import { mat4 } from "gl-matrix";
import { GLTextureData } from "../gl/GLTextureData";
import { GLIndexBufferObject, GLVertexBufferObject } from "../gl/GLBufferData";
import { GLContext } from "../gl/GLContext";
import { getProgram } from "./Program";

interface RenderOptions {
    mvp: mat4;
    glVertexBufferObject: GLVertexBufferObject;
    glIndexBufferObject: GLIndexBufferObject;
}

interface TextureRenderOptions extends RenderOptions {
    glTextureData: GLTextureData;
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
