#version 300 es

precision highp int;
precision highp float;
precision highp sampler2D;

uniform ivec2 u_Count;
uniform float u_Thickness;
uniform float u_CellHalfSize;

uniform float u_Zoom;
uniform vec3 u_Camera;

uniform sampler2D u_Values;
uniform sampler2D u_Mask;
uniform sampler2D u_Projection;

uniform vec4 u_Tint;

in vec2 v_UV;
in vec4 v_WorldPos;
in vec4 v_Constants;

out vec4 fragColor;

//
// Source: OpenGL 4.2 spec chapter 3.9.11 equation 3.21
// http://www.opengl.org/registry/doc/glspec42.core.20120427.pdf
//
// The factor states the rate of change of a texel coordinate between individual pixels
// When the factor is >1.0, pixels start skipping over some texels, causing aliasing and artifacts.
//
float GetLODScaleFactor(vec2 texel_coords) {
    vec2 dx = dFdx(texel_coords);
    vec2 dy = dFdy(texel_coords);
    float dist_sqr = max(dot(dx, dx), dot(dy, dy));
    return sqrt(dist_sqr);
}

float GetCellOpacity(vec2 uv) {
    float mipmap = GetLODScaleFactor(uv * vec2(textureSize(u_Values, 0)));
    float halfSize = mix(u_CellHalfSize, 1.0, clamp(mipmap, 0.0, 1.0));

    float cellX = fract(uv.x * float(u_Count.x)) - 0.5;
    float cellY = fract(uv.y * float(u_Count.y)) - 0.5;

	float cellMin = pow(halfSize + 0.02, 2.0) + 0.0001;
	float cellMax = halfSize * halfSize;

	return smoothstep(cellMin, cellMax, cellX*cellX + cellY*cellY);
}

float ProjectUV(float v) {
    float countY = float(u_Count.y);
	float value = v * countY;
	float index = floor(value);

	float invProjCount = 1.0 / (countY + 1.0);

    float a = texture(u_Projection, vec2((index + 0.5) * invProjCount, 0.5)).x;
    float b = texture(u_Projection, vec2((index + 1.5) * invProjCount, 0.5)).x;

    return mix(a, b, value - index);
}

void main() {
    vec2 uv = vec2(v_UV.x, ProjectUV(v_UV.y));
    vec4 value = texture(u_Values, uv);

    vec4 color = u_Tint;
    color.a = value.r;

    float cellOpacity = GetCellOpacity(uv);

    color.a *= cellOpacity;
    fragColor = clamp(color, 0.0, 1.0);
}
