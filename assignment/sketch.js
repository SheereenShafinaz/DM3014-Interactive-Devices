
let model;
const modelURL = "https://teachablemachine.withgoogle.com/models/BTMOpeY9F/";

let video;
let label = "";

// game panel size
let GAME_W = 640;
let GAME_H = 520;

// menu panel size
let PANEL_X = 640;
let PANEL_W = 260;

// game variables
let gameState = "waiting"; // waiting, countdown, playing, gameover
let startTime = 0;
let currentTime = 0;
let score = 0;
let highScore = 0;

// punch timing
let punchTime = 0;
let punchSide = ""; // "left" or "right"
let punchPhase = "idle"; // idle, signal, punch
let nextPunchAt = 0;

// images
let idleImg, leftSignalImg, leftPunchImg, rightSignalImg, rightPunchImg;

// timers
let gameStartTime = 0;
let countdownStart = 0; //to calculate countdown time ()

function preload() {
  idleImg = loadImage("images/idle.png");
  leftSignalImg = loadImage("images/leftsignal.png");
  leftPunchImg = loadImage("images/leftpunch.png");
  rightSignalImg = loadImage("images/rightsignal.png");
  rightPunchImg = loadImage("images/rightpunch.png");
}

async function setup() {
  createCanvas(GAME_W + PANEL_W, GAME_H);
  video = createCapture(VIDEO,{flipped: true });
  video.size(320, 240);
  video.hide();

  model = await tmPose.load(modelURL + "model.json", modelURL + "metadata.json");
  classifyVideo();
}

function draw() {

  // ---------- WAITING SCREEN ----------
  if (gameState === "waiting") {
    background(30);
    image(video, width / 2 - 160, 340, 320, 240);
    fill(255);
    textSize(14);
    text("Current tilt: " + label, width / 2, 330);
  }

  // ---------- STARTING COUNTDOWN ----------
  else if (gameState === "countdown") {
    background(30);
    let elapsed = (millis() - countdownStart) / 1000;
    let remaining = 3 - floor(elapsed);

    if (remaining > 0) {
      fill(255);
      textSize(80);
      textAlign(CENTER);
      text(remaining, GAME_W / 2, GAME_H / 2);
    } else {
      // countdown done, start the game
      gameState = "playing";
      gameStartTime = millis();
      nextPunchAt = millis() + 2000; // set the time for thefirst punch (after 2 seconds)
      punchPhase = "idle"; //start punchPhase as idle for next part
    }
  }

  // ---------- PLAYING ----------
  else if (gameState === "playing") {
    score = (millis() - gameStartTime) / 1000; //update score
  

    // punch phases pictures
    if (punchPhase === "idle") {
      image(idleImg, 0, 0, GAME_W, GAME_H);
    } else if (punchPhase === "signal") {
      if (punchSide === "left") {
        image(leftSignalImg, 0, 0, GAME_W, GAME_H);
      } else {
        image(rightSignalImg, 0, 0, GAME_W, GAME_H);
      }
    } else if (punchPhase === "punch") {
      if (punchSide === "left") {
        image(leftPunchImg, 0, 0, GAME_W, GAME_H);
      } else {
        image(rightPunchImg, 0, 0, GAME_W, GAME_H);
      }
    }

    // ---------- PUNCH LOGIC ----------
    if (punchPhase === "idle") {
      if (millis() >= nextPunchAt) { //start the punch if current time is greater than or equal to nextPunchAt)
        if (random(1) < 0.5) {         // random pick left or right
          punchSide = "left";
        } else {
          punchSide = "right";
        }
        punchPhase = "signal"; //change phase to signal and start the reaction timer
        punchTime = millis();
      }
    }

    else if (punchPhase === "signal") {
      if (millis() - punchTime >= 1000) { //if 1s has passed since signal, throw punch
        punchPhase = "punch";
        punchTime = millis();
      }
    }

    else if (punchPhase === "punch") {
      // user has a tiny window to be dodging
      let dodged = false;
      if (punchSide === "left") { // left punch comes from the left -> dodge right (note uuuh myy uuh tilt direction is mirrored)
        if (label === "Right Tilt") {
          dodged = true;
        }
      } else {
        // right punch -> dodge left
        if (label === "Left Tilt") {
          dodged = true;
        }
      }

      if (!dodged) {
        gameState = "gameover"; //if dont dodge, update highscore and change to gameover state
        if (score > highScore) {
          highScore = score;
        }
      } else {
        // dodged successfully
        punchPhase = "idle";
        nextPunchAt = millis() + random(800, 2000); // wait a random amount before next punch (0.8 - 2 seconds)
      }
    }

    // draw score
    fill(255);
    textSize(20);
    textAlign(LEFT);
    text("Time: " + nf(score, 1, 1) + "s", 20, 30);

    tint(255, 50); //make image transparent
    image(video, GAME_W/2-350/2, GAME_H/2-250/2, 350, 250);
    fill(255);

    noTint();
    textSize(12);
    textAlign(CENTER);
    text(label, GAME_W/2, GAME_H - 100);
  }

  // ---------- GAME OVER SCREEN ----------
  else if (gameState === "gameover") {

    if (punchSide === "left") { //show last punch image
      image(leftPunchImg, 0, 0, GAME_W, GAME_H);
    } else {
      image(rightPunchImg, 0, 0, GAME_W, GAME_H);
    }

    background(0, 0, 0, 180); //overlay gameover screen on top
    
    fill(255);
    textAlign(CENTER);
    textSize(50);
    text("GAME OVER", GAME_W/2, 120);
    textSize(28);
    text("You survived " + nf(score, 1, 1) + " seconds", GAME_W / 2, 200);
    text("High Score: " + nf(highScore, 1, 1) + "s", GAME_W / 2, 250);
    textSize(22);
    text("Press SPACE to retry", GAME_W / 2, 350);

  }

  // ---------- SIDE PANEL ----------
  drawPanel();
}

