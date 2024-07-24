import { WebGLContext } from './Shaders/Shader';
import { MapLayer } from './MapLayer';
import { GridPatch } from '../Data/GridPatch';
import { GridShader } from './Shaders/GridShader';
import { DataLayer } from '../Data/DataLayer';
import { MercatorCoordinate } from 'maplibre-gl';
import * as utils from './MapUtils';
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

  constructor(id: string, layer: DataLayer, grid: GridPatch) {
    this.id = id;
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
      countX, countY,
      bounds: { north, east, south, west }
    } = this.grid.data;

    const p0 = MercatorCoordinate.fromLngLat({ lng: west, lat: south });
    const p1 = MercatorCoordinate.fromLngLat({ lng: east, lat: south });
    const p2 = MercatorCoordinate.fromLngLat({ lng: west, lat: north });
    const p3 = MercatorCoordinate.fromLngLat({ lng: east, lat: north });

    function calculateProjection(countY: number) {
      const min = utils.latToNormalizedMercator(south);
      const max = utils.latToNormalizedMercator(north);
      const invLatRange = (1.0 / (north - south));

      const lats = new Float32Array(countY);
      const projLatInterval = (max - min) / (countY - 1);

      for (let i = 0; i < countY; i++) {
        const projLat = min + i * projLatInterval;
        const lat = (2 * Math.atan(Math.exp(projLat * Math.PI)) - Math.PI * 0.5) * utils.Rad2Deg;
        lats[i] = utils.clamp01(1.0 - (lat - south) * invLatRange);
      }

      return lats;
    }

    // Normalize values and apply gamma correction
    const [min, max] = this.layer.getMinMaxValue();
    const values = this.grid.data.values
      .map(x => (x - min) / (max - min))
      .map(x => Math.pow(x, 0.25)); // TODO: Calculate correct gamma value

    // Calculate grid map density
    this.shader.density = [
      (east - west) / countX,
      (north - south) / countY,
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
    this.shader.setProjection(gl, calculateProjection(countY + 1));
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

    this.shader.bind(gl);

    // Additive color blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    this.shader.unbind(gl);
  }
}
