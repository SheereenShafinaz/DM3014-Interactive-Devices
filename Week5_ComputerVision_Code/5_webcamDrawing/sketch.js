/* DM3014 Interactive Devices, Ashley Hi 2026
 * Week 5 - Computer Vision
 * Webcam Drawing
 */

var camera;
var prevImg;
var currImg;
var diffImg;
var spotImg;
var threshold = 0.15; // *** change sensitivity (decimal between 0 - 1)
var grid;
let img;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  camera = createCapture(VIDEO, { flipped: true });
  camera.hide();

  grid = new Grid(1280, 720);
}

function draw() {
  background(120);
  image(camera, 0, 0, 1280, 720);
  camera.loadPixels();

  var smallW = camera.width / 4;
  var smallH = camera.height / 4;

  currImg = createImage(smallW, smallH);
  currImg.copy(camera, 0, 0, camera.width, camera.height, 0, 0, smallW, smallH);
  currImg.filter("gray");
  currImg.filter("blur", 2);

  diffImg = createImage(smallW, smallH);

  spotImg = createImage(smallW / 2, smallH / 2);
  spotImg.copy(
    camera,
    0,
    0,
    camera.width,
    camera.height,
    0,
    0,
    smallW / 2,
    smallH / 2
  );
  spotImg.filter("gray");

  if (typeof prevImg !== "undefined") {
    currImg.loadPixels();
    prevImg.loadPixels();
    diffImg.loadPixels();
    spotImg.loadPixels();

    for (var x = 0; x < currImg.width; x += 1) {
      for (var y = 0; y < currImg.height; y += 1) {
        var index = (x + y * currImg.width) * 4;
        var redCurr = currImg.pixels[index];
        var redPrev = prevImg.pixels[index];
        var d = abs(redCurr - redPrev);

        diffImg.pixels[index + 0] = d;
        diffImg.pixels[index + 1] = d;
        diffImg.pixels[index + 2] = d;
        diffImg.pixels[index + 3] = 255;
      }
    }

    diffImg.updatePixels();
  }

  prevImg = createImage(smallW, smallH);
  prevImg.copy(
    currImg,
    0,
    0,
    currImg.width,
    currImg.height,
    0,
    0,
    smallW,
    smallH
  );

  diffImg.filter("threshold", threshold);

  image(currImg, 1280, 0);
  image(diffImg, 1280, currImg.height);

  grid.update(diffImg);
}

function mousePressed() {
  threshold = map(mouseX, 0, 1280, 0, 1);
  console.log(threshold);
}

var Grid = function (_w, _h) {
  this.diffImg = 0;
  this.noteWidth = 5; // *** change spacing between each point
  this.worldWidth = _w;
  this.worldHeight = _h;
  this.numOfNotesX = int(this.worldWidth / this.noteWidth);
  this.numOfNotesY = int(this.worldHeight / this.noteWidth);
  this.arrayLength = this.numOfNotesX * this.numOfNotesY;
  this.noteStates = [];
  this.noteStates = new Array(this.arrayLength).fill(0);
  this.colorStart = color(100, 200, 50, 150); // *** colour when a point first appears
  this.colorEnd = color(255, 50, 150, 150); // *** colour as a point fades out
  console.log(this);
  console.log(_w, _h);

  this.update = function (_img) {
    this.diffImg = _img;
    this.diffImg.loadPixels();

    for (var x = 0; x < this.diffImg.width; x += 1) {
      for (var y = 0; y < this.diffImg.height; y += 1) {
        var index = (x + y * this.diffImg.width) * 4;
        var state = diffImg.pixels[index + 0];

        if (state == 255) {
          var screenX = map(x, 0, this.diffImg.width, 0, this.worldWidth);
          var screenY = map(y, 0, this.diffImg.height, 0, this.worldHeight);
          var noteIndexX = int(screenX / this.noteWidth);
          var noteIndexY = int(screenY / this.noteWidth);
          var noteIndex = noteIndexX + noteIndexY * this.numOfNotesX;
          this.noteStates[noteIndex] = 1;
        }
      }
    }

    for (var i = 0; i < this.arrayLength; i++) {
      this.noteStates[i] -= 0.05; // *** set how long points take to disappear (decimal between 0 - 1)
      this.noteStates[i] = constrain(this.noteStates[i], 0, 1);
    }

    this.draw();
  };

  this.draw = function () {
    push();
    noStroke();
    for (var x = 0; x < this.numOfNotesX / 2; x++) {
      for (var y = 0; y < this.numOfNotesY / 2; y++) {
        var posX = this.noteWidth / 2 + 2 * x * this.noteWidth;
        var posY = this.noteWidth / 2 + 2 * y * this.noteWidth;
        var noteIndex = x + y * this.numOfNotesX;

        if (this.noteStates[noteIndex] > 0) {
          var dynamicColor = lerpColor(
            this.colorStart,
            this.colorEnd,
            1 - this.noteStates[noteIndex]
          );
          fill(dynamicColor);
          //ellipse(posX, posY, camera.width / 20, camera.height / 20); // *** change shape of point
          rect(posX - camera.width / 40,posY - camera.height / 40,camera.width / 20,camera.height / 20);
        }
      }
    }
    pop();
  };
};
