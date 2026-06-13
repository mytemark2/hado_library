# AGENTS.md — hado_library

## 1. Repository purpose

This repository contains the local HTML application **「覇道ライブラリ」** for 三國志 覇道.
Treat the GitHub development branch as the source of truth. A feature or bug fix is not complete until the source changes, validation, preview deployment verification, and development records are all complete.

This file defines repository-wide instructions for Codex. Per-update requirements belong in the task prompt and the repository's update documents.

## 2. Scope

This `AGENTS.md` applies to the entire `mytemark2/hado_library` repository.

Related repositories:
- Application repository: `mytemark2/hado_library`
- Crawler repository: `mytemark2/hado_library-crawler`
- Preview repository: `mytemark2/hado_library-preview`

Default development branch at the time this file was created:
- Application: `feature/app-3.0.0.0`

Do not assume that this branch remains current forever. Before editing, confirm the target branch from the user's task, the latest Roadmap, and the current repository state. Do not silently switch to `main`.

## 3. Source-of-truth rules

Before modifying files:

1. Confirm the target repository and target branch.
2. Fetch or inspect the latest branch state and record the current HEAD commit.
3. Identify the current application entry point, relevant JavaScript, CSS, JSON, workflows, Roadmap, implementation record, and completion report.
4. Confirm the SHA-256 of files when an update record, distribution package, or verification procedure requires it.
5. Use the latest checked-out branch state as the only modification base.

Do not select a modification base from:
- memory,
- an old chat artifact,
- a stale local file,
- a generated preview artifact,
- `main` merely because it is easier to access,
- or an older file with a similar name.

If the repository state, branch, or authoritative source is ambiguous, inspect the repository documents first. If ambiguity remains, report it explicitly before making a destructive change.

## 4. Required modification method

Use a fresh working tree or Codex Cloud workspace based on the target development branch.

For normal updates:

1. Inspect all related files before editing.
2. Modify the actual source files directly in the working tree.
3. Keep related changes together as one coherent change set.
4. Validate locally in the workspace.
5. Deliver the completed related changes together in one pull request.
6. Avoid incremental remote pushes whose only purpose is to transmit one file at a time.
7. Prefer one coherent commit for one Update when the tooling allows it.

If a single coherent commit cannot be produced because of an unavoidable platform constraint, explain the constraint and use a standard Git branch and pull-request workflow. Do not introduce a custom patch transport mechanism.

## 5. Prohibited approaches

Do **not** implement or use any of the following:

- `updates/queue/*.json` or equivalent files that store search-and-replace instructions. Do not recreate an `updates/queue/` directory; remove it if it reappears.
- Replacement queues containing fields such as `old`, `new`, or `expectedCount`.
- GitHub Actions that mutate application source files through ad hoc string replacement.
- Disposable, Update-specific apply workflows.
- Scheduled polling as the normal preview synchronization method.
- A manual workflow dispatch as the normal preview synchronization method.
- File-by-file remote updates for a change that spans multiple related files.
- Repeated user approval requests merely to work around connector or tool limitations.
- A superficial UI-only suppression that leaves the root cause in place.
- Deleting an existing feature merely to make an error disappear.
- Replacing verified current files with older artifacts.

When the standard method is not executable, stop and report:
1. the blocking constraint,
2. the affected operation,
3. the safe alternatives,
4. the recommended next action.

Do not silently build a brittle workaround.

## 6. Application architecture rules

### 6.1 Prevent HTML growth

- Implement new behavior in external JavaScript by default.
- Do not add large JavaScript blocks directly to the HTML file.
- Prefer extending an existing JavaScript module when it has the same responsibility.
- Keep the HTML focused on DOM structure, minimal `<script src>` declarations, and initialization calls.
- When adding or changing external JavaScript, verify load order and dependencies.
- Verify both `file://` local execution and `https://` preview execution when applicable.
- Record changed JavaScript files, HTML size increase or decrease, and the externalization decision in the Update documentation.

### 6.2 Preserve compatibility

Do not break:
- existing UI behavior,
- existing DOM contracts used by scripts,
- JSON compatibility,
- saved-data compatibility,
- Export and Import compatibility,
- search,
- detail display,
- formation features,
- local data loading,
- or preview loading.

When refactoring a shared path, inspect all entry points that use the same behavior. Do not fix only the single path named in the bug report.

## 7. Metadata and version consistency

When a versioned application update is requested, inspect and update all applicable version references together.

Confirm the repository's actual implementation before editing. Applicable items may include:
- Update number,
- screen title,
- `<h1>`,
- `FILE_META`,
- `HADO_BUILD_INFO`,
- `HADO_DEV_INFO.json`,
- version metadata JavaScript,
- Roadmap,
- implementation record,
- completion report.

Do not assume that every item exists. Do not invent missing files. If an expected item does not exist, report that finding.

