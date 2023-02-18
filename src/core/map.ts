import { vec2, vec3 } from "gl-matrix";
import { PerspectiveCamera } from "./camera";
import { WebMercatorProjection } from "../projection/WebMercatorProjection";
import { Layer } from "./layer";
import { GLContext } from "../gl/GLContext";
import { Projection } from "../projection/Projection";
import { EPSGUtilSet } from "../util/tile";
import { DefaultEventImplSet, MapEvents } from "./events";

export interface FrameState {
    camera: PerspectiveCamera;
    zoom: number;
    context: GLContext;
}

export interface SimpleMapInit {
    center: vec2;
    zoom: number;
    pitch: number;
    rotation: number;
    viewSize: vec2;
}

export class SimpleMap {
    public center: vec2;
    public centerCoord: vec2;
    public zoom: number;
    public pitch: number;
    public rotation: number;

    public projection: Projection;
    public camera: PerspectiveCamera;
    public layers: Set<Layer> = new Set();
    public context: GLContext;
    public events: MapEvents;

    private restFrameCount = 0;
    private runningRenderLoopID: number = 0;

    constructor(container: string, init?: Partial<SimpleMapInit>) {
        const {
            center = [0, 0],
            zoom = 1,
            pitch = 0,
            rotation = 0,
            viewSize = [800, 600],
        } = init || {};
        this.projection = EPSGUtilSet["EPSG:3857"].projection;

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

        this.context = new GLContext(container);

        this.events = new MapEvents(this, DefaultEventImplSet);
        this.events.bindAll();
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
        this.camera.updateTransform(this.centerCoord, this.rotation, this.pitch);
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
            context: this.context,
        };

        this.requestRenderLoop(() => {
            this.renderFrame(frameState);
        }, 1);
    }

    destroy() {
        this.events.unbindAll();
    }

    private renderFrame(frameState: FrameState) {
        console.log("renderFrame");
        this.context.clear();
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
