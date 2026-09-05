# Firebase 연결하기 (처음부터 끝까지)

관리자 페이지(`/admin.html`)와 방명록을 쓰려면 **Firebase** 라는 무료 서비스를 한 번 연결해야 합니다.
개발 지식이 없어도 됩니다. **약 10~15분** 걸리고, 돈은 들지 않습니다. (무료 요금제로 충분합니다)

준비물: **구글 계정**, **GitHub 계정**(이미 있으심)

---

## 전체 흐름

```
1. Firebase 프로젝트 만들기        (3분)
2. 데이터베이스 켜기               (2분)
3. 로그인 계정 만들기              (2분)
4. 웹 앱 등록하고 열쇠 복사하기     (2분)
5. 복사한 열쇠를 config.js 에 넣기  (3분)
6. 보안 규칙 붙여넣기              (2분)
7. 관리자 페이지 접속               (1분)
```

---

## 1단계 · Firebase 프로젝트 만들기

1. https://console.firebase.google.com 에 접속해서 **구글 계정으로 로그인**합니다.
2. **[프로젝트 만들기]** (또는 `프로젝트 추가`) 를 누릅니다.
3. 프로젝트 이름에 아무 이름이나 적습니다. 예: `our-wedding`
   → **[계속]**
4. "Google 애널리틱스" 화면이 나오면 **사용 안 함(토글 끄기)** 을 권장합니다. → **[프로젝트 만들기]**
5. 잠시 기다리면 "새 프로젝트가 준비되었습니다" → **[계속]**

이제 프로젝트 홈 화면이 나옵니다.

---

## 2단계 · 데이터베이스(Firestore) 켜기

여기에 청첩장 내용과 방명록 글이 저장됩니다.

1. 왼쪽 메뉴에서 **빌드 > Firestore Database** 를 누릅니다.
   (메뉴가 접혀 있으면 왼쪽 위 ☰ 를 눌러 펼치세요)
2. **[데이터베이스 만들기]** 를 누릅니다.
3. **위치(location)** 선택 화면 → **`asia-northeast3 (Seoul)`** 을 고릅니다.
   > ⚠️ 위치는 나중에 바꿀 수 없습니다. 서울로 골라주세요.
4. 보안 규칙을 고르라고 하면 **프로덕션 모드에서 시작** 을 선택합니다.
   (테스트 모드를 골라도 6단계에서 어차피 규칙을 바꿉니다)
5. **[만들기] / [사용 설정]** 을 누르고 기다립니다.

---

## 3단계 · 로그인 계정 만들기

관리자 페이지에 로그인할 아이디(이메일)와 비밀번호를 만듭니다.

1. 왼쪽 메뉴 **빌드 > Authentication** → **[시작하기]**
2. 로그인 방법 목록에서 **이메일/비밀번호** 를 누릅니다.
3. 첫 번째 **사용 설정** 토글을 **켜고** → **[저장]**
   (아래 "이메일 링크" 토글은 끈 채로 두세요)
4. 위쪽 **Users(사용자)** 탭 → **[사용자 추가]**
5. 관리자용 **이메일**과 **비밀번호**를 입력하고 **[사용자 추가]**
   - 실제로 쓰는 메일 주소가 아니어도 됩니다. 예: `wedding@admin.com`
   - **비밀번호는 12자 이상**으로 길게 만들어 주세요. 꼭 메모해 두시고요.

> 이 이메일·비밀번호가 관리자 페이지 로그인 정보입니다.

### (권장) 접속 도메인 등록

1. **Authentication > Settings(설정) 탭 > 승인된 도메인**
2. **[도메인 추가]** → `jacky92q.github.io` 입력 → 추가

---

## 4단계 · 웹 앱 등록하고 "열쇠" 복사하기

1. 왼쪽 위 **⚙️(톱니바퀴) > 프로젝트 설정** 을 누릅니다.
2. 아래로 스크롤해서 **내 앱** 항목의 **`</>` (웹)** 아이콘을 누릅니다.
3. 앱 닉네임에 아무 이름이나 적고 (예: `invitation`),
   "Firebase 호스팅 설정" 체크박스는 **체크하지 않은 채로** → **[앱 등록]**
4. 아래처럼 생긴 코드가 나옵니다. **이 부분을 통째로 복사**하세요.

```js
const firebaseConfig = {
  apiKey: "AIzaSyD....",
  authDomain: "our-wedding-1234.firebaseapp.com",
  projectId: "our-wedding-1234",
  storageBucket: "our-wedding-1234.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456"
};
```

