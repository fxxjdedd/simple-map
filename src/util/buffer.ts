import { Vector } from "./util-type";

export type TypedArray =
    | Uint8Array
    | Int8Array
    | Uint16Array
    | Int16Array
    | Uint32Array
    | Int32Array
    | Float32Array
    | Float64Array;

export function writeBuffer(dst: TypedArray, src: TypedArray, byteOffset: number = 0) {
    dst.set(getViewOwnBytes(src), byteOffset);
}

export function concatBuffer(dst: TypedArray, src: TypedArray) {
    const tmp = new Uint8Array(dst.byteLength + src.byteLength);

    tmp.set(getViewOwnBytes(dst), 0);
    tmp.set(getViewOwnBytes(src), dst.byteLength);

    return tmp;
}

export function getViewOwnBytes(view: TypedArray) {
    return new Uint8Array(view.buffer).subarray(view.byteOffset, view.byteOffset + view.byteLength);
}

// prettier-ignore
export const TypedArrayCode = {
    uint8:   0b0001_0001, // code 1 byte 1
    int8:    0b0010_0001, // code 2 byte 1
    uint16:  0b0011_0010, // code 3 byte 2
    int16:   0b0100_0010, // code 4 byte 2
    uint32:  0b0101_0100, // code 5 byte 4
    int32:   0b0110_0100, // code 6 byte 4
    float32: 0b0111_0100, // code 7 byte 4
    float64: 0b1000_1000, // code 8 byte 8
}

export function getElementSizeOfCode(code: number) {
    return code & 0x0f;
}

export function getArrayCtorOfCode(code: number) {
    switch (code >> 4) {
        case 0b0001:
            return Uint8Array;
        case 0b0010:
            return Int8Array;
        case 0b0011:
            return Uint16Array;
        case 0b0100:
            return Int16Array;
        case 0b0101:
            return Uint32Array;
        case 0b0110:
            return Int32Array;
        case 0b0111:
            return Float32Array;
        case 0b1000:
            return Float64Array;
        default:
            throw new Error(`Unknown typed array code: ${code.toString(2)}`);
    }
}
export function getCodeFromArrayCtor(ctor: Function) {
    switch (ctor) {
        case Uint8Array:
            return TypedArrayCode.uint8;
        case Int8Array:
            return TypedArrayCode.int8;
        case Uint16Array:
            return TypedArrayCode.uint16;
        case Int16Array:
            return TypedArrayCode.int16;
        case Uint32Array:
            return TypedArrayCode.uint32;
        case Int32Array:
            return TypedArrayCode.int32;
        case Float32Array:
            return TypedArrayCode.float32;
        case Float64Array:
            return TypedArrayCode.float64;
        default:
            throw new Error(`Unknown typed array ctor: ${ctor.name}`);
    }
}

export interface BufferAccessor {
    type: number; // TypedArrayCode
    components: number; // scalar/vec2/vec3/vec4 -> 1/2/3/4
    offset: number;
    stride: number;
    // NOTE: itemSize can retrive from `type` code.
}

export type BufferLayout = {
    [K: string]: {
        type: number;
        components: 1 | 2 | 3 | 4;
    };
};

export type BufferLayoutValue<TLayout extends BufferLayout> = {
    [K in keyof TLayout]: Vector<TLayout[K]["components"]>;
};

export type BufferLayoutMerges<TLayout extends BufferLayout> = {
    [K in keyof TLayout]: number[];
};

export class StructuredData<TLayout extends BufferLayout> {
    buffer = new Uint8Array();
    layout: TLayout;
    accessors = {} as Record<keyof TLayout, BufferAccessor>;

    get layoutSize() {
        let size = 0;
        for (const name in this.layout) {
            const l = this.layout[name];
            size += this._getOneOfLayoutSize(l.type, l.components);
        }
        return size;
    }

    constructor(layout: TLayout) {
        this.layout = layout;
        let offset = 0;
        for (const name in this.layout) {
            const l = this.layout[name];
            this.accessors[name] = {
                type: l.type,
                components: l.components,
                offset,
                stride: this.layoutSize, // might not need here
            };
            offset += this._getOneOfLayoutSize(l.type, l.components);
        }
    }

