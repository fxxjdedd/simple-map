import { InferTileContent, RasterTile, Texture2DData, Tile, TileCache, TileNum } from "./tile";

export abstract class Source<T extends Tile<unknown>> {
    tileCache: TileCache<T>;

    constructor(cacheSize: number) {
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
                return await tile.pendingTask!;
            } else {
                return tile;
            }
        });

        const tiles = await Promise.all(loadings);
        for (const tile of tiles) {
            if (tile !== null) {
                yield tile;
            }
        }
    }

    abstract createTile(tileNum: TileNum): T;

    abstract load(tileNum: TileNum): Promise<InferTileContent<T>>;
}
export class RasterSource extends Source<RasterTile> {
    createTile(tileNum: TileNum): RasterTile {
        return new RasterTile(tileNum);
    }
    async load(tileNum: TileNum): Promise<Uint8Array> {
        const buffer = await (await fetch("")).arrayBuffer();
        return new Uint8Array(buffer);
    }
}
