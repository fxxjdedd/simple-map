import { TypedArray } from "../util/buffer";

export class GLContext {
    container: HTMLElement;
    gl: WebGLRenderingContext;

    constructor(container: string) {
        this.container = document.getElementById(container)!;
        const canvas = document.createElement("canvas");
        canvas.width = this.container.clientWidth;
        canvas.height = this.container.clientHeight;
        this.container.appendChild(canvas);
        this.gl = canvas.getContext("webgl")!;
        this.gl.viewport(0, 0, canvas.width, canvas.height);
    }

    clear() {
        this.gl.clearColor(0, 0, 0, 1);
        this.gl.clearDepth(1);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    activeTexture(n: number) {
        this.gl.activeTexture(n);
    }

    createBuffer() {
        return this.gl.createBuffer()!;
    }

    bindVertexBuffer(buffer: WebGLBuffer) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    }

    bindIndexBuffer(buffer: WebGLBuffer) {
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, buffer);
    }

    bufferVertexData(view: TypedArray) {
        this.gl.bufferData(this.gl.ARRAY_BUFFER, view, this.gl.STATIC_DRAW);
    }

    bufferIndexData(view: TypedArray) {
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, view, this.gl.STATIC_DRAW);
    }
}
