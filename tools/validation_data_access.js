'use strict';
// Preload for validation: fixture-only regressions must not depend on live JSON.
const fs = require('fs');
const path = require('path');
const {fileURLToPath} = require('url');
const root = path.resolve(__dirname, '..');
const script = path.basename(process.argv[1] || '');
const contracts = new Set([
  'test_web_json_cache_policy.js',
  // These consumers combine owned behavior inputs with app-maintained score catalogs.
  'test_update09_5_29_disadvantage_display_labels.js', 'test_update09_5_30_candidate_score_display_hierarchy.js',
  'test_update09_5_34_score_evidence_dedup.js', 'test_update09_5_39_score_evidence_parameter_tactic_labels.js',
  'test_update09_5_40_tactic_evidence_normalization.js', 'test_update09_5_41_real_support_huangzhong_tactic_exclusion.js',
  'test_update09_phase5_candidate_to_formation_score_evidence.js', 'test_update09_phase5_formation_score_evidence_bridge.js',
  'test_update09_phase5_runtime_catalog_consistency.js', 'test_update09_phase5_score_target_scope.js',
  'test_update09_phase5_type_score_catalogs.js', 'test_update09_phase5_zero_primary_type_score_diagnostics.js',
  'test_3_1_0_0_status_effect_trend_order.js', 'test_3_1_0_0_entity_identity_isolation.js',
  'test_3_1_0_0_update04_detail_condition_presenter.js', 'test_3_1_0_0_skill_level_toggle.js',
  'test_3_1_0_0_tag_search_exhaustive.js', 'test_3_1_0_0_update06_search_clause_integration.js',
  'test_3_1_0_0_update06_referenced_skill_cards.js', 'test_3_1_0_0_update05_formation_evaluator.js',
  'test_3_1_0_0_update06_ui_copy_reduction.js', 'test_3_1_0_0_update06_user_facing_cards.js',
  'test_3_1_0_0_update07_score_shadow.js', 'test_3_1_0_0_update08_surface_unification.js',
  'test_3_1_0_0_update09_full_regression.js', 'test_3_1_2_0_detail_link_boundaries.js',
  'test_3_1_2_0_troop_skill_search.js', 'test_3_2_0_0_update01_audit.js',
  'test_3_2_0_0_update02_troop_cross_search.js', 'test_current_data_audit.js',
  'test_3_2_0_0_update07_formation_compare.js',
  'test_equipment_stage_live_contract.js', 'test_data_update_metadata.js',
  'test_formation_type_score_render.js', 'test_3_2_0_0_update03_data_update.js',
  'test_3_2_0_0_update05_detail_hierarchy.js', 'test_3_2_0_0_update06_formation_share.js',
  'test_json_index_contract.js', 'test_release_3_0_2_0_mobile_tag_candidates.js',
  'test_type_candidate_counts.js', 'test_release_3_0_2_0_status_effect_tags.js',
  'test_restored_data_order.js', 'test_update01_condition_census.js',
  'test_update09_5_55_attendant_candidate_gate.js', 'test_update10_1_tab_clarity.js',
  'test_update11_1_skill_owner_tags.js', 'test_update11_tag_organization.js'
]);
function isLive(file) {
  if (file instanceof URL) file = fileURLToPath(file);
  if (typeof file !== 'string' && !Buffer.isBuffer(file)) return false;
  const resolved = path.resolve(String(file));
  return path.dirname(resolved).toLowerCase() === root.toLowerCase() && /^hadou_.*\.json$/i.test(path.basename(resolved));
}
function check(file) {
  if (isLive(file) && !contracts.has(script)) throw new Error(`[validation-data-boundary] ${script || '<unclassified>'} is fixture-only; live JSON requires a reviewed relational contract: ${path.basename(String(file))}`);
}
for (const method of ['readFileSync', 'readFile']) {
  const original = fs[method];
  fs[method] = function(file, ...args) { check(file); return original.call(this, file, ...args); };
}
const asyncRead = fs.promises.readFile;
fs.promises.readFile = async function(file, ...args) { check(file); return asyncRead.call(this, file, ...args); };
process.on('exit', () => {
  for (const file of Object.keys(require.cache)) {
    if (isLive(file) && !contracts.has(script)) { console.error(`[validation-data-boundary] unclassified live JSON module: ${script}`); process.exitCode = 1; }
  }
});
module.exports = {isLive};
