import { mat4 } from "gl-matrix";
import { GLTexture } from "../gl/GLTexture";
import { GLIndexBufferObject, GLVertexBufferObject } from "../gl/GLVertexBufferObject";
import { GLContext } from "../gl/GLContext";
import { getProgram } from "./Program";

interface RenderOptions {
    mvp: mat4;
    glVertexBufferObject: GLVertexBufferObject;
    glIndexBufferObject: GLIndexBufferObject;
}

interface TextureRenderOptions extends RenderOptions {
    glTexture: GLTexture;
}

export function renderTexture2D(glContext: GLContext, options: TextureRenderOptions) {
    const program = getProgram("texture2D", glContext);
    // TODO:
    // confirm whether it is safe to instantiate gl object in `Layer`
    const { glVertexBufferObject, glIndexBufferObject, glTexture, mvp } = options;

    if (!program) {
        throw new Error(`program texture2D not found.`);
    }

    const activeUnit = 0;
    glContext.activeTextureUnit(activeUnit);
    glTexture.bind();

    program.draw(glVertexBufferObject, glIndexBufferObject, {
        u_mvp: {
            type: "Matrix4fv",
            value: mvp,
        },
        u_sampler: {
            type: "1i",
            value: activeUnit,
        },
    });
}
