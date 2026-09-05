# 모바일 청첩장

모바일에 최적화된 정적(HTML/CSS/JS) 청첩장입니다.
빌드 도구 없이 동작하며, `config.js` 값과 `assets/images/` 사진만 바꾸면 그대로 사용할 수 있습니다.

```
index.html              페이지 구조
config.js               ← 이름·날짜·장소·계좌 등 모든 내용 (여기만 고치면 됩니다)
assets/css/style.css    디자인
assets/js/main.js       렌더링 및 동작
assets/images/          사진 (교체 대상)
assets/audio/bgm.mp3    배경음악 (선택)
.github/workflows/      GitHub Pages 자동 배포
```

## 1. 내용 바꾸기

`config.js` 를 열어 값을 수정합니다. 주석에 각 항목 설명이 있습니다.

| 항목 | 설명 |
| --- | --- |
| `wedding` | 예식 일시. `date`(YYYY-MM-DD)는 달력·디데이 계산에 쓰입니다. |
| `cover` | 표지 사진과 문구 |
| `greeting` | 인사말, 앞머리 글귀 |
| `couple` | 신랑·신부와 혼주 성함, 연락처 (`late: true` 면 이름 앞에 `(故)` 표시) |
| `gallery.images` | 갤러리 사진 목록 (원하는 만큼 추가·삭제 가능) |
| `venue` | 예식장, 주소, 교통 안내, 지도 앱 링크 |
| `accounts` | 마음 전하실 곳 (계좌번호) |
| `ending` | 마지막 사진과 인사 |
| `guestbook` | 방명록 (Firebase 설정 — 아래 5번 참고) |
| `options` | 달력·디데이·계좌·연락처·방명록 섹션 켜고 끄기 |

## 2. 사진 바꾸기

`assets/images/` 안의 파일을 실제 사진으로 교체한 뒤, `config.js` 의 경로를 파일명에 맞게 수정합니다.

- 표지 `cover` : 세로 3:4 비율 권장
- 갤러리 `gallery-01 …` : 4:5 비율로 잘려 표시됩니다
- 마지막 `ending` : 세로 4:5 비율 권장
- 용량은 장당 **300KB 이하**(가로 1200px 내외)로 줄이면 모바일에서 훨씬 빠릅니다

## 3. 카카오톡 공유 썸네일

링크를 공유했을 때 보이는 제목·설명·썸네일은 **`index.html` 상단의 `og:` 메타 태그**에서 직접 수정해야 합니다.
(카카오톡 등 크롤러는 자바스크립트를 실행하지 않기 때문입니다.)

```html
<meta property="og:title"       content="민준 ♥ 서연 결혼합니다" />
<meta property="og:description" content="..." />
<meta property="og:image"       content="https://아이디.github.io/저장소이름/assets/images/cover.jpg" />
```

`og:image` 는 `https://` 로 시작하는 전체 주소, 1200×630 크기를 권장합니다.

## 4. 선택 기능

