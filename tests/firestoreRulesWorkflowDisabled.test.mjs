import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('manual Rules workflow has one fail-closed job and no publish-capable step', async () => {
  const source = await readFile('.github/workflows/firebase-rules.yml', 'utf8');
  assert.match(source, /^on:\s*\n\s+workflow_dispatch:\s*$/m);
  assert.doesNotMatch(source, /^\s*push:\s*$/m);
  assert.equal((source.match(/^jobs:\s*$/gm) ?? []).length, 1);
  assert.equal((source.match(/^\s+- name:/gm) ?? []).length, 1);
  assert.equal((source.match(/^\s+run:/gm) ?? []).length, 1);
  assert.match(source, /^\s+exit 1\s*$/m);
  assert.doesNotMatch(source, /\$\{\{|credentials_json:|google-github-actions\/auth|setup-node|setup-java|checkout@|npm ci|firebase deploy|manageReceiptRules\.mjs|--deploy|FIREBASE_RULES_SERVICE_ACCOUNT/);
});