For every user-visible correction after a numbered Update is marked complete, increment the visible Update suffix together with metadata (for example `Update08` -> `Update08.1`, then `Update08.2`). Update all applicable display/version references in the same commit so preview users can distinguish deployed fixes.
Keep visible runtime version constants centralized only in `hado_version.js`; `hado_update_meta.js` and other JavaScript should read `window.HADO_VERSION`, `window.HADO_APP_DISPLAY_VERSION`, or `window.HADO_APP_VERSION_META` instead of hard-coding the visible Update string. Do not duplicate `releaseVersion`, `updateNo`, `displayVersion`, or `revision` in `HADO_DEV_INFO.json`.

## 8. Bug-fix policy

A bug fix is incomplete unless the following are addressed:

1. **Bug classification**
2. **Root cause**
3. **Impact scope for the same defect class**
4. **Permanent countermeasure**
5. **Implementation change**
6. **Added recurrence-prevention mechanism**
7. **Minimum user acceptance operation**

Do not reduce recurrence prevention to adding a checklist item only. Improve the implementation or development process when the root cause shows a process weakness.

## 9. Required validation

Discover and use the repository's existing scripts and workflows. Do not invent commands that do not exist.

At minimum, perform all applicable checks:

### 9.1 Static validation
- JavaScript syntax
- JSON syntax
- HTML structural consistency
- referenced asset existence
- script load order and dependency consistency
- version and metadata consistency
- absence of prohibited queue-based source mutation mechanisms

### 9.2 Functional regression
Check the areas affected by the change and the related shared paths. Unless the task is strictly documentation-only, include the applicable core paths:
- application startup
- local data loading
- search
- detail display
- formation features
- saved-data Export and Import
- PC layout
- smartphone layout

When browser automation is unavailable, use the best available non-browser verification and state precisely what still requires user acceptance testing.

### 9.3 Preview synchronization
After pushing the development branch:
1. Confirm that push-triggered, event-driven preview synchronization runs automatically.
2. Confirm the workflow name and run result.
3. Confirm the deployed commit.
4. Confirm the preview URL reflects the intended source.
5. If synchronization fails, inspect the failed step, fix the cause, rerun the validation, and only then report completion.

A setup that requires the user to manually run a workflow for ordinary preview deployment is incomplete.

## 9.4 Merge queue and auto-merge

Keep `.github/workflows/app-validation.yml` compatible with GitHub merge queue by including both `pull_request` and `merge_group` triggers. The required GitHub status check for branch protection should be `App Validation / app-validation`. Repository-level settings such as `Allow auto-merge` and `Require merge queue` must be enabled by a repository administrator; do not replace real conflict resolution with blanket `ours`/`theirs` rules.

## 10. Preview synchronization design

Maintain an event-driven preview synchronization path from the application development branch to the preview repository.

Allowed patterns include:
- `repository_dispatch`,
- reusable workflows,
- or an equivalent push-triggered design.

Do not use scheduled polling as the normal path.
Do not require or expose manual workflow dispatch for normal operation in the application repository preview notification workflow.

## 11. Distribution package rules

When the user requests a distributable HTML and ZIP for a fix or feature addition:

1. Produce the standalone HTML when applicable.
2. Produce the normal ZIP filename and the versioned ZIP filename when required by the project convention.
3. Use the required folder structure.
4. Include all required JSON files.
5. Verify that the standalone HTML and the HTML inside the ZIP have identical SHA-256 values.
6. Extract the ZIP and verify the actual extracted structure.
7. Validate JSON syntax.
8. Validate required record counts when the repository provides expected values.
9. Validate derived JSON consistency when applicable.

Do not declare the package complete before extraction and verification.

## 12. Documentation and records

For each Update, inspect and update the existing repository records. Use the repository's actual paths; do not invent a parallel documentation structure if one already exists.

The records must capture:
- Roadmap status,
- implementation details,
- completion report,
- changed files,
- HTML size increase or decrease,
- externalization decision,
- validation commands,
- validation results,
- workflow result,
- preview result,
- unresolved items.

## 13. Completion criteria

Do not describe an Update as complete while any applicable item remains unresolved:

- source changes not committed or not included in the pull request,
- validation not executed,
- workflow failure,
- preview not synchronized,
- preview commit mismatch,
- title or metadata mismatch,
- remaining prohibited queue-based mutation path,
- incomplete documentation,
- unreported user acceptance step,
- or known residual defect.

## 14. Final report format

At completion, report:

1. **Summary**
2. **Bug classification and root cause** when applicable
3. **Impact scope checked**
4. **Files changed**
5. **HTML size change and externalization decision**
6. **Validation commands executed**
7. **Validation results**
8. **Git commit and pull request**
9. **GitHub Actions result**
10. **Preview synchronization result**
11. **Minimum user acceptance operation**
12. **Remaining issues**, explicitly stating `none` when there are none

## 15. Maintain this file

If repository inspection reveals that a path, command, workflow name, or record location is stable and important, update this `AGENTS.md` or an existing linked repository document in the same pull request.

Keep this file concise and actionable. Put Update-specific requirements in the Update document or task prompt rather than accumulating them here.
