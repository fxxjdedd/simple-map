import { vec4 } from "gl-matrix";
import { FrameState } from "./map";
import { RasterSource, Source } from "./source";
import { RasterTile, TileNum } from "./tile";

interface LayerInit {
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

export interface RasterLayerInit extends LayerInit {
    url: string;
    cacheSize: number;
}
export abstract class RasterTileLayer extends Layer {
    source: Source<RasterTile>;

    constructor(init: RasterLayerInit) {
        super(init);
        this.source = new RasterSource(init);
    }

    async render(frameState: FrameState) {
        const { camera, zoom } = frameState;
        const viewBounds = camera.getBounds();
        const tileNums = this.getTileNums(viewBounds, zoom);
        const asyncIterator = this.source.loadTiles(tileNums);

        for await (const tile of asyncIterator) {
            if (tile !== null) {
                this.renderTile(tile);
            }
        }
    }

    abstract getTileNums(bounds: vec4, zoom: number): TileNum[];

    abstract renderTile(tile: RasterTile): any;
}
