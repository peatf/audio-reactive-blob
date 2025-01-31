precision mediump float;

attribute vec4 aPosition;  // Changed from vec3 to vec4
attribute vec2 aTexCoord;
varying vec2 vTexCoord;

void main() {
    vTexCoord = aTexCoord;
    gl_Position = aPosition;  // Use the vec4 directly as provided by p5.js
}
