import { mat4, quat, vec2, vec3 } from "gl-matrix";
import { WebMercatorProjection } from "../projection/WebMercatorProjection";
import { Vector3 } from "../util/matrix";

export interface PerspectiveCameraTransform {
    position: vec3;
    direction: vec3;
    up: vec3;
    right: vec3;
}

export interface PerspectiveCameraInit {
    viewSize: vec2;
    target: vec2; // coord
    pitch: number; // direction
    rotation: number; // up
    zoom: number;
    projection: WebMercatorProjection;
}

export const CAMERA_FIXED_ALTITUDE = 1000; // z 1000 暂定

export class PerspectiveCamera {
    near: number;
    far: number;
    viewSize: vec2;

    zoom: number;
    cameraAltitude: number = 0;
    fov: number = (60 * Math.PI) / 180;

    tranform: PerspectiveCameraTransform;

    projection: WebMercatorProjection;

    constructor(init: PerspectiveCameraInit) {
        this.near = 0.01;
        this.far = CAMERA_FIXED_ALTITUDE;
        this.viewSize = init.viewSize;
        this.zoom = this.updateZoom(init.zoom);

        this.tranform = this.updateTransform(init.target, init.rotation, init.pitch);

        this.projection = init.projection;
    }

    updateTransform(target: vec2, rotation: number, pitch: number): PerspectiveCameraTransform {
        const direction = vec3.create();
        const up = vec3.create();
        const right = vec3.create();
        const forward = vec3.create();
        const position = vec3.fromValues(target[0], target[1], this.cameraAltitude);

        const matrix = mat4.create();

        // 处理 pitch
        mat4.fromRotation(matrix, pitch, Vector3.right);
        vec3.transformMat4(forward, Vector3.forward, matrix);
        vec3.transformMat4(up, Vector3.up, matrix);
        vec3.transformMat4(position, position, matrix);

        // 处理 rotation
        mat4.fromRotation(matrix, rotation, forward);
        vec3.transformMat4(right, Vector3.right, matrix);

        // 得到 direction
        vec3.cross(direction, up, right);

        return {
            direction,
            up,
            right,
            position,
        };
    }

    updateZoom(zoom: number) {
        const resolution = this.projection.getResolution(zoom);
        const viewHeightMeters = this.viewSize[1] * resolution;

        // 这里viewHeightMeters值得是地图平面本身，就是处于视锥之间那个大地平面，而不是near;
        // 大地平面就位于z=0的平面上，所以相机与其的距离就是altitude
        const altitude = viewHeightMeters / (2 * Math.tan(this.fov));

        this.cameraAltitude = altitude;
        this.near = altitude / 10;
        this.far = altitude * 50;
        this.fov = Math.atan(viewHeightMeters / (2 * this.near));

        return zoom;
    }

    getVPMatrix() {
        const { position: P, direction: D, up: U, right: R } = this.tranform;
        // prettier-ignore
        const translateMatrix = mat4.fromValues(
            1, 0, 0, -P[0],
            0, 1, 0, -P[1],
            0, 0, 1, -P[2],
            0, 0, 0, 1,
        );

        // prettier-ignore
        const rotateMatrix = mat4.fromValues(
            R[0], R[1], R[2], 0,
            U[0], U[1], U[2], 0,
            D[0], D[1], D[2], 0, 
            0,    0,    0,    1
        );

        const viewMatrix = mat4.multiply(mat4.create(), rotateMatrix, translateMatrix);

        const { near, far, viewSize } = this;
        const [width, height] = viewSize;

        // prettier-ignore
        const projMatrix = mat4.fromValues(
            near/width/2, 0, 0, 0,
            0, near/height/2, 0, 0, 
            0, 0, -(far+near)/(far-near), -2*far*near/(far-near),
            0, 0, -1, 0,
        );
        return mat4.mul(mat4.create(), viewMatrix, projMatrix);
    }

    getBounds() {
        const nearPlaneLB = vec3.fromValues(-1, -1, this.near);
        const nearPlaneRT = vec3.fromValues(1, 1, this.near);

        const farPlaneLB = vec3.fromValues(-1, -1, this.far);
        const farPlaneRT = vec3.fromValues(1, 1, this.far);

        const backToWorldMatrix = mat4.invert(mat4.create(), this.getVPMatrix());

        vec3.transformMat4(nearPlaneLB, nearPlaneLB, backToWorldMatrix);
        vec3.transformMat4(nearPlaneRT, nearPlaneRT, backToWorldMatrix);
        vec3.transformMat4(farPlaneLB, farPlaneLB, backToWorldMatrix);
        vec3.transformMat4(farPlaneRT, farPlaneRT, backToWorldMatrix);

        const minX = Math.min(nearPlaneLB[0], nearPlaneRT[0], farPlaneLB[0], farPlaneRT[0]);
        const minY = Math.min(nearPlaneLB[1], nearPlaneRT[1], farPlaneLB[1], farPlaneRT[1]);
        const maxX = Math.max(nearPlaneLB[0], nearPlaneRT[0], farPlaneLB[0], farPlaneRT[0]);
        const maxY = Math.max(nearPlaneLB[1], nearPlaneRT[1], farPlaneLB[1], farPlaneRT[1]);

        const minLnglat = this.projection.unproject(vec2.fromValues(minX, minY));
        const maxLnglat = this.projection.unproject(vec2.fromValues(maxX, maxY));

        return [...minLnglat, maxLnglat];
    }
}
