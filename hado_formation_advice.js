/* Read-only ranking for the browser formation tools. Battle-dependent effects remain separate. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.HadoFormationAdvice = api;
})(typeof window === 'undefined' ? null : window, function () {
  'use strict';

  const patterns = {
    siege_damage: /兵器(?:による|の)?(?:与ダメージ|攻撃ダメージ)|兵器の攻撃に加算|兵器のダメージ.{0,12}(?:上昇|増加)/,
    siege_speed: /兵器速度|兵器の(?:攻撃間隔|待ち時間)/,
    siege_survival: /兵器(?:が受けるダメージ|の耐久|が故障|は故障)/,
    opening: /戦法ゲージ|戦法速度/,
    chain: /連鎖確率|連鎖率/,
    troop_damage: /(?:通常攻撃|戦法|物理系統|知力系統).*?(?:与ダメージ|攻撃威力)|戦法威力/,
    object_damage: /対物(?:体攻撃|特効)/,
    hit_cap: /(?:ダメージの上限が|被ダメージ上限を)\s*[\d,]+/,
    power_ceiling: /(?:基礎威力|攻撃威力)を\s*\d+%に固定/,
    mitigation: /被ダメージ.*?(?:[-−]\s*\d|軽減)|ダメージを(?:軽減|カット)/,
    recovery: /負傷兵.*?回復|兵力.*?回復|治癒を付与/,
    weakening_protection: /弱化(?:効果)?(?:を|が)?.*?(?:無効|避ける|回避|解除|打ち消す)|弱化無効|弱化解除/,
    buff_protection: /強化(?:効果)?(?:解除|消滅|を消滅).*?(?:無効|避ける|防ぐ)|偽城を付与/,
    disruption: /敵.*?(?:不利変化|弱化)|(?:鎖禁|断道|幻惑|同討|封縛|戦法弱化|分断)を付与/,
    support: /(?:自身を含む)?味方\s*\d*\s*部隊.*?(?:上昇|付与|回復|解除|打ち消す)/,
    mobility: /部隊の(?:機動|射程)|機動上昇/
  };
  const metrics = Object.freeze(Object.keys(patterns));
  const presets = Object.freeze({
    siege: ['siege_damage', 'siege_speed', 'object_damage', 'siege_survival', 'opening'],
    defense: ['hit_cap', 'weakening_protection', 'power_ceiling', 'mitigation', 'recovery', 'buff_protection'],
    assault: ['opening', 'chain', 'troop_damage', 'disruption', 'mobility'],
    support: ['support', 'opening', 'chain', 'weakening_protection', 'recovery']
  });
  const tacticSlots = new Set(['main', 'deputy1', 'deputy2']);
  const clone = value => JSON.parse(JSON.stringify(value));
  const canonical = value => String(value || '').normalize('NFKC').trim();
  const scalar = {
    siege_damage: /兵器(?:による|の)?与ダメージ\s*\+\s*(\d+(?:\.\d+)?)%/,
    siege_speed: /兵器速度\s*\+\s*(\d+(?:\.\d+)?)%/,
    siege_survival: /兵器が受けるダメージ\s*[-−]\s*(\d+(?:\.\d+)?)%/,
    opening: /戦法(?:速度|ゲージ)\s*\+\s*(\d+(?:\.\d+)?)%/,
    chain: /連鎖確率\s*\+\s*(\d+(?:\.\d+)?)%/,
    object_damage: /対物(?:体攻撃|特効)\s*\+\s*(\d+(?:\.\d+)?)%/
  };

  function classify(text) {
    const value = canonical(text);
    return metrics.filter(metric => {
      if (['troop_damage', 'opening', 'chain', 'object_damage'].includes(metric) &&
          /(?:戦法威力|戦法速度|戦法ゲージ|連鎖確率|対物特効).{0,5}(?:低下|減少|[-−]\d)/.test(value)) return false;
      // An effect that protects a weapon must not count as reducing the unit's incoming damage.
      if (metric === 'mitigation' && patterns.siege_survival.test(value)) return false;
      if (metric === 'troop_damage' && patterns.power_ceiling.test(value)) return false;
      return patterns[metric].test(value);
    });
  }

  function rankInputs(input) {
    const purpose = input.purpose ?? 'assault';
    if (!Object.hasOwn(presets, purpose)) throw new Error('unknown purpose');
    const priorities = input.priorities ?? presets[purpose];
    if (!Array.isArray(priorities) || !priorities.length || priorities.length > metrics.length ||
        priorities.some(key => !metrics.includes(key)) || new Set(priorities).size !== priorities.length) {
      throw new Error('invalid priorities');
    }
    const target = input.target ?? (purpose === 'siege' ? 'wall' : 'unit');
    if (!['unit', 'wall', 'citadel'].includes(target)) throw new Error('unknown target');
    const limit = input.limit ?? 3;
    const seconds = input.seconds ?? 30;
    if (!Number.isInteger(limit) || limit < 1 || limit > 5 ||
        !Number.isInteger(seconds) || seconds < 1 || seconds > 180) throw new Error('invalid search bounds');
    return {...input, purpose, priorities, limit, target, seconds};
  }

  function targetApplies(metric, row, target) {
    const value = canonical(row.rawText);
    if (target !== 'unit' && ['hit_cap', 'power_ceiling', 'mitigation', 'weakening_protection', 'buff_protection', 'siege_survival'].includes(metric)) return true;
    if (target !== 'unit' && /対部隊限定|敵部隊に対してのみ/.test(value)) return false;
    if (target === 'unit' && metric === 'object_damage') return false;
    if (target === 'unit' && /外壁に対して|物体に対して/.test(value)) return false;
    if (target === 'wall' && /牙城に対して/.test(value)) return false;
    return !(target === 'citadel' && /外壁に対して/.test(value));
  }

  function summarize(rows, target = 'unit') {
    const result = Object.fromEntries(metrics.map(metric => [metric, {confirmed:0, conditional:0, unknown:0, cap:null, strongestConfirmedPercent:null}]));
    const seen = new Set();
    for (const row of rows) {
      for (const metric of row.metrics) {
        if (!targetApplies(metric, row, target) || !['confirmed','conditional','unknown'].includes(row.state)) continue;
        const key = [metric, row.source, row.slot, row.skill, row.rawText].join('\0');
        if (seen.has(key)) continue;
        seen.add(key);
        result[metric][row.state]++;
        if (metric === 'hit_cap' && row.state === 'confirmed') {
          const match = canonical(row.rawText).match(/(?:ダメージの上限が|被ダメージ上限を)\s*([\d,]+)/);
          const cap = Number(match?.[1]?.replaceAll(',', ''));
          if (cap > 0) result[metric].cap = Math.min(result[metric].cap ?? Infinity, cap);
        }
        if (row.state === 'confirmed' && scalar[metric]) {
          const percent = Number(canonical(row.rawText).match(scalar[metric])?.[1]);
          if (Number.isFinite(percent)) result[metric].strongestConfirmedPercent = Math.max(result[metric].strongestConfirmedPercent ?? 0, percent);
        }
      }
    }
    return result;
  }

  function compareMetrics(a, b, priorities) {
    // Confirmed effect coverage is a search heuristic. Magnitudes/stacking need game evidence.
    for (const key of priorities) {
      const x = a[key], y = b[key];
      if (key === 'hit_cap' && x.cap !== y.cap) return (x.cap ?? Infinity) - (y.cap ?? Infinity);
      if (x.strongestConfirmedPercent !== null && y.strongestConfirmedPercent !== null &&
          x.strongestConfirmedPercent !== y.strongestConfirmedPercent) return y.strongestConfirmedPercent-x.strongestConfirmedPercent;
      if (x.confirmed !== y.confirmed) return y.confirmed - x.confirmed;
    }
    for (const key of priorities) {
      if (a[key].conditional !== b[key].conditional) return b[key].conditional - a[key].conditional;
    }
    return 0;
  }

  function assignments(formation) {
    const result = {};
    for (const [slot, value] of Object.entries(formation.slots || {})) {
      result[slot + '.general'] = value.general || '';
      result[slot + '.attendant'] = value.attendant || '';
      result[slot + '.attendantPosition'] = value.attendantPosition || '';
      for (const [equipment, name] of Object.entries(value.equipments || {})) result[slot + '.' + equipment] = name || '';
    }
    for (const [key, name] of Object.entries(formation.advisorSlots || {})) result['advisor.' + key] = name || '';
    result.formation = formation.formationName || '';
    result.deployment = formation.deploymentType || '';
    result.siege = formation.siegeWeapon?.name ? [formation.siegeWeapon.name, formation.siegeWeapon.level].join(' Lv') : '';
    result.armament = formation.ethnicArmament?.name ? [formation.ethnicArmament.name, formation.ethnicArmament.level, formation.ethnicArmament.ethnicGeneralName].filter(Boolean).join(' / ') : '';
    return result;
  }

  function diff(left, right) {
    const a = assignments(left), b = assignments(right);
    return [...new Set([...Object.keys(a), ...Object.keys(b)])]
      .filter(key => (a[key] || '') !== (b[key] || ''))
      .map(field => ({field, before:a[field] || '', after:b[field] || ''}));
  }

  function compareDetails(a, b, priorities) {
    return priorities.map(key => ({metric:key, before:a[key], after:b[key]}));
  }

  // Grow the best few formations at each slot. Validation and whole-team ranking use the
  // same detached records as explicit evaluations, so the shortlist never skips legality.
  function search({seeds, moves, inspect, options}) {
    const visited = new Set();
    const results = [];
    let examined = 0;
    const max = 1200;
    function score(formation) {
      const id = JSON.stringify(assignments(formation));
      if (examined >= max || visited.has(id)) return null;
      visited.add(id);
      examined++;
      const result = inspect(formation);
      return result ? {id, formation, ...result} : null;
    }
    const compare = (a,b) => compareMetrics(a.metrics,b.metrics,options.priorities) ||
      b.filled - a.filled || a.changes - b.changes || a.id.localeCompare(b.id,'ja');
    const start = seeds.map(score).filter(Boolean);
    results.push(...start);
    let beam = start.sort(compare).slice(0, 5);
    for (const move of moves) {
      const next = beam.slice();
      for (const entry of beam) {
        for (const value of move.values) {
          const candidate = clone(entry.formation);
          move.apply(candidate, value);
          const scored = score(candidate);
          if (scored) {
            next.push(scored);
            results.push(scored);
          }
        }
      }
      // Keep one best full result with each main in the beam before filling duplicate mains.
      next.sort(compare);
      const mainKeys = new Set();
      const diverse = next.filter(item => {
        const main = item.formation.slots.main.general;
        if (mainKeys.has(main)) return false;
        mainKeys.add(main);
        return true;
      }).slice(0, 3);
      beam = [...diverse, ...next.filter(item => !diverse.includes(item))].slice(0, 5);
    }
    return {examined, bound:max, candidates:results.filter(row => row.complete).sort(compare).slice(0, options.limit)};
  }

  return Object.freeze({metrics, presets, tacticSlots, canonical, classify, rankInputs, summarize, compareMetrics,
    assignments, diff, compareDetails, search});
});
