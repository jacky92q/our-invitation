/* =============================================================
 *  모바일 청첩장 기본 설정
 *
 *  · 이 파일은 "기본값" 입니다.
 *  · Firebase 를 연결하면 admin.html 에서 수정한 내용이 이 값보다
 *    우선 적용됩니다. (admin 에서 저장한 값 → 없으면 이 파일 값)
 * ============================================================= */

window.INVITATION_CONFIG = {
  /* ---------- Firebase (방명록 · 관리자 페이지 공용) ----------
   * Firebase 콘솔 > 프로젝트 설정 > 내 앱(웹) 의 firebaseConfig 값을 넣어주세요.
   * 비워두면 방명록과 관리자 페이지가 동작하지 않고, 아래 기본값만 표시됩니다.
   * 자세한 방법은 README 를 참고해 주세요.
   */
  firebase: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  },

  /* 관리자 페이지가 설정을 저장할 위치 (그대로 두셔도 됩니다) */
  store: {
    collection: 'site',
    doc: 'config'
  },

  /* ---------- 공유 / 브라우저 탭에 표시되는 정보 ---------- */
  meta: {
    title: '석호 ♥ 유리 결혼합니다',
    description: '2027년 3월 28일 일요일 오후 2시 · 양재 엘블레스',
    ogImage: 'assets/images/cover.svg'
  },

  /* ---------- 예식 일시 ---------- */
  wedding: {
    date: '2027-03-28',          // YYYY-MM-DD (달력·디데이 계산에 사용)
    time: '14:00',               // HH:MM (24시간)
    dateText: '2027년 3월 28일 일요일 오후 2시',
    dateTextShort: '2027. 03. 28. SUN PM 2:00'
  },

  /* ---------- 표지 ---------- */
  cover: {
    image: 'assets/images/cover.svg',
    label: 'OUR WEDDING DAY',
    titleLeft: '윤석호',
    titleRight: '임유리'
  },

  /* ---------- 인사말 ---------- */
  greeting: {
    label: 'INVITATION',
    title: '소중한 분들을 초대합니다',
    poem: [
      '서로가 마주 보며 다져온 사랑을',
      '이제 함께 한 곳을 바라보며',
      '걸어갈 수 있는 큰 사랑으로 키우고자 합니다.'
    ],
    message: [
      '저희 두 사람이 사랑과 믿음으로',
      '한 가정을 이루게 되었습니다.',
      '',
      '바쁘시더라도 부디 오셔서',
      '축복해 주시면 더없는 기쁨으로 간직하겠습니다.'
    ]
  },

  /* ---------- 신랑 / 신부 ---------- */
  couple: {
    groom: {
      name: '윤석호',
      nameEn: 'Seokho',
      relation: '차남',            // 장남 / 차남 / 아들 ...
      phone: '010-0000-0000',
      father: { name: '윤재삼', phone: '010-0000-0000', late: false }, // late: true 면 이름 앞에 (故) 표시
      mother: { name: '김영애', phone: '010-0000-0000', late: false }
    },
    bride: {
      name: '임유리',
      nameEn: 'Yuri',
      relation: '장녀',            // 장녀 / 차녀 / 딸 ...
      phone: '010-0000-0000',
      father: { name: '임흥빈', phone: '010-0000-0000', late: false },
      mother: { name: '김애란', phone: '010-0000-0000', late: false }
    }
  },

  /* ---------- 갤러리 ---------- */
  gallery: {
    label: 'GALLERY',
    title: '우리의 순간',
    images: [
      'assets/images/gallery-01.svg',
      'assets/images/gallery-02.svg',
      'assets/images/gallery-03.svg',
      'assets/images/gallery-04.svg',
      'assets/images/gallery-05.svg',
      'assets/images/gallery-06.svg',
      'assets/images/gallery-07.svg',
      'assets/images/gallery-08.svg',
      'assets/images/gallery-09.svg'
    ]
  },

  /* ---------- 예식장 / 오시는 길 ---------- */
  venue: {
    label: 'LOCATION',
    name: '엘블레스',
    hall: 'LL층',
    tel: '02-526-8600',
    address: '서울특별시 서초구 강남대로 213',
    addressDetail: '엘타워 LL층 엘블레스',
    // 지도에 표시할 좌표입니다. 정확한 위치는 admin.html > 오시는 길 에서
    // 지도를 눌러 핀을 옮기면 자동으로 저장됩니다.
    lat: 37.4843,
    lng: 127.0341,
    // 카카오 개발자센터 JavaScript 키를 넣으면 카카오맵으로 표시됩니다.
    // 비워두면 별도 키가 필요 없는 OpenStreetMap 지도로 표시됩니다.
    kakaoMapApiKey: '',
    transport: [
      { title: '지하철', desc: '3호선 · 신분당선 양재역 9번 출구와 바로 연결됩니다.' },
      { title: '버스', desc: '양재역 정류장 하차\n140, 400, 741, 4412, 9401 등' },
      { title: '자가용', desc: '내비게이션에 “엘타워” 또는 “엘블레스” 검색\n(서울특별시 서초구 강남대로 213)' },
      { title: '주차', desc: '엘타워 옆 양재주차장 이용 (약 900대)\n하객 2시간 무료' }
    ]
  },

  /* ---------- 마음 전하실 곳 ---------- */
  accounts: {
    label: 'ACCOUNT',
    title: '마음 전하실 곳',
    message: [
      '참석이 어려우신 분들을 위해',
      '계좌번호를 안내드립니다.',
      '따뜻한 마음에 깊이 감사드립니다.'
    ],
    groom: [
      { relation: '신랑', name: '윤석호', bank: '', number: '', kakaopay: '' },
      { relation: '아버지', name: '윤재삼', bank: '', number: '', kakaopay: '' },
      { relation: '어머니', name: '김영애', bank: '', number: '', kakaopay: '' }
    ],
    bride: [
      { relation: '신부', name: '임유리', bank: '', number: '', kakaopay: '' },
      { relation: '아버지', name: '임흥빈', bank: '', number: '', kakaopay: '' },
      { relation: '어머니', name: '김애란', bank: '', number: '', kakaopay: '' }
    ]
  },

  /* ---------- 방명록 ---------- */
  guestbook: {
    label: 'GUESTBOOK',
    title: '축하의 한마디',
    message: [
      '따뜻한 축하의 마음을 남겨주세요.',
      '소중히 간직하겠습니다.'
    ],
    collection: 'guestbook',      // Firestore 컬렉션 이름
    pageSize: 5                   // '더 보기' 한 번에 보여줄 개수
  },

  /* ---------- 마지막 인사 ---------- */
  ending: {
    image: 'assets/images/ending.svg',
    message: [
      '저희의 새로운 시작을',
      '함께해 주신 모든 분들께',
      '진심으로 감사드립니다.'
    ]
  },

  /* ---------- 공유하기 ---------- */
  share: {
    kakaoJsKey: '',               // 카카오 JavaScript 키 (넣으면 카카오톡 공유 버튼 표시)
    kakaoTitle: '윤석호 ♥ 임유리 결혼합니다',
    kakaoDescription: '2027년 3월 28일 일요일 오후 2시\n양재 엘블레스'
  },

  /* ---------- 배경음악 (선택) ---------- */
  bgm: {
    enabled: false,
    src: 'assets/audio/bgm.mp3'
  },

  /* ---------- 표시 옵션 ---------- */
  options: {
    showDday: true,
    showCalendar: true,
    showAccounts: true,
    showContact: true,
    showGuestbook: true
  }
};
