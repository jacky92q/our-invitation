/* =============================================================
 *  청첩장 관리자 페이지
 *  Firebase Auth 로 로그인한 뒤, 청첩장에 표시되는 모든 값을
 *  Firestore 에 저장합니다. (저장 위치: config.store)
 * ============================================================= */
(function () {
  'use strict';

  var DEFAULTS = window.INVITATION_CONFIG || {};
  var FIREBASE_VERSION = '10.12.2';
  var LEAFLET = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/';

  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var DATA = null;   // 편집 중인 설정
  var SDK = null;    // { auth, store, db, authInstance }
  var dirty = false;

  /* ---------------------------------------------------------
   * 편집 항목 정의 — 여기에 추가하면 폼이 자동으로 만들어집니다.
   * ------------------------------------------------------- */
  var SCHEMA = [
    {
      id: 'basic', label: '기본 정보',
      groups: [
        {
          title: '공유 정보',
          note: '카카오톡·문자로 링크를 보낼 때 보이는 제목과 설명입니다.',
          fields: [
            { path: 'meta.title', label: '제목', type: 'text' },
            { path: 'meta.description', label: '설명', type: 'text' },
            { path: 'meta.ogImage', label: '썸네일 이미지 주소', type: 'text', help: '1200×630 권장. https:// 로 시작하는 전체 주소가 가장 안전합니다.' }
          ]
        },
        {
          title: '예식 일시',
          fields: [
            { path: 'wedding.date', label: '날짜', type: 'date' },
            { path: 'wedding.time', label: '시간', type: 'time' },
            { path: 'wedding.dateText', label: '표시 문구 (긴 형식)', type: 'text', action: 'fillDate' },
            { path: 'wedding.dateTextShort', label: '표시 문구 (표지용)', type: 'text' }
          ]
        }
      ]
    },
    {
      id: 'intro', label: '표지 · 인사말',
      groups: [
        {
          title: '표지',
          fields: [
            { path: 'cover.image', label: '표지 사진 주소', type: 'text', help: '세로 3:4 비율을 권장합니다.' },
            { path: 'cover.label', label: '상단 영문 문구', type: 'text' },
            { path: 'cover.titleLeft', label: '왼쪽 이름', type: 'text' },
            { path: 'cover.titleRight', label: '오른쪽 이름', type: 'text' }
          ]
        },
        {
          title: '인사말',
          fields: [
            { path: 'greeting.label', label: '영문 라벨', type: 'text' },
            { path: 'greeting.title', label: '제목', type: 'text' },
            { path: 'greeting.poem', label: '앞머리 글귀', type: 'lines' },
            { path: 'greeting.message', label: '인사말', type: 'lines', help: '빈 줄을 넣으면 문단이 나뉩니다.' }
          ]
        }
      ]
    },
    {
      id: 'couple', label: '신랑 · 신부',
      groups: [
        {
          title: '신랑',
          fields: [
            { path: 'couple.groom.name', label: '이름', type: 'text' },
            { path: 'couple.groom.nameEn', label: '영문 이름', type: 'text' },
            { path: 'couple.groom.relation', label: '관계', type: 'text', help: '장남 / 차남 / 아들 …' },
            { path: 'couple.groom.phone', label: '연락처', type: 'tel' },
            { path: 'couple.groom.father.name', label: '아버지 성함', type: 'text' },
            { path: 'couple.groom.father.phone', label: '아버지 연락처', type: 'tel' },
            { path: 'couple.groom.father.late', label: '아버지 (故) 표시', type: 'check' },
            { path: 'couple.groom.mother.name', label: '어머니 성함', type: 'text' },
            { path: 'couple.groom.mother.phone', label: '어머니 연락처', type: 'tel' },
            { path: 'couple.groom.mother.late', label: '어머니 (故) 표시', type: 'check' }
          ]
        },
        {
          title: '신부',
          fields: [
            { path: 'couple.bride.name', label: '이름', type: 'text' },
            { path: 'couple.bride.nameEn', label: '영문 이름', type: 'text' },
            { path: 'couple.bride.relation', label: '관계', type: 'text', help: '장녀 / 차녀 / 딸 …' },
            { path: 'couple.bride.phone', label: '연락처', type: 'tel' },
            { path: 'couple.bride.father.name', label: '아버지 성함', type: 'text' },
            { path: 'couple.bride.father.phone', label: '아버지 연락처', type: 'tel' },
            { path: 'couple.bride.father.late', label: '아버지 (故) 표시', type: 'check' },
            { path: 'couple.bride.mother.name', label: '어머니 성함', type: 'text' },
            { path: 'couple.bride.mother.phone', label: '어머니 연락처', type: 'tel' },
            { path: 'couple.bride.mother.late', label: '어머니 (故) 표시', type: 'check' }
          ]
        }
      ]
    },
    {
      id: 'gallery', label: '갤러리',
      groups: [
        {
          title: '갤러리',
          note: '사진 파일을 assets/images 에 올린 뒤 경로를 적거나, 외부 이미지 주소를 넣어주세요.',
          fields: [
            { path: 'gallery.label', label: '영문 라벨', type: 'text' },
            { path: 'gallery.title', label: '제목', type: 'text' },
            { path: 'gallery.images', label: '사진 목록', type: 'strings', itemLabel: '사진', preview: true }
          ]
        }
      ]
    },
    {
      id: 'venue', label: '오시는 길',
      groups: [
        {
          title: '예식장',
          fields: [
            { path: 'venue.label', label: '영문 라벨', type: 'text' },
            { path: 'venue.name', label: '예식장 이름', type: 'text' },
            { path: 'venue.hall', label: '홀 이름 · 층', type: 'text' },
            { path: 'venue.tel', label: '예식장 전화', type: 'tel' },
            { path: 'venue.address', label: '주소', type: 'text' },
            { path: 'venue.addressDetail', label: '상세 주소', type: 'text' }
          ]
        },
        {
          title: '지도 위치',
          note: '지도를 눌러 핀을 옮기면 좌표가 자동으로 채워집니다. 지도 앱 연결도 이 좌표를 사용합니다.',
          fields: [
            { path: 'venue.__map', label: '', type: 'map' },
            { path: 'venue.lat', label: '위도 (lat)', type: 'number' },
            { path: 'venue.lng', label: '경도 (lng)', type: 'number' },
            { path: 'venue.kakaoMapApiKey', label: '카카오맵 JavaScript 키', type: 'text', help: '넣으면 카카오맵으로, 비워두면 OpenStreetMap 으로 표시됩니다.' }
          ]
        },
        {
          title: '교통 안내',
          fields: [
            {
              path: 'venue.transport', label: '', type: 'list', itemLabel: '안내',
              item: [
                { key: 'title', label: '구분', type: 'text' },
                { key: 'desc', label: '내용', type: 'textarea' }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'accounts', label: '마음 전하실 곳',
      groups: [
        {
          title: '안내 문구',
          fields: [
            { path: 'accounts.label', label: '영문 라벨', type: 'text' },
            { path: 'accounts.title', label: '제목', type: 'text' },
            { path: 'accounts.message', label: '안내 문구', type: 'lines' }
          ]
        },
        {
          title: '신랑측 계좌',
          fields: [{ path: 'accounts.groom', label: '', type: 'list', itemLabel: '계좌', item: ACCOUNT_ITEM() }]
        },
        {
          title: '신부측 계좌',
          fields: [{ path: 'accounts.bride', label: '', type: 'list', itemLabel: '계좌', item: ACCOUNT_ITEM() }]
        }
      ]
    },
    {
      id: 'guestbook', label: '방명록 · 마무리',
      groups: [
        {
          title: '방명록',
          fields: [
            { path: 'guestbook.label', label: '영문 라벨', type: 'text' },
            { path: 'guestbook.title', label: '제목', type: 'text' },
            { path: 'guestbook.message', label: '안내 문구', type: 'lines' },
            { path: 'guestbook.pageSize', label: '한 번에 보여줄 개수', type: 'number' },
            { path: 'guestbook.collection', label: 'Firestore 컬렉션 이름', type: 'text' }
          ]
        },
        {
          title: '마지막 인사',
          fields: [
            { path: 'ending.image', label: '사진 주소', type: 'text' },
            { path: 'ending.message', label: '인사 문구', type: 'lines' }
          ]
        }
      ]
    },
    {
      id: 'etc', label: '공유 · 표시 설정',
      groups: [
        {
          title: '카카오톡 공유',
          note: '카카오 개발자센터에서 발급한 JavaScript 키를 넣으면 공유 버튼이 나타납니다.',
          fields: [
            { path: 'share.kakaoJsKey', label: 'JavaScript 키', type: 'text' },
            { path: 'share.kakaoTitle', label: '공유 제목', type: 'text' },
            { path: 'share.kakaoDescription', label: '공유 설명', type: 'textarea' }
          ]
        },
        {
          title: '배경음악',
          fields: [
            { path: 'bgm.enabled', label: '배경음악 사용', type: 'check' },
            { path: 'bgm.src', label: '음악 파일 주소', type: 'text' }
          ]
        },
        {
          title: '섹션 표시',
          fields: [
            { path: 'options.showCalendar', label: '달력', type: 'check' },
            { path: 'options.showDday', label: '디데이', type: 'check' },
            { path: 'options.showContact', label: '연락처 버튼', type: 'check' },
            { path: 'options.showAccounts', label: '마음 전하실 곳', type: 'check' },
            { path: 'options.showGuestbook', label: '방명록', type: 'check' }
          ]
        }
      ]
    }
  ];

  function ACCOUNT_ITEM() {
    return [
      { key: 'relation', label: '관계', type: 'text' },
      { key: 'name', label: '예금주', type: 'text' },
      { key: 'bank', label: '은행', type: 'text' },
      { key: 'number', label: '계좌번호', type: 'text' },
      { key: 'kakaopay', label: '카카오페이 송금 링크', type: 'text' }
    ];
  }

  /* ---------------------------------------------------------
   * 값 읽기 / 쓰기
   * ------------------------------------------------------- */
  function readPath(obj, path) {
    return path.split('.').reduce(function (acc, key) {
      return (acc === undefined || acc === null) ? undefined : acc[key];
    }, obj);
  }

  function writePath(obj, path, value) {
    var keys = path.split('.');
    var last = keys.pop();
    var target = keys.reduce(function (acc, key) {
      if (typeof acc[key] !== 'object' || acc[key] === null) acc[key] = {};
      return acc[key];
    }, obj);
    target[last] = value;
    markDirty();
  }

  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function toast(message) {
    var box = $('#toast');
    box.textContent = message;
    box.classList.add('is-on');
    clearTimeout(box._timer);
    box._timer = setTimeout(function () { box.classList.remove('is-on'); }, 2200);
  }

  function markDirty() {
    dirty = true;
    $('#saveState').textContent = '저장하지 않은 변경사항이 있습니다.';
    $('#saveState').className = 'topbar__state is-dirty';
  }

  function markClean(message) {
    dirty = false;
    $('#saveState').textContent = message || '';
    $('#saveState').className = 'topbar__state';
  }

  /* ---------------------------------------------------------
   * 폼 그리기
   * ------------------------------------------------------- */
  function buildForm() {
    var tabs = $('#tabs');
    var panels = $('#panels');
    tabs.innerHTML = '';
    panels.innerHTML = '';

    SCHEMA.forEach(function (tab, index) {
      var button = el('button', 'tabs__btn' + (index === 0 ? ' is-active' : ''), tab.label);
      button.type = 'button';
      button.addEventListener('click', function () { showTab(tab.id); });
      button.dataset.tab = tab.id;
      tabs.appendChild(button);

      var panel = el('section', 'panel' + (index === 0 ? ' is-active' : ''));
      panel.dataset.panel = tab.id;

      tab.groups.forEach(function (group) {
        var box = el('div', 'group');
        box.appendChild(el('h2', 'group__title', group.title));
        if (group.note) box.appendChild(el('p', 'group__note', group.note));

        var grid = el('div', 'grid');
        group.fields.forEach(function (field) { grid.appendChild(buildField(field)); });
        box.appendChild(grid);
        panel.appendChild(box);
      });

      panels.appendChild(panel);
    });
  }

  function showTab(id) {
    Array.prototype.forEach.call(document.querySelectorAll('.tabs__btn'), function (button) {
      button.classList.toggle('is-active', button.dataset.tab === id);
    });
    Array.prototype.forEach.call(document.querySelectorAll('.panel'), function (panel) {
      panel.classList.toggle('is-active', panel.dataset.panel === id);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (id === 'venue') setTimeout(refreshPicker, 120);
  }

  function buildField(field) {
    if (field.type === 'list') return buildList(field);
    if (field.type === 'strings') return buildStrings(field);
    if (field.type === 'map') return buildMapPicker(field);
    if (field.type === 'check') return buildCheck(field);

    var wrap = el('label', 'field' + (field.type === 'lines' || field.type === 'textarea' ? ' field--wide' : ''));
    wrap.appendChild(el('span', 'field__label', field.label));

    var value = readPath(DATA, field.path);
    var input;

    if (field.type === 'lines' || field.type === 'textarea') {
      input = el('textarea');
      input.rows = field.type === 'lines' ? 5 : 3;
      input.value = field.type === 'lines' ? (value || []).join('\n') : (value || '');
      input.addEventListener('input', function () {
        writePath(DATA, field.path, field.type === 'lines' ? input.value.split('\n') : input.value);
      });
    } else {
      input = el('input');
      input.type = field.type === 'number' ? 'number' :
                   field.type === 'date' ? 'date' :
                   field.type === 'time' ? 'time' :
                   field.type === 'tel' ? 'tel' : 'text';
      if (field.type === 'number') input.step = 'any';
      input.value = value === undefined || value === null ? '' : value;
      input.addEventListener('input', function () {
        var next = field.type === 'number' ? (input.value === '' ? '' : Number(input.value)) : input.value;
        writePath(DATA, field.path, next);
        if (field.path === 'venue.lat' || field.path === 'venue.lng') movePicker();
      });
      input.dataset.path = field.path;
    }

    wrap.appendChild(input);
    if (field.help) wrap.appendChild(el('span', 'field__help', field.help));

    if (field.action === 'fillDate') {
      var fill = el('button', 'mini', '날짜에서 문구 자동 채우기');
      fill.type = 'button';
      fill.addEventListener('click', fillDateTexts);
      wrap.appendChild(fill);
    }
    return wrap;
  }

  function buildCheck(field) {
    var wrap = el('label', 'check');
    var input = el('input');
    input.type = 'checkbox';
    input.checked = !!readPath(DATA, field.path);
    input.addEventListener('change', function () { writePath(DATA, field.path, input.checked); });
    wrap.appendChild(input);
    wrap.appendChild(el('span', null, field.label));
    return wrap;
  }

  /** 문자열 배열 (갤러리 사진) */
  function buildStrings(field) {
    var wrap = el('div', 'field field--wide');
    if (field.label) wrap.appendChild(el('span', 'field__label', field.label));

    var list = el('div', 'repeat');
    var draw = function () {
      var values = readPath(DATA, field.path) || [];
      list.innerHTML = '';
      values.forEach(function (value, index) {
        var row = el('div', 'repeat__row');

        if (field.preview) {
          var thumb = el('span', 'repeat__thumb');
          var img = new Image();
          img.src = value;
          img.alt = '';
          thumb.appendChild(img);
          row.appendChild(thumb);
        }

        var input = el('input');
        input.type = 'text';
        input.value = value;
        input.addEventListener('input', function () {
          values[index] = input.value;
          markDirty();
        });
        row.appendChild(input);

        row.appendChild(iconButton('▲', '위로', function () { swap(values, index, index - 1); draw(); }));
        row.appendChild(iconButton('▼', '아래로', function () { swap(values, index, index + 1); draw(); }));
        row.appendChild(iconButton('✕', '삭제', function () { values.splice(index, 1); markDirty(); draw(); }));
        list.appendChild(row);
      });
    };

    var add = el('button', 'mini', '+ ' + (field.itemLabel || '항목') + ' 추가');
    add.type = 'button';
    add.addEventListener('click', function () {
      var values = readPath(DATA, field.path) || [];
      values.push('');
      writePath(DATA, field.path, values);
      draw();
    });

    draw();
    wrap.appendChild(list);
    wrap.appendChild(add);
    return wrap;
  }

  /** 객체 배열 (교통 안내, 계좌) */
  function buildList(field) {
    var wrap = el('div', 'field field--wide');
    if (field.label) wrap.appendChild(el('span', 'field__label', field.label));

    var list = el('div', 'repeat repeat--card');
    var draw = function () {
      var values = readPath(DATA, field.path) || [];
      list.innerHTML = '';
      values.forEach(function (row, index) {
        var card = el('div', 'card');
        var head = el('div', 'card__head');
        head.appendChild(el('span', 'card__index', (field.itemLabel || '항목') + ' ' + (index + 1)));

        var acts = el('span', 'card__acts');
        acts.appendChild(iconButton('▲', '위로', function () { swap(values, index, index - 1); draw(); }));
        acts.appendChild(iconButton('▼', '아래로', function () { swap(values, index, index + 1); draw(); }));
        acts.appendChild(iconButton('✕', '삭제', function () { values.splice(index, 1); markDirty(); draw(); }));
        head.appendChild(acts);
        card.appendChild(head);

        field.item.forEach(function (sub) {
          var label = el('label', 'field');
          label.appendChild(el('span', 'field__label', sub.label));
          var input = el(sub.type === 'textarea' ? 'textarea' : 'input');
          if (sub.type === 'textarea') input.rows = 2; else input.type = 'text';
          input.value = row[sub.key] === undefined ? '' : row[sub.key];
          input.addEventListener('input', function () { row[sub.key] = input.value; markDirty(); });
          label.appendChild(input);
          card.appendChild(label);
        });

        list.appendChild(card);
      });
    };

    var add = el('button', 'mini', '+ ' + (field.itemLabel || '항목') + ' 추가');
    add.type = 'button';
    add.addEventListener('click', function () {
      var values = readPath(DATA, field.path) || [];
      var blank = {};
      field.item.forEach(function (sub) { blank[sub.key] = ''; });
      values.push(blank);
      writePath(DATA, field.path, values);
      draw();
    });

    draw();
    wrap.appendChild(list);
    wrap.appendChild(add);
    return wrap;
  }

  function iconButton(text, label, onClick) {
    var button = el('button', 'icon', text);
    button.type = 'button';
    button.title = label;
    button.setAttribute('aria-label', label);
    button.addEventListener('click', onClick);
    return button;
  }

  function swap(list, from, to) {
    if (to < 0 || to >= list.length) return;
    var moved = list.splice(from, 1)[0];
    list.splice(to, 0, moved);
    markDirty();
  }

  /* ---------------------------------------------------------
   * 지도에서 위치 지정
   * ------------------------------------------------------- */
  var PICKER = { map: null, marker: null, node: null };

  function buildMapPicker() {
    var wrap = el('div', 'field field--wide');

    var search = el('div', 'picker__search');
    var input = el('input');
    input.type = 'search';
    input.placeholder = '주소 또는 장소 이름으로 찾기';
    var find = el('button', 'mini', '검색');
    find.type = 'button';
    find.addEventListener('click', function () { searchPlace(input.value); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); searchPlace(input.value); }
    });
    search.appendChild(input);
    search.appendChild(find);
    wrap.appendChild(search);

    var canvas = el('div', 'picker');
    PICKER.node = canvas;
    wrap.appendChild(canvas);
    wrap.appendChild(el('p', 'field__help', '지도를 누르면 핀이 그 위치로 옮겨지고, 아래 좌표가 함께 바뀝니다.'));

    setTimeout(initPicker, 60);
    return wrap;
  }

  function initPicker() {
    if (PICKER.map || !PICKER.node) return;

    if (!document.querySelector('link[data-leaflet]')) {
      var link = el('link');
      link.rel = 'stylesheet';
      link.href = LEAFLET + 'leaflet.min.css';
      link.dataset.leaflet = '1';
      document.head.appendChild(link);
    }

    var ready = window.L ? Promise.resolve() : new Promise(function (resolve, reject) {
      var script = el('script');
      script.src = LEAFLET + 'leaflet.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });

    ready.then(function () {
      var lat = Number(readPath(DATA, 'venue.lat')) || 37.5665;
      var lng = Number(readPath(DATA, 'venue.lng')) || 126.9780;
      var map = window.L.map(PICKER.node, { center: [lat, lng], zoom: 17, scrollWheelZoom: true });
      window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19, attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      PICKER.marker = window.L.marker([lat, lng], { draggable: true }).addTo(map);
      PICKER.marker.on('dragend', function () {
        var point = PICKER.marker.getLatLng();
        applyPoint(point.lat, point.lng);
      });
      map.on('click', function (e) {
        PICKER.marker.setLatLng(e.latlng);
        applyPoint(e.latlng.lat, e.latlng.lng);
      });
      PICKER.map = map;
      setTimeout(function () { map.invalidateSize(); }, 200);
    }).catch(function () {
      PICKER.node.classList.add('is-failed');
      PICKER.node.textContent = '지도를 불러오지 못했습니다. 아래 위도·경도를 직접 입력해 주세요.';
    });
  }

  function refreshPicker() {
    if (PICKER.map) PICKER.map.invalidateSize();
    else initPicker();
  }

  function applyPoint(lat, lng) {
    var round = function (n) { return Math.round(n * 1000000) / 1000000; };
    writePath(DATA, 'venue.lat', round(lat));
    writePath(DATA, 'venue.lng', round(lng));
    var latInput = document.querySelector('[data-path="venue.lat"]');
    var lngInput = document.querySelector('[data-path="venue.lng"]');
    if (latInput) latInput.value = round(lat);
    if (lngInput) lngInput.value = round(lng);
  }

  function movePicker() {
    if (!PICKER.map) return;
    var lat = Number(readPath(DATA, 'venue.lat'));
    var lng = Number(readPath(DATA, 'venue.lng'));
    if (!lat || !lng) return;
    PICKER.marker.setLatLng([lat, lng]);
    PICKER.map.setView([lat, lng]);
  }

  /** OpenStreetMap 의 무료 주소 검색을 사용합니다. */
  function searchPlace(keyword) {
    if (!keyword.trim()) return;
    var url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=ko&q=' +
              encodeURIComponent(keyword);
    fetch(url, { headers: { Accept: 'application/json' } })
      .then(function (res) { return res.json(); })
      .then(function (list) {
        if (!list.length) { toast('검색 결과가 없습니다. 지도를 눌러 직접 지정해 주세요'); return; }
        var lat = Number(list[0].lat);
        var lng = Number(list[0].lon);
        applyPoint(lat, lng);
        if (PICKER.map) { PICKER.marker.setLatLng([lat, lng]); PICKER.map.setView([lat, lng], 17); }
        toast('위치를 옮겼습니다. 정확한 지점은 지도를 눌러 조정해 주세요');
      })
      .catch(function () { toast('검색에 실패했습니다'); });
  }

  /* ---------------------------------------------------------
   * 날짜 문구 자동 채우기
   * ------------------------------------------------------- */
  var DOW = ['일', '월', '화', '수', '목', '금', '토'];
  var DOW_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  function fillDateTexts() {
    var date = readPath(DATA, 'wedding.date');
    var time = readPath(DATA, 'wedding.time') || '00:00';
    var when = new Date(date + 'T' + time + ':00');
    if (isNaN(when.getTime())) { toast('날짜와 시간을 먼저 입력해 주세요'); return; }

    var hour = when.getHours();
    var minute = when.getMinutes();
    var half = hour < 12 ? '오전' : '오후';
    var hour12 = hour % 12 === 0 ? 12 : hour % 12;
    var pad = function (n) { return n < 10 ? '0' + n : String(n); };

    var long = when.getFullYear() + '년 ' + (when.getMonth() + 1) + '월 ' + when.getDate() + '일 ' +
               DOW[when.getDay()] + '요일 ' + half + ' ' + hour12 + '시' + (minute ? ' ' + minute + '분' : '');
    var short = when.getFullYear() + '. ' + pad(when.getMonth() + 1) + '. ' + pad(when.getDate()) + '. ' +
                DOW_EN[when.getDay()] + ' ' + (hour < 12 ? 'AM' : 'PM') + ' ' + hour12 + ':' + pad(minute);

    writePath(DATA, 'wedding.dateText', long);
    writePath(DATA, 'wedding.dateTextShort', short);
    var a = document.querySelector('[data-path="wedding.dateText"]');
    var b = document.querySelector('[data-path="wedding.dateTextShort"]');
    if (a) a.value = long;
    if (b) b.value = short;
    toast('문구를 채웠습니다');
  }

  /* ---------------------------------------------------------
   * Firebase
   * ------------------------------------------------------- */
  function loadSdk() {
    if (SDK) return Promise.resolve(SDK);
    var base = 'https://www.gstatic.com/firebasejs/' + FIREBASE_VERSION + '/';
    return Promise.all([
      import(base + 'firebase-app.js'),
      import(base + 'firebase-auth.js'),
      import(base + 'firebase-firestore.js')
    ]).then(function (modules) {
      var app = modules[0].initializeApp(DEFAULTS.firebase);
      SDK = {
        auth: modules[1],
        store: modules[2],
        authInstance: modules[1].getAuth(app),
        db: modules[2].getFirestore(app)
      };
      return SDK;
    });
  }

  function docRef() {
    var store = DEFAULTS.store || {};
    return SDK.store.doc(SDK.db, store.collection || 'site', store.doc || 'config');
  }

  function loadConfig() {
    return SDK.store.getDoc(docRef()).then(function (snapshot) {
      var remote = snapshot.exists() ? snapshot.data() : null;
      DATA = merge(clone(DEFAULTS), remote || {});
      delete DATA.firebase;   // 접속 정보는 코드(config.js)에서만 관리합니다
      delete DATA.store;
      delete DATA.updatedAt;
    });
  }

  function merge(base, extra) {
    if (!extra || typeof extra !== 'object' || Array.isArray(extra)) return extra;
    var out = Object.assign({}, base);
    Object.keys(extra).forEach(function (key) {
      var value = extra[key];
      if (value && typeof value === 'object' && !Array.isArray(value) &&
          base[key] && typeof base[key] === 'object' && !Array.isArray(base[key])) {
        out[key] = merge(base[key], value);
      } else if (value !== undefined) {
        out[key] = value;
      }
    });
    return out;
  }

  function save() {
    var button = $('#save');
    button.disabled = true;
    button.textContent = '저장 중…';

    var payload = clone(DATA);
    payload.updatedAt = new Date().toISOString();

    SDK.store.setDoc(docRef(), payload).then(function () {
      markClean('저장했습니다 · ' + new Date().toLocaleTimeString('ko-KR'));
      toast('저장했습니다');
    }).catch(function (error) {
      console.error(error);
      toast('저장에 실패했습니다: ' + (error.code || error.message));
    }).then(function () {
      button.disabled = false;
      button.textContent = '저장하기';
    });
  }

  function resetAll() {
    if (!window.confirm('저장된 내용을 지우고 기본값(config.js)으로 되돌립니다. 계속할까요?')) return;
    SDK.store.deleteDoc(docRef()).then(function () {
      return loadConfig();
    }).then(function () {
      buildForm();
      markClean('기본값으로 되돌렸습니다.');
      toast('기본값으로 되돌렸습니다');
    }).catch(function (error) {
      toast('되돌리기에 실패했습니다: ' + (error.code || error.message));
    });
  }

  /* ---------------------------------------------------------
   * 내보내기 / 불러오기
   * ------------------------------------------------------- */
  function exportJson() {
    var blob = new Blob([JSON.stringify(DATA, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var link = el('a');
    link.href = url;
    link.download = 'invitation-config.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function importJson(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var parsed = JSON.parse(String(reader.result));
        DATA = merge(clone(DEFAULTS), parsed);
        delete DATA.firebase;
        delete DATA.store;
        buildForm();
        markDirty();
        toast('불러왔습니다. 저장하기를 눌러 반영해 주세요');
      } catch (error) {
        toast('설정 파일을 읽지 못했습니다');
      }
    };
    reader.readAsText(file);
  }

  /* ---------------------------------------------------------
   * 로그인 흐름
   * ------------------------------------------------------- */
  function start() {
    var note = $('#gateNote');
    var conf = DEFAULTS.firebase || {};
    if (!conf.apiKey || !conf.projectId) {
      note.textContent = 'config.js 에 Firebase 설정이 없습니다. README 5번을 참고해 먼저 연결해 주세요.';
      note.classList.add('is-error');
      $('#loginSubmit').disabled = true;
      return;
    }

    loadSdk().then(function (sdk) {
      sdk.auth.onAuthStateChanged(sdk.authInstance, function (user) {
        if (user) openAdmin(user);
        else closeAdmin();
      });
    }).catch(function (error) {
      note.textContent = 'Firebase 를 불러오지 못했습니다: ' + error.message;
      note.classList.add('is-error');
    });

    $('#loginForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var form = e.target;
      var button = $('#loginSubmit');
      button.disabled = true;
      note.textContent = '';
      note.classList.remove('is-error');

      SDK.auth.signInWithEmailAndPassword(SDK.authInstance, form.email.value.trim(), form.password.value)
        .catch(function (error) {
          note.textContent = errorMessage(error);
          note.classList.add('is-error');
        })
        .then(function () { button.disabled = false; });
    });
  }

  function errorMessage(error) {
    var code = error && error.code ? error.code : '';
    if (code.indexOf('invalid-credential') >= 0 || code.indexOf('wrong-password') >= 0 ||
        code.indexOf('user-not-found') >= 0) return '이메일 또는 비밀번호가 올바르지 않습니다.';
    if (code.indexOf('too-many-requests') >= 0) return '시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.';
    if (code.indexOf('operation-not-allowed') >= 0) return 'Firebase 콘솔에서 이메일/비밀번호 로그인을 켜주세요.';
    return '로그인에 실패했습니다. (' + (code || error.message) + ')';
  }

  function openAdmin(user) {
    $('#currentUser').textContent = user.email;
    loadConfig().then(function () {
      buildForm();
      markClean('');
      $('#gate').hidden = true;
      $('#admin').hidden = false;
    }).catch(function (error) {
      toast('설정을 불러오지 못했습니다: ' + (error.code || error.message));
    });
  }

  function closeAdmin() {
    $('#gate').hidden = false;
    $('#admin').hidden = true;
  }

  function bindActions() {
    $('#save').addEventListener('click', save);
    $('#resetAll').addEventListener('click', resetAll);
    $('#exportJson').addEventListener('click', exportJson);
    $('#importJson').addEventListener('change', function (e) {
      if (e.target.files && e.target.files[0]) importJson(e.target.files[0]);
      e.target.value = '';
    });
    $('#logout').addEventListener('click', function () {
      SDK.auth.signOut(SDK.authInstance).then(closeAdmin);
    });
    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); if (!$('#admin').hidden) save(); }
    });
    window.addEventListener('beforeunload', function (e) {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = '';
    });
  }

  bindActions();
  start();
})();
