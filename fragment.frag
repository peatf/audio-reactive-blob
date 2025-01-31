precision mediump float;

varying vec2 vTexCoord;
uniform float u_time;
uniform float u_audioLevel;
uniform vec2 u_resolution;

void main() {
    vec2 uv = vTexCoord * 2.0 - 1.0;
    uv.x *= u_resolution.x / u_resolution.y;

    vec3 blobColor = vec3(0.1, 0.8, 0.3);
    float brightness = 0.5 + sin(u_time + uv.x * uv.y) * 0.2 + u_audioLevel;
    
    gl_FragColor = vec4(blobColor * brightness, 1.0);
}
