#version 300 es

precision highp int;
precision highp float;
precision highp sampler2D;

uniform ivec2 u_Count;
uniform ivec2 u_Start;
uniform vec2 u_Scale;
uniform vec2 u_Offset;
uniform vec2 u_MinMax;
uniform vec2 u_Filter;

uniform sampler2D u_Values;
uniform sampler2D u_Contours;
uniform float u_Mask;

out vec4 fragColor;

void main() {
    ivec2 st = ivec2(gl_FragCoord.xy);
    ivec2 qr = ivec2(st - u_Start);

    float q = float(qr.x);
    float r = float(qr.y);

    float x0 = floor(q * u_Scale.x + u_Offset.x);
    float y0 = floor(r * u_Scale.y + u_Offset.y);
    float x1 = float(u_Count.x - 1);
    float y1 = float(u_Count.y - 1);

    float isInside =
        step(0.0, x0) * step(0.0, y0) *
        step(x0,  x1) * step(y0,  y1);

    ivec2 uv = ivec2(x0, y0);
    float value = texelFetch(u_Values, uv, 0).r;
    float contour = texelFetch(u_Contours, st, 0).r;

    float range = u_MinMax.y - u_MinMax.x;
    float filterMin = u_Filter.x * range + u_MinMax.x;
    float filterMax = u_Filter.y * range + u_MinMax.x;
    value = step(filterMin, value) * step(value, filterMax);

    if (!isnan(u_Mask)) {
        value = mix(0.0, value, value != u_Mask);
    }

    fragColor = vec4(contour + value * isInside);
}
