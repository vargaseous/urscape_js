import { WebGLContext } from "./Shader";

/**
 * Represents a unique reference to a shader program.
 */
export class Program {
  private vertexSource?: string;
  private fragmentSource?: string;
  private program: WebGLProgram | null;

  constructor(vertexSource: string, fragmentSource: string) {
    this.program = null;
    this.vertexSource = vertexSource;
    this.fragmentSource = fragmentSource;
  }

  /**
   * Creates and initializes this shader program.
   *
   * This method should be called before {@link get}
   *
   * @returns Immediately when called multiple times.
   * @param gl - The WebGL context.
   */
  public init(gl: WebGLContext) {
    if (this.program) return;
    this.program = this.createProgram(gl);
  }

  /**
   * Returns current shader program.
   *
   * Available after calling {@link init}
   */
  public get(): WebGLProgram {
    if (!this.program) {
      throw new Error("Program not initialized");
    }

    return this.program;
  }

  private createProgram(gl: WebGLContext): WebGLProgram {
    if (!this.vertexSource || !this.fragmentSource) {
      throw new Error("Invalid shader source or createProgram called twice");
    }

    const vertexShader = this.createShader(gl, this.vertexSource, gl.VERTEX_SHADER);
    const fragmentShader = this.createShader(gl, this.fragmentSource, gl.FRAGMENT_SHADER);

    // Link the two shaders into a WebGL program
    const program = gl.createProgram();
    if (!program) throw new Error("An error occured while creating the shader program");

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const error = gl.getProgramInfoLog(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteProgram(program);

      throw new Error("An error occured during shader linking: " + error);
    }

    // Clean-up resources
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    delete this.vertexSource;
    delete this.fragmentSource;

    return program;
  }

  private createShader(gl: WebGLContext, source: string, type: number): WebGLShader {
    const shader = gl.createShader(type);
    if (!shader) throw new Error("An error occured while creating the shader object");

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const error = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);

      throw new Error("An error occured during shader compile: " + error);
    }

    return shader;
  }
}