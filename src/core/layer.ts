import { Source } from "./source";
import { RasterTile } from "./tile";

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

    abstract render(): void;
}

export class RasterTileLayer extends Layer {
    source?: Source<RasterTile>;

    setSource(source: Source<RasterTile>) {
        this.source = source;
    }

    render() {}
}
