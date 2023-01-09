import { mat4 } from "gl-matrix";
import { GLContext } from "../gl/GLContext";
import { getProgram } from "./program";

interface RenderOptions {
    mvp: mat4;
    vertex: WebGLBuffer;
    indices: WebGLBuffer;
}

interface TextureRenderOptions extends RenderOptions {
    textureData: WebGLBuffer;
    texture: WebGLTexture;
}

export function renderTexture2D(glContext: GLContext, options: TextureRenderOptions) {
    const program = getProgram("texture2D", glContext);
    const { ctx: gl } = glContext;

    gl.clearColor(0, 0, 0, 1);
    gl.clearDepth(1);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}
