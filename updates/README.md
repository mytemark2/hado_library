# Update operation

Normal updates are applied by editing completed source files directly in the development branch workspace and committing all related files together.

Preview synchronization is triggered automatically by push to any non-`main` work branch through `.github/workflows/notify-preview.yml`.

## Retired queue path

The `updates/queue/*.json` search-and-replace instruction path is retired and must not be recreated.

Do not add JSON replacement queues, `old` / `new` / `expectedCount` replacement instructions, disposable apply scripts or workflows, or GitHub Actions that mutate application source files through ad hoc string replacement.

Legacy receipts under `updates/applied/` are retained only as historical records of past operations and are not part of the active update path.