    append(layoutValue: BufferLayoutValue<TLayout>) {
        let len = this.buffer.length;
        this.autoResize(len + this.layoutSize);

        // name sorting is unnessary
        for (const name in this.layout) {
            const l = this.layout[name];
            const lv = layoutValue[name];
            this._appendTypedValue(l.type, lv, len);
            len += this._getOneOfLayoutSize(l.type, l.components);
        }
    }

    merge(merges: BufferLayoutMerges<TLayout>) {
        let len = this.buffer.length;
        let layoutCount = 0;
        for (const name in this.layout) {
            const l = this.layout[name];
            const m = merges[name];
            // check merges is valid
            if (m.length % l.components != 0) {
                throw new Error(`Invalid merges length: ${m.length}.`);
            }
            const count = m.length / l.components;
            if (layoutCount > 0 && count !== layoutCount) {
                throw new Error(
                    `Inconsistent number of vertex attributes: ${count}, previous one: ${layoutCount}`
                );
            }

            layoutCount = count;
        }

        this.autoResize(len + layoutCount * this.layoutSize);

        for (const name in this.layout) {
            const l = this.layout[name];
            const m = merges[name];
            this._mergeTypedValue(l.type, m, len, l.components, this.layoutSize);
            len += this._getOneOfLayoutSize(l.type, l.components);
        }
    }

    autoResize(nextLength: number) {
        if (nextLength > this.buffer.byteLength) {
            const tmp = new Uint8Array(nextLength);
            tmp.set(this.buffer);
            this.buffer = tmp;
        }
    }

    pickData(accessor: BufferAccessor) {
        const { type, components, offset, stride } = accessor;
        const oneLayoutSize = this._getOneOfLayoutSize(type, components);
        const byteLength = (this.buffer.byteLength / stride) * oneLayoutSize;

        if (!Number.isInteger(byteLength)) {
            throw new Error(`Wrong accessor picking byte length: ${byteLength}.`);
        }

        const pickingResult = new Uint8Array(byteLength);

        for (let i = offset, j = 0; i < this.buffer.length; i += stride, j += oneLayoutSize) {
            const sub = this.buffer.subarray(i, i + oneLayoutSize);
            pickingResult.set(sub, j);
        }
        return pickingResult;
    }

    protected _appendTypedValue(type: number, value: number[], offset: number) {
        const ctor = getArrayCtorOfCode(type);
        const typedArray = new ctor(value);
        writeBuffer(this.buffer, typedArray, offset);
    }

    protected _mergeTypedValue(
        type: number,
        value: number[],
        offset: number,
        components: number,
        stride: number
    ) {
        const ctor = getArrayCtorOfCode(type);
        const typedArray = new ctor(value);

        let at = offset;
        for (let i = 0; i < value.length; i += components) {
            const sub = typedArray.subarray(i, i + components);
            writeBuffer(this.buffer, sub, at);
            at += stride;
        }
    }

    protected _getOneOfLayoutSize(type: number, components: number) {
        const elemSize = getElementSizeOfCode(type);
        return elemSize * components;
    }

    static mergeFrom(datas: StructuredData<any>[]) {

    }

    static createLayout<TLayout extends BufferLayout>(layout: TLayout) {
        return layout;
    }

    // StructuredData -> buffer
    static serialize<T extends BufferLayout>(data: StructuredData<T>): Uint8Array {
        throw new Error("");
    }

    // buffer -> StructuredData
    static deserialize<T extends BufferLayout>(buffer: Uint8Array): StructuredData<T> {
        throw new Error("");
    }
}

// export class GeometryData extends StructuredData {
//     _index?: BufferAccessDef;
//     attributes: Record<string, BufferAccessDef> = {};

//     get index() {
//         if (!this._index) {
//             throw new Error("Please setIndex first.");
//         }
//         return this._index;
//     }

//     setAttribute(name: string, buffer: TypedArray, size: number) {
//         this.attributes[name] = this.append(buffer, size);
//     }

//     setIndex(buffer: TypedArray) {
//         // TODO: check to use uint16 or uint32
//         this._index = this.append(buffer, 1);
//     }

//     getAttributsData() {}

//     getIndexData() {}
// }
