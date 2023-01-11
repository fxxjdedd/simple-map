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
}
