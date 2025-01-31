precision mediump float;
attribute vec3 aPosition;
varying vec2 vTexCoord;

void main() {
    // Map directly to screen edges
    vTexCoord = aPosition.xy; // [-1, 1] range by default
    gl_Position = vec4(aPosition, 1.0);
}
