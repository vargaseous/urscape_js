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

uniform mat4 u_MVP;
uniform float u_Zoom;
uniform vec3 u_Camera;
uniform vec3d u_Center;

in vec3 a_Pos;
in vec2 a_UV;

out vec2 v_UV;
out vec4 v_WorldPos;
out vec4 v_Constants;

void main() {
    // Translates position to be relative to center
    vec4 pos = vec4(a_Pos - u_Center.high - u_Center.low, 1.0);
    pos.x += u_Offset.x / float(u_Count.x);
    pos.y += u_Offset.y / float(u_Count.y);

    vec3 centerToCamera = u_Camera - u_Center.high - u_Center.low;

    float cellHalfSize = u_MVP[0][0] / float(u_Count.x + 1);
    float fresnel = clamp(1.9 * (0.97 - normalize(centerToCamera).y), 0.0, 1.0) / cellHalfSize * 0.003;
    float feather = clamp(pow(0.004 / cellHalfSize, 2.0), 0.0, 1.0);

    v_UV = a_UV;
    v_WorldPos = vec4(a_Pos, 1.0);
    v_Constants = vec4(clamp(1.0 - cellHalfSize * 50.0, 0.0, 1.0), length(centerToCamera), fresnel, feather);

    gl_Position = u_MVP * pos;
}
