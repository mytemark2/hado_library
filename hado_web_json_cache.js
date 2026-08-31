/* Browser-local public JSON cache policy and manifest contract. */
(() => {
  'use strict';

  const CONTRACT_VERSION = 'hado-json-bundle-manifest-v1';
  const MANIFEST_FILE = 'hadou_bundle_manifest.json';
  const UPDATE_CHECK_TIMEOUT_MS = 3000;
  const FILE_TIMEOUT_MS = 8000;
  const FORCE_REFRESH_KEY = 'hado_force_web_json_refresh_v1';
  const REQUIRED_FILE_NAMES = Object.freeze([
    'hadou_generals.json',
    'hadou_skills.json',
    'hadou_equipments.json',
    'hadou_status_effects.json',
    'hadou_siege_weapons.json',
    'hadou_ethnic_armaments.json',
    'hadou_meta.json',
    'hadou_ethnic_research_skills.json',
    'hadou_formations.json',
    'hadou_five_elements.json',
    'hadou_warhorses.json',
    'hadou_warhorse_skills.json',
    'hadou_status_effect_relations.json',
    'hadou_skill_owner_index.json',
    'hadou_search_index.json',
    'hadou_parameter_summary_index.json',
    'hadou_result_card_index.json',
    'hadou_tag_index.json',
    'hadou_status_effect_meta_index.json',
    'hadou_status_effect_group_owner_index.json',
    'hadou_related_link_index.json',
    'hadou_equipment_skill_stage_index.json',
    'hadou_tactic_attack_index.json',
    'hadou_formation_candidate_index.json',
    'hadou_effect_condition_blocks.json',
    'hadou_effect_clauses.json',
    'hadou_type_search_feature_index.json',
    'hadou_type_search_presets.json',
    'hadou_type_search_regression_cases.json'
  ]);
  const OPTIONAL_FILE_NAMES = Object.freeze(['hadou_type_score_rules.json']);
  const SHA256_RE = /^[0-9a-f]{64}$/;

  function normalizeManifest(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('公開JSONマニフェストが不正です');
    if (raw.contractVersion !== CONTRACT_VERSION) throw new Error(`公開JSONマニフェストの契約版が不正です: ${raw.contractVersion || '未設定'}`);
    const bundleId = String(raw.bundleId || '').trim().toLowerCase();
    if (!SHA256_RE.test(bundleId)) throw new Error('公開JSONマニフェストのbundleIdが不正です');
    const files = raw.files;
    if (!files || typeof files !== 'object' || Array.isArray(files)) throw new Error('公開JSONマニフェストのfilesが不正です');
    for (const fileName of REQUIRED_FILE_NAMES) {
      const entry = files[fileName];
      if (!entry || entry.required !== true) throw new Error(`公開JSONマニフェストに必須ファイルがありません: ${fileName}`);
      if (!SHA256_RE.test(String(entry.sha256 || '').toLowerCase()) || !Number.isFinite(Number(entry.size)) || Number(entry.size) <= 0) {
        throw new Error(`公開JSONマニフェストのファイル情報が不正です: ${fileName}`);
      }
    }
    for (const fileName of OPTIONAL_FILE_NAMES) {
      const entry = files[fileName];
      if (!entry) continue;
      if (entry.required !== false || !SHA256_RE.test(String(entry.sha256 || '').toLowerCase()) || !Number.isFinite(Number(entry.size)) || Number(entry.size) <= 0) {
        throw new Error(`公開JSONマニフェストの任意ファイル情報が不正です: ${fileName}`);
      }
    }
    return Object.freeze({ ...raw, bundleId, files });
  }

  function requestForceRefresh() {
    try { sessionStorage.setItem(FORCE_REFRESH_KEY, '1'); } catch {}
  }

  function consumeForceRefresh() {
    try {
      const requested = sessionStorage.getItem(FORCE_REFRESH_KEY) === '1';
      sessionStorage.removeItem(FORCE_REFRESH_KEY);
      return requested;
    } catch {
      return false;
    }
  }

  const api = Object.freeze({
    CONTRACT_VERSION,
    MANIFEST_FILE,
    UPDATE_CHECK_TIMEOUT_MS,
    FILE_TIMEOUT_MS,
    REQUIRED_FILE_NAMES,
    OPTIONAL_FILE_NAMES,
    normalizeManifest,
    requestForceRefresh,
    consumeForceRefresh
  });

  if (typeof window !== 'undefined') window.HadoWebJsonCache = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
