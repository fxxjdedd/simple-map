import * as texture2DShader from "./texture2D";

export const shaders: Record<string, { vertex: string; fragment: string }> = {
    texture2D: texture2DShader,
};
