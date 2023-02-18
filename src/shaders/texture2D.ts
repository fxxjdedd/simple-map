export const vertex = `
attribute vec4 a_pos;
attribute vec2 a_uv;

uniform mat4 u_mvp;

varying highp vec2 vTextureCoord;

void main(void) {
  gl_Position = u_mvp * a_pos;
  vTextureCoord = a_uv;
}
`;
export const fragment = `
varying highp vec2 vTextureCoord;

uniform sampler2D u_sampler;

void main(void) {
  gl_FragColor = texture2D(u_sampler, vTextureCoord);
}
`;

export const attributes = ["a_pos", "a_uv"];

export const uniforms = ["u_mvp", "u_sampler"];
