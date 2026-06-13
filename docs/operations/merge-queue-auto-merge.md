# Merge queue + Auto-merge setup

This repository uses a code-side `App Validation` workflow for pull requests and GitHub merge queue groups.
Repository administrators must enable the GitHub settings below; they cannot be committed as normal source files.

## Why this is needed

GitHub merge queue removes the normal need for pull request authors to repeatedly update their branch before merge.
GitHub Actions required checks used by merge queue must listen for the `merge_group` event; otherwise the queue waits for a status check that is never reported.

The workflow added for this repository is:

- `.github/workflows/app-validation.yml`
- Workflow name: `App Validation`
- Required job name: `app-validation`
- Triggers: `pull_request`, `merge_group`

## Required repository settings

A repository administrator should configure the application repository (`mytemark2/hado_library`) as follows.

1. Open **Settings → General → Pull Requests**.
2. Enable **Allow auto-merge**.
3. Open **Settings → Rules → Rulesets** or **Settings → Branches → Branch protection rules**.
4. Add or edit the rule for the default development branch, currently `feature/app-3.0.0.0`.
5. Enable **Require a pull request before merging**.
6. Enable **Require status checks to pass**.
7. Add required status check: `app-validation` from workflow `App Validation`.
8. Enable **Require merge queue**.
9. Keep the queue merge method aligned with the repository's normal merge strategy.

## Normal operation after setup

1. Open a pull request.
2. Wait for `App Validation / app-validation` to pass.
3. Enable auto-merge on the pull request, or add the pull request to the merge queue.
4. GitHub creates a merge-group ref and runs `App Validation` again via the `merge_group` trigger.
5. If the merge-group validation passes and there is no real conflict, GitHub merges automatically.

## What this does not automate

Merge queue and auto-merge do not automatically resolve real textual conflicts. If the same source lines are changed incompatibly, the pull request branch must still be corrected.
Do not use blanket `ours` or `theirs` conflict resolution for source files in this repository.

## Manual fallback

If the auto-merge button is not visible:

1. Confirm **Allow auto-merge** is enabled in repository settings.
2. Confirm the base branch has a branch protection/ruleset requirement such as required checks or reviews.
3. Confirm `App Validation / app-validation` is selected as a required check.
4. Confirm the pull request is not a draft.
5. Confirm there is no unresolved merge conflict.

If merge queue does not start:

1. Confirm **Require merge queue** is enabled for the base branch rule.
2. Confirm `App Validation` contains the `merge_group` trigger.
3. Confirm the pull request has passed the normal required checks before adding it to the queue.
