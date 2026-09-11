# Handoff

A phone browser acts as a remote controller; a laptop browser runs the p5.js
platformer environment. Both talk through a small Node.js + socket.io relay.

```
[Phone browser]  --touch/tap-->  [Node.js server]  --broadcast-->  [Laptop browser]
   phone.html                       server.js                      laptop.html
```

## Requirements

- Node.js 18 or later installed on the laptop
- Laptop and phone connected to the **same Wi-Fi network**
- Any modern phone browser (Safari on iOS, Chrome on Android)

**Why HTTPS is required:** iOS Safari refuses to fire device orientation
(tilt) events on a page loaded over plain `http://`, even on a local
network — it only allows this on a secure context. This project generates
its own self-signed certificate automatically on first run (via the
`selfsigned` npm package), so it works offline without needing openssl
installed separately or a real domain — this matters especially on Windows,
which doesn't ship openssl by default.

## 1. Install

Unzip the project, then in a terminal:

```bash
cd 2_handoff_windows
npm install
```

## 2. Run the server

```bash
npm start
```

On the very first run you'll see an extra line:

```
Generated a new self-signed certificate (key.pem / cert.pem).
```

After that, `key.pem` and `cert.pem` exist in the project folder and won't
be regenerated on future runs (until they're deleted or expire after 365
days). You'll then see:

```
Play environment handoff server running (HTTPS)
-------------------------------------------------
Laptop (environment):
  https://localhost:3000/laptop.html

Phone (remote) — on the same Wi-Fi as this laptop:
  https://192.168.1.14:3000/phone.html

The phone will show a certificate warning on first visit
(self-signed cert) — tap "Show Details" then "visit this
website" to proceed. This only needs to happen once.
-------------------------------------------------
```

## 3. Open the two pages

1. On the **laptop**, open the `https://localhost:3000/laptop.html` link.
   Your browser will also warn about the self-signed cert — proceed past it.
   You should see a dark canvas with a red square, a floor, and a floating
   platform.
2. On the **phone**, open the `https://<laptop's IP>:3000/phone.html` link
   (the second link printed in the terminal — not `localhost`, since that
   would point the phone at itself). Tap through the certificate warning the
   same way as on the laptop.
3. Tap **"tap to start remote"** on the phone. This requests both motion and
   orientation permission in the same gesture — iOS requires this to happen
   inside a real tap, so it can't be deferred to later.
4. Drag your finger on the phone screen to move the square left and right on
   the laptop. Tap near the edge of the circular pad to jump.

If nothing happens on the laptop, check the terminal running `npm start` —
it logs `device connected` each time a browser (phone or laptop) opens a
socket connection. If you only see one connection, the phone and laptop
likely aren't on the same network. The laptop page's own tab also opens a
socket connection, so "phone connected" text on `laptop.html` isn't proof
the phone specifically has connected — check the terminal for a second
`device connected` line instead.

**If the phone button doesn't respond at all:**

- Force-reload the page rather than relying on cache — the server sends
  `Cache-Control: no-store`, but a page already open before that change
  shipped may still be running old code.
- Connect the phone to a Mac and use Safari → Develop → [device] →
  phone.html to open a live console and watch for errors when tapping.
