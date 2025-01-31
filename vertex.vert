precision mediump float;
attribute vec3 aPosition;
varying vec2 vTexCoord;

void main() {
    // Standard UV mapping (DO NOT modify)
    vTexCoord = (aPosition.xy + 1.0) * 0.5; // Maps [0,1] for proper coverage
    gl_Position = vec4(aPosition, 1.0);
}
