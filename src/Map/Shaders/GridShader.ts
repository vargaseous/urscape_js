import { Shader, WebGLContext } from './Shader';
import { encodeFloatToDouble } from './ShaderUtils';
import GridProgram from './GridProgram';
import * as glm from 'gl-matrix';

export class GridShader extends Shader {
  public mvp: glm.ReadonlyMat4;
  public camera: glm.ReadonlyVec3;
  public center: glm.ReadonlyVec3;
  public offset: glm.ReadonlyVec2;
  public tint: glm.ReadonlyVec4;
  public count: glm.ReadonlyVec2;
  public density: glm.ReadonlyVec2;
  public zoom: number;

  constructor() {
    super(GridProgram);

    this.mvp = glm.mat4.create();
    this.camera = glm.vec3.create();
    this.center = glm.vec3.create();
    this.offset = glm.vec2.create();
    this.tint = glm.vec4.create();
    this.count = glm.vec2.create();
    this.density = glm.vec2.create();
    this.zoom = 0;
  }

  public bind(gl: WebGLContext) {

    // ------------------------------
    // This shader prevents jitter caused by a loss of precision
    // by emulating double-precision and Camera-relative rendering.
    //
    // On the GPU side we subtract center (stored as two floats in uniforms)
    // from all vertex positions (this makes all vertices relative to center).
    //
    // After applying projection we translate the vertices to their original
    // position by now adding the center (which we substracted earlier).
    //
    // The translation operation is included in the MVP matrix below.
    // ------------------------------

    super.bind(gl);
    const program = this.getProgram();

    glm.glMatrix.setMatrixArrayType(Array);
    const mvp = glm.mat4.clone(this.mvp);
    glm.mat4.translate(mvp, mvp, this.center);

    const center = [
      encodeFloatToDouble(this.center[0]),
      encodeFloatToDouble(this.center[1]),
      encodeFloatToDouble(this.center[2]),
    ];

    const centerHigh = [center[0][0], center[1][0], center[2][0]];
    const centerLow = [center[0][1], center[1][1], center[2][1]];

    // ------------------------------
    // Set uniform values

    gl.uniformMatrix4fv(gl.getUniformLocation(program, 'u_MVP'), false, mvp);
    gl.uniform3fv(gl.getUniformLocation(program, 'u_Center.high'), centerHigh);
    gl.uniform3fv(gl.getUniformLocation(program, 'u_Center.low'), centerLow);
    gl.uniform3fv(gl.getUniformLocation(program, 'u_Camera'), this.camera);
    gl.uniform4fv(gl.getUniformLocation(program, 'u_Tint'), this.tint);
    gl.uniform2fv(gl.getUniformLocation(program, 'u_Offset'), this.offset);
    gl.uniform2iv(gl.getUniformLocation(program, 'u_Count'), this.count);
    gl.uniform2fv(gl.getUniformLocation(program, 'u_Density'), this.density);
    gl.uniform1f(gl.getUniformLocation(program, 'u_CellHalfSize'), 0.35);
    gl.uniform1f(gl.getUniformLocation(program, 'u_Zoom'), this.zoom);
  }

  public setPositions(gl: WebGLContext, values: glm.vec3[]) {
    const name = "a_Pos";
    const index = gl.getAttribLocation(this.getProgram(), name);
    const array = values.flat() as number[];

    this.setAttributeData(
      gl,
      array,
      {
        index: index,
        name: name,
        type: gl.FLOAT,
        normalized: false,
        size: 3,
        stride: 0,
        offset: 0,
      },
    );
  }

  public setUVs(gl: WebGLContext, values: glm.vec2[]) {
    const name = "a_UV";
    const index = gl.getAttribLocation(this.getProgram(), name);
    const array = values.flat() as number[];

    this.setAttributeData(
      gl,
      array,
      {
        index: index,
        name: name,
        type: gl.FLOAT,
        normalized: false,
        size: 2,
        stride: 0,
        offset: 0,
      },
    );
  }

  public setValues(gl: WebGLContext, values: Float32Array, countX: number, countY: number) {
    const name = "u_Values";
    const index = gl.getUniformLocation(this.getProgram(), name)!;

    this.setTextureData(
      gl,
      values,
      {
        index: index,
        name: name,
        width: countX,
        height: countY,
        format: [gl.RED, gl.R32F],
        filter: gl.NEAREST,
        wrap: gl.CLAMP_TO_EDGE
      },
    );
  }

  public setProjection(gl: WebGLContext, values: Float32Array) {
    const name = "u_Projection";
    const index = gl.getUniformLocation(this.getProgram(), name)!;

    this.setTextureData(
      gl,
      values,
      {
        index: index,
        name: name,
        width: values.length,
        height: 1,
        format: [gl.RED, gl.R32F],
        filter: gl.LINEAR,
        wrap: gl.CLAMP_TO_EDGE
      },
    );
  }
}
