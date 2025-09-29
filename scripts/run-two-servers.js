const { spawn } = require('child_process');
const path = require('path');

const serverScript = path.join(__dirname, 'dev-server.js');

function start(port) {
  const child = spawn(process.execPath, [serverScript, '--port', String(port)], {
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'inherit', 'inherit'],
    windowsHide: true,
  });
  child.on('exit', (code, signal) => {
    console.log(`[server:${port}] exited code=${code} signal=${signal}`);
  });
  return child;
}

console.log('Starting two dev servers on 8080 and 8081 ...');
const a = start(8080);
const b = start(8081);

function shutdown() {
  console.log('\nShutting down servers...');
  if (a && !a.killed) a.kill('SIGINT');
  if (b && !b.killed) b.kill('SIGINT');
  setTimeout(() => process.exit(0), 200);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
