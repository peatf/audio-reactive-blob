let theShader;
let audio, fft, amplitude;
let audioLevel = 0;
let captions = [];
let currentCaption = "";
let captionElement;

function preload() {
    // Load shaders using loadStrings (p5.js handles synchronization)
    vertexShaderSource = loadStrings('vertex.vert');
    fragmentShaderSource = loadStrings('fragment.frag');

    // Load audio
    audio = loadSound('https://peatf.github.io/rtkgreenwelcome/rtkgreenwelcome.mp3');

    // Load captions
    loadCaptions('rtkgreenwelcome.vtt');
}

function setup() {
    createCanvas(600, 600, WEBGL);
    noStroke();

    amplitude = new p5.Amplitude();
    fft = new p5.FFT();

    captionElement = document.getElementById("caption");

    // Wait for shaders before creating them
    Promise.all([vertexShaderSource, fragmentShaderSource]).then(([vertData, fragData]) => {
        theShader = createShader(vertData.join('\n'), fragData.join('\n'));
    }).catch(() => {
        console.error("Shaders failed to load. Check 'vertex.vert' and 'fragment.frag'.");
    });
}

function draw() {
    if (!theShader) return;  // Exit if shader isn't ready

    let level = amplitude.getLevel();
    audioLevel = lerp(audioLevel, level, 0.2);

    let spectrum = fft.analyze();
    let bassLevel = lerp(fft.getEnergy("bass") / 255, 0.2);
    let trebleLevel = lerp(fft.getEnergy("treble") / 255, 0.2);

    // Apply shader to the main canvas
    shader(theShader);
    theShader.setUniform("u_time", millis() / 1000.0);
    theShader.setUniform("u_resolution", [width, height]);
    theShader.setUniform("u_audioLevel", audioLevel);
    theShader.setUniform("u_bassLevel", bassLevel);
    theShader.setUniform("u_trebleLevel", trebleLevel);
    
    // Draw the geometry to apply the shader
    rect(0, 0, width, height);

    updateCaptions();
}

function mousePressed() {
    if (!audio) return;  // Ensure audio is loaded
    if (audio.isPlaying()) {
        audio.pause();
    } else {
        audio.play();  // Play instead of loop() if you want it once
    }
}

function loadCaptions(file) {
    fetch(file)
        .then(response => response.text())
        .then(text => parseCaptions(text))
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
            current.text = line;
            captions.push(current);
            current = null;
        }
    }
}

function timeToSeconds(time) {
    let parts = time.split(":");
    let seconds = parseFloat(parts[2]);
    seconds += parseInt(parts[1]) * 60;
    seconds += parseInt(parts[0]) * 3600;
    return seconds;
}

function updateCaptions() {
    if (!audio.isPlaying()) return;

    let currentTime = audio.currentTime();
    for (let i = 0; i < captions.length; i++) {
        if (currentTime >= captions[i].start && currentTime <= captions[i].end) {
            if (currentCaption !== captions[i].text) {
                currentCaption = captions[i].text;
                captionElement.innerHTML = currentCaption;
            }
            return;
        }
    }

    captionElement.innerHTML = "";
}
