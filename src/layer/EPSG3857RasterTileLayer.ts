import { LayerInit, RasterTileLayer } from "../core/Layer";
import { FrameState } from "../core/map";
import { RasterSource } from "../core/source";
import { RasterTile, TileNum } from "../core/tile";
import { GLTexture } from "../gl/GLTexture";
import { GLIndexBufferObject, GLVertexBufferObject } from "../gl/GLVertexBufferObject";
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

        const { tileData } = tile;

        const glVertexBufferObject = new GLVertexBufferObject(context, tileData!.rasterData);
        const glIndexBufferObject = new GLIndexBufferObject(context, tileData!.indexData);
        const glTexture = new GLTexture(context, tileData!.imageData);

        renderTexture2D(context, {
            mvp: camera.getVPMatrix(),
            glVertexBufferObject,
            glIndexBufferObject,
            glTexture,
        });
    }
}
