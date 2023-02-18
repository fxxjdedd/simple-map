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
        const factor = deltaY > 0 ? 1 : -1;

        const deltaZoom = Math.log10(Math.abs(deltaY));
        let nextZoom = this.map.zoom + factor * deltaZoom;
        nextZoom = Math.min(Math.max(1, nextZoom), 25);

        console.log(nextZoom);

        this.map.setZoom(nextZoom);
    }
}

export const DefaultEventImplSet: MapEventImplSet = [new ScrollZoomImpl()];
