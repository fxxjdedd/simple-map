import { vec3 } from "gl-matrix";

export const Vector3 = {
    zero: vec3.fromValues(0, 0, 0),
    right: vec3.fromValues(1, 0, 0),
    left: vec3.fromValues(-1, 0, 0),
    up: vec3.fromValues(0, 1, 0),
    down: vec3.fromValues(0, -1, 0),
    forward: vec3.fromValues(0, 0, 1),
    back: vec3.fromValues(0, 0, -1),
};
