#version 300 es

precision highp int;
precision highp float;
precision highp sampler2D;

uniform ivec2 u_Count;

uniform sampler2D u_Contours;
uniform sampler2D u_Projection;

in vec2 v_UV;
in vec4 v_WorldPos;

out vec4 fragColor;

vec4 LINES[16] = vec4[16](
    vec4(0.0, 0.0, 0.0, 0.0),
    vec4(0.0, 0.5, 0.5, 0.0),
    vec4(0.5, 0.0, 1.0, 0.5),
    vec4(0.0, 0.5, 1.0, 0.5),
    vec4(1.0, 0.5, 0.5, 1.0),
    vec4(0.0, 0.5, 0.5, 1.0),
    vec4(0.5, 0.0, 0.5, 1.0),
    vec4(0.0, 0.5, 0.5, 1.0),
    vec4(0.5, 1.0, 0.0, 0.5),
    vec4(0.5, 1.0, 0.5, 0.0),
    vec4(0.0, 0.5, 0.5, 0.0),
    vec4(0.5, 1.0, 1.0, 0.5),
    vec4(1.0, 0.5, 0.0, 0.5),
    vec4(1.0, 0.5, 0.5, 0.0),
    vec4(0.5, 0.0, 0.0, 0.5),
    vec4(1.0, 1.0, 1.0, 1.0)
);

vec2 TABLE[16] = vec2[](
    vec2(0, 0),
    vec2(1, 0),
    vec2(2, 0),
    vec2(3, 0),
    vec2(4, 0),
    vec2(5, 13),
    vec2(6, 0),
    vec2(7, 0),
    vec2(8, 0),
    vec2(9, 0),
    vec2(14, 11),
    vec2(11, 0),
    vec2(12, 0),
    vec2(13, 0),
    vec2(14, 0),
    vec2(15, 0)
);

const float Fill = 0.3;
const float Thickness = 0.1;
const float LineFeather = 0.1;

int getLineIndex(int a, int b, int c, int d) {
    return a + b * 2 + c * 4 + d * 8;
}

float alphaByMSquare(vec2 uv, vec4 row) {
    float side = (row.z - row.x)*(row.y - uv.y) - (row.x - uv.x)*(row.w - row.y);
    float distSq = pow(row.z - row.x, 2.0) + pow(row.w - row.y, 2.0);
    float dist = abs(side) / distSq;

    // Fill on the right side
    float alpha = step(0.0, side) * Fill;

    // Add line
    alpha += smoothstep(Thickness + LineFeather + 0.01, Thickness, dist);

    return clamp(alpha, 0.0, 1.0);
}

float alphaByMSquare2(vec2 uv, vec4 row1, vec4 row2) {
    float side1 = (row1.z - row1.x)*(row1.y - uv.y) - (row1.x - uv.x)*(row1.w - row1.y);
    float distSq1 = pow(row1.z - row1.x, 2.0) + pow(row1.w - row1.y, 2.0);
    float dist1 = abs(side1) / distSq1;

    float side2 = (row2.z - row2.x)*(row2.y - uv.y) - (row2.x - uv.x)*(row2.w - row2.y);
    float distSq2 = pow(row2.z - row2.x, 2.0) + pow(row2.w - row2.y, 2.0);
    float dist2 = abs(side2) / distSq2;

    // Fill on the right side
    float alpha = step(0.0, side1) * step(0.0, side2) * Fill;

    // Add line
    alpha += smoothstep(Thickness + LineFeather + 0.01, Thickness, dist1) +
             smoothstep(Thickness + LineFeather + 0.01, Thickness, dist2);

    return clamp(alpha, 0.0, 1.0);
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

    float countX = float(u_Count.x);
    float countY = float(u_Count.y);

    float x = floor(uv.x * countX - 0.5);
    float y = floor(uv.y * countY - 0.5);

    vec4 value = vec4(
        texelFetch(u_Contours, ivec2(x,       y      ), 0).r,
        texelFetch(u_Contours, ivec2(x + 1.0, y      ), 0).r,
        texelFetch(u_Contours, ivec2(x,       y + 1.0), 0).r,
        texelFetch(u_Contours, ivec2(x + 1.0, y + 1.0), 0).r
    );

    int index = getLineIndex(
        int((1.0 - step(value.x, 0.0)) * step(0.0, x)    * step(0.0, y)   ),
        int((1.0 - step(value.y, 0.0)) * step(x, countX) * step(0.0, y)   ),
        int((1.0 - step(value.w, 0.0)) * step(x, countX) * step(y, countY)),
        int((1.0 - step(value.z, 0.0)) * step(0.0, x)    * step(y, countY))
    );

    vec2 cellUV = vec2(
        fract(uv.x * countX + 0.5),
        fract(uv.y * countY + 0.5)
    );

    float i = TABLE[index].x;
    float j = TABLE[index].y;

    vec4 a = LINES[int(i)];
    vec4 b = LINES[int(j)];

    float w0 = step(0.5, i) - step(0.5, j);
    float w1 = step(0.5, j);

    float alpha = clamp(
        w0 * alphaByMSquare(cellUV, a) +
        w1 * alphaByMSquare2(cellUV, a, b),
        0.0, 1.0
    );

    fragColor = vec4(1.0, 1.0, 1.0, alpha);
}
