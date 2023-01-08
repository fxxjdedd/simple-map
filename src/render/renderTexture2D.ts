import { GLContext } from "../gl/GLContext";

export function renderTexture2D(glContext: GLContext, textureData: Uint8Array) {
    const { ctx } = glContext;
    ctx.clearColor(0, 1, 0, 1);
    ctx.clear(ctx.COLOR_BUFFER_BIT);
}
