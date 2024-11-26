import { Program } from "./Program";
import { Shader, WebGLContext } from "./Shader";

export abstract class ComputeShader extends Shader {
  private framebuffer: WebGLFramebuffer;

  constructor(program: Program) {
    super(program);
    this.framebuffer = {};
  }

  public init(gl: WebGLContext) {
    super.init(gl);

    const framebuffer = gl.createFramebuffer();
    if (!framebuffer) throw Error("An error occured while creating a framebuffer object");

    this.framebuffer = framebuffer;
  }

  public bind(gl: WebGLContext) {
    super.bind(gl);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
  }

  public unbind(gl: WebGLContext) {
    super.unbind(gl);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  public delete(gl: WebGLContext) {
    super.delete(gl);
    gl.deleteFramebuffer(this.framebuffer);
  }
}
