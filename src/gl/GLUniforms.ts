import { GLContext } from "./GLContext";

export class GLUniforms {
    constructor(
        public glContext: GLContext,
        public uniformLocations: Record<string, WebGLUniformLocation>
    ) {}

    setValue(name: string, uniform: { type: string; value: any }) {
        if (this.uniformLocations[name] !== undefined) {
            (this.glContext.gl as any)[`uniform${uniform.type}`](
                this.uniformLocations[name],
                false,
                uniform.value
            );
        }
    }
}
