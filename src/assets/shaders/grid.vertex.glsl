#version 300 es

struct vec3d {
    vec3 high;
    vec3 low;
};

precision highp int;
precision highp float;
precision highp sampler2D;

uniform ivec2 u_Count;
uniform vec2 u_Offset;
uniform vec2 u_Density;

uniform mat4 u_MVP;
uniform float u_Zoom;
uniform vec3 u_Camera;
uniform vec3d u_Center;

in vec3 a_Pos;
in vec2 a_UV;

out vec2 v_UV;
out vec4 v_WorldPos;

void main() {
    // Translates position to be relative to center
    vec4 pos = vec4(a_Pos - u_Center.high - u_Center.low, 1.0);
    vec3 centerToCamera = u_Camera - u_Center.high - u_Center.low;

    pos.x += u_Offset.x / float(u_Count.x) * u_Density.x;
    pos.y += u_Offset.y / float(u_Count.y) * u_Density.y;

    v_UV = a_UV;
    v_WorldPos = vec4(a_Pos, 1.0);

    gl_Position = u_MVP * pos;
}
