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

float GetCellOpacity(vec2 coords, vec4 constants, float distCamToPixel) {
    float mipmap = GetLODScaleFactor(v_UV * vec2(textureSize(u_Values, 0)));

    float satDist = clamp((distCamToPixel - constants.y) * constants.z, 0.0, 1.0);
    float halfSize = mix(u_CellHalfSize, 1.0, clamp(mipmap, 0.0, 1.0));
    float feather = clamp(constants.w + satDist, 0.02, 1.0);

    float cellX = fract(coords.x * float(u_Count.x)) - 0.5;
    float cellY = fract(coords.y * float(u_Count.y)) - 0.5;

	float cellMin = pow(halfSize + feather, 2.0) + 0.0001;
	float cellMax = halfSize * halfSize;

	return smoothstep(cellMin, cellMax, cellX*cellX + cellY*cellY);
}

void main() {
    int index = int(floor(v_UV.x * float(u_Count.x))) + int(floor(v_UV.y * float(u_Count.y))) * u_Count.x;
    vec4 value = texture(u_Values, v_UV);

    vec4 color = u_Tint;
    color.a = value.r;

    // Get the pixel opacity for the current cell
    float distCamToPixel = distance(v_WorldPos, vec4(u_Camera, 1.0));
    float cellOpacity = GetCellOpacity(v_UV, v_Constants, distCamToPixel);

    color.a *= cellOpacity;
    fragColor = clamp(color, 0.0, 1.0);
}
