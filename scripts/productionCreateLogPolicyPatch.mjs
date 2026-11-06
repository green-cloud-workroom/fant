// Apply only to the reviewed source and emitted JS from the live closing bundle.
// Do not replace the rest of the deployed closing/inventory implementation.
export function patchProductionCreateLogPolicy(source) {
  const pattern = /^([ \t]*)classifyClosingLog\(log\) === 'production' &&\r?$/gm;
  if (!source.includes('export function judgeProductionLogsAcknowledged(') || [...source.matchAll(pattern)].length !== 1 || source.includes("!(log.action === 'production' && log.subAction === 'create')")) {
    throw Error('Closing policy source changed; inspect the deployed bundle before patching.');
  }
  return source.replace(pattern, (line, indent) => line + '\n' + indent + "!(log.action === 'production' && log.subAction === 'create') &&");
}
