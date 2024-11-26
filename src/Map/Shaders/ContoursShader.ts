import { Shader, WebGLContext } from './Shader';
import { encodeFloatToDouble } from './ShaderUtils';
import ContoursProgram from './ContoursProgram';
import * as glm from 'gl-matrix';

export class ContoursShader extends Shader {
  public mvp: glm.ReadonlyMat4;
  public camera: glm.ReadonlyVec3;
  public center: glm.ReadonlyVec3;
  public count: glm.ReadonlyVec2;

  constructor() {
    super(ContoursProgram);

    this.mvp = glm.mat4.create();
    this.camera = glm.vec3.create();
    this.center = glm.vec3.create();
    this.count = glm.vec2.create();
  }

  public bind(gl: WebGLContext) {

    // ------------------------------
    // This shader prevents jitter caused by a loss of precision
    // by emulating double-precision and Camera-relative rendering.
    //
    // See GridShader.ts for the full explanation.
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
    gl.uniform2iv(gl.getUniformLocation(program, 'u_Count'), this.count);
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
        wrap: gl.CLAMP_TO_EDGE,
        type: gl.FLOAT
      },
    );
  }
}
