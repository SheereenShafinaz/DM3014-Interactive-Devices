let socket;
let started = false;
let padCenter;
let dragging = false;

// attached immediately, before p5 finishes loading — if p5 ever fails to
// load (e.g. no internet on the venue Wi-Fi), the button still needs to work
document.getElementById('permission-btn').addEventListener('click', startRemote);
// touchend as a fallback: some iOS Safari configurations suppress the
// synthesized click after a touch when touch-action: none is set globally
document.getElementById('permission-btn').addEventListener('touchend', (e) => {
  e.preventDefault();
  startRemote();
});

function setup() {
  createCanvas(windowWidth, windowHeight);
  noLoop(); // draw() runs manually once started, then via redraw()
  padCenter = { x: width / 2, y: height / 2 };
}

function startRemote() {
  console.log('startRemote fired');

  // iOS requires a user gesture (this click/tap) before motion or
  // orientation events are allowed — each needs its own permission request
  if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
    DeviceMotionEvent.requestPermission().catch(() => {});
  }

  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission()
      .then((response) => {
        if (response === 'granted') {
          window.addEventListener('deviceorientation', handleTilt);
        }
      })
      .catch(() => {});
  } else {
    // Android and older iOS don't gate this behind a permission prompt
    window.addEventListener('deviceorientation', handleTilt);
  }

  document.getElementById('permission-btn').style.display = 'none';
  socket = io();
  started = true;
  loop();
}

// Exercise 5b — tilt as an alternative to touch-drag. Both are wired up
// here for reference; in the actual exercise, gate them (e.g. a toggle
// button) so they don't both send dx to the server at once.
function handleTilt(e) {
  let tiltX = constrain(e.gamma / 45, -1, 1);
  socket.emit('control', { dx: tiltX });
}

function draw() {
  background(20);
  if (!started) return;

  noFill();
  stroke(80);
  circle(padCenter.x, padCenter.y, 160);

  fill(240, 90, 60);
  noStroke();
  let dotX = dragging ? mouseX : padCenter.x;
  let dotY = dragging ? mouseY : padCenter.y;
  circle(dotX, dotY, 30);

  fill(150);
  textAlign(CENTER);
  textSize(14);
  text('drag to move  ·  tap edge to jump', width / 2, height - 40);
}

function touchStarted() {
  if (!started) return false;
  dragging = true;
  maybeJump();
  return false;
}

function touchMoved() {
  if (!started || !dragging) return false;
  let dx = constrain((mouseX - padCenter.x) / 80, -1, 1);
  let dy = constrain((mouseY - padCenter.y) / 80, -1, 1);
  socket.emit('control', { dx, dy });
  return false;
}

function touchEnded() {
  if (!started) return false;
  dragging = false;
  socket.emit('control', { dx: 0, dy: 0 });
  return false;
}

function maybeJump() {
  let dist = Math.hypot(mouseX - padCenter.x, mouseY - padCenter.y);
  if (dist > 80) {
    socket.emit('control', { jump: true });
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  padCenter = { x: width / 2, y: height / 2 };
}
