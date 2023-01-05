import { vec2 } from "gl-matrix";

const R = 6371008.8;
const Circumference = 2 * Math.PI * R;

export class WebMercatorProjection {
    project(lnglat: vec2) {
        const x = lnglat[0] * R;
        const y = Math.tan(Math.PI / 4 + lnglat[1] / 2) * R;
        return vec2.fromValues(x, y);
    }

    unproject(coord: vec2) {
        const lng = coord[0] / R;
        const lat = 2 * Math.atan(Math.exp(coord[1] / R)) - Math.PI / 2;
        return vec2.fromValues(lng, lat);
    }

    getResolution(zoom: number) {
        // 暂未考虑lat变化
        return Circumference / 2 ** zoom / 256;
    }
}
