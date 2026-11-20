# 희수와 보리의 대모험

희수와 강아지 보리가 주인공인 도트 웹게임 시리즈.

| 버전 | 주소 |
|---|---|
| 1탄 에버랜드 대탈출 + 2탄 보리 주세요 | https://byeongjaeyu.github.io/heesoo_bori/ |
| 2탄 원터치 에디션 (탭만으로, 큰 글씨) | https://byeongjaeyu.github.io/heesoo_bori/onetouch/ |

## 구조
- `src/` — 게임 소스 (파일끼리 전역을 공유하는 스크립트들, CSS, HTML 템플릿)
- `build/hb-build.mjs` — 소스를 순서대로 이어 붙이고 Galmuri 폰트를 서브셋해 한 파일짜리 HTML로 빌드 (Vite 플러그인)
- `dist/` — 빌드 결과물 (커밋 안 함). main 푸시 시 GitHub Actions가 검사 통과 후 Pages로 배포
- `public/` — og 이미지 등 그대로 복사되는 정적 파일
- `tests/unit` (Vitest), `tests/e2e` (Playwright) — 테스트
- `supabase/schema.sql` — 랭킹·PvP·선물함 DB
- `fonts/` — [Galmuri](https://github.com/quiple/galmuri) 폰트 (SIL OFL 1.1, `fonts/OFL.md`)

## 개발
```bash
npm ci
npm run dev        # http://localhost:5173 (일반판), /onetouch/ (원터치판). 저장하면 새로고침
npm run check      # 타입 검사 → 단위 테스트 → 빌드 → 브라우저 테스트
npm run build      # dist/ 에 배포본 생성 (배포는 main 푸시 → Actions가 자동)
```
