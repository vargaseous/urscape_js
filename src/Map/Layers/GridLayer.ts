import { v7 as uuid } from 'uuid';
import { WebGLContext } from '../Shaders/Shader';
import { MapLayer } from '../MapLayer';
import { DataLayer } from '../../Data/DataLayer';
import { GridPatch } from '../../Data/GridPatch';
import { GridShader } from '../Shaders/GridShader';
import { MercatorCoordinate } from 'maplibre-gl';
import { calculateProjection } from '../MapUtils';
import * as glm from 'gl-matrix';

export class GridLayer implements MapLayer {
  public readonly id: string;
  public readonly type = "custom";
  public readonly renderingMode = "2d";
  public active: boolean = true;
  public offset: glm.vec2 = [0, 0];

  private layer: DataLayer;
  private grid: GridPatch;
  private shader: GridShader;
  private map?: maplibregl.Map;

  constructor(layer: DataLayer, grid: GridPatch) {
    this.id = uuid();
    this.layer = layer;
    this.grid = grid;
    this.shader = new GridShader();
  }

  public get dataLayer(): DataLayer {
    return this.layer;
  }

  public get patch(): GridPatch {
    return this.grid;
  }

  public onAdd(map: maplibregl.Map, gl: WebGLContext) {
    this.map = map;
    this.shader.init(gl);

    if (!this.grid.data)
      throw Error("Missing grid data");

    const {
      values, mask, countX, countY,
      bounds: { north, east, south, west }
    } = this.grid.data;

    const p0 = MercatorCoordinate.fromLngLat({ lng: west, lat: south });
    const p1 = MercatorCoordinate.fromLngLat({ lng: east, lat: south });
    const p2 = MercatorCoordinate.fromLngLat({ lng: west, lat: north });
    const p3 = MercatorCoordinate.fromLngLat({ lng: east, lat: north });

    const projection = calculateProjection(north, south, countY + 1);

    // Calculate grid map density
    this.shader.density = [
      (east - west) / countX * 0.5,
      (north - south) / countY * 0.5,
    ];

    this.shader.setPositions(gl,
      [
        [p0.x, p0.y, 0.0],
        [p1.x, p1.y, 0.0],
        [p2.x, p2.y, 0.0],
        [p3.x, p3.y, 0.0],
      ],
    );

    this.shader.setUVs(gl,
      [
        [0.0, 0.0],
        [1.0, 0.0],
        [0.0, 1.0],
        [1.0, 1.0],
      ],
    );

    this.shader.setValues(gl, values, countX, countY);
    this.shader.setProjection(gl, projection);
    this.shader.mask = mask;
  }

  public onRemove(_map: maplibregl.Map, gl: WebGLContext): void {
    this.shader.delete(gl);
    delete this.grid.data; // TODO: Shouldn't really be here, but works the best for now
  }

  public render(gl: WebGLRenderingContext | WebGL2RenderingContext, mvp: glm.mat4) {
    if (!(gl instanceof WebGL2RenderingContext))
      throw Error("Unsupported WebGL version");

    if (!this.grid.data)
      throw Error("Missing grid data");

    const { countX, countY } = this.grid.data;

    const centerMercator = MercatorCoordinate.fromLngLat(this.map!.transform.center);
    const center: glm.vec3 = [centerMercator.x, centerMercator.y, centerMercator.z];

    const { lngLat, altitude } = this.map!.transform.getCameraPosition();
    const cameraMercator = MercatorCoordinate.fromLngLat(lngLat, altitude);

    const camera: glm.vec3 = [
      cameraMercator.x,
      cameraMercator.y,
      cameraMercator.z
    ];

    const zoom = this.map!.getZoom();

    // Set uniforms and bind shader program
    this.shader.mvp = mvp;
    this.shader.zoom = zoom;
    this.shader.center = center;
    this.shader.camera = camera;
    this.shader.offset = this.offset;
    this.shader.tint = this.layer.tint.vec();
    this.shader.count = [countX, countY];
    this.shader.minmax = this.layer.minmax;
    this.shader.filter = this.layer.filtered
      ? this.layer.filter : [0, 1];

    this.shader.bind(gl);

    // Additive color blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    this.shader.unbind(gl);
  }
}
