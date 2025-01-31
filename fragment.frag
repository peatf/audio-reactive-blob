precision mediump float;

varying vec2 vTexCoord;
uniform float u_time;
uniform float u_audioLevel;
uniform float u_bassLevel;
uniform float u_trebleLevel;
uniform vec2 u_resolution;

// Noise function for smooth shape distortion
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

// Organic blob with smooth, dramatic motion
float jellyBlob(vec2 uv, float baseRadius, float wobble) {
    float dist = length(uv);

    // Dynamic motion using bass & treble frequencies
    float audioWobble = (u_bassLevel * 0.5) + (u_trebleLevel * 0.3);

    float distortion = fbm(uv * 3.0 + u_time * 0.8) * (wobble + audioWobble);
    
    return smoothstep(baseRadius + distortion, baseRadius - 0.02, dist);
}

// Light scattering function for soft glow
float softLight(vec2 uv, float spread) {
    return exp(-pow(length(uv) * spread, 2.0));
}

// Integrated specular shine following blob motion
float integratedShine(vec2 uv, float blobMask, float intensity) {
    vec2 shinePos = vec2(
      sin(u_time * 0.5) * 0.2,  
      cos(u_time * 0.5) * 0.2
    ); 

    // Align shine movement with the blob's deformation
    shinePos *= (1.0 + u_trebleLevel * 0.5);

    // Smooth, diffused highlight
    float distanceToShine = length(uv - shinePos);
    float shine = smoothstep(0.35, 0.0, distanceToShine); // More diffused
    shine *= exp(-distanceToShine * 3.5);  // More prominent glow effect
    return shine * intensity * blobMask;
}

void main() {
    vec2 uv = vTexCoord * 2.0 - 1.0;
    uv.x *= u_resolution.x / u_resolution.y;

    vec3 jellyColor = vec3(0.1, 0.8, 0.3); // Vibrant green
    vec3 bgColor = vec3(0.02, 0.02, 0.03); // Dark background

    float blob = jellyBlob(uv, 0.4, 0.1);

    // Subsurface glow effect
    float lightScatter = softLight(uv * 1.5, 2.0) * 0.5;

    // Integrated soft shine
    float specular = integratedShine(uv, blob, (1.0 + u_trebleLevel * 1.5));

    // Textured grain effect for realism
    float grain = smoothstep(0.2, 0.5, blob) * noise(uv * 40.0 + u_time) * 0.2;

    vec3 finalColor = mix(bgColor, jellyColor + lightScatter, blob);
    finalColor += specular;  // Ensure shine is visible
    finalColor += grain;

    gl_FragColor = vec4(finalColor, 1.0);
}
