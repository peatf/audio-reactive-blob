// background.js
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
camera.position.z = 1;

const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true // Enable transparency
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('background-canvas').appendChild(renderer.domElement);

// Rest of your Three.js code here (mouse tracking, shader, etc.)
const mouse = new THREE.Vector2();
let mouseSpeed = 0;
let lastMouseX = 0;
let lastMouseY = 0;

document.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    const dx = event.clientX - lastMouseX;
    const dy = event.clientY - lastMouseY;
    mouseSpeed = Math.min(Math.sqrt(dx * dx + dy * dy) * 0.01, 1);
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
});

const uniforms = {
    time: { value: 0.0 },
    resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    mouse: { value: mouse },
    mouseSpeed: { value: 0.0 }
};

const fragmentShader = `
    precision highp float;
    uniform vec2 resolution;
    uniform float time;
    uniform vec2 mouse;
    uniform float mouseSpeed;

    // Improved noise function
    float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        
        float a = dot(sin(i + vec2(0.0, 0.0)), vec2(12.9898, 78.233));
        float b = dot(sin(i + vec2(1.0, 0.0)), vec2(12.9898, 78.233));
        float c = dot(sin(i + vec2(0.0, 1.0)), vec2(12.9898, 78.233));
        float d = dot(sin(i + vec2(1.0, 1.0)), vec2(12.9898, 78.233));
        
        float na = fract(sin(a) * 43758.5453);
        float nb = fract(sin(b) * 43758.5453);
        float nc = fract(sin(c) * 43758.5453);
        float nd = fract(sin(d) * 43758.5453);
        
        return mix(mix(na, nb, u.x), mix(nc, nd, u.x), u.y);
    }

    float fbm(vec2 p) {
        float sum = 0.0;
        float amp = 0.5;
        float freq = 1.0;
        
        for(int i = 0; i < 6; i++) {
            sum += amp * noise(p * freq + time * 0.1);
            amp *= 0.5;
            freq *= 2.0;
            p += vec2(sum * 0.1);
        }
        return sum;
    }

    float lightning(vec2 uv, vec2 p1, vec2 p2, float thickness) {
        vec2 dir = p2 - p1;
        float len = length(dir);
        dir = dir / len;
        
        vec2 normal = vec2(-dir.y, dir.x);
        float segment = 10.0;
        float offset = noise(p1 * 5.0 + time) * 0.2;
        
        vec2 pos = p1 + normal * offset;
        float d = length(uv - pos);
        float beam = smoothstep(thickness, 0.0, d);
        
        for(float i = 1.0; i < segment; i++) {
            offset = noise(vec2(i) + time * 2.0) * 0.2;
            pos = p1 + dir * (i * len / segment) + normal * offset;
            d = length(uv - pos);
            beam = max(beam, smoothstep(thickness, 0.0, d));
        }
        
        return beam;
    }

    void main() {
        vec2 uv = (2.0 * gl_FragCoord.xy - resolution.xy) / resolution.y;
        vec2 mouseUV = mouse * 0.1;
        
        // Base ethereal effect
        float flow = fbm(uv + mouseUV);
        vec3 baseColor = mix(
            vec3(0.1, 0.2, 0.4),
            vec3(0.3, 0.6, 1.0),
            flow
        );
        
        // Multiple lightning bolts
        float bolt1 = lightning(uv, vec2(-0.5, -0.5) + mouseUV, vec2(0.5, 0.5) + mouseUV, 0.02);
        float bolt2 = lightning(uv, vec2(0.5, -0.5) + mouseUV, vec2(-0.5, 0.5) + mouseUV, 0.015);
        float bolt3 = lightning(uv, mouseUV, mouseUV + vec2(cos(time), sin(time)) * 0.5, 0.01);
        
        // Combine effects
        vec3 finalColor = baseColor;
        finalColor += vec3(1.0, 1.0, 1.2) * bolt1 * (1.0 + mouseSpeed * 2.0);
        finalColor += vec3(0.8, 0.9, 1.0) * bolt2 * (1.0 + mouseSpeed * 2.0);
        finalColor += vec3(0.9, 1.0, 1.1) * bolt3 * (1.0 + mouseSpeed * 3.0);
        
        // Add glow
        float glow = exp(-length(uv - mouseUV) * 2.0) * (mouseSpeed + 0.2);
        finalColor += vec3(0.3, 0.5, 1.0) * glow;
        
        gl_FragColor = vec4(finalColor, 1.0);
    }
`;

const vertexShader = `
    void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader
});

const geometry = new THREE.PlaneGeometry(2, 2);
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

function animate() {
    requestAnimationFrame(animate);
    uniforms.time.value += 0.016;
    uniforms.mouseSpeed.value = mouseSpeed;
    mouseSpeed *= 0.95;
    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    uniforms.resolution.value.set(width, height);
});
// Add after your existing Three.js setup
const overlayTexture = new THREE.TextureLoader().load('https://raw.githubusercontent.com/peatf/audio-reactive-blob/refs/heads/main/%20A%20seamless%2C%20grainy%20pencil%20texture%201.png');
const overlayMaterial = new THREE.ShaderMaterial({
  uniforms: {
    texture1: { value: overlayTexture },
    opacity: { value: 0.3 } // Adjust texture visibility
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D texture1;
    uniform float opacity;
    varying vec2 vUv;
    void main() {
      vec4 textureColor = texture2D(texture1, vUv * 5.0); // Tile texture 5x
      gl_FragColor = vec4(textureColor.rgb, opacity);
    }
  `,
  transparent: true
});

const overlayPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(2, 2),
  overlayMaterial
);
scene.add(overlayPlane);
