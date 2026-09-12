/*
  H-nugget 건강 계산기 공통 엔진 v4
  ------------------------------------------------
  [단일 도구] 티스토리 글(HTML 모드)에 넣는 방법 — 아래 3줄만 붙여넣으면 됨:

  <div id="hn-calc" data-tool="bmi"></div>
  <script src="https://cdn.jsdelivr.net/gh/geenie7773-arch/H-nugget-tools@main/calc-engine.js?v=4"></script>
  <script>HNuggetCalc.init({ container: 'hn-calc', tool: 'bmi' });</script>

  [탭형 다중 도구] 하나의 카드 안에서 탭으로 여러 계산기를 전환:

  <div id="hn-calc"></div>
  <script src="https://cdn.jsdelivr.net/gh/geenie7773-arch/H-nugget-tools@main/calc-engine.js?v=4"></script>
  <script>HNuggetCalc.init({ container: 'hn-calc', tools: ['bmi', 'bmr', 'tdee'] });</script>

  tool(단수, 문자열) / tools(복수, 배열) 중 하나만 넘기면 됨.
    data-tool / init tool 값: 'bmi' | 'bmr' | 'tdee' | 'standardWeight' | 'protein'

  ⚠️ v4부터는 <link rel="stylesheet"> 태그를 본문에 넣지 않는다.
  티스토리 에디터가 저장(완료) 시 <link> 태그를 자동으로 제거하는 것이
  실제 발행 페이지에서 확인되어(2026-09), 엔진이 로드되자마자 스스로
  document.head에 stylesheet <link>를 주입하도록 바꿨다. 그래서 embed
  스니펫에서 <link> 줄이 완전히 빠짐 — 이 방식이 유일하게 검증된 방법.

  새 계산기를 추가할 때는 아래 TOOLS 객체에 항목만 하나 더 추가하면 됨.
  (입력폼/버튼/결과카드/설명 아코디언/출처 표시는 전부 공통 렌더러가 처리)

  v2 변경사항: select(드롭다운) 필드 타입 추가, calculate()가 goals 배열을
  반환하면 결과 카드 아래에 3분할 목표 카드(감량/유지/증량 등)를 렌더링함.
  v3 변경사항: tools(배열)로 init하면 상단에 탭 버튼이 자동 생성되고,
  탭을 누르면 해당 도구의 입력폼/결과카드가 같은 자리에 다시 렌더링됨.
  v4 변경사항: calc-style.css를 <link> 태그 대신 엔진이 JS로 직접
  document.head에 주입함(티스토리 저장 시 <link> 태그 소실 문제 회피).
  기존 단일 tool 방식과 bmi 도구 동작은 그대로 유지됨(하위 호환).
*/
(function () {
  'use strict';

  // ---- 스타일시트 자동 주입 (v4) -----------------------------------------
  // 티스토리 에디터가 본문 저장 시 <link> 태그를 제거하는 문제를 피하기 위해
  // <link>를 본문에 넣지 않고, 엔진이 실행되자마자 스스로 head에 주입한다.
  if (!document.getElementById('hn-calc-style-v4')) {
    var linkEl = document.createElement('link');
    linkEl.id = 'hn-calc-style-v4';
    linkEl.rel = 'stylesheet';
    linkEl.href = 'https://cdn.jsdelivr.net/gh/geenie7773-arch/H-nugget-tools@main/calc-style.css?v=4';
    document.head.appendChild(linkEl);
  }

  var TOOLS = {};

  // ---- 1. BMI 계산기 --------------------------------------------------
  TOOLS.bmi = {
    title: 'BMI 계산기',
    tabLabel: 'BMI',
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
    related: [] // 다른 계산기가 발행되면 { label: '기초대사량 계산기', url: '...' } 형태로 여기에 추가
  };

  // ---- 2. 기초대사량(BMR) 계산기 --------------------------------------
  TOOLS.bmr = {
    title: '기초대사량(BMR) 계산기',
    tabLabel: 'BMR',
    fields: [
      { id: 'sex', label: '성별', type: 'select', default: 'm', options: [
        { value: 'm', label: '남성' },
        { value: 'f', label: '여성' }
      ] },
      { id: 'age', label: '나이 (세)', placeholder: '30', min: 15, max: 100 },
      { id: 'height', label: '키 (cm)', placeholder: '170', min: 100, max: 250 },
      { id: 'weight', label: '몸무게 (kg)', placeholder: '65', min: 20, max: 300 }
    ],
    calculate: function (v) {
      var bmr = 10 * v.weight + 6.25 * v.height - 5 * v.age + (v.sex === 'm' ? 5 : -161);
      var val = Math.round(bmr);
      return {
        resultLabel: '기초대사량(BMR)',
        resultValue: val.toLocaleString('ko-KR') + ' kcal',
        category: '숨만 쉬어도 쓰는 최소 에너지',
        color: '#0f6e5c'
      };
    },
    note: 'Mifflin-St Jeor(1990) 공식 기준 · 남성 10×체중+6.25×키-5×나이+5, 여성은 마지막에 -161. 국내 별도 공식 기준치는 없으며 국제적으로 널리 쓰이는 추정 공식입니다.',
    source: 'Mifflin MD et al., Mifflin-St Jeor 공식(1990) · 기준일 2026-09',
        explain: '기초대사량(BMR)은 하루 종일 누워만 있어도 생명 유지를 위해 최소한으로 소모되는 에너지입니다. 실제 활동량까지 반영한 하루 필요 칼로리가 궁금하다면 "하루 필요 칼로리(TDEE) 계산기"를 함께 확인해보세요.',
    related: [] // { label: '하루 필요 칼로리(TDEE) 계산기', url: '...' } 발행 후 추가
  };

  // ---- 3. 하루 필요 칼로리(TDEE) 계산기 --------------------------------
  TOOLS.tdee = {
    title: '하루 필요 칼로리(TDEE) 계산기',
    tabLabel: 'TDEE',
    fields: [
      { id: 'sex', label: '성별', type: 'select', default: 'm', options: [
        { value: 'm', label: '남성' },
        { value: 'f', label: '여성' }
      ] },
      { id: 'age', label: '나이 (세)', placeholder: '30', min: 15, max: 100 },
      { id: 'height', label: '키 (cm)', placeholder: '170', min: 100, max: 250 },
      { id: 'weight', label: '몸무게 (kg)', placeholder: '65', min: 20, max: 300 },
      { id: 'activity', label: '활동량', type: 'select', default: '1.55', options: [
        { value: '1.2', label: '거의 운동 안 함 (좌식 생활)' },
        { value: '1.375', label: '가벼운 운동 (주 1~3일)' },
        { value: '1.55', label: '보통 운동 (주 3~5일)' },
        { value: '1.725', label: '활발한 운동 (주 6~7일)' },
        { value: '1.9', label: '매우 활발함 (매일 강도 높은 운동·육체노동)' }
      ] }
    ],
    calculate: function (v) {
      var act = parseFloat(v.activity);
      var bmr = 10 * v.weight + 6.25 * v.height - 5 * v.age + (v.sex === 'm' ? 5 : -161);
      var tdee = bmr * act;
      var val = Math.round(tdee);
      return {
        resultLabel: '하루 유지 칼로리(TDEE)',
        resultValue: val.toLocaleString('ko-KR') + ' kcal',
        category: '기초대사량 ' + Math.round(bmr).toLocaleString('ko-KR') + 'kcal × ' + act,
        color: '#c9702f',
        goals: [
          { label: '감량 목표', value: Math.round(tdee * 0.8).toLocaleString('ko-KR') + ' kcal' },
          { label: '유지', value: val.toLocaleString('ko-KR') + ' kcal', current: true },
          { label: '증량 목표', value: Math.round(tdee * 1.15).toLocaleString('ko-KR') + ' kcal' }
        ]
      };
    },
    note: '기초대사량(Mifflin-St Jeor 공식) × 활동계수로 계산합니다. 감량 목표는 유지 칼로리의 80%, 증량 목표는 115% 수준을 참고치로 제시한 것이며, 개인의 대사·체성분·건강 상태에 따라 실제 필요량은 달라질 수 있습니다.',
    source: 'Mifflin-St Jeor 공식(1990) + 활동계수 · 기준일 2026-09',
    explain: '하루 필요 칼로리(TDEE)는 기초대사량에 실제 활동량을 곱해 하루 동안 실제로 소모하는 총 에너지를 추정한 값입니다. 체중을 유지하려면 이 칼로리만큼, 감량하려면 이보다 적게, 증량하려면 이보다 많이 섭취하는 것이 일반적인 방향입니다.',
    related: [] // { label: '기초대사량(BMR) 계산기', url: '...' } 발행 후 추가
  };

  // ---- 4. 적정체중(표준체중) 계산기 ------------------------------------
  TOOLS.standardWeight = {
    title: '적정체중(표준체중) 계산기',
    tabLabel: '표준체중',
    fields: [
      { id: 'sex', label: '성별', type: 'select', default: 'm', options: [
        { value: 'm', label: '남성' },
        { value: 'f', label: '여성' }
      ] },
      { id: 'height', label: '키 (cm)', placeholder: '170', min: 100, max: 250 }
    ],
    calculate: function (v) {
      var h = v.height / 100;
      var coef = v.sex === 'm' ? 22 : 21;
      var std = h * h * coef;
      var val = Math.round(std * 10) / 10;
      var rangeLow = Math.round(h * h * 18.5 * 10) / 10;
      var rangeHigh = Math.round(h * h * 22.9 * 10) / 10;
      return {
        resultLabel: '표준체중',
        resultValue: val.toLocaleString('ko-KR') + ' kg',
        category: 'BMI 정상범위(18.5~22.9) 환산 시 ' + rangeLow.toLocaleString('ko-KR') + '~' + rangeHigh.toLocaleString('ko-KR') + 'kg',
        color: '#2f7d6b'
      };
    },
    note: '대한당뇨병학회 등에서 제시하는 표준체중 계산법(성별 계수 적용) 기준입니다 · 남성 키(m)²×22, 여성 키(m)²×21. 표준체중 산식은 기관·자료마다 계수가 달라질 수 있어(Broca 변형식 등) 절대적인 목표 체중이 아니라 참고 기준치로 활용하는 것이 좋습니다.',
    source: '대한당뇨병학회 · 기준일 2026-09',
    explain: '표준체중은 키를 기준으로 계산한 참고 체중입니다. 이 계산기는 대한당뇨병학회 등에서 제시하는 성별 계수(남성 22, 여성 21)를 사용합니다. 다만 표준체중이 반드시 도달해야 할 목표 체중을 의미하지는 않습니다. 근육량·체지방률·건강 상태에 따라 실제로 건강한 체중 범위는 사람마다 다를 수 있어, 함께 표시되는 BMI 정상범위(18.5~22.9) 환산 체중 구간도 참고하는 것이 좋습니다.',
    related: [] // { label: 'BMI 계산기', url: '...' } 등 필요 시 추가
  };

     // ---- 5. 단백질 섭취량 계산기 ------------------------------------------
    TOOLS.protein = {
          title: '단백질 섭취량 계산기',
          tabLabel: '단백질',
          fields: [
            { id: 'weight', label: '몸무게 (kg)', placeholder: '65', min: 20, max: 300 },
            { id: 'activity', label: '활동 수준', type: 'select', default: '0.91', options: [
              { value: '0.91', label: '평소 운동을 거의 하지 않음' },
              { value: '1.3', label: '주 2~3회 가벼운 운동' },
              { value: '1.6', label: '주 4회 이상 근력운동' },
              { value: '2.0', label: '근육량 증가가 목표(고강도 웨이트)' }
                    ] }
                ],
          calculate: function (v) {
                  var coef = parseFloat(v.activity);
                  var val = Math.round(v.weight * coef);
                  return {
                            resultLabel: '하루 권장 단백질 섭취량',
                            resultValue: val.toLocaleString('ko-KR') + ' g',
                            color: '#7c4dae',
                            category: '체중 ' + v.weight + 'kg × ' + coef + 'g/kg 기준',
                            goals: [
                              { label: '일반 성인(0.91g/kg)', value: Math.round(v.weight * 0.91).toLocaleString('ko-KR') + ' g' },
                              { label: '선택 조건', value: val.toLocaleString('ko-KR') + ' g', current: true },
                              { label: '근육증가 목표(2.0g/kg)', value: Math.round(v.weight * 2.0).toLocaleString('ko-KR') + ' g' }
                                      ]
                  };
          },
          note: '2020 한국인 영양소 섭취기준(KDRIs) 성인 단백질 권장섭취량은 체중 1kg당 약 0.91g입니다. 규칙적으로 운동하거나 근육량 증가가 목표라면 체중 1kg당 1.2~2.0g까지 권장하는 자료도 있어, 하나의 숫자보다는 활동 수준에 따른 범위로 참고하는 것이 좋습니다.',
          source: '보건복지부·한국영양학회, 2020 한국인 영양소 섭취기준(KDRIs) · 기준일 2026-09',
          explain: '단백질 필요량은 목적에 따라 달라집니다. 특별한 운동 없이 건강 유지가 목적이라면 2020 한국인 영양소 섭취기준의 권장섭취량인 체중 1kg당 약 0.91g이 기준이 되고, 규칙적으로 근력운동을 하거나 근육량을 늘리는 것이 목표라면 체중 1kg당 1.2~2.0g까지 섭취를 권장하는 자료도 있습니다. 신장질환 등으로 단백질 섭취를 제한해야 하는 경우는 이 계산기의 기준을 그대로 적용하지 말고 의료진과 상담하는 것이 좋습니다.',
          related: [] // { label: '하루 필요 칼로리(TDEE) 계산기', url: '...' } 등 필요 시 추가
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
  function renderToolBody(root, key) {
    var tool = TOOLS[key];
    if (!tool) { root.innerHTML = '<p>준비 중인 도구입니다.</p>'; return; }

    var fieldsHtml = tool.fields.map(function (f) {
      if (f.type === 'select') {
        var optsHtml = f.options.map(function (o) {
          var sel = (f.default !== undefined && o.value === f.default) ? ' selected' : '';
          return '<option value="' + o.value + '"' + sel + '>' + o.label + '</option>';
        }).join('');
        return (
          '<div class="hn-field">' +
            '<label for="hn-' + f.id + '">' + f.label + '</label>' +
            '<select id="hn-' + f.id + '">' + optsHtml + '</select>' +
          '</div>'
        );
      }
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
          '<div class="hn-goals" id="hn-goals" hidden></div>' +
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
        var el = root.querySelector('#hn-' + f.id);
        if (f.type === 'select') {
          values[f.id] = el.value;
          return;
        }
        var v = num(el.value);
        if (isNaN(v) || v < f.min || v > f.max) ok = false;
        values[f.id] = v;
      });

      var resultBox = root.querySelector('#hn-result');
      var goalsBox = root.querySelector('#hn-goals');
      resultBox.hidden = false;

      if (!ok) {
        root.querySelector('#hn-result-label').textContent = '';
        root.querySelector('#hn-result-value').textContent = '';
        goalsBox.hidden = true;
        goalsBox.innerHTML = '';
        var numericFields = tool.fields.filter(function (f) { return f.type !== 'select'; });
        root.querySelector('#hn-result-category').textContent =
          '값을 확인해주세요 (' + numericFields.map(function (f) {
            return f.label + ' ' + f.min + '~' + f.max;
          }).join(', ') + ')';
        return;
      }

      var r = tool.calculate(values);
      root.querySelector('#hn-result-label').textContent = r.resultLabel;
      root.querySelector('#hn-result-value').textContent = r.resultValue;
      root.querySelector('#hn-result-value').style.color = r.color || '#2f5fa8';
      root.querySelector('#hn-result-category').textContent = r.category || '';

      if (r.goals && r.goals.length) {
        goalsBox.hidden = false;
        goalsBox.innerHTML = r.goals.map(function (g) {
          return '<div class="hn-goal' + (g.current ? ' hn-goal-cur' : '') + '">' +
            '<div class="hn-goal-label">' + g.label + '</div>' +
            '<div class="hn-goal-value">' + g.value + '</div>' +
          '</div>';
        }).join('');
      } else {
        goalsBox.hidden = true;
        goalsBox.innerHTML = '';
      }
    });

    var toggleBtn = root.querySelector('#hn-toggle-btn');
    toggleBtn.addEventListener('click', function () {
      var box = root.querySelector('#hn-explain');
      box.hidden = !box.hidden;
      toggleBtn.textContent = box.hidden ? '계산 방법 더 보기 ▾' : '접기 ▴';
    });
  }

  // ---- 탭형 다중 도구 렌더러 (v3) ---------------------------------------
  function renderTabs(root, keys, active) {
    var tabsHtml = keys.map(function (k) {
      var t = TOOLS[k];
      var label = t ? (t.tabLabel || t.title) : k;
      var activeCls = (k === active) ? ' hn-tab-active' : '';
      return '<button type="button" class="hn-tab' + activeCls + '" data-tool="' + k + '">' + label + '</button>';
    }).join('');

    root.innerHTML =
      '<div class="hn-tabs" id="hn-tabs">' + tabsHtml + '</div>' +
      '<div id="hn-tab-content"></div>';

    var contentEl = root.querySelector('#hn-tab-content');
    renderToolBody(contentEl, active);

    var tabBtns = root.querySelectorAll('.hn-tab');
    for (var i = 0; i < tabBtns.length; i++) {
      tabBtns[i].addEventListener('click', function (e) {
        var key = e.currentTarget.getAttribute('data-tool');
        for (var j = 0; j < tabBtns.length; j++) { tabBtns[j].classList.remove('hn-tab-active'); }
        e.currentTarget.classList.add('hn-tab-active');
        renderToolBody(contentEl, key);
      });
    }
  }

// ---- 6. 다이어트 칼로리 계산기 ------------------------------------------
      TOOLS.dietCalorie = {
        title: '다이어트 칼로리 계산기',
        tabLabel: '다이어트 칼로리',
        fields: [
          { id: 'sex', label: '성별', type: 'select', default: 'm', options: [
            { value: 'm', label: '남성' },
            { value: 'f', label: '여성' }
                  ] },
          { id: 'age', label: '나이 (세)', placeholder: '30', min: 15, max: 100 },
          { id: 'height', label: '키 (cm)', placeholder: '170', min: 100, max: 250 },
          { id: 'weight', label: '몸무게 (kg)', placeholder: '65', min: 20, max: 300 },
          { id: 'activity', label: '활동량', type: 'select', default: '1.55', options: [
            { value: '1.2', label: '거의 운동 안 함 (좌식 생활)' },
            { value: '1.375', label: '가벼운 운동 (주 1~3일)' },
            { value: '1.55', label: '보통 운동 (주 3~5일)' },
            { value: '1.725', label: '활발한 운동 (주 6~7일)' },
            { value: '1.9', label: '매우 활발함 (매일 강도 높은 운동·육체노동)' }
                  ] },
          { id: 'goalRate', label: '목표 감량 속도', type: 'select', default: '0.5', options: [
            { value: '0.25', label: '천천히 (주 0.25kg)' },
            { value: '0.5', label: '보통 (주 0.5kg, 가장 일반적인 권장치)' },
            { value: '0.75', label: '빠르게 (주 0.75kg)' },
            { value: '1.0', label: '최대 권장치 (주 1kg)' }
                  ] }
              ],
        calculate: function (v) {
                var act = parseFloat(v.activity);
                var bmr = 10 * v.weight + 6.25 * v.height - 5 * v.age + (v.sex === 'm' ? 5 : -161);
                var tdee = bmr * act;
                var rate = parseFloat(v.goalRate);
                var deficit = Math.round(rate * 1000);
                var rawTarget = Math.round(tdee - deficit);
                var floor = v.sex === 'm' ? 1500 : 1200;
                var unsafe = rawTarget < floor;
                var target = unsafe ? floor : rawTarget;
                return {
                          resultLabel: '하루 목표 섭취 칼로리',
                          resultValue: target.toLocaleString('ko-KR') + ' kcal',
                          category: unsafe
                            ? '계산상 필요한 칼로리(' + rawTarget.toLocaleString('ko-KR') + 'kcal)가 최소 권장 섭취량보다 낮아 최소 섭취량으로 표시했습니다. 감량 속도를 낮추는 것이 안전합니다'
                                      : '유지 칼로리 ' + Math.round(tdee).toLocaleString('ko-KR') + 'kcal에서 하루 ' + deficit.toLocaleString('ko-KR') + 'kcal 줄인 값',
                          color: unsafe ? '#d1452b' : '#2f7d6b',
                          goals: [
                            { label: '현재 유지 칼로리(TDEE)', value: Math.round(tdee).toLocaleString('ko-KR') + ' kcal' },
                            { label: '하루 감량분', value: '-' + deficit.toLocaleString('ko-KR') + ' kcal' },
                            { label: '목표 섭취 칼로리', value: target.toLocaleString('ko-KR') + ' kcal', current: true }
                                    ]
                };
        },
        note: '체지방 1kg 감량에는 약 7,000~7,700kcal의 누적 칼로리 부족이 필요하다는 것이 통상적인 추정치입니다(질병관리청 국가건강정보포털은 하루 500kcal 감량 시 주 0.5kg 감량 예시를 제시 — 7,000kcal/kg 기준). 성인 최소 권장 섭취량(남성 약 1,500kcal, 여성 약 1,200kcal) 미만으로는 내려가지 않는 것이 좋습니다.',
        source: '질병관리청 국가건강정보포털 · 대한비만학회 비만 진료지침 · Mifflin-St Jeor 공식(1990) · 기준일 2026-09',
        explain: '다이어트 칼로리 계산기는 하루 유지 칼로리(TDEE)에서 목표로 하는 주당 감량 속도만큼 칼로리를 줄인 목표 섭취량을 보여줍니다. 체지방 1kg을 줄이려면 약 7,000~7,700kcal의 누적 칼로리 부족이 필요하다고 보는 것이 일반적이며, 이를 7일로 나누어 하루 감량분을 계산합니다. 질병관리청은 6개월 동안 현재 체중의 5~10퍼센트 감량을 현실적인 목표로 제시하고, 미국 질병통제예방센터(CDC)는 주 1kg 감량을 안전한 다이어트의 상한선으로 봅니다. 이보다 빠른 감량은 근손실과 요요 위험을 높일 수 있어 권장하지 않습니다.',
        related: [] // { label: '목표체중 달성기간 계산기', url: '...' } 발행 후 추가
  };
  window.HNuggetCalc = {
    TOOLS: TOOLS,
    init: function (opts) {
      var root = document.getElementById(opts.container);
      if (!root) return;
      if (opts.tools && opts.tools.length) {
        renderTabs(root, opts.tools, opts.active || opts.tools[0]);
      } else {
        renderToolBody(root, opts.tool);
      }
    }
      
  
  };
})();
