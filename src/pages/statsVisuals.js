// Presentation only: consume the existing statistical projections and samples.
import { periodRows } from '../services/statsLogic.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = value => value == null ? '확인 불가' : typeof value === 'number' ? value.toLocaleString('ko-KR', { maximumFractionDigits: 3 }) : String(value);
const idOf = row => row.itemId || (row.key ? JSON.parse(row.key)[0] : row.rows?.[0]?.itemId);
const scopeOf = row => JSON.stringify([row.stage, row.unit]);
const day = date => Date.parse(date + 'T00:00:00Z') / 86400000;
const dateAt = value => new Date(value * 86400000).toISOString().slice(0, 10);
const sum = rows => rows.reduce((n, row) => n + row.qty, 0);
const stages = ['생식 완성', '동결 생산', '동결 포장', '샘플세트 조립', '원료', '봉투', '계란', '영양제', '계산상 사용량', '재고 순차감', '봉투 순차감', '계란 출고', '영양제 순차감'];
export function visualChoices(view, selection, tab) {
  const scopes = [...new Map(view.groups.map(g => [scopeOf(g), { id: scopeOf(g), label: g.stage + ' · ' + g.unit }])).values()]
    .sort((a, b) => stages.indexOf(JSON.parse(a.id)[0]) - stages.indexOf(JSON.parse(b.id)[0]));
  if (!scopes.some(s => s.id === selection.scope)) { selection.scope = scopes[0]?.id || ''; selection.item = ''; }
  const groups = view.groups.filter(g => !selection.scope || scopeOf(g) === selection.scope);
  const items = groups.map(g => ({ id: idOf(g), label: g.name, group: g }));
  const counts = new Map();
  for (const item of items) counts.set(item.label, (counts.get(item.label) || 0) + 1);
  items.forEach((item, i) => {
    if (item.id.includes('unlinked:')) item.label += ' · ID 미연결 [' + (i + 1) + ']';
    else if (counts.get(item.label) > 1) item.label += ' [' + (i + 1) + ']';
  });
  if (selection.item && !items.some(i => i.id === selection.item)) selection.item = '';
  // Start supply/usage on one identifiable item, so intervals and means have a clear denominator.
  if (((!selection.initialized && tab !== 'production') || (tab === 'usage' && !selection.item)) && items.length) {
    selection.item = [...items].sort((a, b) => Number(a.id.includes('unlinked:')) - Number(b.id.includes('unlinked:'))
      || Number(b.group.events.length > 0) - Number(a.group.events.length > 0) || (b.group.total ?? -Infinity) - (a.group.total ?? -Infinity))[0].id;
  }
  selection.initialized = true;
  return { scopes, items };
}

const registrationId = id => {
  const [collection, ...rest] = id.split(':');
  return ({ meatLogs: 'meat', bagLogs: 'bag', eggLogs: 'egg', supplementLogs: 'supplement' }[collection] || collection) + ':' + rest.join(':');
};
export function visualFilter(selection, matches) {
  return row => {
    if (!matches(row)) return false;
    const id = idOf(row);
    // Unconfirmed records have no reliable stage/item identity. Keep them visible as exceptions.
    if (!row.unit) {
      if (!id) return true;
      const targetStage = selection.scope ? JSON.parse(selection.scope)[0] : '';
      if (targetStage && row.stage && (row.stage === 'supplement' ? '영양제' : row.stage) !== targetStage) return false;
      return !selection.item || id === registrationId(selection.item);
    }
    return (!selection.scope || scopeOf(row) === selection.scope) && (!selection.item || id === selection.item);
  };
}

const metric = (label, value, unit, note) => '<div class="stats-v-metric"><div class="stats-v-label">' + esc(label) +
  '</div><div class="stats-v-value">' + esc(fmt(value)) + '<span>' + esc(unit) + '</span></div><div class="stats-v-note">' + esc(note) + '</div></div>';
