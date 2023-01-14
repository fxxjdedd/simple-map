import { StructuredData, TypedArrayCode } from "../util/buffer";

const indexStructuredDataLayout = StructuredData.createLayout({
    a_index: {
        type: TypedArrayCode.uint16,
        components: 1,
    },
});

export class IndexStructuredData extends StructuredData<typeof indexStructuredDataLayout> {
    constructor() {
        super(indexStructuredDataLayout);
    }
}

const rasterStructuredDataLayout = StructuredData.createLayout({
    a_pos: {
        type: TypedArrayCode.float32,
        components: 2,
    },

    a_uv: {
        type: TypedArrayCode.float32,
        components: 2,
    },
});

export class RasterStructuredData extends StructuredData<typeof rasterStructuredDataLayout> {
    constructor() {
        super(rasterStructuredDataLayout);
    }
}
