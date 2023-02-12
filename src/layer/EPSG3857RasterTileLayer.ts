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

        // TODO:
        // 1. renderFrame new Map和addLayer都会触发一次render的问题
        // 2. google的瓦片服务貌似有网络限制，总是不返回
        // 3. 这里要改成一次render多个tiles？貌似也没必要，因为每个瓦片都是互相不覆盖的
        const { tileData } = tile;

        const glVertexBufferObject = new GLVertexBufferObject(context, tileData!.rasterData);
        const glIndexBufferObject = new GLIndexBufferObject(context, tileData!.indexData);
        const glTexture = new GLTexture(context, tileData!.image);

        renderTexture2D(context, {
            mvp: camera.getVPMatrix(),
            glVertexBufferObject,
            glIndexBufferObject,
            glTexture,
        });
    }
}
