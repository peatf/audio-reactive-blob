let theShader;
let audio, fft, amplitude;
let audioLevel = 0;
let bassLevel = 0;
let trebleLevel = 0;
let captions = [];
let currentCaption = "";
let captionElement;

function preload() {
    vertexShaderSource = loadStrings('vertex.vert');
    fragmentShaderSource = loadStrings('fragment.frag');

    audio = loadSound('https://peatf.github.io/rtkgreenwelcome/rtkgreenwelcome.mp3');

    loadCaptions('rtkgreenwelcome.vtt');
}

function setup() {
    createCanvas(600, 600, WEBGL);
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

    rect(-width / 2, -height / 2, width, height);

    updateCaptions();
}

function mousePressed() {
    if (!audio) return;
    if (audio.isPlaying()) {
        audio.pause();
    } else {
        audio.play();
    }
}

function updateCaptions() {
    if (!audio.isPlaying()) {
        captionElement.innerHTML = "Click to play.";
        return;
    }

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
