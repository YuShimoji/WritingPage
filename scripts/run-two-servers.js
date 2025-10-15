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

async function main(){
  try {
    console.log('Starting dev server on 8081 ...');
    start(8081);
    await waitForReady(8081);
    console.log('Server 8081 ready. Starting dev server on 8080 ...');
    start(8080);
    await waitForReady(8080);
    console.log('Servers ready on 8080 and 8081.');
  } catch (err) {
    console.error('Failed to start dev servers:', err);
    shutdown();
    process.exit(1);
  }
}

main();
