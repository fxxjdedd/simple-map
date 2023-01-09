import { GLContext } from "../gl/GLContext";
import { shaders } from "../shaders";

const programCache: Record<string, WebGLProgram> = {};

export function getProgram(name: string, glContext: GLContext) {
    if (programCache[name]) {
        return programCache[name];
    }

    if (name in shaders) {
        const { vertex, fragment } = shaders[name];
        const program = initShaderProgram(glContext.ctx, vertex, fragment);
        programCache[name] = program;
        return program;
    }
    return null;
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
