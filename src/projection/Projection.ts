import { vec2 } from "gl-matrix";

export interface Projection {
    project(lnglat: vec2 | [number, number]): vec2;

    unproject(coord: vec2 | [number, number]): vec2;

    getResolution(zoom: number): number;
}
