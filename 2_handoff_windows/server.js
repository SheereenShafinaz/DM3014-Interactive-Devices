const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const os = require('os');

const KEY_PATH = path.join(__dirname, 'key.pem');
const CERT_PATH = path.join(__dirname, 'cert.pem');

if (!fs.existsSync(KEY_PATH) || !fs.existsSync(CERT_PATH)) {
  // generated in pure JS so nothing outside `npm install` is required on
  // any OS — no dependency on openssl being installed separately, which
  // Windows doesn't ship by default
  const selfsigned = require('selfsigned');
  const attrs = [{ name: 'commonName', value: 'localhost' }];
  const pems = selfsigned.generate(attrs, { days: 365 });
  fs.writeFileSync(KEY_PATH, pems.private);
  fs.writeFileSync(CERT_PATH, pems.cert);
  console.log('Generated a new self-signed certificate (key.pem / cert.pem).');
}

const server = require('https').createServer(
  {
    key: fs.readFileSync(KEY_PATH),
    cert: fs.readFileSync(CERT_PATH),
  },
  app
);
const io = require('socket.io')(server);

// disable caching on everything served from /public — iOS Safari caches
// aggressively, which makes edited phone.js/phone.html look "stuck" during
// a workshop unless this is set
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('device connected:', socket.id);

  // relay any "control" message straight to everyone else in the room
  socket.on('control', (data) => {
    socket.broadcast.emit('control', data);
  });

  socket.on('disconnect', () => {
    console.log('device disconnected:', socket.id);
  });
});

const PORT = 3000;

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

server.listen(PORT, () => {
  const ip = getLocalIP();
  console.log('');
  console.log('Play environment handoff server running (HTTPS)');
  console.log('-------------------------------------------------');
  console.log('Laptop (environment):');
  console.log(`  https://localhost:${PORT}/laptop.html`);
  console.log('');
  console.log('Phone (remote) — on the same Wi-Fi as this laptop:');
  console.log(`  https://${ip}:${PORT}/phone.html`);
  console.log('');
  console.log('The phone will show a certificate warning on first visit');
  console.log('(self-signed cert) — tap "Show Details" then "visit this');
  console.log('website" to proceed. This only needs to happen once.');
  console.log('-------------------------------------------------');
  console.log('');
});
