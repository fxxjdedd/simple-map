import { vec2 } from "gl-matrix";
import { SimpleMap } from "./map";

export interface IMapEventImpl {
    map: SimpleMap;
    bind(): void;
    unbind(): void;
}

export type MapEventImplSet = IMapEventImpl[];

export class MapEvents {
    constructor(public map: SimpleMap, public eventImplSet: MapEventImplSet) {
        eventImplSet.forEach(imp => {
            imp.map = map;
        });
    }

    bindAll() {
        for (const eventImpl of this.eventImplSet) {
            eventImpl.bind();
        }
    }

    unbindAll() {
        for (const eventImpl of this.eventImplSet) {
            eventImpl.unbind();
        }
    }
}

export class MouseMoveImpl implements IMapEventImpl {
    map!: SimpleMap;

    moving: boolean = false;

    constructor() {
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
    }

    bind(): void {
        this.map.context.container.addEventListener("mousedown", this.onMouseDown);
    }
    unbind(): void {
        this.map.context.container.removeEventListener("mousedown", this.onMouseDown);
        this.map.context.container.removeEventListener("mousemove", this.onMouseMove);
        this.map.context.container.removeEventListener("mouseup", this.onMouseUp);
    }

    onMouseDown() {
        this.moving = true;
        this.map.context.container.addEventListener("mousemove", this.onMouseMove);
        this.map.context.container.addEventListener("mouseup", this.onMouseUp);
    }

    onMouseMove(e: MouseEvent) {
        if (this.moving) {
            // unnessary check ...
            const { movementX, movementY } = e; // y is negative when move up, x is positive when move right
            const resolution = this.map.getResolution();
            const deltaX = -movementX * resolution;
            const deltaY = movementY * resolution;

            const nextCenterCoord = vec2.clone(this.map.centerCoord);
            nextCenterCoord[0] += deltaX;
            nextCenterCoord[1] += deltaY;

            this.map.setCenterCoord(nextCenterCoord);
        }
    }

    onMouseUp() {
        this.map.context.container.removeEventListener("mousemove", this.onMouseMove);
    }
}

export class ScrollZoomImpl implements IMapEventImpl {
    map!: SimpleMap;
    constructor() {
        this.handler = this.handler.bind(this);
    }

    bind(): void {
        this.map.context.container.addEventListener("wheel", this.handler);
    }
    unbind(): void {
        this.map.context.container.removeEventListener("wheel", this.handler);
    }

    handler(e: WheelEvent) {
        const { deltaY } = e;
        const factor = deltaY > 0 ? -1 : +1;

        const deltaZoom = Math.log10(Math.abs(deltaY));
        let nextZoom = this.map.zoom + factor * deltaZoom;
        nextZoom = Math.min(Math.max(0, nextZoom), 25);

        console.log(nextZoom);

        this.map.setZoom(nextZoom);
    }
}

export const DefaultEventImplSet: MapEventImplSet = [new ScrollZoomImpl(), new MouseMoveImpl()];
