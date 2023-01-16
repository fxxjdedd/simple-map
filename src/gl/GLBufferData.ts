import { IndexStructuredData } from "../data/allStructuredData";
import { Program } from "../render/Program";
import { getArrayCtorOfCode, StructuredData } from "../util/buffer";
import { GLContext } from "./GLContext";

export function getGLType(gl: WebGLRenderingContext, typeCode: number) {
    switch (getArrayCtorOfCode(typeCode)) {
        case Uint8Array:
            return gl.UNSIGNED_BYTE;
        case Int8Array:
            return gl.BYTE;
        case Uint16Array:
            return gl.UNSIGNED_SHORT;
        case Int8Array:
            return gl.SHORT;
        case Uint32Array:
            return gl.UNSIGNED_INT;
        case Int8Array:
            return gl.INT;
        case Float32Array:
            return gl.FLOAT;
        case Float64Array:
            throw new Error("Double float precision not supported yet.");
        default:
            throw new Error(`Invalid type code: ${typeCode.toString(2)}`);
    }
}

export class GLVertexBufferObject {
    buffer: WebGLBuffer;
    constructor(public glContext: GLContext, public data: StructuredData<any>) {
        this.buffer = this.glContext.createBuffer();
        this.bind();
        this.glContext.bufferVertexData(data.buffer);
    }

    bind() {
        this.glContext.bindVertexBuffer(this.buffer);
    }

    enableVertexAttribArray(program: Program) {
        for (const attrName in this.data.accessors) {
            const location = program.attribLocations[attrName];
            if (location !== undefined) {
                this.glContext.gl.enableVertexAttribArray(location);
            }
        }
    }

    setVertexAttribPointer(program: Program) {
        for (const attrName in this.data.accessors) {
            const { type, components, offset, stride } = this.data.accessors[attrName];
            const location = program.attribLocations[attrName];
            if (location !== undefined) {
                this.glContext.gl.vertexAttribPointer(
                    location,
                    components,
                    getGLType(this.glContext.gl, type),
                    false,
                    stride,
                    offset
                );
            }
        }
    }
}

export class GLIndexBufferObject {
    buffer: WebGLBuffer;
    constructor(public glContext: GLContext, public data: IndexStructuredData) {
        this.buffer = this.glContext.createBuffer();
        this.bind();
        this.glContext.bufferIndexData(data.buffer);
    }

    bind() {
        this.glContext.bindIndexBuffer(this.buffer);
    }
}
