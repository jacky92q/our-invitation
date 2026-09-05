/* =============================================================
 *  모바일 청첩장 설정 파일
 *  이 파일의 값만 바꾸면 청첩장 내용이 전부 바뀝니다.
 *  (사진은 assets/images/ 안의 파일을 교체하거나 경로를 바꿔주세요)
 * ============================================================= */

window.INVITATION_CONFIG = {
  /* ---------- 공유 / 브라우저 탭에 표시되는 정보 ---------- */
  meta: {
    title: '민준 ♥ 서연 결혼합니다',
    description: '2026년 10월 17일 토요일 오후 12시 · 그랜드 컨벤션 5층 그레이스홀',
    // 카카오톡·문자로 링크를 보낼 때 보이는 썸네일 (1200x630 권장, 절대경로 URL이 가장 안전합니다)
    ogImage: 'assets/images/cover.svg'
  },

  /* ---------- 예식 일시 ---------- */
  wedding: {
    date: '2026-10-17',          // YYYY-MM-DD (달력·디데이 계산에 사용)
    time: '12:00',               // HH:MM (24시간)
    dateText: '2026년 10월 17일 토요일 낮 12시',
    dateTextShort: '2026. 10. 17. SAT PM 12:00'
  },

  /* ---------- 표지 ---------- */
  cover: {
    image: 'assets/images/cover.svg',
    label: 'OUR WEDDING DAY',
    // 표지에 크게 들어가는 문구 (원하시면 이름 대신 다른 문구도 가능합니다)
    titleLeft: '김민준',
    titleRight: '이서연'
  },

  /* ---------- 인사말 ---------- */
  greeting: {
    label: 'INVITATION',
    title: '소중한 분들을 초대합니다',
    // 앞머리에 넣는 짧은 글귀 (필요 없으면 빈 배열 [] 로 두세요)
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
      name: '김민준',
      nameEn: 'Minjun',
      relation: '장남',            // 장남 / 차남 / 아들 ...
      phone: '010-0000-0000',
      father: { name: '김철수', phone: '010-0000-0000', late: false }, // late: true 면 이름 앞에 (故) 표시
      mother: { name: '박영희', phone: '010-0000-0000', late: false }
    },
    bride: {
      name: '이서연',
      nameEn: 'Seoyeon',
      relation: '장녀',            // 장녀 / 차녀 / 딸 ...
      phone: '010-0000-0000',
      father: { name: '이정호', phone: '010-0000-0000', late: false },
      mother: { name: '최은숙', phone: '010-0000-0000', late: false }
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
    name: '그랜드 컨벤션',
    hall: '5층 그레이스홀',
    tel: '02-000-0000',
    address: '서울특별시 강남구 테헤란로 000',
    addressDetail: '그랜드 컨벤션 5층',
    lat: 37.5045,                 // 위도 (카카오맵 사용 시)
    lng: 127.0492,                // 경도
    // 카카오 개발자센터에서 발급받은 JavaScript 키를 넣으면 실제 지도가 표시됩니다.
    // 비워두면 아래 mapImage 가 대신 표시됩니다.
    kakaoMapApiKey: '',
    mapImage: 'assets/images/map.svg',
    // 지도 앱 바로가기 (아래 주소를 각 지도 앱에서 '공유 > 링크 복사'로 받아 넣어주세요)
    naverMapUrl: 'https://map.naver.com/p/search/그랜드컨벤션',
    kakaoMapUrl: 'https://map.kakao.com/?q=그랜드컨벤션',
    tmapUrl: 'https://tmap.life/route?goalname=그랜드컨벤션',
    // 교통 안내 (필요한 만큼 추가·삭제 가능)
    transport: [
      { title: '지하철', desc: '2호선 · 신분당선 강남역 3번 출구에서 도보 5분' },
      { title: '버스', desc: '간선 140, 402, 471 / 지선 3412 · 강남역 정류장 하차' },
      { title: '자가용', desc: '내비게이션에 “그랜드 컨벤션” 검색\n건물 지하 1~4층 주차장 2시간 무료' },
      { title: '전세버스', desc: '예식 당일 오전 10시 30분 · ○○역 1번 출구 앞에서 출발' }
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
      { relation: '신랑', name: '김민준', bank: '국민은행', number: '000000-00-000000', kakaopay: '' },
      { relation: '아버지', name: '김철수', bank: '신한은행', number: '000-000-000000', kakaopay: '' },
      { relation: '어머니', name: '박영희', bank: '농협은행', number: '000-0000-0000-00', kakaopay: '' }
    ],
    bride: [
      { relation: '신부', name: '이서연', bank: '우리은행', number: '0000-000-000000', kakaopay: '' },
      { relation: '아버지', name: '이정호', bank: '하나은행', number: '000-000000-00000', kakaopay: '' },
      { relation: '어머니', name: '최은숙', bank: '카카오뱅크', number: '0000-00-0000000', kakaopay: '' }
    ]
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
    // 카카오 개발자센터 JavaScript 키를 넣으면 '카카오톡 공유' 버튼이 활성화됩니다.
    kakaoJsKey: '',
    kakaoTitle: '김민준 ♥ 이서연 결혼합니다',
    kakaoDescription: '2026년 10월 17일 토요일 낮 12시\n그랜드 컨벤션 5층 그레이스홀'
  },

  /* ---------- 배경음악 (선택) ---------- */
  bgm: {
    enabled: false,               // true 로 바꾸고 아래 파일을 넣으면 음악 버튼이 나타납니다
    src: 'assets/audio/bgm.mp3'
  },

  /* ---------- 옵션 ---------- */
  options: {
    showDday: true,               // 디데이 카운터 표시
    showCalendar: true,           // 달력 표시
    showAccounts: true,           // 마음 전하실 곳 표시
    showContact: true             // 연락처(전화·문자) 버튼 표시
  }
};
