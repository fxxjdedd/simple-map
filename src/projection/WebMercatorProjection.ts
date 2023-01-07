import { vec2 } from "gl-matrix";
import { AngleToRadius, Circumference, R, RadiusToAngle } from "./Constants";

export class WebMercatorProjection {
    project(lnglat: vec2 | [number, number]) {
        const lngRad = lnglat[0] * AngleToRadius;
        const latRad = lnglat[1] * AngleToRadius;
        const x = lngRad * R;
        const y = Math.log(Math.tan(Math.PI / 4 + latRad / 2)) * R;
        return vec2.fromValues(x, y);
    }

    unproject(coord: vec2 | [number, number]) {
        const lng = coord[0] / R;
        const lat = 2 * Math.atan(Math.exp(coord[1] / R)) - Math.PI / 2;
        const lngAngle = lng * RadiusToAngle;
        const latAngle = lat * RadiusToAngle;
        return vec2.fromValues(lngAngle, latAngle);
    }

    getResolution(zoom: number) {
        // 暂未考虑lat变化
        return Circumference / 2 ** zoom / 256;
    }
}
