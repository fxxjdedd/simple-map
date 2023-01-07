export class GLContext {
    container: HTMLElement;
    ctx: WebGLRenderingContext;

    constructor(container: string) {
        this.container = document.getElementById(container)!;
        const canvas = document.createElement("canvas");
        canvas.width = this.container.clientWidth;
        canvas.height = this.container.clientHeight;
        this.container.appendChild(canvas);
        this.ctx = canvas.getContext("webgl")!;
        this.ctx.viewport(0, 0, canvas.width, canvas.height);
    }
}
