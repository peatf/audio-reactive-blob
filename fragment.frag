precision mediump float;

varying vec2 vTexCoord;
uniform float u_time;
uniform float u_audioLevel;
uniform float u_bassLevel;
uniform float u_trebleLevel;
uniform vec2 u_resolution;

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

float jellyBlob(vec2 uv, float baseRadius, float wobble) {
    float dist = length(uv);
    float audioWobble = (u_audioLevel * 0.4) + (u_bassLevel * 0.3) + (u_trebleLevel * 0.2);
    float distortion = fbm(uv * 3.0 + u_time * 0.8) * (wobble + audioWobble);
    
    return smoothstep(baseRadius + distortion, baseRadius - 0.02, dist);
}

float softLight(vec2 uv, float spread) {
    return exp(-pow(length(uv) * spread, 2.0));
}

float integratedShine(vec2 uv, float blobMask, float intensity) {
    vec2 shinePos = vec2(
        sin(u_time * 0.5) * 0.2,
        cos(u_time * 0.5) * 0.2
    );
    shinePos *= (1.0 + u_trebleLevel * 0.5);
    float distanceToShine = length(uv - shinePos);
    float shine = smoothstep(0.35, 0.0, distanceToShine);
    shine *= exp(-distanceToShine * 3.5);
    return shine * intensity * blobMask;
}

void main() {
    // PROPER CENTERED UV CALCULATION
    vec2 uv = vTexCoord * 2.0 - 1.0; // Convert to [-1, 1] range
    uv.x *= u_resolution.x / u_resolution.y; // Aspect ratio correction
    
    vec3 jellyColor = vec3(0.1, 0.8, 0.3);
    vec3 bgColor = vec3(0.0);
    
    float blob = jellyBlob(uv, 0.4, 0.1);
    float lightScatter = softLight(uv * 1.5, 2.0) * 0.5;
    float specular = integratedShine(uv, blob, (1.0 + u_trebleLevel * 1.5));
    float grain = smoothstep(0.2, 0.5, blob) * noise(uv * 40.0 + u_time) * 0.2;

    vec3 finalColor = mix(bgColor, jellyColor, blob);
    finalColor += vec3(lightScatter);
    finalColor += vec3(specular);
    finalColor += vec3(grain);

    // TEMPORARY DEBUG (remove when working)
    // finalColor.r += step(0.99, abs(uv.x)) * 0.5; // Red vertical borders
    // finalColor.g += step(0.99, abs(uv.y)) * 0.5; // Green horizontal borders

    gl_FragColor = vec4(finalColor, blob);
}
