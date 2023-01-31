import { GLContext } from "./GLContext";

export class GLTexture {
    texture: WebGLTexture;

    get gl() {
        return this.glContext.gl;
    }

    constructor(public glContext: GLContext, public image: HTMLImageElement) {
        this.texture = this.gl.createTexture()!;
        this.bind();
        const gl = this.gl;
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    }

    bind() {
        const gl = this.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        // update tex params...
        // this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, 0);
    }
}
