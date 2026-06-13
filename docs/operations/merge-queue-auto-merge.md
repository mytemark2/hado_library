# Merge queue + Auto-merge setup

This repository uses code-side workflows to reduce manual conflict/update checks for internal pull requests.
Repository administrators must still enable the GitHub repository settings below; settings cannot be committed as normal source files.

## Code-side automation now present

### App Validation

- Workflow: `.github/workflows/app-validation.yml`
- Workflow name: `App Validation`
- Required job name: `app-validation`
- Triggers: `pull_request`, `merge_group`

This is the required status check used by branch protection and merge queue.

### Internal PR auto-merge

- Workflow: `.github/workflows/auto-merge-codex-pr.yml`
- Workflow name: `Auto-merge Internal PR`
- Trigger: `pull_request_target`
- Scope: non-draft pull requests whose head repository is the same repository as the base repository.
- Security rule: this workflow does **not** check out pull request code. It only calls the GitHub GraphQL `enablePullRequestAutoMerge` mutation.

With repository auto-merge enabled, same-repository PRs can be marked for auto-merge automatically after they are opened or updated. GitHub will then wait for required checks and merge queue validation instead of requiring the author to repeatedly press a conflict/update button.

## Required repository settings

A repository administrator should configure the application repository (`mytemark2/hado_library`) as follows.

1. Open **Settings → General → Pull Requests**.
2. Enable **Allow auto-merge**.
3. Open **Settings → Rules → Rulesets** or **Settings → Branches → Branch protection rules**.
4. Add or edit the rule for the default development branch, currently `feature/app-3.0.0.0`.
5. Enable **Require a pull request before merging**.
6. Enable **Require status checks to pass**.
7. Add required status check: `app-validation` from workflow `App Validation`.
8. Enable **Require merge queue** if the repository should serialize merges through GitHub's queue.
9. Keep the queue merge method aligned with the repository's normal merge strategy.

## Normal operation after setup

1. Open a non-draft pull request from a branch in `mytemark2/hado_library`.
2. `Auto-merge Internal PR` enables auto-merge automatically.
3. `App Validation / app-validation` runs on the pull request.
4. If merge queue is required, GitHub creates a merge-group ref and runs `App Validation` again via the `merge_group` trigger.
5. If validation passes and there is no real textual conflict, GitHub merges automatically.

## What this does not and cannot automate

GitHub does not provide a safe setting to ignore real merge conflicts. If two branches edit the same lines incompatibly, the pull request branch must still be corrected.
Do not use blanket `ours` or `theirs` conflict resolution for source files in this repository.

The automation removes the routine manual step of enabling auto-merge/checking whether the PR can be merged. It does not hide actual conflicts or failed required checks.

## Troubleshooting

If auto-merge is not enabled automatically:

1. Confirm **Allow auto-merge** is enabled in repository settings.
2. Confirm branch protection/rulesets require at least one check, such as `App Validation / app-validation`.
3. Confirm the pull request is not a draft.
4. Confirm the pull request branch is in the same repository, not a fork.
5. Open the `Auto-merge Internal PR` workflow log and check the warning emitted by the GitHub GraphQL mutation.

If merge queue does not start:

1. Confirm **Require merge queue** is enabled for the base branch rule.
2. Confirm `App Validation` contains the `merge_group` trigger.
3. Confirm the pull request has passed the normal required checks before GitHub queues it.
