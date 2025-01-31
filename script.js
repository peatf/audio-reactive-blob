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
    // Create canvas inside p5-container
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
// ✅ Move the orb down slightly to center under text
    translate(0, 50); // Move down (increase or decrease 50px as needed)

    rect(-width / 2, -height / 2, width, height);

    updateCaptions();
}

function mousePressed() {
    if (!audio) return;

    if (audio.isPlaying()) {
        audio.pause();
    } else {
        audio.play();
        updateCaptions(); // ✅ Ensures captions resume immediately
    }
}


function loadCaptions(file) {
    fetch(file)
        .then(response => response.text())
        .then(text => {
            parseCaptions(text);
            console.log("Loaded captions:", captions); // ✅ Debugging check
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
            current.text += (current.text ? "\n" : "") + line; // ✅ Allow multi-line captions
        } else if (line === "" && current) {
            captions.push(current);
            current = null;
        }
    }

    console.log("Final Captions:", captions); // ✅ Debugging check
}

function timeToSeconds(timeStr) {
    let parts = timeStr.split(":");
    if (parts.length === 3) {
        return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
    } else if (parts.length === 2) {
        return parseInt(parts[0]) * 60 + parseFloat(parts[1]);
    } else {
        console.error("Invalid time format:", timeStr);
        return 0;
    }
}

function updateCaptions() {
    if (!audio) return;

    let currentTime = audio.currentTime();
    console.log("Audio Time:", currentTime); // ✅ Debugging log

    let foundCaption = false; // ✅ Track if a caption was found

    for (let i = 0; i < captions.length; i++) {
        console.log("Checking Caption:", captions[i]); // ✅ Debugging log

        if (currentTime >= captions[i].start && currentTime <= captions[i].end) {
            if (currentCaption !== captions[i].text) {
                console.log("Showing Caption:", captions[i].text); // ✅ Debugging log
                currentCaption = captions[i].text;
                captionElement.innerHTML = currentCaption;
            }
            foundCaption = true;
            break;
        }
    }

    // ✅ If no caption is found, don't overwrite previous text
    if (!foundCaption) {
        captionElement.innerHTML = "";
    }

    // ✅ Ensure updateCaptions() keeps running even when paused
    requestAnimationFrame(updateCaptions);
}
