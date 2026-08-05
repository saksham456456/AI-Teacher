// Fallback server.js to catch Render if it completely ignores our start script
console.log("Error: Render is ignoring package.json 'npm start' and executing node server.js.");
console.log("To fix this, you must change your Render Start Command from 'node server.js' to 'npm start'");
console.log("Attempting to boot Next.js manually as a fallback...");

// Using Next.js programmatic API to try and salvage the boot sequence
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
