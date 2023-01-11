import { mat4 } from "gl-matrix";
import { GLContext } from "../gl/GLContext";
import { getProgram } from "./program";

interface RenderOptions {
    mvp: mat4;
    vertex: WebGLBuffer;
    indices: WebGLBuffer;
}

interface TextureRenderOptions extends RenderOptions {
    uv: WebGLBuffer;
    texture: WebGLTexture;
}

export function renderTexture2D(glContext: GLContext, options: TextureRenderOptions) {
    const program = getProgram("texture2D", glContext);
    const { gl } = glContext;

    if (!program) {
        throw new Error(`program texture2D not found.`);
    }

    const mvp = gl.getUniformLocation(program, "uMVP");
    const sampler = gl.getUniformLocation(program, "uSampler");

    const vertexPosition = gl.getAttribLocation(program, "aVertexPosition");
    const textureCoord = gl.getAttribLocation(program, "aTextureCoord");

    glContext.activeTexture(0);
}
