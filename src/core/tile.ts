import { vec4 } from "gl-matrix";
import { GLContext } from "../gl/GLContext";

export interface TileNum {
    x: number;
    y: number;
    z: number;
}

export class TileCache<T extends Tile<any>> {
    cache: Map<string, T>;
    size: number;

    constructor(size = 500) {
        this.cache = new Map();
        this.size = size;
    }

    get(tileNum: TileNum) {
        return this.cache.get(`${tileNum.x}-${tileNum.y}-${tileNum.z}`);
    }

    set(tileNum: TileNum, tile: T) {
        if (this.cache.size > this.size) {
            this.cache.delete(this.cache.keys().next().value);
        }
        this.cache.set(`${tileNum.x}-${tileNum.y}-${tileNum.z}`, tile);
    }

    delete(tileNum: TileNum) {
        return this.cache.delete(`${tileNum.x}-${tileNum.y}-${tileNum.z}`);
    }
}

export abstract class Tile<T> {
    tileNum: TileNum;

    tileData?: T;

    pendingTask?: Promise<Tile<T> | null>;

    constructor(tileNum: TileNum) {
        this.tileNum = tileNum;
    }
}

export type Texture2DData = Uint8Array;

export class RasterTile extends Tile<Texture2DData> {
    coordBounds?: vec4;
    glContext?: GLContext;

    private _boundsPositionBuffer?: WebGLBuffer;
    private _indexBuffer?: WebGLBuffer;
    private _textureBuffer?: WebGLTexture;

    get boundsPositionBuffer() {
        if (!this.glContext || !this.coordBounds) return null;
        if (!this._boundsPositionBuffer) {
            const gl = this.glContext.ctx;
            const buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            const [minX, minY, maxX, maxY] = this.coordBounds;
            // prettier-ignore
            const positions = [
                minX, minY, 0, 
                maxX, minY, 0, 
                maxX, maxY, 0, 
                minX, maxY, 0
            ];

            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
            this._boundsPositionBuffer = buffer!;
        }
        return this._boundsPositionBuffer;
    }

    get indexBuffer() {
        if (!this.glContext) return null;
        if (!this._indexBuffer) {
            const gl = this.glContext.ctx;
            const buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            // prettier-ignore
            const indices = [
                0, 1, 2,
                0, 2, 3
            ];
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
            this._indexBuffer = buffer!;
        }
        return this._indexBuffer;
    }

    get textureBuffer() {
        if (!this.glContext) return null;
        if (!this._textureBuffer) {
            const gl = this.glContext.ctx;
            const buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

            // prettier-ignore
            const uv = [
                0, 0,
                1, 0,
                1, 1,
                0, 0,
                1, 1,
                0, 1
            ]

            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), gl.STATIC_DRAW);

            this._textureBuffer = buffer!;
        }
        return this._textureBuffer;
    }

    get texture() {
        if (!this.glContext) return null;
        const a = this.glContext?.ctx.createTexture();
    }
}

export type InferTileContent<T> = T extends Tile<infer E> ? E : never;
