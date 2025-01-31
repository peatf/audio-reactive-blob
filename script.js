let theShader;
let audio, fft, amplitude;
let audioLevel = 0;
let bassLevel = 0;
let trebleLevel = 0;
let captions = [];
let currentCaption = "";
let captionElement;
let textureImg;

function preload() {
    vertexShaderSource = loadStrings('vertex.vert');
    fragmentShaderSource = loadStrings('fragment.frag');
    audio = loadSound('https://peatf.github.io/rtkgreenwelcome/rtkgreenwelcome.mp3');
    loadCaptions('rtkgreenwelcome.vtt');
    textureImg = loadImage('A seamless, grainy pencil texture 1.png');
}

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight, WEBGL);
    canvas.parent('p5-container');
    noStroke();
    
    amplitude = new p5.Amplitude();
    fft = new p5.FFT();

    captionElement = document.getElementById("caption");

    Promise.all([vertexShaderSource, fragmentShaderSource]).then(([vertData, fragData]) => {
        theShader = createShader(vertData.join('\n'), fragData.join('\n'));
    }).catch(() => {
        console.error("Shaders failed to load. Check 'vertex.vert' and 'fragment.frag'.");
    });
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
    theShader.setUniform("u_time", millis() / 1000.0);
    theShader.setUniform("u_resolution", [width, height]);
    theShader.setUniform("u_audioLevel", audioLevel);
    theShader.setUniform("u_bassLevel", bassLevel);
    theShader.setUniform("u_trebleLevel", trebleLevel);

    // Draw centered orb
    push();
    let size = min(width, height) * 0.35; // Slightly smaller size
    rect(-size/2, -size/2, size, size);
    pop();

    // Draw texture overlay
    push();
    resetShader();
    imageMode(CENTER);
    blendMode(HARD_LIGHT);
    if (textureImg) {
        image(textureImg, 0, 0, width, height);
    }
    blendMode(BLEND);
    pop();

    updateCaptions();
}

function mousePressed() {
    if (!audio) return;

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
