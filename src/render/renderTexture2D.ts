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
    const { glVertexBufferObject, glIndexBufferObject, glTextureData } = options;

    if (!program) {
        throw new Error(`program texture2D not found.`);
    }

    glContext.activeTexture(0);
}
