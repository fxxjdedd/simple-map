import { vec4 } from "gl-matrix";
import { IndexStructuredData, RasterStructuredData } from "../data/allStructuredData";

export interface TileNum {
    x: number;
    y: number;
    z: number;
    offset: number; // tell shader how to locate repeatde tile
}

export class TileCache<T extends Tile<any>> {
    cache: Map<string, T>;
    size: number;

    constructor(size = 500) {
        this.cache = new Map();
        this.size = size;
    }

    get(tileNum: TileNum) {
        return this.cache.get(`${tileNum.x}-${tileNum.y}-${tileNum.z}`);
    }

    set(tileNum: TileNum, tile: T) {
        if (this.cache.size > this.size) {
            this.cache.delete(this.cache.keys().next().value);
        }
        this.cache.set(`${tileNum.x}-${tileNum.y}-${tileNum.z}`, tile);
    }

    delete(tileNum: TileNum) {
        return this.cache.delete(`${tileNum.x}-${tileNum.y}-${tileNum.z}`);
    }
}

export abstract class Tile<T> {
    tileNum: TileNum;

    tileData?: T;

    pendingTask?: Promise<Tile<T> | null>;

    freshTile: boolean = false;

    constructor(tileNum: TileNum) {
        this.tileNum = tileNum;
    }
}

interface RasterTileData {
    rasterData: RasterStructuredData;
    indexData: IndexStructuredData;
    image: HTMLImageElement;
}

export class RasterTile extends Tile<RasterTileData> {
    coordBounds?: vec4;
}

export type InferTileContent<T> = T extends Tile<infer E> ? E : never;
