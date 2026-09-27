/* DM3014 Interactive Devices, Ashley Hi 2026
 * Week 6 - Teachable Machine
 * Train Your Own Model
 */

let model;
// model url *** edit link here
const modelURL = "https://teachablemachine.withgoogle.com/models/BTMOpeY9F/";

let video;
let label = ""; // to store classifications

async function setup() {
  createCanvas(320, 260);
  video = createCapture(VIDEO);
  video.size(320, 240);
  video.hide();

  model = await tmPose.load(modelURL + "model.json", modelURL + "metadata.json");
  classifyVideo();
}

// canvas stuff here
function draw() {

  if (label ==="Left Tilt"){
    background(255, 0, 0); //red
  }
    else if (label === "No Tilt") {
    background(0, 255, 0); // green
  }
  else if (label === "Right Tilt") {
    background(0, 0, 255); // blue
  }

  // draw video
  image(video, 0, 0);

  // draw label *** edit label here
  fill(255);
  textSize(16);
  textAlign(CENTER);
  text(label, width / 2, height - 4);
}

// Get a pose prediction for the current video frame.
async function classifyVideo() {
  if (!model || video.elt.readyState < 2) {
    requestAnimationFrame(classifyVideo);
    return;
  }

  const { posenetOutput } = await model.estimatePose(video.elt);
  const predictions = await model.predict(posenetOutput);
  predictions.sort((a, b) => b.probability - a.probability);
  label = predictions[0].className;
  requestAnimationFrame(classifyVideo);
}
