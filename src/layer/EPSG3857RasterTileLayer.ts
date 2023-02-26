import { mat4, vec3 } from "gl-matrix";
import { LayerInit, RasterTileLayer } from "../core/layer";
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

type GLData = {
    glVertexBufferObject: GLVertexBufferObject;
    glIndexBufferObject: GLIndexBufferObject;
    glTexture: GLTexture;
};

export class EPSG3857RasterTileLayer extends RasterTileLayer {
    glDataMap = new WeakMap<RasterTile, GLData>();

    constructor(init: EPSG3857RasterTileLayerInit) {
        const source = new RasterSource({
            ...init,
            code: "EPSG:3857",
        });
        super(init, source);
    }

    renderTile(frameState: FrameState, tile: RasterTile) {
        const { context, camera } = frameState;

        const { tileData, freshTile } = tile;

        let glData: GLData;
        if (freshTile || !this.glDataMap.has(tile)) {
            const glVertexBufferObject = new GLVertexBufferObject(context, tileData!.rasterData);
            const glIndexBufferObject = new GLIndexBufferObject(context, tileData!.indexData);
            const glTexture = new GLTexture(context, tileData!.image);
            glData = {
                glVertexBufferObject,
                glIndexBufferObject,
                glTexture,
            };
            this.glDataMap.set(tile, glData);
        } else {
            glData = this.glDataMap.get(tile)!;
        }

        renderTexture2D(context, {
            mvp: camera.getVPMatrix(),
            glVertexBufferObject: glData.glVertexBufferObject,
            glIndexBufferObject: glData.glIndexBufferObject,
            glTexture: glData.glTexture,
        });
    }
}
