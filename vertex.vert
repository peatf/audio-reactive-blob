precision mediump float;

attribute vec3 aPosition;
attribute vec2 aTexCoord;
varying vec2 vTexCoord;

void main() {
    // Change UV mapping to be centered
    vTexCoord = aPosition.xy * 0.5 + 0.5;  // Center UV coordinates
    gl_Position = vec4(aPosition, 1.0);
}
