import { mat2, vec2 } from "gl-matrix";
import { DegreeToRadian } from "../projection/Constants";
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

enum ButtonNum {
    left,
    mid,
    right,
}

export class MapInteractionImpl implements IMapEventImpl {
    map!: SimpleMap;

    button!: ButtonNum;

    constructor() {
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
    }

    bind(): void {
        this.map.context.container.addEventListener("mousedown", this.onMouseDown);
        this.map.context.container.addEventListener("contextmenu", this.onRightClick);
    }
    unbind(): void {
        this.map.context.container.removeEventListener("mousedown", this.onMouseDown);
        this.map.context.container.removeEventListener("mousemove", this.onMouseMove);
        this.map.context.container.removeEventListener("mouseup", this.onMouseUp);
        this.map.context.container.removeEventListener("contextmenu", this.onRightClick);
    }

    onMouseDown(e: MouseEvent) {
        e.preventDefault();
        this.button = e.button;
        this.map.context.container.addEventListener("mousemove", this.onMouseMove);
        this.map.context.container.addEventListener("mouseup", this.onMouseUp);
    }

    onMouseMove(e: MouseEvent) {
        const { movementX, movementY } = e; // y is negative when move up, x is positive when move right

        if (this.button == ButtonNum.left) {
            const resolution = this.map.getResolution();
            const nextCenterCoord = vec2.clone(this.map.centerCoord);

            const deltaX = -movementX * resolution;
            const deltaY = movementY * resolution;

            let vDelta = vec2.fromValues(deltaX, deltaY);
            // Because the view matrix first applies translation and then rotation, we need to remove the influence of rotation on translation when we perform a translation.
            vDelta = vec2.rotate(
                vDelta,
                vDelta,
                vec2.fromValues(0, 0),
                this.map.rotation * DegreeToRadian
            );

            nextCenterCoord[0] += vDelta[0];
            nextCenterCoord[1] += vDelta[1];

            this.map.setCenterCoord(nextCenterCoord);
        } else if (this.button == ButtonNum.right) {
            console.log(movementX, movementY);

            const deltaRotation = movementX;
            const deltaPitch = movementY;
            this.map.setRotation(this.map.rotation - deltaRotation);
            this.map.setPitch(Math.max(Math.min(this.map.pitch - deltaPitch, 80), 0));
        }
    }

    onMouseUp() {
        this.map.context.container.removeEventListener("mousemove", this.onMouseMove);
    }

    onRightClick(e: MouseEvent) {
        e.preventDefault(); // disable context menu
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
        // TODO: zoom at mouse point
        this.map.setZoom(nextZoom);
    }
}

export const DefaultEventImplSet: MapEventImplSet = [
    new ScrollZoomImpl(),
    new MapInteractionImpl(),
];
