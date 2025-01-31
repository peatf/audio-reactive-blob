precision mediump float;

varying vec2 vTexCoord;
uniform float u_time;
uniform float u_audioLevel;
uniform float u_bassLevel;
uniform float u_trebleLevel;
uniform vec2 u_resolution;

// Noise function for organic shape distortion
float noise(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// Fractal Brownian Motion (fbm) for deeper organic texture
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

// Organic blob with smooth, dynamic motion
float jellyBlob(vec2 uv, float baseRadius, float wobble) {
    float dist = length(uv);

    // Dynamic motion using both **audio level & frequencies**
    float audioWobble = (u_audioLevel * 0.4) + (u_bassLevel * 0.3) + (u_trebleLevel * 0.2);

    float distortion = fbm(uv * 3.0 + u_time * 0.8) * (wobble + audioWobble);
    
    return smoothstep(baseRadius + distortion, baseRadius - 0.02, dist);
}

// Soft glow effect
float softLight(vec2 uv, float spread) {
    return exp(-pow(length(uv) * spread, 2.0));
}

// Dynamic shine based on high frequencies
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
    vec2 uv = vTexCoord * 2.0 - 1.0;
    uv.x *= u_resolution.x / u_resolution.y;

    vec3 jellyColor = vec3(0.1, 0.8, 0.3); // Vibrant green
    vec3 bgColor = vec3(0.02, 0.02, 0.03); // Dark background

    float blob = jellyBlob(uv, 0.4, 0.1);

    float lightScatter = softLight(uv * 1.5, 2.0) * 0.5;

    float specular = integratedShine(uv, blob, (1.0 + u_trebleLevel * 1.5));

    float grain = smoothstep(0.2, 0.5, blob) * noise(uv * 40.0 + u_time) * 0.2;

    vec3 finalColor = mix(bgColor, jellyColor + lightScatter, blob);
    finalColor += specular;
    finalColor += grain;

    gl_FragColor = vec4(finalColor, 1.0);
}
