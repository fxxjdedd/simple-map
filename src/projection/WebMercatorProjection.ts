import { vec2 } from "gl-matrix";
import { DegreeToRadian, Circumference, R, RadianToDegree } from "./Constants";
import { Projection } from "./Projection";

export class WebMercatorProjection implements Projection {
    project(lnglat: vec2 | [number, number]) {
        const lngRad = lnglat[0] * DegreeToRadian;
        const latRad = lnglat[1] * DegreeToRadian;
        const x = lngRad * R;
        const y = Math.log(Math.tan(Math.PI / 4 + latRad / 2)) * R;
        return vec2.fromValues(x, y);
    }

    unproject(coord: vec2 | [number, number]) {
        const lng = coord[0] / R;
        const lat = 2 * Math.atan(Math.exp(coord[1] / R)) - Math.PI / 2;
        const lngAngle = lng * RadianToDegree;
        const latAngle = lat * RadianToDegree;
        return vec2.fromValues(lngAngle, latAngle);
    }

    getResolution(zoom: number) {
        // No lat changes considered for now
        return Circumference / 2 ** zoom / 256;
    }
}
