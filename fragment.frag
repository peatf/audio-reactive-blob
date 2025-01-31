=precision mediump float;

// --- Declare uniforms first ---
varying vec2 vTexCoord;
uniform float u_time;
uniform float u_audioLevel;
uniform float u_bassLevel;
uniform float u_trebleLevel;
uniform vec2 u_resolution;

// --- Noise functions ---
float noise(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float fbm(vec2 p) {
    float total = 0.0;
    float amplitude = 0.5;
    for(int i = 0; i < 5; i++) {
        total += amplitude * noise(p);
        p *= 2.0;
        amplitude *= 0.5;
    }
    return total;
}

// --- Orb function ---
float jellyBlob(vec2 uv, float baseRadius, float wobble) {
    float dist = length(uv);
    float audioWobble = (u_audioLevel * 0.4) + (u_bassLevel * 0.3) + (u_trebleLevel * 0.2);
    float distortion = fbm(uv * 3.0 + u_time * 0.8) * (wobble + audioWobble);
    return smoothstep(baseRadius + distortion, baseRadius - 0.02, dist);
}

// --- Main ---
void main() {
    // Declare 'uv' FIRST
    vec2 uv = (vTexCoord * 2.0 - 1.0) * vec2(u_resolution.x / u_resolution.y, 1.0);
    
    // Use 'jellyBlob' AFTER its declaration
    float blob = jellyBlob(uv, 0.4, 0.1);
    vec3 finalColor = mix(vec3(0.0), vec3(0.1, 0.8, 0.3), blob);
    
    gl_FragColor = vec4(finalColor, blob);
}
