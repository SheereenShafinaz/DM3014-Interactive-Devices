let socket;
let input = { dx: 0, dy: 0 };
let player = { x: 50, y: 0, vy: 0, w: 80, h: 80 };
let gravity = 0.6;
let ground = 350;
let speed = 4;
let platform = { x: 300, y: 220, w: 140, h: 16 };
let platform2 = { x: 100, y: 150, w: 140, h: 16 };
let connected = false;
let run_right;
let run_left;
let idle;
let jump;

function setup() {
  createCanvas(600, 400);
  socket = io();

  //all the different animations)
  run_right = loadImage("images/umbra_run(4frames).gif");
  run_left = loadImage("images/umbra_run_left.gif");
  idle = loadImage("images/umbra_idle 2 frames.gif");
  jump = loadImage("images/umbrajump.png");

  socket.on('connect', () => {
    connected = true;
    document.getElementById('status').textContent = 'phone connected — waiting for input';
  });

  socket.on('control', (data) => {
    document.getElementById('status').textContent = 'receiving input from phone';
    if (typeof data.dx === 'number') input.dx = data.dx;
    if (typeof data.dy === 'number') input.dy = data.dy;
    if (data.jump) doJump();
  });
}

function draw() {
  background(20);

  player.x += input.dx * speed;
  player.x = constrain(player.x, 0, width - player.w);

  player.vy += gravity;
  player.y += player.vy;

  if (player.y + player.h > ground) {
    player.y = ground - player.h;
    player.vy = 0;
  }

  //platform1 collision
  let landing =
    player.x + player.w > platform.x &&
    player.x < platform.x + platform.w &&
    player.y + player.h > platform.y &&
    player.y + player.h < platform.y + platform.h + 10 &&
    player.vy >= 0;

  if (landing) {
    player.y = platform.y - player.h;
    player.vy = 0;
  }

  //platform2 collision
  let landing2 =
    player.x + player.w > platform2.x &&
    player.x < platform2.x + platform2.w &&
    player.y + player.h > platform2.y &&
    player.y + player.h < platform2.y + platform2.h + 10 &&
    player.vy >= 0;

  if (landing2) {
    player.y = platform2.y - player.h;
    player.vy = 0;
  }
  //draw ground and platform
  fill(60);
  rect(0, ground, width, height - ground);
  fill(90);
  rect(platform.x, platform.y, platform.w, platform.h);
  fill(90);
  rect(platform2.x, platform2.y, platform2.w, platform2.h);

  //draw player
  // also allow keyboard for testing without a phone
  if (keyIsDown(LEFT_ARROW)){
    player.x -= 5;
    image(run_left, player.x, player.y, player.w, player.h);
  }
  else if (keyIsDown(RIGHT_ARROW)) {
    player.x += 5;
    image(run_right, player.x, player.y, player.w, player.h);
  }
  else if (key === ' '){
    image(jump, player.x, player.y, player.w, player.h);
  }
  else{
    image(idle, player.x, player.y, player.w, player.h);
  }
  
}

function keyPressed() {
  if (key === ' ') doJump();
}

function doJump() {
  if (player.y + player.h >= ground || player.vy === 0) {
    player.vy = -12;
  }
}
