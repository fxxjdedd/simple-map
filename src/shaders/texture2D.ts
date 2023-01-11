export const vertex = `
attribute vec4 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat4 uMVP;

varying highp vec2 vTextureCoord;

void main(void) {
  gl_Position = uMVP * aVertexPosition;
  vTextureCoord = aTextureCoord;
}
`;
export const fragment = `
varying highp vec2 vTextureCoord;

uniform sampler2D uSampler;

void main(void) {
  gl_FragColor = texture2D(uSampler, vTextureCoord);
}
`;
