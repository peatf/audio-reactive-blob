let theShader;
let shaderCanvas;
let audio, fft, amplitude;
let audioLevel = 0;
let bassLevel = 0;
let trebleLevel = 0;

function preload() {
  theShader = new p5.Shader(this.renderer, vertShader, fragShader);
  audio = loadSound('rtkgreenwelcome.mp3'); // Load your audio file
}

function setup() {
  createCanvas(600, 600, WEBGL);
  noStroke();
  
  shaderCanvas = createGraphics(width, height, WEBGL);
  shaderCanvas.noStroke();
  
  amplitude = new p5.Amplitude();
  fft = new p5.FFT();
}

function draw() {
  let level = amplitude.getLevel();
  audioLevel = lerp(audioLevel, level, 0.2);

  let spectrum = fft.analyze();
  bassLevel = lerp(bassLevel, fft.getEnergy("bass") / 255, 0.2);
  trebleLevel = lerp(trebleLevel, fft.getEnergy("treble") / 255, 0.2);

  shaderCanvas.shader(theShader);
  theShader.setUniform("u_time", millis() / 1000.0);
  theShader.setUniform("u_resolution", [width, height]);
  theShader.setUniform("u_audioLevel", audioLevel);
  theShader.setUniform("u_bassLevel", bassLevel);
  theShader.setUniform("u_trebleLevel", trebleLevel);
  
  shaderCanvas.rect(0, 0, width, height);
  image(shaderCanvas, -width / 2, -height / 2, width, height);
}

// Click to play or pause audio
function mousePressed() {
  if (audio.isPlaying()) {
    audio.pause();
  } else {
    audio.loop();
  }
}
