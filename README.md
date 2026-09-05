# 모바일 청첩장

모바일에 최적화된 정적(HTML/CSS/JS) 청첩장입니다. 빌드 도구가 필요 없습니다.
Firebase 를 연결하면 **관리자 페이지(`/admin.html`)에서 청첩장에 보이는 모든 내용을 직접 수정**할 수 있고,
**방명록**도 함께 동작합니다.

```
index.html              청첩장 페이지
admin.html              관리자 페이지 (별도 주소로 접속)
config.js               기본값 (이름·날짜·장소·계좌 등)
assets/css/style.css    청첩장 디자인
assets/css/admin.css    관리자 페이지 디자인
assets/js/main.js       청첩장 동작
assets/js/admin.js      관리자 페이지 동작
assets/images/          사진 (교체 대상)
assets/audio/bgm.mp3    배경음악 (선택)
.github/workflows/      GitHub Pages 자동 배포
```

## 내용을 바꾸는 두 가지 방법

| 방법 | 언제 쓰나 | 반영 방식 |
| --- | --- | --- |
| **관리자 페이지** (`/admin.html`) | 평소 내용 수정 | 저장 즉시 반영 (새로고침) |
| `config.js` 직접 수정 | Firebase 를 안 쓰거나 초기값을 바꿀 때 | 커밋 → 자동 배포 |

관리자 페이지에서 저장한 값이 `config.js` 기본값보다 **우선**합니다.
관리자에서 “기본값으로 되돌리기”를 누르면 저장된 값이 지워지고 다시 `config.js` 값이 표시됩니다.

---

> **처음 설정하시나요?**
> 화면 하나하나 따라만 하면 되는 **[SETUP.md — Firebase 연결하기](SETUP.md)** 를 먼저 보세요. (10~15분, 무료)
> 관리자 페이지(`/admin.html`)에 접속하면 같은 내용을 안내하는 **설정 도우미**도 있습니다.

## 1. Firebase 연결 (관리자 페이지 · 방명록 공용)

