import { getGLType, GLIndexBufferObject, GLVertexBufferObject } from "../gl/GLVertexBufferObject";
import { GLContext } from "../gl/GLContext";
import { GLUniforms } from "../gl/GLUniforms";
import { shaders } from "../shaders";

const programCache: Record<string, Program> = {};

export function getProgram(name: string, glContext: GLContext) {
    if (programCache[name]) {
        return programCache[name];
    }

    if (name in shaders) {
        const { vertex, fragment, attributes, uniforms } = shaders[name];
        const shaderProgram = initShaderProgram(glContext.gl, vertex, fragment);

        const attribLocations: Record<string, number> = {};
        for (const attrName of attributes) {
            // TODO: gl.bindAttribLocation can make attrib layout stable.
            attribLocations[attrName] = glContext.gl.getAttribLocation(shaderProgram, attrName);
        }

        const uniformLocations: Record<string, WebGLUniformLocation> = {};
        for (const uniformName of uniforms) {
            uniformLocations[uniformName] = glContext.gl.getUniformLocation(
                shaderProgram,
                uniformName
            )!;
        }

        programCache[name] = new Program(
            glContext,
            shaderProgram,
            attribLocations,
            uniformLocations
        );
        return programCache[name];
    }
    return null;
}

export class Program {
    uniforms: GLUniforms;

    get gl() {
        return this.glContext.gl;
    }

    constructor(
        public glContext: GLContext,
        public shaderProgram: WebGLProgram,
        public attribLocations: Record<string, number>,
        public uniformLocations: Record<string, WebGLUniformLocation>
    ) {
        this.uniforms = new GLUniforms(glContext, uniformLocations);
    }

    draw(
        vbo: GLVertexBufferObject,
        ebo: GLIndexBufferObject,
        uniformValues: Record<string, { type: string; value: any }>
    ) {
        for (const uniformName in uniformValues) {
            this.uniforms.setValue(uniformName, uniformValues[uniformName]);
        }

        vbo.bind();
        vbo.enableVertexAttribArray(this);
        vbo.setVertexAttribPointer(this);

        ebo.bind();
        this.gl.drawElements(
            this.gl.TRIANGLES,
            ebo.data.getTrangleCount(),
            getGLType(this.gl, ebo.data.getTrangleType()),
            0 // keep at 0 until we have segment abstraction
        );
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
