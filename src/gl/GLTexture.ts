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
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // must set this param
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }

    bind() {
        const gl = this.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
    }
}
