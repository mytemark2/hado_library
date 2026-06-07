# Update Bundle operation
Normal app updates are applied by adding exactly one JSON bundle under `updates/queue/`.
GitHub Actions applies all operations, validates the app, commits the result, removes the queue file, writes a receipt under `updates/applied/`, and dispatches preview synchronization.
Supported operations: `write`, `replace`, `delete`.
Protected paths: `.github/workflows/`, `updates/queue/`, `updates/applied/`.
