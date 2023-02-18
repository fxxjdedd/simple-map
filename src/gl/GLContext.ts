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
        // https://stackoverflow.com/questions/25834400/rendering-multiple-objects-in-webgl
        this.gl = canvas.getContext("webgl", {
            preserveDrawingBuffer: true,
        })!;
        this.gl.viewport(0, 0, canvas.width, canvas.height);
    }

    clear() {
        this.gl.clearColor(1, 1, 1, 1);
        this.gl.clearDepth(1);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
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
        this.gl.bufferData(this.gl.ARRAY_BUFFER, view.buffer, this.gl.STATIC_DRAW);
    }

    bufferIndexData(view: TypedArray) {
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, view.buffer, this.gl.STATIC_DRAW);
    }

    activeTextureUnit(n: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7) {
        this.gl.activeTexture(this.gl[`TEXTURE${n}`]);
    }
}
