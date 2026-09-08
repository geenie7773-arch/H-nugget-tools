/*
  H-nugget 건강 계산기 공통 엔진 v1
  ------------------------------------------------
  티스토리 글(HTML 모드)에 넣는 방법 — 아래 4줄만 붙여넣으면 됨:

  <div id="hn-calc" data-tool="bmi"></div>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/geenie7773-arch/H-nugget-tools@main/calc-style.css">
  <script src="https://cdn.jsdelivr.net/gh/geenie7773-arch/H-nugget-tools@main/calc-engine.js"></script>
  <script>HNuggetCalc.init({ container: 'hn-calc', tool: 'bmi' });</script>

  새 계산기를 추가할 때는 아래 TOOLS 객체에 항목만 하나 더 추가하면 됨.
  (입력폼/버튼/결과카드/설명 아코디언/출처 표시는 전부 공통 렌더러가 처리)
*/
(function () {
  'use strict';

  var TOOLS = {};

  // ---- 1. BMI 계산기 --------------------------------------------------
  TOOLS.bmi = {
    title: 'BMI 계산기',
    fields: [
      { id: 'height', label: '키 (cm)', placeholder: '170', min: 100, max: 250 },
      { id: 'weight', label: '몸무게 (kg)', placeholder: '65', min: 20, max: 300 }
    ],
    calculate: function (v) {
      var h = v.height / 100;
      var bmi = v.weight / (h * h);
      var val = Math.round(bmi * 10) / 10;
      var category, color;
      if (val < 18.5) { category = '저체중'; color = '#6b8e23'; }
      else if (val < 23) { category = '정상'; color = '#2f5fa8'; }
      else if (val < 25) { category = '비만전단계(과체중)'; color = '#c9702f'; }
      else { category = '비만'; color = '#d1452b'; }
      return { resultLabel: '내 BMI', resultValue: val, category: category, color: color };
    },
    note: '대한비만학회·질병관리청 국가건강정보포털 기준(아시아-태평양 기준) · 18.5 미만 저체중 · 18.5~22.9 정상 · 23~24.9 비만전단계 · 25 이상 비만. 참고용 수치이며, 근육량이 많거나 적은 경우 실제 체지방과 차이가 있을 수 있습니다.',
    source: '대한비만학회 / 질병관리청 국가건강정보포털 · 기준일 2026-09',
    explain: 'BMI(체질량지수)는 키와 몸무게로 비만도를 가늠하는 가장 널리 쓰이는 지표입니다. 계산식은 체중(kg) ÷ 신장(m)²입니다. 다만 근육량, 나이, 골격 구조에 따라 실제 체지방률과 차이가 날 수 있어 하나의 참고 지표로만 활용하는 것이 좋습니다.',
    related: [] // 다른 계산기가 발행되면 { label: '표준체중 계산기', url: '...' } 형태로 여기에 추가
  };

  // ---- 앞으로 추가할 도구는 여기 아래에 TOOLS.xxx = {...} 형태로 이어서 작성 ----

  // ---- 공통 유틸 -------------------------------------------------------
  function num(v) {
    v = (v || '').toString().replace(/[^0-9.]/g, '');
    return v ? parseFloat(v) : NaN;
  }

  function relatedHtml(tool) {
    if (!tool.related || !tool.related.length) return '';
    var links = tool.related.map(function (r) {
      return '<a href="' + r.url + '">' + r.label + '</a>';
    }).join(' · ');
    return '<div class="hn-related"><span>관련 계산기</span> ' + links + '</div>';
  }

  // ---- 렌더러 -----------------------------------------------------------
  function render(root, key) {
    var tool = TOOLS[key];
    if (!tool) { root.innerHTML = '<p>준비 중인 도구입니다.</p>'; return; }

    var fieldsHtml = tool.fields.map(function (f) {
      return (
        '<div class="hn-field">' +
          '<label for="hn-' + f.id + '">' + f.label + '</label>' +
          '<input type="number" inputmode="decimal" id="hn-' + f.id + '" ' +
            'placeholder="' + f.placeholder + '" min="' + f.min + '" max="' + f.max + '">' +
        '</div>'
      );
    }).join('');

    root.innerHTML =
      '<div class="hn-card">' +
        '<div class="hn-fields">' + fieldsHtml + '</div>' +
        '<button type="button" class="hn-btn" id="hn-calc-btn">계산하기</button>' +
        '<div class="hn-result" id="hn-result" hidden>' +
          '<div class="hn-result-label" id="hn-result-label"></div>' +
          '<div class="hn-result-value" id="hn-result-value"></div>' +
          '<div class="hn-result-category" id="hn-result-category"></div>' +
        '</div>' +
        '<div class="hn-note">' + tool.note + '</div>' +
        relatedHtml(tool) +
        '<button type="button" class="hn-toggle" id="hn-toggle-btn">계산 방법 더 보기 ▾</button>' +
        '<div class="hn-explain" id="hn-explain" hidden>' +
          '<p>' + tool.explain + '</p>' +
          '<div class="hn-source">출처: ' + tool.source + '</div>' +
        '</div>' +
      '</div>';

    root.querySelector('#hn-calc-btn').addEventListener('click', function () {
      var values = {};
      var ok = true;
      tool.fields.forEach(function (f) {
        var v = num(root.querySelector('#hn-' + f.id).value);
        if (isNaN(v) || v < f.min || v > f.max) ok = false;
        values[f.id] = v;
      });

      var resultBox = root.querySelector('#hn-result');
      resultBox.hidden = false;

      if (!ok) {
        root.querySelector('#hn-result-label').textContent = '';
        root.querySelector('#hn-result-value').textContent = '';
        root.querySelector('#hn-result-category').textContent =
          '값을 확인해주세요 (' + tool.fields.map(function (f) {
            return f.label + ' ' + f.min + '~' + f.max;
          }).join(', ') + ')';
        return;
      }

      var r = tool.calculate(values);
      root.querySelector('#hn-result-label').textContent = r.resultLabel;
      root.querySelector('#hn-result-value').textContent = r.resultValue;
      root.querySelector('#hn-result-value').style.color = r.color || '#2f5fa8';
      root.querySelector('#hn-result-category').textContent = r.category || '';
    });

    var toggleBtn = root.querySelector('#hn-toggle-btn');
    toggleBtn.addEventListener('click', function () {
      var box = root.querySelector('#hn-explain');
      box.hidden = !box.hidden;
      toggleBtn.textContent = box.hidden ? '계산 방법 더 보기 ▾' : '접기 ▴';
    });
  }

  window.HNuggetCalc = {
    TOOLS: TOOLS,
    init: function (opts) {
      var root = document.getElementById(opts.container);
      if (!root) return;
      render(root, opts.tool);
    }
  };
})();