const panel = (title, note, content) => '<section class="stats-v-panel"><h3>' + esc(title) + '</h3><p class="stats-v-note">' + esc(note) + '</p>' + content + '</section>';
const canvas = (id, label) => '<div class="stats-v-canvas"><canvas id="' + id + '" role="img" aria-label="' + esc(label) + '"></canvas></div>';
const empty = text => '<p class="stats-v-empty">' + esc(text) + '</p>';
const select = (key, label, options, value) => '<label>' + esc(label) + '<select data-visual-select="' + key + '" aria-label="' + esc(label) + '">' +
  options.map(o => '<option value="' + esc(o.id) + '"' + (o.id === value ? ' selected' : '') + '>' + esc(o.label) + '</option>').join('') + '</select></label>';
function ranks(groups, unit, selected, labelOf) {
  const sorted = [...groups].sort((a, b) => b.total - a.total);
  const max = Math.max(0, ...sorted.map(g => g.total));
  return '<div class="stats-v-ranking">' + sorted.slice(0, 20).map(g => '<button class="stats-v-rank" data-visual-item="' + esc(idOf(g)) +
    '" aria-pressed="' + (idOf(g) === selected) + '"><span>' + esc(labelOf(g)) + '</span><strong>' + esc(fmt(g.total)) + ' ' + esc(unit) +
    '</strong><span class="stats-v-track"><span style="width:' + (max ? Math.max(0, g.total) / max * 100 : 0) +
    '%"></span></span></button>').join('') + '</div>' +
    (sorted.length > 20 ? '<p class="stats-v-note">상위 20항목 / ' + sorted.length + '항목 · 다른 항목은 품목 선택에서 조회</p>' : '');
}
function registrationRanges(groups) {
  if (!groups.length) return empty('선택 품목의 기간 내 완료된 입고예정 기록 없음');
  return groups.map(g => '<div class="stats-v-registration"><strong>' + esc(g.name) + '</strong>' +
    [['사전 등록일수', g.prior], ['완료처리 소요일수', g.processing]].map(([label, sample]) => {
      const max = Math.max(1, sample.max ?? 0);
      return '<div class="stats-v-range"><div><span>' + label + '</span><strong>평균 ' + esc(fmt(sample.mean)) + '일</strong></div>' +
        (sample.count ? '<div class="stats-v-range-track" role="img" aria-label="' + esc(label + ' 최소 ' + sample.min + '일, 평균 ' + sample.mean + '일, 최대 ' + sample.max + '일') +
          '"><span style="left:' + sample.min / max * 90 + '%;width:' + (sample.max - sample.min) / max * 90 +
          '%"></span><i style="left:' + sample.mean / max * 90 + '%"></i></div>' : '') +
        '<p class="stats-v-note">최소 ' + esc(fmt(sample.min)) + '일 · 최대 ' + esc(fmt(sample.max)) + '일 · 유효 표본 ' + sample.count + '건</p></div>';
    }).join('') + '</div>').join('');
}
function calendar(groups, range, offset, limit, labelOf) {
  const end = Math.max(day(range.startDate), day(range.endDate) - offset * 31), start = Math.max(day(range.startDate), end - 30);
  const dates = Array.from({ length: end - start + 1 }, (_, i) => dateAt(start + i));
  const header = '<div class="stats-v-calendar-controls"><span>' + dateAt(start) + ' ~ ' + dateAt(end) +
    '</span><div><button data-calendar-step="1"' + (start <= day(range.startDate) ? ' disabled' : '') + '>이전 날짜</button>' +
    '<button data-calendar-step="-1"' + (!offset ? ' disabled' : '') + '>다음 날짜</button></div></div>';
  const table = '<div class="stats-table-scroll"><table class="stats-v-calendar"><thead><tr><th scope="col">제품</th>' + dates.map(d =>
    '<th scope="col">' + d.slice(5).replace('-', '/') + '</th>').join('') + '</tr></thead><tbody>' + groups.slice(0, limit).map((g, index) =>
    '<tr><th scope="row">' + esc(labelOf(g)) + '</th>' + dates.map(d => {
      const events = g.events.filter(e => e.date === d), qty = events.length ? sum(events) : null;
      return '<td>' + (events.length ? '<button class="stats-v-day" data-calendar-row="' + index + '" data-calendar-date="' + d +
        '" aria-label="' + esc(labelOf(g) + ' ' + d + ' ' + fmt(qty) + g.unit + ' · ' + events.length + '건') +
        '"><span aria-hidden="true">●</span></button>' : '<span class="stats-v-day-empty" aria-label="확정 기록 없음">·</span>') + '</td>';
    }).join('') + '</tr>').join('') + '</tbody></table></div>';
  return header + table + '<p class="stats-v-note">● 확정 생산 기록 · 빈칸은 생산량 0을 뜻하지 않습니다. 달력은 최대 31일, 통계는 선택 기간 전체 기준입니다.</p>' +
    (groups.length > limit ? '<button class="stats-v-more" data-calendar-more>제품 더 보기 (' + Math.min(limit, groups.length) + '/' + groups.length + ')</button>' : '') +
    '<div id="statsCalendarSelection" class="stats-v-calendar-selection" role="status">생산일을 누르면 수량과 원본 기록을 확인할 수 있습니다.</div>';
}

