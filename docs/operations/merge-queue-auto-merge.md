# Merge queue setup

This repository keeps only the minimum code-side workflow needed for GitHub merge queue validation.
Repository administrators must still configure GitHub repository settings; those settings cannot be committed as normal source files.

## Code-side automation now present

### App Validation

- Workflow: `.github/workflows/app-validation.yml`
- Workflow name: `App Validation`
- Required job name: `app-validation`
- Triggers: `pull_request`, `merge_group`

This is the required status check used by branch protection and merge queue.

## Removed auto-merge workflow

The repository no longer keeps `.github/workflows/auto-merge-codex-pr.yml`.
The workflow added extra permission-sensitive checks around repository auto-merge settings and repeatedly failed without improving application validation or preview deployment safety.
Auto-merge can be enabled manually through GitHub's normal pull request UI or repository settings when needed.

## Required repository settings

A repository administrator should configure the application repository (`mytemark2/hado_library`) as follows.

1. Open **Settings → Rules → Rulesets** or **Settings → Branches → Branch protection rules**.
2. Add or edit the rule for the default development branch, currently `feature/app-3.0.0.0`.
3. Enable **Require a pull request before merging**.
4. Enable **Require status checks to pass**.
5. Add required status check: `app-validation` from workflow `App Validation`.
6. Enable **Require merge queue** if the repository should serialize merges through GitHub's queue.
7. Keep the queue merge method aligned with the repository's normal merge strategy.

## Normal operation after setup

1. Open a pull request against `feature/app-3.0.0.0`.
2. `App Validation / app-validation` runs on the pull request.
3. If merge queue is required, GitHub creates a merge-group ref and runs `App Validation` again via the `merge_group` trigger.
4. If validation passes and there is no real textual conflict, GitHub merges according to the repository's merge queue settings.

## What this does not and cannot automate

GitHub does not provide a safe setting to ignore real merge conflicts. If two branches edit the same lines incompatibly, the pull request branch must still be corrected.
Do not use blanket `ours` or `theirs` conflict resolution for source files in this repository.

## Troubleshooting

If merge queue does not start:

1. Confirm **Require merge queue** is enabled for the base branch rule.
2. Confirm `App Validation` contains the `merge_group` trigger.
3. Confirm the pull request has passed the normal required checks before GitHub queues it.
4. Confirm branch protection/rulesets require `App Validation / app-validation` or the repository's current required check name.
