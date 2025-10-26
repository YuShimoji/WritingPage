const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const serverScript = path.join(__dirname, 'dev-server.js');
const processes = new Map();

function start(port) {
  const child = spawn(process.execPath, [serverScript, '--port', String(port)], {
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'inherit', 'inherit'],
    windowsHide: true,
  });
  processes.set(port, child);
  child.on('exit', (code, signal) => {
    console.log(`[server:${port}] exited code=${code} signal=${signal}`);
  });
  return child;
}

function waitForReady(port, retries = 50, delay = 200) {
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get({ hostname: '127.0.0.1', port, path: '/index.html' }, res => {
        res.resume();
        if (res.statusCode && res.statusCode < 500) {
          return resolve();
        }
        retry();
      });
      req.on('error', retry);
      req.end();
    };
    const retry = () => {
      if (retries <= 0) {
        return reject(new Error(`Server on port ${port} did not become ready`));
      }
      retries -= 1;
      setTimeout(attempt, delay);
    };
    attempt();
  });
}

function shutdown() {
  console.log('\nShutting down servers...');
  processes.forEach(child => {
    if (child && !child.killed) child.kill('SIGINT');
  });
  setTimeout(() => process.exit(0), 200);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

function parseBasePort() {
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (/^\d+$/.test(a)) return parseInt(a, 10);
    let m = /^--base=(\d+)$/.exec(a);
    if (m) return parseInt(m[1], 10);
    m = /^--port=(\d+)$/.exec(a);
    if (m) return parseInt(m[1], 10);
    if ((a === '--base' || a === '--port') && /^\d+$/.test(argv[i+1] || '')) {
      return parseInt(argv[i+1], 10);
    }
  }
  return 8080;
}

async function main(){
  try {
    const base = parseBasePort();
    const childPort = base + 1;
    console.log(`Starting dev server on ${childPort} ...`);
    start(childPort);
    await waitForReady(childPort);
    console.log(`Server ${childPort} ready. Starting dev server on ${base} ...`);
    start(base);
    await waitForReady(base);
    console.log(`Servers ready on ${base} and ${childPort}.`);
  } catch (err) {
    console.error('Failed to start dev servers:', err);
    shutdown();
    process.exit(1);
  }
}

main();
