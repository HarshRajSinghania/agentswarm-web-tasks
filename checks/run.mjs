import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';

// Only the trusted worker/check reads fixtures; candidate modules run in a child.
export function run(worker) {
  assert.equal(process.argv.length, 4, 'Usage: node check.mjs --solution /absolute/path');
  assert.equal(process.argv[2], '--solution');
  const result = spawnSync(process.execPath, [worker, resolve(process.argv[3])], {
    timeout: 5000, maxBuffer: 1024 * 1024, encoding: 'utf8',
  });
  process.stdout.write(result.stdout || '');
  process.stderr.write(result.stderr || '');
  if (result.error) console.error(result.error.message);
  process.exitCode = result.status === 0 && !result.error ? 0 : 1;
}
