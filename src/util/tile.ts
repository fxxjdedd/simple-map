import { vec2, vec4 } from "gl-matrix";
import { TileNum } from "../core/tile";
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
    const optimalZoom = Math.floor(zoom);
    const [minLng, minLat, maxLng, maxLat] = bounds;

    let [minX, minY] = webMercatorProjection.project(vec2.fromValues(minLng, minLat));
    let [maxX, maxY] = webMercatorProjection.project(vec2.fromValues(maxLng, maxLat));

    // clamp Y to Circumference / 2, cause we only need repeat tile in x-direction.
    // minus/plus 1 is useful to guard load only 1 tile when zoom = 0.
    minY = Math.max(Math.min(minY, Circumference / 2), -Circumference / 2);
    maxY = Math.max(Math.min(maxY, Circumference / 2), -Circumference / 2);

    // x,y start from 0°, not -180°, so here + half Circumference
    let minTileX = (minX + Circumference / 2) / (Circumference / 2 ** optimalZoom);
    let minTileY = (Circumference / 2 - maxY) / (Circumference / 2 ** optimalZoom);
    let maxTileX = (maxX + Circumference / 2) / (Circumference / 2 ** optimalZoom);
    let maxTileY = (Circumference / 2 - minY) / (Circumference / 2 ** optimalZoom);

    const tileNums: TileNum[] = [];
    for (let i = minTileX; i < maxTileX; i++) {
        i = Math.floor(i);
        for (let j = minTileY; j < maxTileY; j++) {
            j = Math.floor(j);
            const totalNums = 2 ** Math.floor(zoom);

            tileNums.push({
                x: Math.abs(i % totalNums),
                y: j, // j is safe
                z: optimalZoom,
                offset: Math.floor(i / totalNums),
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
