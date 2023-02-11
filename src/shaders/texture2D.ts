export const vertex = `
attribute vec4 a_pos;
attribute vec2 a_uv;

uniform mat4 u_mvp;

varying highp vec2 vTextureCoord;
varying highp vec4 vPos;
void main(void) {
  gl_Position = u_mvp * a_pos;
  vPos = a_pos;
}
`;
export const fragment = `
varying highp vec2 vTextureCoord;
varying highp vec4 vPos;

uniform sampler2D u_sampler;

void main(void) {
  // gl_FragColor = texture2D(u_sampler, vTextureCoord);
  gl_FragColor = vec4(vPos.x, vPos.y, vPos.z, 1);
}
`;

export const attributes = ["a_pos", "a_uv"];

export const uniforms = ["u_mvp", "u_sampler"];
