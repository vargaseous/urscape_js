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
uniform sampler2D u_Projection;
uniform float u_Mask;

uniform vec4 u_Tint;
uniform vec2 u_MinMax;
uniform vec2 u_Filter;

in vec2 v_UV;
in vec4 v_WorldPos;

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

float GetCellOpacityNoData(vec2 uv) {
    float mipmap = GetLODScaleFactor(uv * vec2(textureSize(u_Values, 0)));
    mipmap = clamp(8.0 * mipmap, 0.0, 1.0);

    float extraThickness = u_Thickness + u_CellHalfSize * mipmap * 0.2;

    float cellX = fract(uv.x * float(u_Count.x) + 0.5);
    float cellY = fract((1.0 - uv.y) * float(u_Count.y) + 0.5);

    // First line
    float side = cellX - cellY;
    float dist = abs(side) * 0.5;
    float alpha = smoothstep(extraThickness, u_Thickness, dist);

    // Second line
    side = 1.0 - cellX - cellY;
    dist = abs(side) * 0.5;
    alpha += smoothstep(extraThickness, u_Thickness, dist);

    alpha = clamp(alpha, 0.0, 1.0);

    return mix(alpha, 0.0, mipmap);
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
    float value = texture(u_Values, uv).r;

    // Apply gamma correction
    // TODO: Calculate correct gamma constant
    float range = u_MinMax.y - u_MinMax.x;
    float normalized = (value - u_MinMax.x) / range;
    float gammaCorrected = pow(normalized, 0.25);

    vec4 color = u_Tint;
    color.a = gammaCorrected;

    float cellOpacity = GetCellOpacity(uv);
    float noDataOpacity = GetCellOpacityNoData(uv);

    if (!isnan(u_Mask)) {
        color.a = mix(noDataOpacity, color.a, value != u_Mask);
    } else {
        color.a *= step(0.0, normalized);
    }

    float filterMin = u_Filter.x * range + u_MinMax.x;
    float filterMax = u_Filter.y * range + u_MinMax.x;
    float filterOpacity = step(filterMin, value) * step(value, filterMax);

    color.a *= cellOpacity * filterOpacity;
    fragColor = clamp(color, 0.0, 1.0);
}
