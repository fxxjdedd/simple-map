import { IndexStructuredData } from "../data/allStructuredData";
import { StructuredData } from "../util/buffer";
import { GLContext } from "./GLContext";

export class GLVertexBufferObject {
    constructor(public glContext: GLContext, public geometry: StructuredData<any>) {}
    bind() {}
}

export class GLIndexBufferObject {
    constructor(public glContext: GLContext, public geometry: IndexStructuredData) {}
    bind() {}
}