- **카카오톡 공유 버튼** : [카카오 개발자센터](https://developers.kakao.com)에서 앱을 만들고 **JavaScript 키**를 `config.js` 의 `share.kakaoJsKey` 에 넣으면 버튼이 나타납니다. 앱 설정 > 플랫폼 > Web 에 배포 주소를 등록해야 합니다.
- **지도** : `venue.kakaoMapApiKey` 에 카카오 JavaScript 키와 `lat`/`lng` 를 넣으면 실제 지도가 표시되고, 비워두면 `venue.mapImage` 약도 이미지가 표시됩니다.
- **배경음악** : `assets/audio/bgm.mp3` 를 넣고 `config.js` 의 `bgm.enabled` 를 `true` 로 바꾸면 우측 상단에 음악 버튼이 생깁니다. (브라우저 정책상 첫 화면 터치 후 재생됩니다.)

## 5. 방명록 (선택)

방명록은 **Firebase Firestore** 를 사용합니다. 무료 요금제로 충분하며, 서버 없이 동작합니다.
`config.js` 의 `guestbook.firebase` 가 비어 있으면 방명록 섹션은 표시되지 않습니다.

### 5-1. Firebase 설정

1. [Firebase 콘솔](https://console.firebase.google.com) 에서 프로젝트를 만듭니다.
2. **빌드 > Firestore Database > 데이터베이스 만들기** (위치는 `asia-northeast3` 서울 권장)
3. 프로젝트 개요 옆 **⚙️ 프로젝트 설정 > 내 앱 > 웹(</>)** 으로 앱을 추가하면 아래와 같은 값이 나옵니다.
4. 그 값을 `config.js` 의 `guestbook.firebase` 에 그대로 붙여넣습니다.

```js
firebase: {
  apiKey: 'AIza...',
  authDomain: '프로젝트.firebaseapp.com',
  projectId: '프로젝트',
  storageBucket: '프로젝트.appspot.com',
  messagingSenderId: '000000000000',
  appId: '1:0000:web:abcdef'
}
```

> `apiKey` 는 비밀키가 아니라 프로젝트를 가리키는 식별자라서 공개 저장소에 있어도 괜찮습니다.
> 실제 보안은 아래 **보안 규칙**이 담당합니다.

### 5-2. Firestore 보안 규칙

**Firestore Database > 규칙** 에 아래 내용을 붙여넣고 게시하세요.
글자 수를 제한해 장난성 대량 등록을 막습니다.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /guestbook/{entry} {
      allow read: if true;
      allow create: if request.resource.data.name is string
                    && request.resource.data.name.size() > 0
                    && request.resource.data.name.size() <= 10
                    && request.resource.data.message is string
                    && request.resource.data.message.size() > 0
                    && request.resource.data.message.size() <= 300
                    && request.resource.data.password is string;
      allow delete: if true;
      allow update: if false;
    }
  }
}
```

### 5-3. 알아두실 점

- 글 작성 시 입력한 **숫자 4자리 비밀번호**로만 본인 글을 지울 수 있습니다.
  비밀번호는 원문이 아니라 SHA-256 해시로 저장됩니다.
- 다만 삭제 권한 자체는 규칙에서 열려 있어야 동작하므로, **기술적으로 아주 능숙한 사람이
  Firestore API 를 직접 호출해 글을 지우는 것까지는 막지 못합니다.** 하객 대상 방명록에서는
  일반적인 수준의 보호이며, 더 엄격히 막으려면 Cloud Functions 가 필요합니다.
- 부적절한 글이 올라오면 Firebase 콘솔의 Firestore 데이터 화면에서 직접 삭제할 수 있습니다.
- 예식이 끝난 뒤 방명록을 닫으려면 `config.js` 의 `options.showGuestbook` 를 `false` 로 바꾸세요.

## 6. 배포 (GitHub Pages)

1. 저장소 **Settings > Pages > Build and deployment > Source** 를 **GitHub Actions** 로 설정합니다.
2. `main` 브랜치에 push 하면 `.github/workflows/deploy.yml` 이 자동으로 실행되어 배포됩니다.
3. 완료 후 주소는 `https://<아이디>.github.io/<저장소이름>/` 입니다.

Actions 탭 > **Deploy to GitHub Pages > Run workflow** 로 수동 배포도 가능합니다.

## 7. 로컬에서 확인하기

```bash
python3 -m http.server 8080
# 브라우저에서 http://localhost:8080 접속
```

## 참고

- 사진은 확대(핀치 줌·길게 눌러 저장·드래그)가 되지 않도록 막아두었습니다.
- 방명록의 Firebase SDK 는 방명록이 설정되어 있을 때만 내려받으므로, 쓰지 않으면 로딩이 느려지지 않습니다.
- 모션에 민감한 사용자를 위해 `prefers-reduced-motion` 설정 시 애니메이션이 자동으로 꺼집니다.
