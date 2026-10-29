# Historical source for isolated safety controls

The four `.source.txt` files are the exact pre-seal source captured on 2026-10-27.
They are text fixtures, not executable maintenance tools. Their SHA-256 digests
are pinned in `manifest.json` and checked by the test before loading them. The
checked digest normalizes CRLF to LF so a Git checkout on another OS works;
`originalFiles` separately preserves the captured raw-byte provenance.

Only `legacyMaintenanceSafety.test.mjs` loads this source into its synthetic VM:
credentials, Firebase/Firestore and REST are fake; mutation primitives throw.
Never run these historical programs against a cloud project or restore their
write functions to the current inspection-only scripts.

Keeping these fixtures here makes the default safety test independent of local
`output/` history. Runtime test logs are still written to `output/`.
