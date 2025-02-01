let theShader;
let audio, fft, amplitude;
let audioLevel = 0;
let bassLevel = 0;
let trebleLevel = 0;
let captions = [];
let currentCaption = "";
let captionElement;
let vertexShaderSource;
let fragmentShaderSource;
let pencilTexture;

function preload() {
     vertexShaderSource = loadStrings('vertex.vert');
    fragmentShaderSource = loadStrings('fragment.frag');
    pencilTexture = loadImage('seamless-grainy-pencil-texture-1.png');
    loadCaptions('rtkgreenwelcome.vtt');
}

function startAudio() {
    if (!audio) {
        audio = loadSound('https://peatf.github.io/rtkgreenwelcome/rtkgreenwelcome.mp3', () => {
            audio.play();
        });
    } else {
        audio.play();
    }
}

function setup() {
    // Get the container element
    let container = document.getElementById('p5-container');
    // Create the canvas using the container's dimensions
    let canvas = createCanvas(container.clientWidth, container.clientHeight, WEBGL);
    canvas.parent('p5-container');
    noStroke();
    rectMode(CENTER);
    
    // Set pixel density to 1 for consistent scaling
   pixelDensity(window.devicePixelRatio);

    console.log('vertexShaderSource:', vertexShaderSource);
    console.log('fragmentShaderSource:', fragmentShaderSource);
    amplitude = new p5.Amplitude();
    fft = new p5.FFT();
    
    captionElement = document.getElementById("caption");

    // Create shader once sources are loaded
    Promise.all([vertexShaderSource, fragmentShaderSource]).then(([vertData, fragData]) => {
        try {
            theShader = createShader(vertData.join('\n'), fragData.join('\n'));
            console.log('Shader created successfully');
        } catch(err) {
            console.error("Shader creation error:", err);
        }
    }).catch((err) => {
        console.error("Shader loading error:", err);
    });
}

function windowResized() {
    let container = document.getElementById('p5-container');
    resizeCanvas(container.clientWidth, container.clientHeight);
    if (theShader) {
        theShader.setUniform("u_resolution", [width, height]);
    }
}


function draw() {
    if (!theShader) return;

 clear(0, 0, 0, 0);
    let level = amplitude.getLevel();
    audioLevel = lerp(audioLevel, level, 0.2);

    let spectrum = fft.analyze();
    bassLevel = lerp(bassLevel, fft.getEnergy("bass") / 255, 0.2);
    trebleLevel = lerp(trebleLevel, fft.getEnergy("treble") / 255, 0.2);

    shader(theShader);
theShader.setUniform("u_resolution", [width * pixelDensity(), height * pixelDensity()]);
    theShader.setUniform("u_time", millis() / 1000.0);
    theShader.setUniform("u_audioLevel", audioLevel);
    theShader.setUniform("u_bassLevel", bassLevel);
    theShader.setUniform("u_trebleLevel", trebleLevel);
    theShader.setUniform('u_texture', pencilTexture);
     theShader.setUniform('u_textureStrength', 0.45); // 0-1 (texture visibility)


      // FIXED: Simplified drawing logic
rect(0, 0, width, height);
    updateCaptions();
}

function mousePressed() {
    if (!audio) return;
function touchStarted() {
    startAudio();
}
    if (audio.isPlaying()) {
        audio.pause();
    } else {
        audio.play();
        updateCaptions();
    }
}

function loadCaptions(file) {
    fetch(file)
        .then(response => response.text())
        .then(text => {
            parseCaptions(text);
        })
        .catch(() => console.error("Captions file not found: " + file));
}

function parseCaptions(data) {
    let lines = data.split("\n");
    let current = null;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        if (line.includes("-->")) {
            let times = line.split(" --> ");
            let start = timeToSeconds(times[0]);
            let end = timeToSeconds(times[1]);
            current = { start, end, text: "" };
        } else if (line.length > 0 && current) {
            current.text += (current.text ? "\n" : "") + line;
        } else if (line === "" && current) {
            captions.push(current);
            current = null;
        }
    }
}

function timeToSeconds(timeStr) {
    let parts = timeStr.split(":");
    if (parts.length === 3) {
        return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
    } else if (parts.length === 2) {
        return parseInt(parts[0]) * 60 + parseFloat(parts[1]);
    }
    return 0;
}

function updateCaptions() {
    if (!audio) return;

    let currentTime = audio.currentTime();
    let foundCaption = false;

    for (let i = 0; i < captions.length; i++) {
        if (currentTime >= captions[i].start && currentTime <= captions[i].end) {
            if (currentCaption !== captions[i].text) {
                currentCaption = captions[i].text;
                captionElement.innerHTML = currentCaption;
            }
            foundCaption = true;
            break;
        }
    }

    if (!foundCaption) {
        captionElement.innerHTML = "";
    }

    requestAnimationFrame(updateCaptions);
}
