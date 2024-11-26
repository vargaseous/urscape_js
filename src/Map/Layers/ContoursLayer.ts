import { v7 as uuid } from 'uuid';
import { WebGLContext } from '../Shaders/Shader';
import { MapLayer } from '../MapLayer';
import { GridPatch } from '../../Data/GridPatch';
import { AreaBounds } from '../../Data/DataUtils';
import { ContoursShader } from '../Shaders/ContoursShader';
import { ContoursComputeShader } from '../Shaders/ContoursComputeShader';
import { MercatorCoordinate } from 'maplibre-gl';
import { calculateProjection } from '../MapUtils';
import * as glm from 'gl-matrix';

export class ContoursLayer implements MapLayer {
  public readonly id: string;
  public readonly type = "custom";
  public readonly renderingMode = "2d";
  public active: boolean = true;

  private grids: GridPatch[];
  private map?: maplibregl.Map;
  private shader: ContoursShader;
  private compute: ContoursComputeShader;

  private countX: number;
  private countY: number;
  private bounds: AreaBounds;
  private recalculate: boolean;

  constructor(grids: GridPatch[]) {
    this.id = uuid();

    this.grids = grids;
    this.shader = new ContoursShader();
    this.compute = new ContoursComputeShader();

    this.countX = 0;
    this.countY = 0;
    this.bounds = AreaBounds.inf();
    this.recalculate = false;
  }

  public get patches(): GridPatch[] {
    return this.grids;
  }

  public recalculateContours() {
    this.recalculate = true;
  }

  public onAdd(map: maplibregl.Map, gl: WebGLContext) {
    this.map = map;
    this.shader.init(gl);
    this.compute.init(gl);

    let dotsPerDegreeX = 0;
    let dotsPerDegreeY = 0;

		for (const grid of this.grids) {
      if (!grid.data) continue;

      const bounds = grid.bounds!;
      const { countX, countY } = grid.data;

      dotsPerDegreeX = Math.max(countX / (bounds.east - bounds.west), dotsPerDegreeX);
			dotsPerDegreeY = Math.max(countY / (bounds.north - bounds.south), dotsPerDegreeY);

      this.bounds.add(bounds);
		}

    const { north, east, south, west } = this.bounds;

		if (east <= west || north <= south) {
      console.error("Invalid bounds");
      return;
    }

    /*
      TODO: Implement texture splitting

      When the grid contains a larger number of cells, the final texture
      might exceed maximum texture size allowed by the WebGL device.

      This can be solved by splitting the texture into multiple textures.
    */

    this.countX = Math.round((east - west) * dotsPerDegreeX);
    this.countY = Math.round((north - south) * dotsPerDegreeY);

    const p0 = MercatorCoordinate.fromLngLat({ lng: west, lat: south });
    const p1 = MercatorCoordinate.fromLngLat({ lng: east, lat: south });
    const p2 = MercatorCoordinate.fromLngLat({ lng: west, lat: north });
    const p3 = MercatorCoordinate.fromLngLat({ lng: east, lat: north });

    const projection = calculateProjection(north, south, this.countY + 1);

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

    this.shader.setProjection(gl, projection);
    this.compute.setContours(gl, null, this.countX, this.countY);

    this.runCompute(gl);

    this.shader.borrowTexture(gl, this.compute, "u_Contours");
  }

  public onRemove(_map: maplibregl.Map, gl: WebGLContext): void {
    this.shader.delete(gl);
    this.compute.delete(gl);
  }

  public render(gl: WebGLRenderingContext | WebGL2RenderingContext, mvp: glm.mat4) {
    if (!(gl instanceof WebGL2RenderingContext))
      throw Error("Unsupported WebGL version");

    if (this.recalculate) {
      this.runCompute(gl);
      this.recalculate = false;
      this.shader.borrowTexture(gl, this.compute, "u_Contours");
    }

    this.runShader(gl, mvp);
  }

  private runCompute(gl: WebGLContext) {
    const contoursDegreesPerCellX = (this.bounds.east - this.bounds.west) / this.countX;
		const contoursDegreesPerCellY = (this.bounds.south - this.bounds.north) / this.countY;
		const contoursCellsPerDegreeX = 1.0 / contoursDegreesPerCellX;
		const contoursCellsPerDegreeY = 1.0 / contoursDegreesPerCellY;

    const gridsWithData = this.grids
      .filter(grid => grid.data);

    const dataLayers = Array.from(new Set(gridsWithData.map(grid => grid.dataLayer)));

    // Set initial contour grid values
    this.compute.bind(gl);
    this.compute.clear(gl, 1 - dataLayers.length, this.countX, this.countY);
    this.compute.swapTextures("u_Contours", "output");

    for (const grid of gridsWithData) {
      const bounds = grid.bounds!;
      const { values, mask, countX, countY } = grid.data!;

      const cellsPerDegreeX = countX / (bounds.east - bounds.west);
			const cellsPerDegreeY = countY / (bounds.south - bounds.north);

      const scaleX = cellsPerDegreeX * contoursDegreesPerCellX;
			const scaleY = cellsPerDegreeY * contoursDegreesPerCellY;

			const offsetX = 0.5 * scaleX;
			const offsetY = 0.5 * scaleY;

			const startX = Math.floor((bounds.west - this.bounds.west) * contoursCellsPerDegreeX + 0.5);
			const startY = Math.floor((bounds.north - this.bounds.north) * contoursCellsPerDegreeY + 0.5);
			const endX = Math.floor((bounds.east - this.bounds.west) * contoursCellsPerDegreeX + 0.5);
			const endY = Math.floor((bounds.south - this.bounds.north) * contoursCellsPerDegreeY + 0.5);

      this.compute.count = [endX - startX, endY - startY];
      this.compute.start = [startX, startY];
      this.compute.scale = [scaleX, scaleY];
      this.compute.offset = [offsetX, offsetY];
      this.compute.minmax = grid.dataLayer!.minmax;
      this.compute.filter = grid.dataLayer!.filtered
        ? grid.dataLayer!.filter : [0, 1];

      this.compute.setValues(gl, values, countX, countY);
      this.compute.mask = mask;

      this.compute.bind(gl);
      this.compute.draw(gl, this.countX, this.countY);
      this.compute.swapTextures("u_Contours", "output");
    }

    this.compute.unbind(gl);
  }

  private runShader(gl: WebGLContext, mvp: glm.mat4) {
    const centerMercator = MercatorCoordinate.fromLngLat(this.map!.transform.center);
    const center: glm.vec3 = [centerMercator.x, centerMercator.y, centerMercator.z];

    const { lngLat, altitude } = this.map!.transform.getCameraPosition();
    const cameraMercator = MercatorCoordinate.fromLngLat(lngLat, altitude);

    const camera: glm.vec3 = [
      cameraMercator.x,
      cameraMercator.y,
      cameraMercator.z
    ];

    this.shader.mvp = mvp;
    this.shader.center = center;
    this.shader.camera = camera;
    this.shader.count = [this.countX, this.countY];

    this.shader.bind(gl);

    // Additive color blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    this.shader.unbind(gl);
  }
}
