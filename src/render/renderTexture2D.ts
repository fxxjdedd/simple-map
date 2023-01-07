import { GLContext } from "../gl/GLContext";

export function renderTexture2D(gl: GLContext, textureData: Uint8Array) {
    gl.ctx.clearColor(0, 1, 0, 1);
    gl.ctx.clear(gl.ctx.COLOR_BUFFER_BIT);
}
