import { spawn } from 'node:child_process';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const children = [];

function start(args, label) {
  const child = spawn(npmCommand, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
  });

  child.on('error', (error) => {
    console.error(`[${label}] failed to start:`, error.message);
  });

  child.on('exit', (code, signal) => {
    if (code && code !== 0) {
      console.error(`[${label}] stopped with code ${code}.`);
      stopAll(code);
    } else if (signal) {
      stopAll(0);
    }
  });

  children.push(child);
}

function stopAll(exitCode = 0) {
  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM');
  }
  setTimeout(() => process.exit(exitCode), 250);
}

process.on('SIGINT', () => stopAll(0));
process.on('SIGTERM', () => stopAll(0));

start(['run', 'server'], 'api');
start(['exec', 'vite', '--', '--port', '3000', '--host', '0.0.0.0'], 'vite');
