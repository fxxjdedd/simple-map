import { vec4 } from "gl-matrix";
import { IndexStructuredData, RasterStructuredData } from "../data/allStructuredData";
import { loadImage } from "../util/image";
import { EPSGUtilSet } from "../util/tile";
import { replaceURLWithTileNum } from "../util/url";
import { InferTileContent, RasterTile, Tile, TileCache, TileNum } from "./Tile";

export abstract class Source<T extends Tile<unknown>> {
    tileCache: TileCache<T>;
    tileNums: TileNum[] = [];

    constructor(cacheSize: number = 500) {
        this.tileCache = new TileCache(cacheSize);
    }

    async *loadTiles() {
        const loadings = this.tileNums.map(async tileNum => {
            let tile = this.tileCache.get(tileNum);

            if (!tile) {
                const newTile = this.createTile(tileNum);

                this.tileCache.set(tileNum, newTile);

                const task = this.load(newTile)
                    .then(tileData => {
                        newTile.tileData = tileData;
                        newTile.pendingTask = undefined;
                        // dont know why this line is nessary? if comment, tile wont have the `freshTile` field.
                        newTile.freshTile = true;
                        this.tileCache.set(tileNum, newTile);
                        return newTile;
                    })
                    .catch(e => {
                        this.tileCache.delete(tileNum);
                        throw e;
                    });
                newTile.pendingTask = task;
                tile = newTile;
            } else {
                tile.freshTile = false;
            }

            if (tile.pendingTask !== undefined) {
                return (await tile.pendingTask!) as T;
            } else {
                return tile;
            }
        });
        while (loadings.length) {
            let firstRaced = false;
            const tile = await Promise.race(
                loadings.map(async loading => {
                    try {
                        return await loading;
                    } catch (e) {
                        throw e;
                    } finally {
                        if (!firstRaced) {
                            const at = loadings.indexOf(loading);
                            loadings.splice(at, 1);
                            firstRaced = true;
                        }
                    }
                })
            );

            yield tile;
        }
    }

    abstract createTile(tileNum: TileNum): T;

    abstract load(tile: T): Promise<InferTileContent<T>>;
}

export interface RasterSourceInit {
    code: string;
    url: string;
    cacheSize: number;
}
export class RasterSource extends Source<RasterTile> {
    code: string;
    url: string;

    constructor(init: RasterSourceInit) {
        super(init.cacheSize);
        this.url = init.url;
        this.code = init.code;
    }

    createTile(tileNum: TileNum): RasterTile {
        const tile = new RasterTile(tileNum);
        tile.coordBounds = EPSGUtilSet[this.code].getTileCoordBounds(tileNum);
        return tile;
    }

    updateTileNums(bounds: vec4, zoom: number) {
        this.tileNums = EPSGUtilSet[this.code].getBoundsTileNums(bounds, zoom);
    }

    async load(tile: RasterTile) {
        const { tileNum, coordBounds } = tile;
        const url = replaceURLWithTileNum(this.url, tileNum);
        console.log(`load tileNum: ${tileNum.z}/${tileNum.x}/${tileNum.y}`);
        const image = await loadImage(url);

        const rasterData = new RasterStructuredData();

        const [minX, minY, maxX, maxY] = coordBounds!;
        // prettier-ignore
        const positions = [
            minX, minY, 0, 
            maxX, minY, 0, 
            maxX, maxY, 0, 
            minX, maxY, 0
        ];

        // prettier-ignore
        const uv = [
            0, 0,
            1, 0,
            1, 1,
            0, 1,
        ]
        rasterData.merge({
            a_pos: positions,
            a_uv: uv,
        });

        const indexData = new IndexStructuredData();
        // prettier-ignore
        const triangles = [
            0, 1, 3,
            1, 2, 3
        ]
        indexData.merge({
            a_index: triangles,
        });

        return {
            rasterData,
            indexData,
            image,
        };
    }
}
