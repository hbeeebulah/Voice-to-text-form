const { spawn } = require('child_process');
const path = require('path');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

console.log('\x1b[36m%s\x1b[0m', '================================================');
console.log('\x1b[36m%s\x1b[0m', '   VoxForm Studio - Multimodal Voice-to-Text Forms   ');
console.log('\x1b[36m%s\x1b[0m', '================================================');

function startProcess(name, dir, script, color) {
  const proc = spawn(npmCmd, ['run', script], {
    cwd: path.join(__dirname, dir),
    shell: true,
    env: { ...process.env, FORCE_COLOR: '1' }
  });

  proc.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      console.log(`${color}[${name}]\x1b[0m ${line}`);
    });
  });

  proc.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      console.error(`${color}[${name} ERR]\x1b[0m ${line}`);
    });
  });

  proc.on('close', (code) => {
    console.log(`${color}[${name}]\x1b[0m exited with code ${code}`);
  });

  return proc;
}

const serverProc = startProcess('BACKEND', 'server', 'dev', '\x1b[35m');
const clientProc = startProcess('FRONTEND', 'client', 'dev', '\x1b[32m');

process.on('SIGINT', () => {
  console.log('\nShutting down dev servers...');
  serverProc.kill('SIGINT');
  clientProc.kill('SIGINT');
  process.exit(0);
});
