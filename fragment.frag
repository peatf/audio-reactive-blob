precision mediump float;

varying vec2 vTexCoord;
uniform float u_time;
uniform float u_audioLevel;
uniform vec2 u_resolution;

// Soft circular mask function
float circularMask(vec2 uv, float radius, float blur) {
    float dist = length(uv);
    return smoothstep(radius + blur, radius - blur, dist);
}

// Noise function for organic shape variation
float noise(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// Animate blob deformation based on audio
float blobShape(vec2 uv, float radius) {
    float distort = noise(uv * 5.0 + u_time * 0.5) * 0.1;
    distort += u_audioLevel * 0.3; // Reacts to sound
    return circularMask(uv, radius + distort, 0.05);
}

void main() {
    vec2 uv = vTexCoord * 2.0 - 1.0;
    uv.x *= u_resolution.x / u_resolution.y;

    // Define base color
    vec3 blobColor = vec3(0.1, 0.8, 0.3); // Green

    // Calculate blob shape
    float blob = blobShape(uv, 0.4);

    // Background color
    vec3 bgColor = vec3(0.02, 0.02, 0.03);

    // Final color blending
    vec3 finalColor = mix(bgColor, blobColor, blob);

    gl_FragColor = vec4(finalColor, 1.0);
}