// function to draw side MENU panel

function drawPanel() {
  fill(87, 104, 185);
  rect(PANEL_X, 0, PANEL_W, GAME_H);

  // TITLE
  fill(255);
  textSize(32);
  textAlign(CENTER);
  text("DODGE OUT!", PANEL_X + PANEL_W / 2, 50);

  // HIGH SCORE
  textSize(20);
  textAlign(LEFT);
  text("High Score: " + nf(highScore, 1, 1) + "s", PANEL_X + 20, 100);

  // instructions
  fill(255);
  textSize(16);
  textAlign(LEFT);
  let tx = PANEL_X + 20;
  text("HOW TO PLAY", tx, 240);

  fill(255);
  textSize(13);
  textAlign(LEFT);
  text("Sit in front of the camera", tx, 270);
  text("Lean LEFT or RIGHT to dodge", tx, 290);
  text("the incoming punch in time", tx, 310);
  text("Dodge for as long as you can", tx, 330);

  textAlign(CENTER);
  fill(255);
  textSize(14);
  if (gameState === "waiting") {
    text("Press SPACE to start", PANEL_X + PANEL_W / 2, 430);
  } else if (gameState === "gameover") {
    text("Press SPACE to retry", PANEL_X + PANEL_W / 2, 430);
  }
}


// spacebar to start / restart
function keyPressed() {
  if (key === " ") {
    if (gameState === "waiting") {
      gameState = "countdown";
      countdownStart = millis(); //where countdownStart is recorded to track countdown time
    } else if (gameState === "gameover") {
      // reset the game
      score = 0;
      punchPhase = "idle";
      punchSide = "";
      gameState = "countdown";
      countdownStart = millis();
    }
  }
}

// machine learning
async function classifyVideo() {
  if (!model || video.elt.readyState < 2) {
    requestAnimationFrame(classifyVideo);
    return;
  }

  const { posenetOutput } = await model.estimatePose(video.elt);
  const predictions = await model.predict(posenetOutput);
  predictions.sort((a, b) => b.probability - a.probability);
  
  if (predictions[0].className === "Left Tilt") { //idk why but the left and right tilt are swapped so yeah jsut swap them back
    label = "Right Tilt";
  } else if (predictions[0].className === "Right Tilt") {
    label = "Left Tilt";
  } else {
    label = predictions[0].className;
  }

  requestAnimationFrame(classifyVideo);
}