> 나중에 다시 보려면 **⚙️ 프로젝트 설정 > 내 앱 > SDK 설정 및 구성** 에서 언제든 확인할 수 있습니다.
> 이 값은 비밀번호가 아닙니다. 공개되어도 괜찮습니다. (실제 보안은 6단계 규칙이 담당합니다)

---

## 5단계 · 복사한 열쇠를 청첩장에 넣기

### 쉬운 방법 — 관리자 페이지의 도우미 사용

1. `https://jacky92q.github.io/our-invitation/admin.html` 에 접속합니다.
2. 아직 연결 전이라 **“Firebase 연결이 필요합니다”** 안내가 보입니다.
3. **[설정 도우미 열기]** 를 누르고, 4단계에서 복사한 코드를 **그대로 붙여넣습니다.**
4. **[코드 만들기]** 를 누르면 `config.js` 에 넣을 내용이 만들어집니다. → **[복사]**
5. 아래 "GitHub 에서 붙여넣기" 로 이어집니다.

### GitHub 에서 붙여넣기

1. https://github.com/jacky92q/our-invitation 접속
2. 파일 목록에서 **`config.js`** 클릭
3. 오른쪽 위 **연필 아이콘(✏️ Edit this file)** 클릭
4. 파일 맨 위쪽의 이 부분을 찾습니다.

```js
  firebase: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  },
```

5. 이 부분을 **드래그해서 지우고**, 4번에서 복사한 내용을 붙여넣습니다.
   (도우미를 안 쓰셨다면 `apiKey: ''` 의 따옴표 안에 값만 하나씩 채워 넣어도 됩니다)
6. 오른쪽 위 **[Commit changes...]** → **[Commit changes]**
7. **약 1~2분 뒤** 자동으로 배포됩니다.
   (진행 상황은 저장소 상단 **Actions** 탭에서 초록색 체크가 되면 완료)

---

## 6단계 · 보안 규칙 붙여넣기

**이 단계를 건너뛰면 저장이 안 되거나, 아무나 내용을 바꿀 수 있습니다. 꼭 해주세요.**

1. Firebase 콘솔 → **빌드 > Firestore Database** → 위쪽 **규칙(Rules)** 탭
2. 안에 있는 내용을 **전부 지우고**, 아래를 그대로 붙여넣습니다.

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

3. **[게시(Publish)]** 를 누릅니다.

---

## 7단계 · 관리자 페이지 접속

1. `https://jacky92q.github.io/our-invitation/admin.html` 접속
2. 3단계에서 만든 **이메일 / 비밀번호**로 로그인
3. 위쪽 탭에서 원하는 항목을 고쳐서 **[저장하기]**
4. 청첩장 주소를 새로고침하면 바로 반영됩니다.

축하합니다. 이제 코드를 만지지 않고도 청첩장을 바꿀 수 있습니다. 🎉

---

## 자주 겪는 문제

| 증상 | 원인과 해결 |
| --- | --- |
| 관리자 페이지에 "Firebase 연결이 필요합니다" 가 계속 보임 | 5단계 커밋 후 배포가 끝나지 않았습니다. 1~2분 뒤 새로고침하세요. Actions 탭에 초록 체크가 떠야 합니다. |
| 로그인 시 "이메일 또는 비밀번호가 올바르지 않습니다" | 3단계에서 만든 계정인지 확인하세요. Authentication > Users 에 그 이메일이 보여야 합니다. |
| 로그인 시 "이메일/비밀번호 로그인을 켜주세요" | 3단계 2~3번(로그인 방법 사용 설정)을 안 하셨습니다. |
| 저장할 때 `permission-denied` 오류 | 6단계 보안 규칙을 붙여넣고 **게시**했는지 확인하세요. |
| 방명록이 안 보임 | Firebase 연결이 안 되어 있거나, 관리자 > 공유·표시 설정에서 방명록이 꺼져 있습니다. |
| 내용을 되돌리고 싶음 | 관리자 페이지 아래 **[기본값으로 되돌리기]** 를 누르면 `config.js` 의 값으로 돌아갑니다. |

## 알아두시면 좋은 것

- **요금**: 무료(Spark) 요금제로 충분합니다. 하객 수천 명이 봐도 무료 한도를 넘지 않습니다.
- **`apiKey` 공개**: Firebase 의 `apiKey` 는 비밀번호가 아니라 "우리 프로젝트 주소" 같은 값입니다.
  공개 저장소에 있어도 안전하며, 실제 보호는 6단계 규칙과 로그인 계정이 담당합니다.
- **카카오톡 공유 썸네일**: 이것만은 관리자 페이지가 아니라 `index.html` 의 `og:` 부분을 고쳐야 합니다.
  (카카오톡이 자바스크립트를 실행하지 않기 때문입니다)
