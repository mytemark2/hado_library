# Production data promotion: 2026-10-17

## Authorization and fixed source

- User explicitly requested Production publication after Preview confirmation.
- Preview source: `feature/app-3.1.2.0`, commit `dbad5ed909f4a0acb2c5d4e8fcd40db5091e43f1`.
- Production base: `9d8642b77665a94b7b8e166814e15c4dc6b87091`.
- Bundle: `3b8af373d5135d664db9b494e8e6eba8a19b08552103c7884d015b00fc290d1c`.
- Acquisition timestamp: `2026-10-17T01:56:42.204Z` (10:56:42 JST).
- No recrawl or data regeneration. All hadou JSON files copied from the fixed Preview commit.
- Metadata sourceCommit `8239d70ed4d43f2b762858a1c14c21f221c9757b` records the generation baseline, not the later publication merge. Preserve the original metadata and use the fixed Preview commit above for deployment provenance.

## Scope and compatibility

- Generals: 499 (+5); equipment: 266 (+6); skills: 701 (+20); formations: 22 (unchanged).
- Primary, derived, inherited JSON and synchronized bundle manifest are promoted together.
- Runtime, HTML, styles, workflows and formal release version 3.1.2.1 r209 remain unchanged.
- Carry forward the fixed Preview audit artifacts and two regression tests: stable LR Lu Bu article identity and source-based skill owner counts instead of a hard-coded count.
- No application schema change is introduced by this promotion.
- Eight source-derived status names remain unclassified, without inferred polarity: 意気、焔計、火属性威力変化、劇毒、相性変化、即時攻撃、即時戦法、即時兵器行動.

## Verification

- Fixed public Preview: all 30 bundle file hashes verified before promotion.
- `node tools/build_json_bundle_manifest.js --check`: passed.
- `python -X utf8 tools/run_app_validation.py`: passed, all 170 commands.
- Git comparison of all hadou JSON against the fixed Preview commit: no differences.
- Production PR checks, deployment result and public hash verification are recorded in the pull request after deployment.

## Acceptance and rollback

- Confirm the Production data date is 2026-10-17 10:56:42 JST; search for LR李典 and 鋒利典雅剣.
- Production rollback uses a revert of this data promotion, retaining application runtime. No automatic Production promotion path is added.
