precision mediump float;
attribute vec3 aPosition;
varying vec2 vTexCoord;

void main() {
    // Map directly to screen coordinates
    vTexCoord = (aPosition.xy + 1.0) * 0.5;
    gl_Position = vec4(aPosition, 1.0);
}
