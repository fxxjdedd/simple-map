import { mat2, mat4, quat, vec2, vec3, vec4 } from "gl-matrix";
import { EPSILON, EPSILON_RADIAN } from "../projection/Constants";
import { Projection } from "../projection/Projection";
import { Vector3 } from "../util/matrix";

export interface PerspectiveCameraTransform {
    position: vec3;
    forward: vec3; // negative direction
    up: vec3;
    right: vec3;
}

export interface PerspectiveCameraInit {
    viewSize: vec2;
    target: vec2;
    pitch: number;
    rotation: number;
    zoom: number;
    projection: Projection;
}

export class PerspectiveCamera {
    near: number;
    far: number;
    viewSize: vec2;
    nearPlaneWidth!: number;
    nearPlaneHeight!: number;

    zoom: number;
    cameraAltitude: number = 0;
    fov: number = (60 * Math.PI) / 180;

    transform: PerspectiveCameraTransform;

    projection: Projection;
    target!: vec2;

    constructor(init: PerspectiveCameraInit) {
        this.projection = init.projection;

        this.near = 0.01;
        this.far = 1000;
        this.viewSize = init.viewSize;
        this.zoom = this.updateZoom(init.zoom);
        this.transform = this.updateTransform(init.target, init.rotation, init.pitch);
    }

    updateTransform(target: vec2, rotation: number, pitch: number): PerspectiveCameraTransform {
        const up = vec3.clone(Vector3.up);
        const right = vec3.clone(Vector3.right);
        const forward = vec3.clone(Vector3.forward);

        const matrix = mat4.create();

        // Handling pitch
        mat4.fromRotation(matrix, pitch, Vector3.right);
        vec3.transformMat4(forward, forward, matrix);
        vec3.transformMat4(up, up, matrix);

        let pitchedPosition = vec3.scale(vec3.create(), forward, this.cameraAltitude);
        pitchedPosition[0] += target[0];
        pitchedPosition[1] += target[1];
        console.log(
            "🚀 ~ file: Camera.ts:61 ~ PerspectiveCamera ~ updateTransform ~ pitchedPosition:",
            pitchedPosition
        );

        // Handling rotation
        mat4.fromRotation(matrix, rotation, forward);
        vec3.transformMat4(up, up, matrix);
        vec3.transformMat4(right, right, matrix);

        this.transform = {
            forward,
            up,
            right,
            position: pitchedPosition,
        };

        return this.transform;
    }

    updateZoom(zoom: number) {
        const resolution = this.projection.getResolution(zoom);
        const viewSizeWidth = this.viewSize[0] * resolution;
        const viewSizeHeight = this.viewSize[1] * resolution;

        const altitude = viewSizeHeight / (2 * Math.tan(this.fov / 2)); // Note that here is fov/2

        const factor = 1 / 10;

        this.cameraAltitude = altitude;
        this.near = altitude * factor;
        this.far = altitude * 50;

        this.nearPlaneWidth = viewSizeWidth * factor;
        this.nearPlaneHeight = viewSizeHeight * factor;

        return zoom;
    }

    getVPMatrix() {
        const { position: P, forward: F, up: U, right: R } = this.transform;
        // prettier-ignore
        let translateMatrix = mat4.fromValues(
            1, 0, 0, -P[0],
            0, 1, 0, -P[1],
            0, 0, 1, -P[2],
            0, 0, 0, 1,
        );
        // fromValues is entered by column, but it's not convenient to display it by convention, so we write it upside down first and then turn it around
        translateMatrix = mat4.transpose(translateMatrix, translateMatrix);

        // prettier-ignore
        let rotateMatrix = mat4.fromValues(
            R[0], R[1], R[2], 0,
            U[0], U[1], U[2], 0,
            F[0], F[1], F[2], 0, // This must be forward, not direction (negative forward)
            0,    0,    0,    1
        );
        rotateMatrix = mat4.transpose(rotateMatrix, rotateMatrix);

        // First move, then rotate.
        const viewMatrix = mat4.multiply(mat4.create(), rotateMatrix, translateMatrix);

        let { near, far, nearPlaneWidth, nearPlaneHeight } = this;

        const m00 = near / (nearPlaneWidth / 2);
        const m11 = near / (nearPlaneHeight / 2);
        const m22 = -(far + near) / (far - near);
        const m23 = (-2 * far * near) / (far - near);
        // prettier-ignore
        let projMatrix = mat4.fromValues(
            m00, 0,   0,   0,
            0,   m11, 0,   0,
            0,   0,   m22, m23,
            0,   0,   -1,  0,
        );
        projMatrix = mat4.transpose(projMatrix, projMatrix);

        return mat4.mul(mat4.create(), projMatrix, viewMatrix);
    }

