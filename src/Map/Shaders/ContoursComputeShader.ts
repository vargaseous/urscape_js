import { ComputeShader } from './ComputeShader';
import { WebGLContext } from './Shader';
import ContoursComputeProgram from './ContoursComputeProgram';
import * as glm from 'gl-matrix';

export class ContoursComputeShader extends ComputeShader {
  public count: glm.ReadonlyVec2;
  public start: glm.ReadonlyVec2;
  public scale: glm.ReadonlyVec2;
  public offset: glm.ReadonlyVec2;
  public minmax: glm.ReadonlyVec2;
  public filter: glm.ReadonlyVec2;
  public mask: number | null;

  constructor() {
    super(ContoursComputeProgram);

    this.count = glm.vec2.create();
    this.start = glm.vec2.create();
    this.scale = glm.vec2.create();
    this.offset = glm.vec2.create();
    this.minmax = glm.vec2.create();
    this.filter = glm.vec2.create();
    this.mask = null;
  }

  public init(gl: WebGLContext) {
    super.init(gl);

    this.setPositions(gl,
      [
        [-1, -1,  0],
        [ 1, -1,  0],
        [-1,  1,  0],
        [ 1,  1,  0],
      ],
    );
  }

  public bind(gl: WebGLContext): void {
    super.bind(gl);
    const program = this.getProgram();

    gl.uniform2iv(gl.getUniformLocation(program, 'u_Count'), this.count);
    gl.uniform2iv(gl.getUniformLocation(program, 'u_Start'), this.start);
    gl.uniform2fv(gl.getUniformLocation(program, 'u_Scale'), this.scale);
    gl.uniform2fv(gl.getUniformLocation(program, 'u_Offset'), this.offset);
    gl.uniform2fv(gl.getUniformLocation(program, 'u_MinMax'), this.minmax);
    gl.uniform2fv(gl.getUniformLocation(program, 'u_Filter'), this.filter);
    gl.uniform1f(gl.getUniformLocation(program, 'u_Mask'), this.mask ?? NaN);
  }

  public draw(gl: WebGLContext, countX: number, countY: number) {
    gl.getExtension("EXT_float_blend");
    gl.getExtension("EXT_color_buffer_float");

    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      this.textures.output.texture,
      0
    );

    // Set viewport to match render target size
    gl.viewport(0, 0, countX, countY);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Restore previous viewport
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  }

  public clear(gl: WebGLContext, value: GLclampf, countX: number, countY: number) {
    gl.getExtension("EXT_float_blend");
    gl.getExtension("EXT_color_buffer_float");

    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      this.textures.output.texture,
      0
    );

    // Set viewport to match render target size
    gl.viewport(0, 0, countX, countY);

    gl.clearColor(value, value, value, value);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Restore previous viewport
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
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
        wrap: gl.CLAMP_TO_EDGE,
        type: gl.FLOAT
      },
    );
  }

  public setContours(gl: WebGLContext, values: Float32Array | null, countX: number, countY: number) {
    const name = "u_Contours";
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
        wrap: gl.CLAMP_TO_EDGE,
        type: gl.FLOAT
      },
    );

    this.setTextureData(
      gl,
      null,
      {
        index: -1,
        name: "output",
        width: countX,
        height: countY,
        format: [gl.RED, gl.R32F],
        filter: gl.NEAREST,
        wrap: gl.CLAMP_TO_EDGE,
        type: gl.FLOAT
      },
    );
  }

  private setPositions(gl: WebGLContext, values: glm.vec3[]) {
    const name = "a_Position";
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
}
