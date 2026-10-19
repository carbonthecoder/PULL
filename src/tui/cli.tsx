#!/usr/bin/env node
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import React from 'react';
import { render } from 'ink';
import App from './App.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function getLocalVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(resolve(__dirname, '../../package.json'), 'utf-8'));
    return pkg.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

function runUpdate() {
  const installDir = resolve(__dirname, '../..');

  console.log('\x1b[36m  pulling update...\x1b[0m\n');

  try {
    console.log('\x1b[33m  pulling latest...\x1b[0m');
    execSync('git pull', { cwd: installDir, stdio: 'inherit' });

    console.log('\n\x1b[33m  rebuilding...\x1b[0m');
    execSync('npx tsc', { cwd: installDir, stdio: 'inherit' });

    console.log('\n\x1b[32m  ✓ updated\x1b[0m\n');
    process.exit(0);
  } catch (err: any) {
    console.error('\n\x1b[31m  update failed:', err.message || err, '\x1b[0m\n');
    process.exit(1);
  }
}

if (process.argv.includes('update')) {
  runUpdate();
}

if (process.argv.includes('--web') || process.argv.includes('web')) {
  const { startServer } = await import('../server.js');
  const port = parseInt(process.env.PORT || '3000', 10);
  startServer(port);
} else {
  process.stdout.write('\x1b[?1049h');

  const instance = render(React.createElement(App), {
    exitOnCtrlC: true,
  });

  instance.waitUntilExit().then(() => {
    process.stdout.write('\x1b[?1049l');
    process.exit(0);
  });
}
