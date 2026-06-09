# Update operation

Normal updates are applied by editing completed source files directly and committing all changed files together.

Preview synchronization is triggered automatically by push to `feature/app-3.0.0.0` through `.github/workflows/notify-preview.yml`.

Legacy queue receipts under `updates/applied/` are retained only as historical records and are not part of the active update path.
