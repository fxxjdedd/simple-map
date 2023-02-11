import { vec2, vec4 } from "gl-matrix";
import { TileNum } from "../core/Tile";
import { Circumference } from "../projection/Constants";
import { Projection } from "../projection/Projection";
import { WebMercatorProjection } from "../projection/WebMercatorProjection";

export interface EPSGUtil {
    projection: Projection;
    getBoundsTileNums(bounds: vec4, zoom: number): TileNum[];
    getTileCoordBounds(tileNum: TileNum): vec4;
}

export interface EPSGUtilSet {
    [k: string]: EPSGUtil;
}

const webMercatorProjection = new WebMercatorProjection();

function getBoundsTileNums(bounds: vec4, zoom: number): TileNum[] {
    const [minLng, minLat, maxLng, maxLat] = bounds;

    const [minX, minY] = webMercatorProjection.project(vec2.fromValues(minLng, minLat));
    const [maxX, maxY] = webMercatorProjection.project(vec2.fromValues(maxLng, maxLat));

    // x,y start from 0°, not -180°, so here add half Circumference
    const minTileX = Math.floor((minX + Circumference / 2) / (Circumference / 2 ** zoom));
    const minTileY = Math.floor((minY + Circumference / 2) / (Circumference / 2 ** zoom));
    const maxTileX = Math.floor((maxX + Circumference / 2) / (Circumference / 2 ** zoom));
    const maxTileY = Math.floor((maxY + Circumference / 2) / (Circumference / 2 ** zoom));

    const tileNums: TileNum[] = [];
    for (let i = minTileX; i <= maxTileX; i++) {
        for (let j = minTileY; j <= maxTileY; j++) {
            tileNums.push({
                x: i,
                y: j,
                z: zoom,
            });
        }
    }
    return tileNums;
}

function getTileCoordBounds(tileNum: TileNum): vec4 {
    const { x, y, z } = tileNum;

    const coordMinX = (Circumference / 2 ** z) * x - Circumference / 2;
    const coordMinY = Circumference / 2 - (Circumference / 2 ** z) * y;

    const coordMaxX = (Circumference / 2 ** z) * (x + 1) - Circumference / 2;
    const coordMaxY = Circumference / 2 - (Circumference / 2 ** z) * (y + 1);

    // to sw -> ne
    return vec4.fromValues(coordMinX, coordMaxY, coordMaxX, coordMinY);
}

export const EPSGUtilSet: EPSGUtilSet = {
    "EPSG:3857": {
        projection: webMercatorProjection,
        getBoundsTileNums,
        getTileCoordBounds,
    },
};
