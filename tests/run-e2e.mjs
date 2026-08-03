import { spawn } from 'node:child_process';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';
const devCommand = isWindows
  ? { command: 'cmd.exe', args: ['/d', '/s', '/c', npmCmd, 'run', 'dev'] }
  : { command: npmCmd, args: ['run', 'dev'] };

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const canReachServer = async () => {
  try {
    const response = await fetch(BASE_URL);
    return response.status < 500;
  } catch {
    return false;
  }
};

const waitForServer = async () => {
  const deadline = Date.now() + 120_000;

  while (Date.now() < deadline) {
    if (await canReachServer()) return;
    await wait(1000);
  }

  throw new Error(`Servidor nao respondeu em ${BASE_URL}.`);
};

const killProcessTree = (child) => new Promise((resolve) => {
  if (!child || child.exitCode !== null) return resolve();

  const done = () => {
    clearTimeout(timeout);
    resolve();
  };
  const timeout = setTimeout(resolve, 3000);

  if (isWindows) {
    const killer = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
      stdio: 'ignore',
    });
    killer.on('close', done);
    killer.on('error', done);
    return;
  }

  child.kill('SIGTERM');
  done();
});

let server = null;
const hadServer = await canReachServer();

try {
  if (!hadServer) {
    server = spawn(devCommand.command, devCommand.args, {
      stdio: 'inherit',
      shell: false,
    });
    await waitForServer();
  }

  const tests = spawn(process.execPath, ['node_modules/@playwright/test/cli.js', 'test'], {
    stdio: 'inherit',
    shell: false,
  });

  const exitCode = await new Promise((resolve) => {
    tests.on('close', resolve);
    tests.on('error', () => resolve(1));
  });

  process.exitCode = exitCode;
} finally {
  if (server) {
    await killProcessTree(server);
  }
  process.exit(process.exitCode ?? 0);
}
