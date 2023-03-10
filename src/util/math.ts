import { mat2, vec2, vec3, vec4 } from "gl-matrix";
import { EPSILON, EPSILON_RADIAN } from "../projection/Constants";

export function twoLineIntersectPoint(lineA: vec3, lineB: vec3) {
    // Ax + By + D = 0;
    // M·(x,y) = -D
    // (x,y) = invM·-D

    // prettier-ignore
    const M = mat2.fromValues(
        lineA[0], lineA[1],
        lineB[0], lineB[1]
    );
    mat2.transpose(M, M);

    const absDeterminant = Math.abs(mat2.determinant(M));

    if (absDeterminant === 0 || absDeterminant < EPSILON) {
        return null;
    } else if (absDeterminant >= EPSILON && absDeterminant < 0.1) {
        const v1 = vec2.fromValues(lineA[0], lineA[1]);
        const v2 = vec2.fromValues(lineB[0], lineB[1]);
        // v1 · v2 = ||v1|| ||v2|| cos(θ)
        // cos(θ) = (v1 · v2) / (||v1|| ||v2||)
        let cosTheta = vec2.dot(v1, v2) / (vec2.len(v1) * vec2.len(v2));
        cosTheta = Math.max(Math.min(cosTheta, 1), -1);
        const rad = Math.acos(cosTheta);
        if (Math.PI - rad < EPSILON_RADIAN) {
            return null;
        }
    }

    mat2.invert(M, M);

    const D = vec2.fromValues(lineA[2], lineB[2]);
    vec2.scale(D, D, -1);

    const xy = vec2.transformMat2(vec2.create(), D, M);

    return xy;
}

export function threePlaneIntersectPoint(planeA: vec4, planeB: vec4, planeC: vec4) {
    //
}
