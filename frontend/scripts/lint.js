import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd(), 'src');
const files = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx'))) {
      files.push(path.relative(process.cwd(), fullPath));
    }
  }
}

walk(root);

if (files.length === 0) {
  console.error('No source files found to lint.');
  process.exit(1);
}

const result = spawnSync('npx oxlint --react-plugin --vitest-plugin --jsx-a11y-plugin ' + files.map((file) => `"${file}"`).join(' '), {
  encoding: 'utf8',
  shell: true,
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
