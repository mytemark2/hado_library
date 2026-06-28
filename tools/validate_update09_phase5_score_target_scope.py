#!/usr/bin/env python3
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
score = (ROOT / 'hado_type_score.js').read_text(encoding='utf-8')
formation = (ROOT / 'hado_formation.js').read_text(encoding='utf-8')
required = [
    'METRIC_MATCH_SPECS',
    'targetScope',
    'effectKind',
    'includeAliases',
    'excludeAliases',
    'requiresTarget',
    'displayBucket',
    "ally_non_damage_effect:{targetScope:'ally',requiresTarget:true",
    "self_disadvantage_countermeasure:{targetScope:'self',requiresTarget:true",
    "ally_wounded_recovery:{targetScope:'ally',requiresTarget:true",
    "enemy_attack_debuff:{targetScope:'enemy',requiresTarget:true",
    "function inferTargetScope(text)",
    "function inferTargetScopeForMetric(text,required='any')",
    "function targetMatches(actual,required)",
    "const FIREPOWER_ALIASES=",
    "const INTELLIGENCE_ALIASES=",
    "intelligenceException",
    "dedupeBreakdownRows",
    "dedupePolicy:'single-score-per-evidence-row'",
    "weakening_nullify:{targetScope:'self',requiresTarget:true",
    "deprecatedInto:'self_disadvantage_countermeasure'",
]
missing = [s for s in required if s not in score]
if missing:
    raise SystemExit('target-scope score validator missing required score snippets: ' + ', '.join(missing))
for forbidden in ["'攻撃速度','戦法速度','戦法ゲージ','会心発生','会心威力','連鎖確率','連鎖率','通常攻撃対象数','通常攻撃対象部隊数','射程'"]:
    if "ally_non_damage_effect:['味方非ダメージ効果'" in score and forbidden in score.split("ally_non_damage_effect:['味方非ダメージ効果'",1)[1].split(']',1)[0]:
        raise SystemExit('ally_non_damage_effect still contains broad firepower aliases: ' + forbidden)
formation_required = [
    'targetScopeLabel',
    'effectKindLabel',
    'displayBucket',
    'targetScopeResult',
    "target_scope_matched_item_count",
]
missing = [s for s in formation_required if s not in formation]
if missing:
    raise SystemExit('target-scope score validator missing formation detail snippets: ' + ', '.join(missing))

meta = (ROOT / 'hado_update_meta.js').read_text(encoding='utf-8')
for forbidden in [
    'patchVaccine',
    'formation-vaccine-effect-keyword-match',
    'positiveSupport',
    'PREDICATES=',
    '__vaccineMatch',
    '__u09321',
    'window.calculateFormationAutoScores=',
    'calculateFormationAutoScores=wrapped',
    'renderFormationComposeBarHtml=function',
    'renderFormationListHtml=function',
    "document.createElement('style')",
]:
    if forbidden in meta:
        raise SystemExit('hado_update_meta.js must stay metadata-only; forbidden legacy runtime override remains: ' + forbidden)
if 'HADO_APP_VERSION_META' not in meta or 'loadMeta' not in meta or 'syncVisibleVersion' not in meta:
    raise SystemExit('hado_update_meta.js must keep only version metadata synchronization behavior')
if 'formation-vaccine-effect-keyword-match' in score:
    raise SystemExit('legacy vaccine keyword score policy must not remain in score source')
if 'calculateFormationAutoScores(f,{})' in formation:
    raise SystemExit('formation list rendering must not call calculateFormationAutoScores with empty data')

run = (ROOT / 'tools' / 'run_app_validation.py').read_text(encoding='utf-8')
if 'tools/validate_update09_phase5_score_target_scope.py' not in run:
    raise SystemExit('run_app_validation.py must include validate_update09_phase5_score_target_scope.py')
print('Update09 Phase5 score targetScope validation passed')
