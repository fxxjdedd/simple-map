import { TileNum } from "../core/tile";

export function replaceURLWithTileNum(url: string, tileNum: TileNum) {
    return url.replace(/\[(z|x|y)\]/g, (all, match) => {
        switch (match) {
            case "z":
                return tileNum.z + "";
            case "x":
                return tileNum.x + "";
            case "y":
                return tileNum.y + "";
            default:
                throw new Error("Unexpected url foramt, use [z]/[x]/[y].");
        }
    });
}
