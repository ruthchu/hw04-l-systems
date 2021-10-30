#version 300 es
precision highp float;

uniform vec3 u_Eye, u_Ref, u_Up;
uniform vec2 u_Dimensions;
uniform float u_Time;

in vec2 fs_Pos;
out vec4 out_Col;

void main() {
  vec4 blue = vec4(24.0, 34.0, 82.0, 255.0) / 255.0;
  vec4 gray = vec4(125.0, 125.0, 125.0, 255.0) / 255.0;
  vec4 black = vec4(9.0, 14.0, 41.0, 255.0) / 255.0;
  vec4 blueGrey = mix(blue, gray, smoothstep(0.0, 1.0, fs_Pos.y));
  out_Col = mix(black, blueGrey, smoothstep(-1.0, 0.5, fs_Pos.y));
}
