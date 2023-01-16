import * as texture2DShader from "./texture2D";

export const shaders: Record<
    string,
    { vertex: string; fragment: string; attributes: string[]; uniforms: string[] }
> = {
    texture2D: texture2DShader,
};
