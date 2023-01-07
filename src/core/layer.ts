import { vec4 } from "gl-matrix";
import { FrameState } from "./map";
import { RasterSource, Source } from "./source";
import { RasterTile, TileNum } from "./tile";

export interface LayerInit {
    zooms: [number, number];
    zIndex: number;
}
export abstract class Layer {
    zooms: [number, number];
    zIndex: number;

    constructor(init: Partial<LayerInit>) {
        this.zooms = init.zooms ?? [2, 22];
        this.zIndex = init.zIndex ?? 1;
    }

    abstract render(frameState: FrameState): void;
}

export abstract class RasterTileLayer extends Layer {
    source: RasterSource;

    constructor(init: LayerInit, source: RasterSource) {
        super(init);
        this.source = source;
    }

    async render(frameState: FrameState) {
        const { camera, zoom } = frameState;
        const viewBounds = camera.getBounds();
        this.source.updateTileNums(viewBounds, zoom);

        const asyncIterator = this.source.loadTiles();
        for await (const tile of asyncIterator) {
            if (tile !== null) {
                this.renderTile(frameState, tile);
            }
        }
    }

    abstract renderTile(frameState: FrameState, tile: RasterTile): any;
}
