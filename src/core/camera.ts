import { mat2, mat4, quat, vec2, vec3, vec4 } from "gl-matrix";
import { DegreeToRadian, EPSILON, EPSILON_RADIAN } from "../projection/Constants";
import { Projection } from "../projection/Projection";
import { twoLineIntersectPoint } from "../util/math";
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
    fov: number = 60 * DegreeToRadian;

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
        const rotationRad = rotation * DegreeToRadian;
        const pitchRad = pitch * DegreeToRadian;

        const up = vec3.clone(Vector3.up);
        const right = vec3.clone(Vector3.right);
        const forward = vec3.clone(Vector3.forward);

        const matrix = mat4.create();

        // Handling pitch
        mat4.fromRotation(matrix, pitchRad, Vector3.right);
        vec3.transformMat4(forward, forward, matrix);
        vec3.transformMat4(up, up, matrix);

        let pitchedPosition = vec3.scale(vec3.create(), forward, this.cameraAltitude);
        pitchedPosition[0] += target[0];
        pitchedPosition[1] += target[1];

        // Handling rotation
        mat4.fromRotation(matrix, rotationRad, forward);
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
        // ndc positions (right-handed), the order is: near-lb, near-rb, near-rt, near-lt, far follows the same order.
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
            [frustumWorldPositions[2], frustumWorldPositions[1], frustumWorldPositions[0]], // near
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

        // intersects with z = 0
        const frustumIntersectLines = frustumPlanes.map(plane => {
            const [A, B, C, D] = plane;
            // map plane's z is 0, so C is discarded
            // line: Ax + By + D = 0;
            return vec3.fromValues(A, B, D);
        });

        const intersectPoints = this.getFrustumPlaneIntersectPoints(
            frustumWorldPositions,
            frustumIntersectLines
        );

        // prettier-ignore
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        for (const point of intersectPoints) {
            minX = Math.min(minX, point[0]);
            minY = Math.min(minY, point[1]);
            maxX = Math.max(maxX, point[0]);
            maxY = Math.max(maxY, point[1]);
        }

        const minLnglat = this.projection.unproject(vec2.fromValues(minX, minY));
        const maxLnglat = this.projection.unproject(vec2.fromValues(maxX, maxY));

        // TODO: support skyHeight and fog, to reduce tile nums when pitch at hight value

        return vec4.fromValues(minLnglat[0], minLnglat[1], maxLnglat[0], maxLnglat[1]);
    }

    private getFrustumPlaneIntersectPoints(frustumVerties: vec3[], lines: vec3[]) {
        const [nearLB, nearRB, nearRT, nearLT, farLB, farRB, farRT, farLT] = frustumVerties;
        const [left, right, top, bottom, near, far] = lines;

        let toIntersectLines: vec3[];

        if (farLB[2] >= 0 && farRB[2] >= 0 && farRT[2] >= 0 && farLT[2] >= 0) {
            toIntersectLines = [];
        } else if (farLB[2] < 0 && farRB[2] < 0 && farRT[2] < 0 && farLT[2] < 0) {
            toIntersectLines = [left, top, right, bottom];
        } else if (farLT[2] > 0 && farRT[2] > 0) {
            // top plane above 0, discard
            toIntersectLines = [left, far, right, bottom];
        } else if (farRT[2] > 0 && farRB[2] > 0) {
            // right plane above 0, discard
            toIntersectLines = [bottom, far, top, left];
        } else if (farRB[2] > 0 && farLB[2] > 0) {
            // bottom plane above 0, discatd
            toIntersectLines = [right, far, left, top];
        } else if (farLB[2] > 0 && farLT[2] > 0) {
            // left plane above 0, discard
            toIntersectLines = [bottom, far, top, right];
        } else {
            // only one vertex above 0, no discard
            toIntersectLines = [left, far, top, right, bottom];
        }

        const intersectPoints = [];
        for (let i = 0; i < toIntersectLines.length; i++) {
            const pnt = twoLineIntersectPoint(
                toIntersectLines[i],
                toIntersectLines[(i + 1) % toIntersectLines.length]
            );
            if (pnt) {
                intersectPoints.push(pnt);
            }
        }

        return intersectPoints;
    }
}