    getBounds() {
        // ndc positions (right-handed)
        const frustumNDCPositions = [
            // near
            vec4.fromValues(1, -1, -1, 1),
            vec4.fromValues(-1, -1, -1, 1),
            vec4.fromValues(-1, 1, -1, 1),
            vec4.fromValues(1, 1, -1, 1),
            // far
            vec4.fromValues(1, -1, 1, 1),
            vec4.fromValues(-1, -1, 1, 1),
            vec4.fromValues(-1, 1, 1, 1),
            vec4.fromValues(1, 1, 1, 1),
        ];

        const backToWorldMatrix = mat4.invert(mat4.create(), this.getVPMatrix());

        // world positions
        const frustumWorldPositions: vec3[] = [];
        for (const ndcPos of frustumNDCPositions) {
            const worldPos = vec4.transformMat4(vec4.create(), ndcPos, backToWorldMatrix);
            vec4.scale(worldPos, worldPos, 1 / worldPos[3]); // w-divide
            frustumWorldPositions.push(vec3.fromValues(worldPos[0], worldPos[1], worldPos[2]));
        }

        const frustumPlaneTriangles = [
            [frustumWorldPositions[7], frustumWorldPositions[3], frustumWorldPositions[0]], // left (2,3) x (2,0)
            [frustumWorldPositions[1], frustumWorldPositions[2], frustumWorldPositions[6]], // right
            [frustumWorldPositions[2], frustumWorldPositions[3], frustumWorldPositions[7]], // top
            [frustumWorldPositions[4], frustumWorldPositions[0], frustumWorldPositions[1]], // bottom
            [frustumWorldPositions[7], frustumWorldPositions[4], frustumWorldPositions[5]], // far
        ];

        const frustumPlaneNormals = frustumPlaneTriangles
            .map(([p1, p2, p3]) => [
                vec3.subtract(vec3.create(), p1, p2),
                vec3.subtract(vec3.create(), p3, p2),
            ])
            .map(([v1, v2]) => {
                const normal = vec3.create();
                vec3.cross(normal, v1, v2);
                vec3.normalize(normal, normal);
                return normal;
            });

        const frustumPlanes = frustumPlaneNormals.map((normal, index) => {
            // plane: Ax + By + Cz + D = 0;
            // prettier-ignore
            const A = normal[0];
            const B = normal[1];
            const C = normal[2];
            const pointOnPlane = frustumPlaneTriangles[index][0];
            const D = -vec3.dot(normal, pointOnPlane);
            return vec4.fromValues(A, B, C, D);
        });

        const frustumIntersectLines = frustumPlanes.map(plane => {
            const [A, B, C, D] = plane;
            // map plane's z is 0, so C is discarded
            // line: Ax + By + D = 0;
            return vec3.fromValues(A, B, D);
        });

        const intersectPoints = frustumIntersectLines.map(line => {
            return this.intersectPoints(line, frustumIntersectLines);
        });

        // prettier-ignore
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        for (const points of intersectPoints) {
            for (const point of points) {
                minX = Math.min(minX, point[0]);
                minY = Math.min(minY, point[1]);
                maxX = Math.max(maxX, point[0]);
                maxY = Math.max(maxY, point[1]);
            }
        }

        const minLnglat = this.projection.unproject(vec2.fromValues(minX, minY));
        const maxLnglat = this.projection.unproject(vec2.fromValues(maxX, maxY));

        return vec4.fromValues(minLnglat[0], minLnglat[1], maxLnglat[0], maxLnglat[1]);
    }

    private intersectPoints(line: vec3, intersectLines: vec3[]) {
        const points: vec2[] = [];

        for (const intersectLine of intersectLines) {
            // same line
            if (vec3.equals(line, intersectLine)) {
                continue;
            }

            // Ax + By + D = 0;
            // M·(x,y) = -D
            // (x,y) = invM·-D

            // prettier-ignore
            const M = mat2.fromValues(
                line[0], line[1],
                intersectLine[0], intersectLine[1]
            );
            mat2.transpose(M, M);

            const absDeterminant = Math.abs(mat2.determinant(M));

            if (absDeterminant === 0 || absDeterminant < EPSILON) {
                continue;
            } else if (absDeterminant >= EPSILON && absDeterminant < 0.1) {
                const v1 = vec2.fromValues(line[0], line[1]);
                const v2 = vec2.fromValues(intersectLine[0], intersectLine[1]);
                // v1 · v2 = ||v1|| ||v2|| cos(θ)
                // cos(θ) = (v1 · v2) / (||v1|| ||v2||)
                let cosTheta = vec2.dot(v1, v2) / (vec2.len(v1) * vec2.len(v2));
                cosTheta = Math.max(Math.min(cosTheta, 1), -1);
                const rad = Math.acos(cosTheta);
                if (Math.PI - rad < EPSILON_RADIAN) {
                    continue;
                }
            }

            mat2.invert(M, M);

            const D = vec2.fromValues(line[2], intersectLine[2]);
            vec2.scale(D, D, -1);

            const xy = vec2.transformMat2(vec2.create(), D, M);
            points.push(xy);
        }
        return points;
    }
}