export function renderStatsVisuals({ host, tab, view, fullView, choices, selection, range, aggregation, calendarOffset, calendarLimit, onSelect, onCalendar, createChart }) {
  if (!host) return;
  const groups = view.groups, events = view.events, group = groups.length === 1 ? groups[0] : null;
  const scopeGroups = fullView.groups.filter(g => scopeOf(g) === selection.scope);
  const labelOf = g => choices.items.find(i => i.id === idOf(g))?.label || g.name;
  const unit = selection.scope ? JSON.parse(selection.scope)[1] : '';
  const stage = selection.scope ? JSON.parse(selection.scope)[0] : '';
  const total = events.length ? sum(events) : null, days = new Set(events.map(e => e.date)).size;
  const options = tab === 'usage' ? choices.items : [{ id: '', label: '전체 품목' }, ...choices.items];
  const controls = '<div class="stats-v-controls">' + select('scope', tab === 'usage' ? '집계 기준 · 단위' : '단계 · 단위', choices.scopes, selection.scope) +
    select('item', tab === 'production' ? '제품 선택' : '품목 선택', options, selection.item) +
    '<p class="stats-v-note">Excel 다운로드: 선택 범위 · 전체 다운로드: 검색 조건의 모든 단계·세 탭</p></div>';
  let metrics, primary, secondary, extra = '';
  if (tab === 'production') {
    metrics = metric('기간 생산량', total, unit, stage) + metric('생산일수', days, '일', '같은 날 여러 기록은 하루') +
      metric('확정 기록', events.length, '건', '마지막 생산 ' + (events.map(e => e.date).sort().at(-1) || '확인 불가'));
    primary = panel('언제 얼마나 만들었나', '생산일 기준 · 기록이 있는 기간만 표시', canvas('statsTrendChart', stage + ' 기간별 생산량 · ' + unit));
    secondary = panel('제품별 생산량', '같은 단계·단위 · 제품을 누르면 선택 범위 변경', ranks(scopeGroups, unit, selection.item, labelOf));
    extra = panel('제품별 생산일', stage + ' · 선택 단계 전체 제품의 생산 주기', calendar(scopeGroups, range, calendarOffset, calendarLimit, labelOf));
  } else if (tab === 'supply') {
    metrics = metric('기간 입고량', total, unit, '외부 입고 ' + events.length + '건') +
      metric('평균 입고 간격', group?.interval.mean, '일', group ? '최소 ' + fmt(group.interval.min) + ' / 최대 ' + fmt(group.interval.max) + '일 · 표본 ' + group.interval.count + '개' : '품목 하나를 선택해주세요') +
      metric('마지막 입고 후', group?.elapsed, '일', group ? '조회 종료일 기준 · 마지막 입고 ' + (group.lastDate || '확인 불가') : '품목 하나를 선택해주세요');
    primary = panel('입고 흐름', '입고 기록일 기준 · 같은 날 수량 합산 · 실제 도착일은 보장되지 않음', group && events.length ?
      canvas('statsTimelineChart', group.name + ' 입고 날짜·수량') +
      '<p class="stats-v-note">입고일 간격: ' + [...new Set(events.map(e => e.date))].sort().slice(1).map((d, i) => {
        const prev = [...new Set(events.map(e => e.date))].sort()[i];
        return prev.slice(5) + ' → ' + d.slice(5) + ': ' + (day(d) - day(prev)) + '일';
      }).join(' · ') + '</p>' : empty(selection.item ? '조회기간 내 유효한 입고 기록 없음' : '품목 하나를 선택하면 입고 흐름과 간격을 표시합니다.'));
    secondary = panel('입고예정은 얼마나 미리 등록했나', '최종 예정일 기준 · 실제 발주·배송 기간과 다름', registrationRanges(view.registrationGroups));
    extra = panel('기간별 입고량', '외부 입고만 집계 · 정정 수량 반영', canvas('statsTrendChart', '기간별 입고량 · ' + unit));
  } else {
    const calculated = stage === '계산상 사용량';
    metrics = metric('기간 합계', total, unit, stage) +
      metric('달력 일평균', group?.calendarMean, unit + '/일', '조회기간 전체 ' + (day(range.endDate) - day(range.startDate) + 1) + '일 기준' + (!group ? ' · 품목 하나 선택' : '')) +
      metric(calculated ? '생산일 평균' : '변동일 평균', group?.workingMean, unit + '/일', group ? '기록이 있는 ' + group.interval.days + '일 기준' : '품목 하나를 선택해주세요');
    primary = panel(calculated ? '언제 얼마나 사용했나' : '차감과 복원이 어떻게 기록됐나', stage + ' · ' + (calculated ? '생산일' : '재고 변동일') + ' 기준',
      canvas('statsTrendChart', stage + ' 기간별 수량 · ' + unit));
    secondary = calculated ? panel('어떤 제품에 사용됐나', '선택 원료의 제품별 계산상 사용량', !selection.item ? empty('원료 하나를 선택하면 제품별 사용량을 표시합니다.') :
      '<div class="stats-v-products">' + view.productGroups.map(g => '<div><span>' + esc(g.stage) + '</span><strong>' + esc(fmt(g.total)) + ' ' + esc(g.unit) +
        '</strong><span class="stats-v-track"><span style="width:' + (Math.max(0, g.total) / Math.max(1, ...view.productGroups.map(p => p.total)) * 100) +
        '%"></span></span></div>').join('') + '</div>') :
      panel('부호를 반영한 순차감', '차감·출고는 양수 · 복원은 음수', '<dl class="stats-v-signed"><div><dt>차감·출고 합계</dt><dd>' +
        esc(fmt(events.length ? sum(events.filter(e => e.qty >= 0)) : null)) + ' ' + esc(unit) + '</dd></div><div><dt>복원 반영</dt><dd>' +
        esc(fmt(events.length ? sum(events.filter(e => e.qty < 0)) : null)) + ' ' + esc(unit) + '</dd></div></dl><p class="stats-v-note">계산상 사용량과 합산하거나 차이율로 해석하지 않습니다.</p>');
  }
  host.innerHTML = controls + '<div class="stats-v-metrics">' + metrics + '</div><div class="stats-v-columns">' + primary + secondary + '</div>' + extra;
  host.querySelectorAll('[data-visual-select]').forEach(node => node.addEventListener('change', () => onSelect(node.dataset.visualSelect, node.value)));
  host.querySelectorAll('[data-visual-item]').forEach(node => node.addEventListener('click', () => onSelect('item', node.dataset.visualItem)));
  host.querySelectorAll('[data-calendar-step]').forEach(node => node.addEventListener('click', () => onCalendar('step', Number(node.dataset.calendarStep))));
  host.querySelector('[data-calendar-more]')?.addEventListener('click', () => onCalendar('more'));
  host.querySelectorAll('[data-calendar-date]').forEach(node => node.addEventListener('click', () => {
    const g = scopeGroups[Number(node.dataset.calendarRow)], date = node.dataset.calendarDate;
    const rows = g.events.filter(e => e.date === date);
    host.querySelector('#statsCalendarSelection').innerHTML = '<strong>' + esc(labelOf(g) + ' · ' + date + ' · ' + fmt(sum(rows)) + ' ' + g.unit) +
      '</strong><div>' + rows.map(e => esc(fmt(e.qty) + ' ' + e.unit + ' · ' + e.source)).join('<br>') + '</div>';
  }));
  const trend = host.querySelector('#statsTrendChart');
  if (trend && events.length) {
    const periods = new Map();
    for (const row of periodRows(events, aggregation)) periods.set(row.period, (periods.get(row.period) ?? 0) + row.qty);
    const rows = [...periods].sort(([a], [b]) => a.localeCompare(b));
    createChart(trend, { type: 'bar', data: { labels: rows.map(([d]) => d), datasets: [{
      label: stage + ' (' + unit + ')', data: rows.map(([, qty]) => qty), backgroundColor: rows.map(([, qty]) => qty < 0 ? '#AD7137' : '#4A7C59'), borderWidth: 0,
    }] }, options: { responsive: true, maintainAspectRatio: false, animation: false,
      scales: { x: { title: { display: true, text: aggregation === 'weekly' ? '주 시작일 (월요일)' : aggregation === 'monthly' ? '기록월' : '기록일' }, ticks: { maxTicksLimit: 8 } },
        y: { beginAtZero: true, title: { display: true, text: unit } } }, plugins: { legend: { display: false } } } });
  } else if (trend) trend.parentElement.innerHTML = empty('집계 가능한 기록 없음 · 수량을 0으로 대체하지 않습니다.');
  const timeline = host.querySelector('#statsTimelineChart');
  if (timeline) {
    const rows = periodRows(events, 'daily');
    const labels = {
      id: 'incomingTimelineLabels',
      afterDatasetsDraw(chart) {
        if (rows.length > 6) return; // Dense histories remain available through tooltips and full evidence.
        const { ctx, chartArea } = chart, points = chart.getDatasetMeta(0).data;
        ctx.save(); ctx.font = '12px sans-serif'; ctx.fillStyle = '#365440'; ctx.textAlign = 'center';
        points.forEach((point, i) => {
          const label = rows[i].period.slice(5) + ' · ' + fmt(rows[i].qty) + unit;
          const half = ctx.measureText(label).width / 2;
          const x = Math.max(chartArea.left + half, Math.min(chartArea.right - half, point.x));
          ctx.fillText(label, x, point.y + (i % 2 ? 28 : -18));
          if (i) ctx.fillText((day(rows[i].period) - day(rows[i - 1].period)) + '일', (points[i - 1].x + point.x) / 2, point.y - 54);
        });
        ctx.restore();
      },
    };
    createChart(timeline, { type: 'scatter', data: { datasets: [{ label: '입고량 (' + unit + ')', showLine: true,
      data: rows.map(r => ({ x: day(r.period), y: 0, qty: r.qty, date: r.period })), backgroundColor: '#4A7C59', borderColor: '#4A7C59', pointRadius: 5, borderWidth: 1,
    }] }, plugins: [labels], options: { responsive: true, maintainAspectRatio: false, animation: false, layout: { padding: { left: 20, right: 20 } },
      scales: { x: { type: 'linear', title: { display: true, text: '입고 기록일' }, ticks: { maxTicksLimit: 5, callback: value => dateAt(value).slice(5) } },
        y: { display: false, min: -1, max: 1 } },
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ctx.raw.date + ' · ' + fmt(ctx.raw.qty) + ' ' + unit } } } } });
  }
}

export function compactSection(tab, original) {
  const indices = tab === 'production' ? [0, 1, 2, 3, 5, 6, 10] : tab === 'supply' ? [0, 2, 3, 5, 7, 11, 12] : [0, 1, 2, 3, 4, 5];
  return { ...original, headers: indices.map(i => original.headers[i]), rows: original.rows.map(row => indices.map(i => row[i])) };
}
