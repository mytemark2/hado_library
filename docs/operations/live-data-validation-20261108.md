# Live data acceptance correction — 2026-11-08

## Basis and root cause

Base: feature/app-3.2.0.0, 11aff86a65fb35010dea76a4eb1adc1e9529563a (Update07 r227). Today's saved crawl 2026-11-08T08-12-26-162Z stopped at equipment-search regression 99/181. 黄焔柳緑披風 legitimately gained UR-only 堪撃癒術 (20% healing), while the regression demanded an old exact nine-name result set. Original raw article 453622, stage/search JSON and semantic diagnostics agree. Acquisition and schema were not the failure. Earlier version/count fixes did not remove all live ability/name anchors: this was an incomplete validation-boundary fix.

## Implementation and impact review

- Owned source-shape fixtures replace live inputs for equipment stage behavior, general commentary/owner-roster exclusion, numeric boundaries, search/performance and individual status-owner matching. These fixtures are artificial test data, not historical or current game claims.
- Live equipment acceptance checks all primary/search/stage records and all three stages against current structured skill text, plus actual runtime stage selection. A new UR equipment/ability, renamed equipment, changed percentage or removed healing ability is not an error by itself. Missing entries/skills, extra cross-stage text and invalid quality audits remain fatal.
- Full current source-roster/status-reference equality replaces dated 練兵 owners and three-name 会心耐性 assumptions. Variant cache isolation remains independently tested with owned inputs. Update07 comparison uses owned troop fixtures while retaining full current troop-classification parity. Retained-record gates use article identity rather than mutable labels; count floors are unchanged.
- `validation_data_access.js` preloads every Node test in full validation. Unclassified tests default to fixture-only and cannot read live root JSON synchronously, asynchronously or through require. Its explicit reviewed-contract list is an inventory of current-data readers, not permission to pin mutable names/abilities. No test is skipped. New live readers require assertion review before registration.
- Other reviewed live readers cover schema/source evidence, historical reviewed Clause gold, current owner/condition/score/tag relationships, manual preserved status records, manifest/provenance and loss floors. Owned historical gold (including 499 commander history) stays immutable and distinct from current acceptance. Python data validators retain current primary/index coverage. This guard governs Node tests, not arbitrary application code.
- Crawler Update19 separately removes its 双鉄戟/回復 representative acceptance gate and requires all equipment/three-stage coverage. Diagnostic representative keys remain compatible.

No runtime JS/CSS/HTML, visible app version, JSON schema, manual master or historical gold is changed by this source PR. HTML size change: 0 bytes; externalization not applicable. Data publication is a separate fixed-bundle Preview operation, never Production. Today's saved collected artifacts will be replayed without browser extraction.

## Checks and completion evidence

横断確認追補（基準2242bc76、PR #420後）: 兵科技能検索の5名称/30%/70%の現行固定も、全収集effectのname/description/troop/grant/search/detail/copy一致へ置換した。所有fixtureで追加・改名・効果変更の正例、欠落・古い効果の負例を検証する。全技能のplaceholderがなくなる正当更新も拒否しない（固定placeholder例の検査は継続）。モバイル候補の掃討1名称固定を全現行tagキーの一致へ変更した。取得・runtime・schema・gold・manifestを変更せず、全体185検査と統合/GitHub検査の結果は追補PRへ記録する。

Run `python -X utf8 tools/run_app_validation.py`, focused fixture/boundary/live-contract tests, and `python -X utf8 tools/check_pr_merge_readiness.py --base feature/app-3.2.0.0`. Full new-data validation, GitHub checks, Preview source/hash/UI results and resulting commits are recorded on the PR after execution; this document does not claim those pending operations succeeded.

## 確認事項

ローカル旧基準: `python -X utf8 tools/run_app_validation.py` は185/185合格。新しい境界テストは同期/require/非同期の未分類live読込を拒否し、fixture回帰の正常動作を確認。全装備3段階契約は本日保存生成先にも合格(268装備)。装備追加/改名/能力変更/回復削除を許容し、技能欠落/段階混入/段階欠落/索引欠落を拒否する正負例も合格。

追加判断不要。公開版データは未承認のため変更しない。取得元の技能一覧が空の場合は701件と元取得日を保持し、全件最新とは表示しない。
