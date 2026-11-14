
let model;
const modelURL = "https://teachablemachine.withgoogle.com/models/BTMOpeY9F/";

let video;
let label = "";
let sound, amp, delay, cnv; //for music p5.SoundFile 

// canvas size
let WIDTH = 1920;
let HEIGHT = 1080;

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
let punchDuration = 500; // punch stays on screen for 0.5 second

// images & music
let idleGif,idleImg,idleHands, leftSignalImg, leftPunchImg, rightSignalImg, rightPunchImg;
let bgmusic, signalSound, punchSound, gameoverSound;

// timers
let gameStartTime = 0;
let countdownStart = 0; //to calculate countdown time ()

function preload() {
  idleGif = loadImage("images/idle_animation.gif");
  idleImg = loadImage("images/idle_image.png");
  idleHands = loadImage("images/hands_idle.png");
  leftSignalImg = loadImage("images/left_signal.png");
  leftPunchImg = loadImage("images/left_punch.png");
  rightSignalImg = loadImage("images/right_signal.png");
  rightPunchImg = loadImage("images/right_punch.png");
  UI = loadImage("images/UI.png");

  bgmusic = loadSound('sounds/bgmusic.mp3');
  signalSound = loadSound('sounds/signal.mp3')
  punchSound = loadSound('sounds/punch.mp3')
  gameoverSound = loadSound('sounds/gameover.mp3')
}

async function setup() {
  createCanvas(WIDTH, HEIGHT);
  video = createCapture(VIDEO,{flipped: true });
  video.size(320, 240);
  video.hide();

  model = await tmPose.load(modelURL + "model.json", modelURL + "metadata.json");
  classifyVideo();
}

function draw() {

  // ---------- WAITING SCREEN ----------
  if (gameState === "waiting") {
    image(idleImg, 0, 0, WIDTH, HEIGHT);
    background(0, 0, 0, 200); //transparent overlay on top of idle image
  }

  // ---------- STARTING COUNTDOWN ----------
  else if (gameState === "countdown") {
    image(idleImg, 0, 0, WIDTH, HEIGHT);
    background(0, 0, 0, 200);
    
    let elapsed = (millis() - countdownStart) / 1000;
    let remaining = 3 - floor(elapsed);

    if (remaining > 0) {
      fill(255);
      textSize(80);
      textAlign(CENTER);
      text(remaining, WIDTH / 2, HEIGHT / 2);
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
    if (!bgmusic.isPlaying()) {
      bgmusic.loop(); // loop bg music, and check if bgmusic isnt already playing
    }
    image(idleGif, 0, 0, WIDTH, HEIGHT);
    score = (millis() - gameStartTime) / 1000; //update score
  

    // punch phases pictures
    if (punchPhase === "idle") {
      image(idleHands, 0, 0, WIDTH, HEIGHT);
    } else if (punchPhase === "signal") {
      if (punchSide === "left") {
        image(idleHands, 0, 0, WIDTH, HEIGHT);
        image(leftSignalImg, 0, 0, WIDTH, HEIGHT);
      } else {
        image(idleHands, 0, 0, WIDTH, HEIGHT);
        image(rightSignalImg, 0, 0, WIDTH, HEIGHT);
      }
    } else if (punchPhase === "punch") {
      if (punchSide === "left") {
        image(leftPunchImg, 0, 0, WIDTH, HEIGHT);
      } else {
        image(rightPunchImg, 0, 0, WIDTH, HEIGHT);
      }
    }

    // ---------- PUNCH LOGIC ----------
    if (punchPhase === "idle") {
      if (millis() >= nextPunchAt) { //start the punch if current time is greater than or equal to nextPunchAt
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
      if (millis() - punchTime < punchDuration) {
      } else {
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
          nextPunchAt = millis() + random(700, 2000); // wait a random amount before next punch (0.7 - 2 seconds)
        }
      }
    }

    // draw score
    fill(255);
    textSize(20);
    textAlign(LEFT);
    text("Time: " + nf(score, 1, 1) + "s", WIDTH/2, 1060);
  }

  // ---------- GAME OVER SCREEN ----------
  else if (gameState === "gameover") {
    if (!bgmusic.isPlaying()) {
      bgmusic.stop(); // stop bg music
    }
    gameoverSound.play();

    if (punchSide === "left") { //show last punch image
      image(leftPunchImg, 0, 0, WIDTH, HEIGHT);
    } else {
      image(rightPunchImg, 0, 0, WIDTH, HEIGHT);
    }

    background(0, 0, 0, 180); //overlay gameover screen on top
    
    fill(255);
    textAlign(CENTER);
    textSize(50);
    text("GAME OVER", WIDTH/2, 120);
    textSize(28);
    text("You survived " + nf(score, 1, 1) + " seconds", WIDTH / 2, 200);
    text("High Score: " + nf(highScore, 1, 1) + "s", WIDTH / 2, 250);
    textSize(22);
    text("Press SPACE to retry", WIDTH / 2, 350);

  }

  // ---------- UI ----------
  drawUI();
  
}

// function to draw UI ontop of everything

function drawUI() {
  image(video, 30, 531, 442, 425); //camera below ui
  image(UI, 0, 0, WIDTH, HEIGHT); //phone UI
  textSize(20);
  textAlign(CENTER);
  fill("white");
  textStyle(BOLD);
  text("Current tilt: " + label, 225, 560); //tilt label for camera

  // high score message
  textSize(40);
  fill("white");
  textStyle(BOLD);
  textAlign(CENTER);
  text(nf(highScore, 1, 1) + "s", 1705, 777);
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