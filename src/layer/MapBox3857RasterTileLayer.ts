import { vec2, vec4 } from "gl-matrix";
import { RasterTileLayer } from "../core/layer";
import { RasterTile, TileNum } from "../core/tile";
import { Circumference, R } from "../projection/Constants";
import { WebMercatorProjection } from "../projection/WebMercatorProjection";

export class MapBox3857RasterTileLayer extends RasterTileLayer {
    projection = new WebMercatorProjection();

    getTileNums(bounds: vec4, zoom: number): TileNum[] {
        const [minLng, minLat, maxLng, maxLat] = bounds;

        const [minX, minY] = this.projection.project(vec2.fromValues(minLng, minLat));
        const [maxX, maxY] = this.projection.project(vec2.fromValues(maxLng, maxLat));

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
    renderTile(tile: RasterTile) {
        throw new Error("Method not implemented.");
    }
}
