## ✅ AutoGrader

자동 채점을 위한 웹 애플리케이션입니다. [**바로가기**](https://jwchoi-autograder.vercel.app/)

중동고등학교 이메일(@joongdong.hs.kr)을 통한 Google SSO로 로그인해 사용할 수 있습니다. 자세한 도움말은 [도움말 문서](./docs/README.md)를 참조하세요.

오류 제보나 기능 제안은 **중동고등학교 121기 최종원**에게 연락 바랍니다. (h2511129@joongdong.hs.kr)

### 주요 기능

- 문제집 생성/수정/삭제 (데이터베이스에 저장됨)
- 객관식(1-5), 단답형, 단순 채점 불가(서술형, 꼬리 문제 등등...) 문제 지원
- 모바일 친화적 UI
- 시작 문제 선택 및 중도 종료로 부분 범위 채점 가능

### Technical Stacks

- **React** + **TypeScript** for frontend
- **Supabase** for storage
- **Vite** for build
- **Biome** for linting
- **Vercel** for deployment

### Developing

```bash
pnpm i
cp .env.development.example .env.development
pnpm dev
```