1. [Firebase 콘솔](https://console.firebase.google.com) 에서 프로젝트를 만듭니다. (무료 Spark 요금제로 충분합니다)
2. **빌드 > Firestore Database > 데이터베이스 만들기** — 위치는 `asia-northeast3`(서울) 권장
3. **빌드 > Authentication > 시작하기 > 이메일/비밀번호** 사용 설정
   → **Users 탭 > 사용자 추가** 로 관리자 계정(이메일 + 비밀번호)을 만듭니다.
4. **⚙️ 프로젝트 설정 > 내 앱 > 웹(`</>`)** 으로 앱을 등록하면 아래 값이 나옵니다.
5. 그 값을 `config.js` 맨 위 `firebase` 에 붙여넣고 커밋합니다.

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

> `apiKey` 는 비밀키가 아니라 프로젝트를 가리키는 식별자입니다. 공개 저장소에 있어도 괜찮으며,
> 실제 보안은 아래 **보안 규칙**과 로그인 계정이 담당합니다.

### 보안 규칙

**Firestore Database > 규칙** 에 아래 내용을 붙여넣고 게시하세요.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // 청첩장 설정: 누구나 읽고, 로그인한 관리자만 수정
    match /site/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // 방명록: 누구나 읽고 쓰기, 글자 수 제한
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

## 2. 관리자 페이지 사용법

배포 주소 뒤에 `/admin.html` 을 붙여 접속합니다.
예: `https://아이디.github.io/저장소이름/admin.html`

3번에서 만든 이메일·비밀번호로 로그인하면 아래 항목을 모두 수정할 수 있습니다.

- **기본 정보** — 공유 제목·설명·썸네일, 예식 날짜와 시간
  (`날짜에서 문구 자동 채우기` 를 누르면 “2027년 3월 28일 일요일 오후 2시” 형태로 자동 작성)
- **표지 · 인사말** — 표지 사진, 이름, 인사말 문구
- **신랑 · 신부** — 본인/혼주 성함, 연락처, `(故)` 표시
- **갤러리** — 사진 추가·삭제·순서 변경
- **오시는 길** — 예식장 정보, **지도에서 핀을 옮겨 좌표 지정**, 교통 안내 항목
- **마음 전하실 곳** — 계좌 추가·삭제
- **방명록 · 마무리** — 문구, 한 번에 보여줄 개수
- **공유 · 표시 설정** — 카카오 공유 키, 배경음악, 각 섹션 On/Off

`설정 내려받기 / 불러오기` 로 백업할 수 있고, `기본값으로 되돌리기` 로 초기화할 수 있습니다.

> 관리자 주소는 링크로 노출되지 않고 `robots.txt` 로 검색엔진에서도 제외되지만,
> **주소를 아는 사람은 로그인 화면까지 볼 수 있습니다.** 비밀번호를 충분히 길게 설정해 주세요.

## 3. 지도

- 기본적으로 **OpenStreetMap** 으로 표시되어 별도 키 없이 바로 지도가 나옵니다.
- 한글 지명이 더 정확한 **카카오맵**을 쓰려면 [카카오 개발자센터](https://developers.kakao.com)에서
  앱을 만들고 **JavaScript 키**를 관리자 페이지 > 오시는 길 > `카카오맵 JavaScript 키` 에 넣으세요.
  (앱 설정 > 플랫폼 > Web 에 배포 주소 등록 필요)
- **카카오맵 / 네이버지도 / 티맵** 버튼은 저장된 좌표로 연결됩니다.
  앱이 설치되어 있으면 앱이 열리고, 없으면 웹 지도로 넘어갑니다. (티맵은 앱 전용)
- 좌표는 관리자 페이지에서 지도를 눌러 지정하는 것이 가장 정확합니다.

## 4. 사진 바꾸기

`assets/images/` 안의 파일을 실제 사진으로 교체한 뒤, 관리자 페이지나 `config.js` 에서 경로를 맞춰주세요.

- 표지 : 세로 3:4 비율 권장
- 갤러리 : 4:5 비율로 잘려 표시됩니다
- 마지막 : 세로 4:5 비율 권장
- 용량은 장당 **300KB 이하**(가로 1200px 내외)로 줄이면 모바일에서 훨씬 빠릅니다

## 5. 카카오톡 공유 썸네일

링크를 공유했을 때 보이는 제목·설명·썸네일은 **`index.html` 상단의 `og:` 메타 태그**를 직접 수정해야 합니다.
카카오톡 등 크롤러는 자바스크립트를 실행하지 않기 때문에, 관리자 페이지에서 바꾼 값은 반영되지 않습니다.

```html
<meta property="og:title"       content="석호 ♥ 유리 결혼합니다" />
<meta property="og:description" content="..." />
<meta property="og:image"       content="https://아이디.github.io/저장소이름/assets/images/cover.jpg" />
```

## 6. 방명록

- 이름 · 숫자 4자리 비밀번호 · 메시지를 남기고, 그 비밀번호로만 본인 글을 지울 수 있습니다.
  비밀번호는 원문이 아니라 SHA-256 해시로 저장됩니다.
- 다만 삭제 권한은 규칙에서 열려 있어야 동작하므로, **Firestore API 를 직접 호출할 줄 아는 사람이
  글을 지우는 것까지는 막지 못합니다.** 더 엄격히 막으려면 Cloud Functions 가 필요합니다.
- 부적절한 글은 Firebase 콘솔의 Firestore 데이터 화면에서 직접 지울 수 있습니다.
- 예식이 끝난 뒤에는 관리자 페이지 > 공유 · 표시 설정에서 방명록을 꺼두면 됩니다.

## 7. 배경음악 (선택)

`assets/audio/bgm.mp3` 를 넣고 관리자 페이지에서 `배경음악 사용` 을 켜면 우측 상단에 버튼이 생깁니다.
브라우저 정책상 첫 화면 터치 이후에 재생됩니다.

## 8. 배포 (GitHub Pages)

1. 저장소 **Settings > Pages > Build and deployment > Source** 를 **GitHub Actions** 로 설정합니다.
2. `main` 브랜치에 push 하면 자동 배포됩니다.
3. 주소는 `https://<아이디>.github.io/<저장소이름>/` 입니다.

Actions 탭 > **Deploy to GitHub Pages > Run workflow** 로 수동 배포도 가능합니다.

## 9. 로컬에서 확인하기

```bash
python3 -m http.server 8080
# http://localhost:8080        청첩장
# http://localhost:8080/admin.html   관리자
```

## 참고

- 사진은 확대(핀치 줌·길게 눌러 저장·드래그)가 되지 않도록 막아두었습니다.
- 모션에 민감한 사용자를 위해 `prefers-reduced-motion` 설정 시 애니메이션이 자동으로 꺼집니다.
- Firebase·지도 SDK 는 실제로 필요할 때만 내려받으므로 첫 로딩이 무거워지지 않습니다.
