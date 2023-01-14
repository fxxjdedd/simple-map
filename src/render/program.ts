import { GLContext } from "../gl/GLContext";
import { shaders } from "../shaders";

const programCache: Record<string, Program> = {};

export function getProgram(name: string, glContext: GLContext) {
    if (programCache[name]) {
        return programCache[name];
    }

    if (name in shaders) {
        const { vertex, fragment } = shaders[name];
        const shaderProgram = initShaderProgram(glContext.gl, vertex, fragment);
        programCache[name] = new Program(glContext, shaderProgram, {}, {});
        return programCache[name];
    }
    return null;
}

class Program {
    constructor(
        public context: GLContext,
        public shaderProgram: WebGLProgram,
        public attribLocations: Record<string, number>,
        public uniformLocations: Record<string, WebGLUniformLocation>
    ) {}

    get gl() {
        return this.context.gl;
    }

    draw(
        indices: WebGLBuffer,
        attribBuffers: Record<
            string,
            {
                size: number;
                type: GLenum;
                stride: number;
                offset: number;
                normalize: boolean;
                value: WebGLBuffer;
            }
        >,
        uniformValues: Record<string, { type: string; value: any }>
    ) {
        for (const key in this.attribLocations) {
            let attribBuffer = attribBuffers[key];
            if (attribBuffer) {
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, attribBuffer.value);
                this.gl.vertexAttribPointer(
                    this.attribLocations[key],
                    attribBuffer.size,
                    attribBuffer.type,
                    attribBuffer.normalize,
                    attribBuffer.stride,
                    attribBuffer.offset
                );
                this.gl.enableVertexAttribArray(this.attribLocations[key]);
            }
        }
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indices);
        this.gl.useProgram(this.shaderProgram);

        for (const key in this.uniformLocations) {
            let uniformValue = uniformValues[key];
            if (uniformValue) {
                (this.gl as any)[`uniform${uniformValue.type}`](
                    this.uniformLocations[key],
                    false,
                    uniformValue.value
                );
            }
        }

        // this.gl.drawElements(this.gl.TRIANGLES);

        // TODO: deal with texture
        // TODO: deal with vao
    }
}

function initShaderProgram(gl: WebGLRenderingContext, vert: string, frag: string) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vert);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, frag);

    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader!);
    gl.attachShader(program, fragmentShader!);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(
            `Unable to initialize the shader program: ${gl.getProgramInfoLog(program)}`
        );
    }

    return program;
}

function loadShader(gl: WebGLRenderingContext, type: GLenum, source: string) {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        throw new Error(`An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`);
    }
    return shader;
}

// segements是对于一个buffer的分段render
// 一个buffer可以有很多个attributes，分散在这个buffer中
// 一个segment指定的是，每个attributes各自的一小段

// draw是对一个buffer的render，这个buffer有几个segemnt就render几次
// 这一个buffer是一个layer的渲染内容。如果有多个layer，就是多次draw。

// layer是对一个buffer的生成和更新，并对buffer根据业务需求进行segment分段
