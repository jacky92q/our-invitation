/* =============================================================
 *  모바일 청첩장 - main.js
 *  config.js 의 값을 읽어 화면을 그리고 상호작용을 붙입니다.
 * ============================================================= */
(function () {
  'use strict';

  var CFG = window.INVITATION_CONFIG || {};
  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); };

  /* ---------------------------------------------------------
   * 유틸
   * ------------------------------------------------------- */
  function get(path, fallback) {
    var value = path.split('.').reduce(function (obj, key) {
      return (obj === undefined || obj === null) ? undefined : obj[key];
    }, CFG);
    if (value === undefined || value === null) return fallback !== undefined ? fallback : '';
    return value;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  /** 줄 배열을 <br> 로 이어 붙입니다. 빈 문자열은 문단 간격이 됩니다. */
  function lines(target, arr) {
    if (!target) return;
    target.innerHTML = '';
    (arr || []).forEach(function (line, i) {
      if (line === '') {
        target.appendChild(el('span', 'gap'));
        return;
      }
      if (i > 0 && arr[i - 1] !== '') target.appendChild(document.createElement('br'));
      target.appendChild(document.createTextNode(line));
    });
  }

  function toast(message) {
    var box = $('#toast');
    if (!box) return;
    box.textContent = message;
    box.classList.add('is-on');
    clearTimeout(box._timer);
    box._timer = setTimeout(function () { box.classList.remove('is-on'); }, 1800);
  }

  function copy(text, message) {
    var done = function () { toast(message || '복사되었습니다'); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(function () { legacyCopy(text, done); });
    } else {
      legacyCopy(text, done);
    }
  }

  function legacyCopy(text, done) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.cssText = 'position:fixed;top:-1000px;opacity:0';
    document.body.appendChild(area);
    area.select();
    try { document.execCommand('copy'); done(); } catch (e) { toast('복사에 실패했습니다'); }
    document.body.removeChild(area);
  }

  function telHref(number) { return 'tel:' + String(number).replace(/[^0-9+]/g, ''); }
  function smsHref(number) { return 'sms:' + String(number).replace(/[^0-9+]/g, ''); }
  function person(p) { return (p && p.late ? '(故) ' : '') + (p && p.name ? p.name : ''); }

  /* ---------------------------------------------------------
   * 0-1. Firebase (방명록 · 관리자 설정 공용)
   * ------------------------------------------------------- */
  var FIREBASE_VERSION = '10.12.2';
  var FB = { promise: null };

  function hasFirebase() {
    var conf = get('firebase', {});
    return !!(conf && conf.apiKey && conf.projectId);
  }

  /** Firebase SDK 는 실제로 필요할 때 한 번만 내려받습니다. */
  function firestore() {
    if (FB.promise) return FB.promise;
    var base = 'https://www.gstatic.com/firebasejs/' + FIREBASE_VERSION + '/';
    FB.promise = Promise.all([
      import(base + 'firebase-app.js'),
      import(base + 'firebase-firestore.js')
    ]).then(function (modules) {
      var app = modules[0].initializeApp(get('firebase'));
      return { api: modules[1], db: modules[1].getFirestore(app) };
    });
    return FB.promise;
  }

  /** 관리자 페이지에서 저장한 설정을 불러와 기본값 위에 덮어씁니다. */
  function loadRemoteConfig() {
    var store = get('store', {});
    return firestore().then(function (s) {
      return s.api.getDoc(s.api.doc(s.db, store.collection || 'site', store.doc || 'config'));
    }).then(function (snapshot) {
      return snapshot.exists() ? snapshot.data() : null;
    });
  }

  /** 객체는 깊게, 배열·원시값은 통째로 덮어씁니다. */
  function merge(base, extra) {
    if (!extra || typeof extra !== 'object' || Array.isArray(extra)) return extra;
    var out = Array.isArray(base) ? [] : Object.assign({}, base);
    Object.keys(extra).forEach(function (key) {
      var value = extra[key];
      if (value && typeof value === 'object' && !Array.isArray(value) &&
          base && typeof base[key] === 'object' && !Array.isArray(base[key])) {
        out[key] = merge(base[key], value);
      } else if (value !== undefined) {
        out[key] = value;
      }
    });
    return out;
  }

  /* ---------------------------------------------------------
   * 1. 메타 정보 · 단순 텍스트 바인딩
   * ------------------------------------------------------- */
  function renderMeta() {
    var title = get('meta.title', '모바일 청첩장');
    var desc = get('meta.description');
    var image = get('meta.ogImage');
    var absolute = image ? new URL(image, location.href).href : '';

    document.title = title;
    var set = function (selector, value) {
      var node = $(selector);
      if (node) node.setAttribute('content', value);
    };
    set('meta[property="og:title"]', title);
    set('meta[property="og:description"]', desc);
    set('meta[property="og:image"]', absolute);
  }

  function renderBindings() {
    $$('[data-bind]').forEach(function (node) {
      node.textContent = get(node.getAttribute('data-bind'));
    });
  }

  /* ---------------------------------------------------------
   * 2. 표지
   * ------------------------------------------------------- */
  function renderCover() {
    var img = $('#coverImg');
    var src = get('cover.image');
    if (!img || !src) { document.body.classList.add('is-ready'); return; }

    img.alt = get('cover.titleLeft') + ' ' + get('cover.titleRight') + ' 웨딩 사진';
    var ready = function () { document.body.classList.add('is-ready'); };
    img.addEventListener('load', ready, { once: true });
    img.addEventListener('error', ready, { once: true });
    img.src = src;
    if (img.complete) ready();
    setTimeout(ready, 2500); // 이미지가 느려도 문구는 보이도록
  }

  /* ---------------------------------------------------------
   * 3. 인사말 · 혼주
   * ------------------------------------------------------- */
  function renderGreeting() {
    var poem = get('greeting.poem', []);
    var poemBox = $('#greetingPoem');
    if (poem.length) lines(poemBox, poem); else if (poemBox) poemBox.remove();
    lines($('#greetingMessage'), get('greeting.message', []));

    var wrap = $('#familyBlock');
    if (!wrap) return;
    wrap.innerHTML = '';

    [['groom', 'couple.groom'], ['bride', 'couple.bride']].forEach(function (pair) {
      var side = get(pair[1]);
      if (!side || !side.name) return;

      var row = el('div', 'family__row');
      var parents = [person(side.father), person(side.mother)].filter(Boolean).join(' · ');

      if (parents) {
        var p = el('span', 'family__parents');
        p.appendChild(document.createTextNode(parents));
        row.appendChild(p);
      }
      if (side.relation) row.appendChild(el('span', 'family__rel', side.relation));
      row.appendChild(el('span', 'family__name', side.name));
      wrap.appendChild(row);
    });
  }

  /* ---------------------------------------------------------
   * 4. 연락처 시트
   * ------------------------------------------------------- */
  var ICON_CALL = 'M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24 11.4 11.4 0 0 0 3.6.58 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .58 3.6 1 1 0 0 1-.25 1z';
  var ICON_SMS = 'M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9l-5 4V5a1 1 0 0 1 1-1z';

  function contactRow(label, name, phone) {
    var row = el('div', 'sheet__row');
    var who = el('p', 'sheet__who', label);
    who.appendChild(el('b', null, name));
    row.appendChild(who);

    var acts = el('div', 'sheet__acts');
    [[telHref(phone), ICON_CALL, '전화하기'], [smsHref(phone), ICON_SMS, '문자하기']].forEach(function (item) {
      var a = document.createElement('a');
      a.className = 'sheet__act';
      a.href = item[0];
      a.setAttribute('aria-label', name + ' ' + item[2]);
      a.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + item[1] + '"/></svg>';
      acts.appendChild(a);
    });
    row.appendChild(acts);
    return row;
  }

  function renderContact() {
    if (get('options.showContact') === false) return;
    var list = $('#contactList');
    var wrap = $('#contactOpenWrap');
    if (!list || !wrap) return;

    var built = 0;
    [['신랑측', 'couple.groom', 'GROOM'], ['신부측', 'couple.bride', 'BRIDE']].forEach(function (pair) {
      var side = get(pair[1]);
      if (!side) return;

      var group = el('div', 'sheet__group');
      group.appendChild(el('p', 'sheet__group-title', pair[2]));

      var members = [
        [pair[0] === '신랑측' ? '신랑' : '신부', side.name, side.phone],
        ['아버지', person(side.father), side.father && side.father.phone],
        ['어머니', person(side.mother), side.mother && side.mother.phone]
      ];
      members.forEach(function (m) {
        if (!m[1] || !m[2]) return;
        group.appendChild(contactRow(m[0], m[1], m[2]));
        built++;
      });
      list.appendChild(group);
    });

    if (!built) return;
    wrap.hidden = false;

    var sheet = $('#contactSheet');
    var open = function () {
      sheet.hidden = false;
      requestAnimationFrame(function () { sheet.classList.add('is-open'); });
    };
    var close = function () {
      sheet.classList.remove('is-open');
      setTimeout(function () { sheet.hidden = true; }, 400);
    };
    $('#contactOpen').addEventListener('click', open);
    $$('[data-close]', sheet).forEach(function (node) { node.addEventListener('click', close); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !sheet.hidden) close();
    });
  }

  /* ---------------------------------------------------------
   * 5. 갤러리 (확대 없이 좌우 스와이프만)
   * ------------------------------------------------------- */
  function renderGallery() {
    var images = get('gallery.images', []);
    var track = $('#galleryTrack');
    var thumbs = $('#galleryThumbs');
    if (!track || !images.length) return;

    images.forEach(function (src, i) {
      var item = el('div', 'gallery__item');
      var img = new Image();
      img.src = src;
      img.alt = '웨딩 사진 ' + (i + 1);
      img.loading = i < 2 ? 'eager' : 'lazy';
      img.decoding = 'async';
      item.appendChild(img);
      track.appendChild(item);

      var btn = el('button', 'thumbs__btn' + (i === 0 ? ' is-active' : ''));
      btn.type = 'button';
      btn.setAttribute('aria-label', (i + 1) + '번째 사진 보기');
      var thumb = new Image();
      thumb.src = src;
      thumb.alt = '';
      thumb.loading = 'lazy';
      btn.appendChild(thumb);
      btn.addEventListener('click', function () { goTo(i); });
      thumbs.appendChild(btn);
    });

    var GAP = 10; /* style.css 의 .gallery__track gap 과 같은 값 */
    var index = 0;
    var indexLabel = $('#galleryIndex');
    var prev = $('#galleryPrev');
    var next = $('#galleryNext');
    $('#galleryTotal').textContent = images.length;

    function goTo(i) {
      index = Math.max(0, Math.min(images.length - 1, i));
      track.scrollTo({ left: index * (track.clientWidth + GAP), behavior: 'smooth' });
      sync();
    }

    function sync() {
      indexLabel.textContent = index + 1;
      prev.disabled = index === 0;
      next.disabled = index === images.length - 1;
      $$('.thumbs__btn', thumbs).forEach(function (btn, i) {
        btn.classList.toggle('is-active', i === index);
      });
    }

    var scrollTimer;
    track.addEventListener('scroll', function () {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function () {
        index = Math.round(track.scrollLeft / (track.clientWidth + GAP));
        sync();
      }, 90);
    }, { passive: true });

    prev.addEventListener('click', function () { goTo(index - 1); });
    next.addEventListener('click', function () { goTo(index + 1); });
    sync();
  }

  /* ---------------------------------------------------------
   * 6. 달력 · 디데이
   * ------------------------------------------------------- */
  var DOW = ['일', '월', '화', '수', '목', '금', '토'];

  function weddingDate() {
    var date = get('wedding.date');
    var time = get('wedding.time', '00:00');
    if (!date) return null;
    var d = new Date(date + 'T' + time + ':00');
    return isNaN(d.getTime()) ? null : d;
  }

  /** 12:00 → '오후 12시', 13:30 → '오후 1시 30분' */
  function timeText(date) {
    var hour = date.getHours();
    var minute = date.getMinutes();
    var half = hour < 12 ? '오전' : '오후';
    var display = hour % 12 === 0 ? 12 : hour % 12;
    return half + ' ' + display + '시' + (minute ? ' ' + minute + '분' : '');
  }

  function renderCalendar() {
    var target = weddingDate();
    var box = $('#calendar');
    if (!target || !box || get('options.showCalendar') === false) return;

    var year = target.getFullYear();
    var month = target.getMonth();
    var day = target.getDate();
    var first = new Date(year, month, 1).getDay();
    var total = new Date(year, month + 1, 0).getDate();

    var grid = el('div', 'calendar__grid');
    DOW.forEach(function (name, i) {
      grid.appendChild(el('p', 'calendar__dow' + (i === 0 ? ' calendar__dow--sun' : ''), name));
    });
    for (var i = 0; i < first; i++) grid.appendChild(el('p', 'calendar__cell'));
    for (var d = 1; d <= total; d++) {
      var sunday = (first + d - 1) % 7 === 0;
      var cell = el('p', 'calendar__cell' + (sunday ? ' calendar__cell--sun' : '') + (d === day ? ' calendar__cell--target' : ''));
      cell.appendChild(el('span', null, String(d)));
      grid.appendChild(cell);
    }

    box.appendChild(grid);
    box.appendChild(el('p', 'calendar__time', DOW[target.getDay()] + '요일 ' + timeText(target)));
    box.hidden = false;
  }

  function renderDday() {
    var target = weddingDate();
    var box = $('#dday');
    if (!target || !box || get('options.showDday') === false) return;

    var groom = get('couple.groom.name');
    var bride = get('couple.bride.name');
    var startOfDay = function (d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };
    var diff = Math.round((startOfDay(target) - startOfDay(new Date())) / 86400000);

    box.innerHTML = '';
    if (diff > 0) {
      box.appendChild(document.createTextNode(groom + ', ' + bride + '의 결혼식이 '));
      box.appendChild(el('b', null, diff + '일'));
      box.appendChild(document.createTextNode(' 남았습니다.'));
    } else if (diff === 0) {
      box.appendChild(document.createTextNode('오늘은 '));
      box.appendChild(el('b', null, groom + ' · ' + bride));
      box.appendChild(document.createTextNode('의 결혼식입니다.'));
    } else {
      box.appendChild(document.createTextNode('함께해 주신 모든 분들께 감사드립니다.'));
    }
    box.hidden = false;
  }

  /* ---------------------------------------------------------
   * 7. 오시는 길
   * ------------------------------------------------------- */
  function renderVenue() {
    var venue = get('venue', {});
    var full = [venue.address, venue.addressDetail].filter(Boolean).join(' ');

    var copyBtn = $('#copyAddress');
    if (copyBtn && !copyBtn._bound) {
      copyBtn._bound = true;
      copyBtn.addEventListener('click', function () { copy(full, '주소가 복사되었습니다'); });
    }

    var tel = $('#venueTel');
    if (tel) {
      if (venue.tel) tel.href = telHref(venue.tel);
      else tel.remove();
    }

    renderMapApps(venue);
    renderTransport(venue);
    renderMap(venue);
  }

  function renderTransport(venue) {
    var list = $('#transportList');
    if (!list) return;
    list.innerHTML = '';
    (venue.transport || []).forEach(function (item) {
      if (!item || !item.title) return;
      var li = el('li', 'info__item');
      li.appendChild(el('p', 'info__title', item.title));
      li.appendChild(el('p', 'info__desc', item.desc || ''));
      list.appendChild(li);
    });
    list.hidden = !list.children.length;
  }

  /* ---------------------------------------------------------
   * 7-1. 지도 앱으로 열기
   *      설치되어 있으면 앱, 아니면 웹 지도로 넘어갑니다.
   * ------------------------------------------------------- */
  function renderMapApps(venue) {
    var wrap = $('#mapApps');
    if (!wrap) return;
    wrap.innerHTML = '';

    var name = venue.name || '';
    var lat = Number(venue.lat);
    var lng = Number(venue.lng);
    var hasPoint = !!(lat && lng);
    var query = encodeURIComponent([name, venue.address].filter(Boolean).join(' '));

    var apps = [
      {
        label: '카카오맵',
        // 카카오맵은 웹 링크만으로 앱·웹 모두 열립니다.
        web: hasPoint
          ? 'https://map.kakao.com/link/map/' + encodeURIComponent(name) + ',' + lat + ',' + lng
          : 'https://map.kakao.com/link/search/' + query
      },
      {
        label: '네이버지도',
        scheme: hasPoint
          ? 'nmap://place?lat=' + lat + '&lng=' + lng + '&name=' + encodeURIComponent(name) +
            '&appname=' + encodeURIComponent(location.hostname || 'invitation')
          : null,
        web: 'https://map.naver.com/p/search/' + query
      },
      {
        label: '티맵',
        scheme: hasPoint
          ? 'tmap://route?goalname=' + encodeURIComponent(name) + '&goalx=' + lng + '&goaly=' + lat
          : null,
        notice: '티맵 앱이 설치되어 있지 않습니다'
      }
    ];

    apps.forEach(function (app) {
      var button = el('button', 'mapapps__btn', app.label);
      button.type = 'button';
      button.addEventListener('click', function () { openMapApp(app); });
      wrap.appendChild(button);
    });
  }

  function openMapApp(app) {
    if (!app.scheme) {
      if (app.web) window.open(app.web, '_blank', 'noopener');
      else toast(app.notice || '지도를 열 수 없습니다');
      return;
    }

    var moved = false;
    var onHide = function () { moved = true; };
    document.addEventListener('visibilitychange', onHide, { once: true });
    window.addEventListener('pagehide', onHide, { once: true });

    var frame = document.createElement('iframe');
    frame.style.cssText = 'display:none';
    frame.src = app.scheme;
    document.body.appendChild(frame);
    location.href = app.scheme;

    setTimeout(function () {
      document.removeEventListener('visibilitychange', onHide);
      if (frame.parentNode) frame.parentNode.removeChild(frame);
      if (moved || document.hidden) return;
      if (app.web) window.open(app.web, '_blank', 'noopener');
      else toast(app.notice || '앱을 열 수 없습니다');
    }, 1400);
  }

  /* ---------------------------------------------------------
   * 7-2. 지도
   *      카카오 키가 있으면 카카오맵, 없으면 OpenStreetMap 을 씁니다.
   * ------------------------------------------------------- */
  function renderMap(venue) {
    var canvas = $('#mapCanvas');
    if (!canvas) return;
    canvas.innerHTML = '';

    var lat = Number(venue.lat);
    var lng = Number(venue.lng);
    if (!lat || !lng) { staticMap(canvas, venue); return; }

    if (venue.kakaoMapApiKey) {
      kakaoMap(canvas, venue, lat, lng).catch(function () { osmMap(canvas, venue, lat, lng); });
      return;
    }
    osmMap(canvas, venue, lat, lng).catch(function () { staticMap(canvas, venue); });
  }

  /** 지도를 불러오지 못했을 때의 대체 이미지 */
  function staticMap(canvas, venue) {
    canvas.innerHTML = '';
    var img = new Image();
    img.src = venue.mapImage || 'assets/images/map.svg';
    img.alt = (venue.name || '예식장') + ' 약도';
    img.loading = 'lazy';
    canvas.appendChild(img);
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = function () { reject(new Error('script load failed: ' + src)); };
      document.head.appendChild(script);
    });
  }

  function loadStyle(href) {
    if (document.querySelector('link[href="' + href + '"]')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  var LEAFLET = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/';

  function osmMap(canvas, venue, lat, lng) {
    loadStyle(LEAFLET + 'leaflet.min.css');
    var ready = window.L ? Promise.resolve() : loadScript(LEAFLET + 'leaflet.min.js');

    return ready.then(function () {
      if (!window.L) throw new Error('leaflet unavailable');
      var map = window.L.map(canvas, {
        center: [lat, lng],
        zoom: 17,
        zoomControl: true,
        scrollWheelZoom: false,   /* 페이지 스크롤을 방해하지 않도록 */
        attributionControl: true
      });
      window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);
      window.L.marker([lat, lng], { icon: pinIcon(window.L), keyboard: false }).addTo(map);
      setTimeout(function () { map.invalidateSize(); }, 200);
      canvas._map = map;
      return map;
    });
  }

  function pinIcon(L) {
    return L.divIcon({
      className: 'map-pin',
      iconSize: [30, 40],
      iconAnchor: [15, 38],
      html: '<svg viewBox="0 0 30 40" width="30" height="40" aria-hidden="true">' +
            '<path d="M15 39C5.8 25.6 2 20.3 2 15a13 13 0 1 1 26 0c0 5.3-3.8 10.6-13 24z" fill="#A98A63"/>' +
            '<circle cx="15" cy="14.5" r="5" fill="#FFFDF9"/></svg>'
    });
  }

  function kakaoMap(canvas, venue, lat, lng) {
    var src = 'https://dapi.kakao.com/v2/maps/sdk.js?autoload=false&appkey=' +
              encodeURIComponent(venue.kakaoMapApiKey);
    var ready = (window.kakao && window.kakao.maps) ? Promise.resolve() : loadScript(src);

    return ready.then(function () {
      return new Promise(function (resolve, reject) {
        if (!window.kakao || !window.kakao.maps) { reject(new Error('kakao unavailable')); return; }
        window.kakao.maps.load(function () {
          var center = new window.kakao.maps.LatLng(lat, lng);
          var map = new window.kakao.maps.Map(canvas, { center: center, level: 3 });
          new window.kakao.maps.Marker({ position: center, map: map });
          map.addControl(new window.kakao.maps.ZoomControl(), window.kakao.maps.ControlPosition.RIGHT);
          canvas._map = map;
          resolve(map);
        });
      });
    });
  }

  /* ---------------------------------------------------------
   * 8. 마음 전하실 곳
   * ------------------------------------------------------- */
  function renderAccounts() {
    var section = $('#accountSection');
    if (!section || get('options.showAccounts') === false) return;

    var groom = get('accounts.groom', []);
    var bride = get('accounts.bride', []);
    if (!groom.length && !bride.length) return;

    lines($('#accountMessage'), get('accounts.message', []));

    var wrap = $('#accountAccordion');
    [['신랑측 마음 전하실 곳', groom], ['신부측 마음 전하실 곳', bride]].forEach(function (pair) {
      if (!pair[1].length) return;

      var acc = el('div', 'acc');

      var head = el('button', 'acc__head');
      head.type = 'button';
      head.appendChild(el('span', null, pair[0]));
      head.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>');

      var body = el('div', 'acc__body');
      var inner = el('div', 'acc__inner');
      var list = el('div', 'acc__list');

      pair[1].forEach(function (item) {
        if (!item.number) return;
        var row = el('div', 'acc__row');

        var left = el('div');
        var who = el('p', 'acc__who', item.relation || '');
        who.appendChild(el('b', null, item.name || ''));
        left.appendChild(who);
        left.appendChild(el('p', 'acc__bank', [item.bank, item.number].filter(Boolean).join(' ' )));
        row.appendChild(left);

        var right = el('div');
        var btn = el('button', 'acc__copy', '복사');
        btn.type = 'button';
        btn.addEventListener('click', function () {
          copy(item.bank + ' ' + item.number + ' ' + (item.name || ''), '계좌번호가 복사되었습니다');
        });
        right.appendChild(btn);

        if (item.kakaopay) {
          var pay = document.createElement('a');
          pay.className = 'acc__pay';
          pay.href = item.kakaopay;
          pay.target = '_blank';
          pay.rel = 'noopener noreferrer';
          pay.textContent = 'pay';
          right.appendChild(pay);
        }
        row.appendChild(right);
        list.appendChild(row);
      });

      inner.appendChild(list);
      body.appendChild(inner);
      acc.appendChild(head);
      acc.appendChild(body);
      wrap.appendChild(acc);

      head.addEventListener('click', function () { acc.classList.toggle('is-open'); });
    });

    if (wrap.children.length) section.hidden = false;
  }

  /* ---------------------------------------------------------
   * 8-1. 방명록 (Firebase Firestore)
   *      config.guestbook.firebase 설정이 있을 때만 동작합니다.
   * ------------------------------------------------------- */
  var GB = { api: null, col: null, docs: [], shown: 0, size: 5, targetId: null };

  function renderGuestbook() {
    if (get('options.showGuestbook') === false) return;

    var section = $('#guestbookSection');
    var settings = get('guestbook', {});
    if (!section || !hasFirebase()) return;

    GB.size = settings.pageSize || 5;
    lines($('#guestbookMessage'), settings.message || []);
    section.hidden = false;

    var form = $('#guestbookForm');
    var list = $('#guestbookList');
    var more = $('#guestbookMore');
    var submit = $('#guestbookSubmit');

    setBusy(list, '방명록을 불러오는 중입니다.');

    connect(settings.collection || 'guestbook')
      .then(loadEntries)
      .then(function () { drawEntries(list, more); })
      .catch(function (error) {
        console.error('[guestbook]', error);
        setBusy(list, '방명록을 불러오지 못했습니다.');
      });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      submitEntry(form, submit, list, more);
    });
    more.addEventListener('click', function () {
      GB.shown += GB.size;
      drawEntries(list, more);
    });

    bindDeleteSheet(list, more);
  }

  function setBusy(list, text) {
    list.innerHTML = '';
    list.appendChild(el('p', 'gb-empty', text));
  }

  function connect(collectionName) {
    return firestore().then(function (store) {
      GB.api = store.api;
      GB.col = store.api.collection(store.db, collectionName);
    });
  }

  function loadEntries() {
    var api = GB.api;
    var query = api.query(GB.col, api.orderBy('createdAt', 'desc'), api.limit(200));
    return api.getDocs(query).then(function (snapshot) {
      GB.docs = snapshot.docs.map(function (doc) {
        var data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          message: data.message || '',
          password: data.password || '',
          createdAt: data.createdAt && data.createdAt.toDate ? data.createdAt.toDate() : null
        };
      });
      GB.shown = GB.size;
    });
  }

  function drawEntries(list, more) {
    list.innerHTML = '';
    if (!GB.docs.length) {
      list.appendChild(el('p', 'gb-empty', '첫 번째 축하 메시지를 남겨주세요.'));
      more.hidden = true;
      return;
    }

    GB.docs.slice(0, GB.shown).forEach(function (entry) {
      var item = el('div', 'gb-item');

      var head = el('div', 'gb-item__head');
      head.appendChild(el('p', 'gb-item__name', entry.name));
      head.appendChild(el('p', 'gb-item__date', dateLabel(entry.createdAt)));
      item.appendChild(head);
      item.appendChild(el('p', 'gb-item__body', entry.message));

      var del = el('button', 'gb-item__del');
      del.type = 'button';
      del.setAttribute('aria-label', entry.name + '님의 글 삭제');
      del.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
      del.addEventListener('click', function () { openDeleteSheet(entry.id); });
      item.appendChild(del);

      list.appendChild(item);
    });

    more.hidden = GB.shown >= GB.docs.length;
  }

  function dateLabel(date) {
    var d = date || new Date();
    var pad = function (n) { return n < 10 ? '0' + n : String(n); };
    return d.getFullYear() + '. ' + pad(d.getMonth() + 1) + '. ' + pad(d.getDate());
  }

  /** 비밀번호는 원문 대신 해시로 저장합니다. */
  function hash(text) {
    if (!window.crypto || !window.crypto.subtle || !window.TextEncoder) {
      return Promise.resolve('raw:' + text);
    }
    return window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(function (buffer) {
      return Array.prototype.map.call(new Uint8Array(buffer), function (byte) {
        return ('0' + byte.toString(16)).slice(-2);
      }).join('');
    });
  }

  function submitEntry(form, submit, list, more) {
    var name = form.name.value.trim();
    var message = form.message.value.trim();
    var password = form.password.value.trim();

    if (!name || !message) { toast('이름과 메시지를 입력해 주세요'); return; }
    if (!/^[0-9]{4}$/.test(password)) { toast('비밀번호는 숫자 4자리로 입력해 주세요'); return; }
    if (!GB.api) { toast('잠시 후 다시 시도해 주세요'); return; }

    submit.disabled = true;
    submit.textContent = '남기는 중…';

    hash(password).then(function (hashed) {
      return GB.api.addDoc(GB.col, {
        name: name,
        message: message,
        password: hashed,
        createdAt: GB.api.serverTimestamp()
      }).then(function (ref) {
        GB.docs.unshift({ id: ref.id, name: name, message: message, password: hashed, createdAt: new Date() });
        GB.shown = Math.max(GB.shown, GB.size);
        drawEntries(list, more);
        form.reset();
        toast('축하 메시지가 등록되었습니다');
      });
    }).catch(function (error) {
      console.error('[guestbook]', error);
      toast('등록에 실패했습니다. 잠시 후 다시 시도해 주세요');
    }).then(function () {
      submit.disabled = false;
      submit.textContent = '축하 메시지 남기기';
    });
  }

  function openDeleteSheet(id) {
    GB.targetId = id;
    var sheet = $('#deleteSheet');
    sheet.hidden = false;
    requestAnimationFrame(function () { sheet.classList.add('is-open'); });
  }

  function closeDeleteSheet() {
    var sheet = $('#deleteSheet');
    sheet.classList.remove('is-open');
    setTimeout(function () { sheet.hidden = true; }, 400);
    $('#deleteForm').reset();
    GB.targetId = null;
  }

  function bindDeleteSheet(list, more) {
    var sheet = $('#deleteSheet');
    var form = $('#deleteForm');

    $$('[data-close]', sheet).forEach(function (node) { node.addEventListener('click', closeDeleteSheet); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !sheet.hidden) closeDeleteSheet();
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var id = GB.targetId;
      var entry = GB.docs.filter(function (item) { return item.id === id; })[0];
      if (!entry) { closeDeleteSheet(); return; }

      hash(form.password.value.trim()).then(function (hashed) {
        if (hashed !== entry.password) { toast('비밀번호가 일치하지 않습니다'); return; }
        return GB.api.deleteDoc(GB.api.doc(GB.col, id)).then(function () {
          GB.docs = GB.docs.filter(function (item) { return item.id !== id; });
          drawEntries(list, more);
          closeDeleteSheet();
          toast('삭제되었습니다');
        });
      }).catch(function (error) {
        console.error('[guestbook]', error);
        toast('삭제에 실패했습니다');
      });
    });
  }

  /* ---------------------------------------------------------
   * 9. 마무리 · 공유
   * ------------------------------------------------------- */
  function renderEnding() {
    var img = $('#endingImg');
    var src = get('ending.image');
    if (img) {
      if (src) { img.src = src; img.alt = '웨딩 사진'; }
      else img.parentNode.remove();
    }
    lines($('#endingMessage'), get('ending.message', []));

    var linkBtn = $('#shareLink');
    if (linkBtn) {
      linkBtn.addEventListener('click', function () {
        copy(location.href.split('#')[0], '링크가 복사되었습니다');
      });
    }
    renderKakaoShare();
  }

  function renderKakaoShare() {
    var key = get('share.kakaoJsKey');
    var btn = $('#shareKakao');
    if (!btn || !key) return;

    var script = document.createElement('script');
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';
    script.onload = function () {
      if (!window.Kakao) return;
      if (!window.Kakao.isInitialized()) window.Kakao.init(key);
      btn.hidden = false;
      btn.addEventListener('click', function () {
        window.Kakao.Share.sendDefault({
          objectType: 'feed',
          content: {
            title: get('share.kakaoTitle', get('meta.title')),
            description: get('share.kakaoDescription', get('meta.description')),
            imageUrl: new URL(get('meta.ogImage'), location.href).href,
            link: { mobileWebUrl: location.href, webUrl: location.href }
          },
          buttons: [{
            title: '청첩장 보기',
            link: { mobileWebUrl: location.href, webUrl: location.href }
          }]
        });
      });
    };
    document.head.appendChild(script);
  }

  /* ---------------------------------------------------------
   * 10. 배경음악
   * ------------------------------------------------------- */
  function renderBgm() {
    var bgm = get('bgm', {});
    var btn = $('#bgmToggle');
    if (!btn || !bgm.enabled || !bgm.src) return;

    var audio = new Audio(bgm.src);
    audio.loop = true;
    audio.volume = .4;
    btn.hidden = false;

    var setState = function (playing) {
      btn.classList.toggle('is-playing', playing);
      btn.setAttribute('aria-label', playing ? '배경음악 끄기' : '배경음악 재생');
    };

    btn.addEventListener('click', function () {
      if (audio.paused) audio.play().then(function () { setState(true); }).catch(function () {});
      else { audio.pause(); setState(false); }
    });

    /* 자동재생은 브라우저가 막으므로 첫 터치에 한 번만 시도합니다. */
    var tryOnce = function () {
      audio.play().then(function () { setState(true); }).catch(function () {});
      document.removeEventListener('touchstart', tryOnce);
      document.removeEventListener('click', tryOnce);
    };
    document.addEventListener('touchstart', tryOnce, { once: true, passive: true });
    document.addEventListener('click', tryOnce, { once: true });
  }

  /* ---------------------------------------------------------
   * 11. 스크롤 등장 효과
   * ------------------------------------------------------- */
  function observeReveals() {
    var nodes = $$('.reveal');
    if (!('IntersectionObserver' in window)) {
      nodes.forEach(function (n) { n.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: .12 });
    nodes.forEach(function (n) { io.observe(n); });
  }

  /* ---------------------------------------------------------
   * 12. 사진 확대 차단 (핀치 · 길게 누르기 · 드래그)
   * ------------------------------------------------------- */
  function lockZoom() {
    ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (type) {
      document.addEventListener(type, function (e) { e.preventDefault(); }, { passive: false });
    });
    document.addEventListener('contextmenu', function (e) {
      if (e.target && e.target.tagName === 'IMG') e.preventDefault();
    });
    document.addEventListener('dragstart', function (e) {
      if (e.target && e.target.tagName === 'IMG') e.preventDefault();
    });
    document.addEventListener('touchmove', function (e) {
      if (e.touches && e.touches.length > 1) e.preventDefault();
    }, { passive: false });
  }

  /* ---------------------------------------------------------
   * 실행
   * ------------------------------------------------------- */
  function init() {
    renderMeta();
    renderBindings();
    renderCover();
    renderGreeting();
    renderContact();
    renderGallery();
    renderCalendar();
    renderDday();
    renderVenue();
    renderAccounts();
    renderGuestbook();
    renderEnding();
    renderBgm();
    observeReveals();
    lockZoom();
  }

  /**
   * 원격 설정이 있으면 먼저 받아온 뒤 화면을 그립니다.
   * 네트워크가 느려도 3초 안에는 기본값으로 그리기 시작합니다.
   */
  function boot() {
    if (!hasFirebase()) { init(); return; }

    var splash = el('div', 'boot');
    document.body.appendChild(splash);

    var done = false;
    var start = function () {
      if (done) return;
      done = true;
      init();
      splash.classList.add('is-out');
      setTimeout(function () { splash.remove(); }, 600);
    };

    setTimeout(start, 3000);
    loadRemoteConfig().then(function (remote) {
      if (remote) CFG = merge(CFG, remote);
    }).catch(function (error) {
      console.warn('[config]', error);
    }).then(start);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
