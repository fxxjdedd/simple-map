import { LayerInit, RasterTileLayer } from "../core/Layer";
import { FrameState } from "../core/map";
import { RasterSource } from "../core/source";
import { RasterTile, TileNum } from "../core/tile";
import { WebMercatorProjection } from "../projection/WebMercatorProjection";
import { renderTexture2D } from "../render/renderTexture2D";

export interface EPSG3857RasterTileLayerInit extends LayerInit {
    cacheSize: number;
    url: string;
}

export class EPSG3857RasterTileLayer extends RasterTileLayer {
    constructor(init: EPSG3857RasterTileLayerInit) {
        const source = new RasterSource({
            ...init,
            code: "EPSG:3857",
        });
        super(init, source);
    }

    renderTile(frameState: FrameState, tile: RasterTile) {
        const { context, camera } = frameState;
        console.log("renderTile", tile);

        renderTexture2D(context, {
            mvp: camera.getVPMatrix(),
            vertex: tile.boundsPositionBuffer!,
            indices: tile.indexBuffer!,
            uv: tile.uvBuffer!,
            texture: tile.texture!,
        });
    }
}
