import { mat4, quat, vec2, vec3, vec4 } from "gl-matrix";
import { Projection } from "../projection/Projection";
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
    projection: Projection;
}

export const CAMERA_FIXED_ALTITUDE = 1000; // z 1000 暂定

export class PerspectiveCamera {
    near: number;
    far: number;
    viewSize: vec2;
    viewSizeWidth!: number;
    viewSizeHeight!: number;

    zoom: number;
    cameraAltitude: number = 0;
    fov: number = (60 * Math.PI) / 180;
    aspect = 1;

    tranform: PerspectiveCameraTransform;

    projection: Projection;
    target!: vec2;

    constructor(init: PerspectiveCameraInit) {
        this.projection = init.projection;

        this.near = 0.01;
        this.far = CAMERA_FIXED_ALTITUDE;
        this.viewSize = init.viewSize;
        this.zoom = this.updateZoom(init.zoom);

        this.tranform = this.updateTransform(init.target, init.rotation, init.pitch);
    }

    updateTransform(target: vec2, rotation: number, pitch: number): PerspectiveCameraTransform {
        this.target = target;
        const worldSpaceTarget = vec3.fromValues(target[0], target[1], 0);
        const up = vec3.clone(Vector3.up);
        const right = vec3.clone(Vector3.right);
        const forward = vec3.clone(Vector3.forward);
        const position = vec3.fromValues(
            worldSpaceTarget[0],
            worldSpaceTarget[1],
            this.cameraAltitude
        );

        const viewSpacePosition = vec3.subtract(position, position, worldSpaceTarget);

        const matrix = mat4.create();

        // 处理 pitch
        mat4.fromRotation(matrix, pitch, Vector3.right);
        vec3.transformMat4(forward, forward, matrix);
        vec3.transformMat4(up, up, matrix);

        const viewSpacePitchedPosition = vec3.scale(
            vec3.create(),
            forward,
            vec3.len(viewSpacePosition)
        );

        // 处理 rotation
        mat4.fromRotation(matrix, rotation, forward);
        vec3.transformMat4(up, up, matrix);
        vec3.transformMat4(right, right, matrix);

        // 反方向即是 direction
        vec3.scale(forward, forward, -1);

        return {
            direction: forward,
            up,
            right,
            position: viewSpacePitchedPosition,
        };
    }

    updateZoom(zoom: number) {
        const resolution = this.projection.getResolution(zoom);
        this.viewSizeWidth = this.viewSize[0] * resolution;
        this.viewSizeHeight = this.viewSize[1] * resolution;

        // 这里viewHeightMeters值得是地图平面本身，就是处于视锥之间那个大地平面，而不是near;
        // 大地平面就位于z=0的平面上，所以相机与其的距离就是altitude
        const altitude = this.viewSizeHeight / (2 * Math.tan(this.fov));

        this.cameraAltitude = altitude;
        this.near = altitude / 10;
        this.far = altitude * 50;
        this.fov = Math.atan(this.viewSizeHeight / (2 * this.near));
        this.aspect = this.viewSizeWidth / this.viewSizeHeight;

        return zoom;
    }

    getVPMatrix() {
        const { position: P, direction: D, up: U, right: R } = this.tranform;
        // prettier-ignore
        let translateMatrix = mat4.fromValues(
            1, 0, 0, -P[0],
            0, 1, 0, -P[1],
            0, 0, 1, -P[2],
            0, 0, 0, 1,
        );
        // fromValues是按列输入，但是不方便按照习惯展示，所以我们先倒置写，然后再转过来
        translateMatrix = mat4.transpose(translateMatrix, translateMatrix);

        // prettier-ignore
        let rotateMatrix = mat4.fromValues(
            R[0], R[1], R[2], 0,
            U[0], U[1], U[2], 0,
            D[0], D[1], D[2], 0, 
            0,    0,    0,    1
        );
        rotateMatrix = mat4.transpose(rotateMatrix, rotateMatrix);

        const viewMatrix = mat4.multiply(mat4.create(), translateMatrix, rotateMatrix);

        const { near, far, viewSize } = this;
        const [width, height] = viewSize;

        // prettier-ignore
        let projMatrix = mat4.fromValues(
            near/this.viewSizeWidth/2, 0, 0, 0,
            0, near/this.viewSizeHeight/2, 0, 0,
            0, 0, -(far+near)/(far-near), -2*far*near/(far-near),
            0, 0, -1, 0,
        );
        projMatrix = mat4.transpose(projMatrix, projMatrix);
        const projMatrix2 = mat4.perspective(
            mat4.create(),
            this.fov,
            this.aspect,
            this.near,
            this.far
        );
        return mat4.mul(mat4.create(), projMatrix2, viewMatrix);
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

        return vec4.fromValues(minLnglat[0], minLnglat[1], maxLnglat[0], maxLnglat[0]);
    }
}
