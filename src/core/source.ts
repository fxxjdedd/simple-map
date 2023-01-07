import { replaceURLWithTileNum } from "../util/url";
import { InferTileContent, RasterTile, Texture2DData, Tile, TileCache, TileNum } from "./tile";

export abstract class Source<T extends Tile<unknown>> {
    tileCache: TileCache<T>;

    constructor(cacheSize: number = 500) {
        this.tileCache = new TileCache(cacheSize);
    }

    async *loadTiles(tileNums: TileNum[]) {
        const loadings = tileNums.map(async tileNum => {
            let tile = this.tileCache.get(tileNum);

            if (!tile) {
                const newTile = this.createTile(tileNum);

                this.tileCache.set(tileNum, newTile);

                const task = this.load(tileNum)
                    .then(tileData => {
                        newTile.tileData = tileData;
                        newTile.pendingTask = undefined;
                        this.tileCache.set(tileNum, newTile);
                        return newTile;
                    })
                    .catch(e => {
                        this.tileCache.delete(tileNum);
                        console.error(e);
                        return null;
                    });
                newTile.pendingTask = task;
                tile = newTile;
            }

            if (tile.pendingTask !== undefined) {
                return (await tile.pendingTask!) as T | null;
            } else {
                return tile;
            }
        });

        while (loadings.length) {
            const tile = await Promise.race(
                loadings.map(async loading => {
                    try {
                        return await loading;
                    } catch (e) {
                        throw e;
                    } finally {
                        const at = loadings.indexOf(loading);
                        loadings.splice(at, 1);
                    }
                })
            );

            yield tile;
        }
    }

    abstract createTile(tileNum: TileNum): T;

    abstract load(tileNum: TileNum): Promise<InferTileContent<T>>;
}

export interface RasterSourceInit {
    url: string;
    cacheSize: number;
}
export class RasterSource extends Source<RasterTile> {
    url: string;

    constructor(init: RasterSourceInit) {
        super(init.cacheSize);
        this.url = init.url;
    }

    createTile(tileNum: TileNum): RasterTile {
        return new RasterTile(tileNum);
    }

    async load(tileNum: TileNum): Promise<Uint8Array> {
        const url = replaceURLWithTileNum(this.url, tileNum);
        const buffer = await (await fetch(url)).arrayBuffer();
        return new Uint8Array(buffer);
    }
}
