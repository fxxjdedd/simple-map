import { vec2, vec3 } from "gl-matrix";
import { PerspectiveCamera } from "./perspective-camera";
import { WebMercatorProjection } from "../projection/WebMercatorProjection";
import { Layer } from "./layer";
import { GLContext } from "../gl/GLContext";

export interface FrameState {
    camera: PerspectiveCamera;
    zoom: number;
    gl: GLContext;
}

export interface SimpleMapInit {
    center: vec2;
    zoom: number;
    pitch: number;
    rotation: number;
    viewSize: vec2;
}

export class SimpleMap {
    private restFrameCount = 0;
    private runningRenderLoopID: number = 0;

    private center: vec2;
    private centerCoord: vec2;
    private zoom: number;
    private pitch: number;
    private rotation: number;

    private projection: WebMercatorProjection;

    private camera: PerspectiveCamera;

    private layers: Set<Layer> = new Set();

    private gl: GLContext;

    constructor(container: string, init?: Partial<SimpleMapInit>) {
        const {
            center = [116.4, 39.9],
            zoom = 1,
            pitch = 0,
            rotation = 0,
            viewSize = [800, 600],
        } = init || {};
        this.projection = new WebMercatorProjection();

        this.center = center;
        this.centerCoord = this.projection.project(center);
        this.zoom = zoom;
        this.pitch = pitch;
        this.rotation = rotation;

        this.camera = new PerspectiveCamera({
            viewSize,
            zoom,
            pitch,
            rotation,
            target: this.centerCoord,
            projection: this.projection,
        });

        this.gl = new GLContext(container);

        this.requestRender();
    }

    setCenter(center: vec2) {
        this.centerCoord = this.projection.project(center);
        this.camera.updateTransform(this.centerCoord, this.rotation, this.pitch);
        this.requestRender();
    }

    setPitch(pitch: number) {
        this.pitch = pitch;
        this.camera.updateTransform(this.centerCoord, this.rotation, this.pitch);
        this.requestRender();
    }

    setRotation(rotation: number) {
        this.rotation = rotation;
        this.camera.updateTransform(this.centerCoord, this.rotation, this.pitch);
        this.requestRender();
    }

    setZoom(zoom: number) {
        this.zoom = zoom;
        this.camera.updateZoom(zoom);
        this.requestRender();
    }

    addLayer(layer: Layer) {
        this.layers.add(layer);
        this.requestRender();
    }

    requestRender() {
        const frameState: FrameState = {
            camera: this.camera,
            zoom: this.zoom,
            gl: this.gl,
        };

        this.requestRenderLoop(() => {
            this.renderFrame(frameState);
        }, 5);
    }

    private renderFrame(frameState: FrameState) {
        console.log("renderFrame");
        for (const layer of this.layers) {
            layer.render(frameState);
        }
    }

    private requestRenderLoop(fn: Function, frameCount: number) {
        if (this.runningRenderLoopID > 0) {
            cancelAnimationFrame(this.runningRenderLoopID);
            this.runningRenderLoopID = 0;
        }

        this.restFrameCount = frameCount;
        const startRenderLoop = () => {
            this.runningRenderLoopID = requestAnimationFrame(() => {
                fn.call(null);
                if (--this.restFrameCount > 0) {
                    startRenderLoop();
                } else {
                    this.restFrameCount = 0;
                    this.runningRenderLoopID = 0;
                }
            });
        };
        startRenderLoop();
    }
}
