# 희수와 보리의 대모험 — 에이전트 작업 안내

아내 희수와 강아지 보리가 주인공인 픽셀 웹게임. 1탄 RPG(에버랜드 대탈출), 2탄 보리 외전 미니게임(보리 주세요), PvP·랭킹·할로윈파티(무한던전)·자동사냥.
배포: https://byeongjaeyu.github.io/heesoo_bori/ (원터치판 `/onetouch/`)

## 명령
- `npm run dev` — 개발 서버 (src 저장 시 새로고침)
- `npm run check` — **변경 후 반드시 실행**: typecheck → vitest → build → playwright
- `npm run build` — `dist/`에 두 에디션 생성 (커밋하지 않음)
- **배포**: main에 푸시하면 GitHub Actions(`.github/workflows/deploy.yml`)가 검사를 전부 통과한 경우에만 `dist/`를 Pages로 배포. 검사 실패 = 배포 안 됨. 진행 확인: `gh api repos/byeongjaeyu/heesoo_bori/actions/runs?per_page=1`
- 로컬 크롬으로 e2e: `CHROME_PATH=/usr/bin/google-chrome npm run test:e2e` (없으면 `npx playwright install chromium`)

## 코드 구조 (중요)
- `src/*.js`는 ES 모듈이 아니라 **하나로 이어 붙는 전역 스크립트**. 순서는 `build/hb-build.mjs`의 `ORDER`. 다른 파일의 함수/상수를 import 없이 바로 씀.
  - 새 파일을 만들면 `ORDER`에 넣을 것. 앞 파일의 전역을 뒤 파일이 씀.
  - 파일을 `.ts`로 바꿔도 됨(빌드 시 타입만 제거). 단 `import`/`export`를 쓰면 전역 공유가 깨지니 쓰지 말 것.
  - HTML 문자열 안의 `onclick="rankJoin()"`처럼 전역 이름에 의존하는 곳이 있음.
- `FORCE_EASY` — 빌드가 맨 앞에 주입. `true`면 원터치 에디션(2탄만, 큰 글씨, 서버 기능 없음).
- 정적 파일(og 이미지, `.nojekyll`)은 `public/` → `dist/`로 그대로 복사.
- 주요 파일: `data.js`(장비·몬스터·스킬·각성 표), `game.js`(전투·드롭·강화·세이브), `ui.js`(메뉴·HUD), `render.js`/`sprites*.js`(도트), `pvp.js`/`rank.js`/`cloud.js`(Supabase), `inf.js`(할로윈파티), `auto.js`(자동사냥), `daily.js`(출석·미션), `guide.js`(첫 걸음 가이드), `share.js`(카드 공유), `raid.js`(월드 보스), `ep2*.js`(2탄).
- 타입: `src/types.d.ts`(SaveData, ItemDef), `src/globals.d.ts`. JS 파일도 `checkJs`로 검사됨.

## 세이브 호환성 (유저 데이터 날리지 말 것)
- localStorage 키: 1탄 `heesu_bori_save_v1`, 2탄 `heesu_bori_ep2_v1` / 원터치 `heesu_bori_ep2_onetouch_v1`.
- **필드 삭제·이름 변경 금지.** 새 필드는 `SaveData`에 선택(`?`)으로 추가하고 `loadGame()`에서 기본값 처리. `tests/unit/progress.test.mjs`의 "예전 세이브" 테스트 유지.
- 밸런스를 바꿔도 기존 유저의 장비·강화 단계는 소급해서 깎지 않는 게 원칙.

## 밸런스 기준 (테스트로 고정됨: tests/unit)
- 강화: 모든 장비(보리 포함) +25까지. 0→+25 기대 비용 약 500만G (+17 약 15만, +20 약 52만). 파괴 시 +20 미만은 +12, 이상은 +17.
- 강화석(+10%·파괴 방지): +20~24는 회당 50·80·120·160·200개. 매번 쓰면 +25 = 장비당 약 128만G + 강화석 약 2,700개 (강화석이 병목).
- 강화석 수입: 사냥 중 중복 장비 `DUP_YIELD` [0.5,1.5,4,10,25,60](소수는 확률), 분해 `STONE_YIELD` [1,2,4,10,25,60]. 엔드급 자동사냥(시간당 약 4,000마리) 시간당 약 350개 → +25 1개 ≈ 8시간. 출석·미션·시즌은 별도(하루 약 30개).
- 드롭(일반 몬스터 1마리 기준, 1회차): 일반 1/80 · 희귀 1/250 · 영웅 1/800 · 전설 1/2000 · 신화 1/5000(2회차~) · 초월 1/12000(3회차~). 정예 ×5, 보스 ×25.
- 장비 레벨: 착용 장비와 같은 부위·같은 등급 5개 → Lv+1, 기본 스탯 +5%/Lv.
- 장비 도감(`BOOK_SETS`, data.js / `bookStats`, game.js): 시작 장비 제외 44종. 보유하면 자동 등록(분해해도 기록 유지), 1칸 최대 HP +5, 등급별·보리 용품 세트 완성 보너스. 새 장비 획득 경로를 추가하면 `bookNotify(id)` 호출.
- 꾸미기(`LOOK_SLOTS`/`HAIRS`, data.js / `visEq`·`hairOk`, game.js): 능력치 없음. 모자·옷·신발·가방은 **도감에 있는** 장비 모습으로, 헤어 8색(5색은 도감·회차·+25·각성 조건). 그리기는 `heePal()`이 visEq+헤어 사용, 스냅샷 `vis`/`hair`로 랭킹·PvP 반영.
- 카드 공유(`src/share.js`): 랭킹 「내 카드 공유」 → 1080×1350 PNG(꾸민 희수·보리, 전투력 순위, PvP, 도감, 최고 강화). 모바일은 Web Share(파일), PC는 저장·링크 복사. 링크 `?from=닉네임` → 초대 알림 + 랭킹 열림.
- 레벨 상한 50, 이후 각성(★): 경험치로 각성 포인트 → 능력치/스킬 위력/보리 공격.
- 회차(cleared) 난이도는 `LOOP_CAP`(10)에서 더 오르지 않음. 화면 표시는 실제 회차.
- 출석·일일 미션(`src/daily.js`): 출석 7일 주기(누적, 빠져도 초기화 X, 7일차 골드×5+강화석 50+자동사냥 2시간). 미션은 날짜로 4개(항상 몬스터 150마리 포함), 4개 다 받으면 자동사냥 30분. 골드 보상은 `dailyGold(pd)`(레벨·회차 비례) 배수.
  - 진행 집계는 `dailyAdd(kind)`: kill/boss(killEnemy) · enh(tryEnhance) · pvp(pvpEnd) · wave(infKill) · ep2(e2End). 새 미션은 `MISSIONS`에 넣고 해당 지점에서 dailyAdd 호출.
  - e2e `withSave`는 기본으로 오늘 출석 완료 상태(출석 창이 다른 테스트를 가리지 않게).
- 첫 걸음 가이드(`src/guide.js`): 신규 세이브 `guide: 0` → 7단계(5마리·스매싱 배우기·써보기·무기 착용·강화·보리 합류·STAGE1 보스), 단계마다 확정 보상, 상단 카드 + 대상 버튼 `.gpulse`. 사건은 `guideEv('kill'|'skill:<id>'|'enh'|'boss')`, 상태 단계는 0.5초마다 `guideCheck`. 예전 세이브는 Lv5+·2스테이지 이후면 건너뜀. e2e `withSave` 기본 `guide: 99`.

## Supabase (project ref `ujxuzduomfssguibnjux`)
- `hb_fighters`(랭킹·PvP 등록, 익명 로그인 user_id), `hb_battles`, `hb_grants`(운영자 선물함), `hb_saves`(클라우드 세이브), `hb_transfer_codes`(기기 옮기기). 스키마: `supabase/schema.sql`.
- 클라우드 세이브(`src/cloud.js`): `saveGame`/`e2SaveNow` 때 1분에 한 번 업로드. 기기 옮기기 = 옛 기기 코드 발급 → 새 기기 `hb_use_transfer_code` (세이브·닉네임·전투기록·미수령 선물 이동) → localStorage 덮어쓰고 새로고침.
- 서버 함수는 운영 DB에서 `do $$ ... raise exception 'RESULT: %' ... $$` 로 감싸 실행하면 롤백되므로 안전하게 검증 가능.
- 클라이언트는 공개(anon) 키로 RLS 범위만 접근. 테스트는 Supabase·CDN 요청을 차단하고 가짜 SB로 돔 — 운영 DB를 건드리지 말 것.
- **랭킹 등록·갱신은 `hb_submit_fighter(snap, nick)` RPC로만** (직접 쓰기 권한 없음). 서버가 `hb_power(snap)`로 전투력을 계산하고 범위 밖 값은 거절.
  - 전투력 공식을 바꾸면 `src/pvp.js` pvpSnap 과 DB 함수 `hb_power` 를 **같이** 바꿀 것. snap 에 새 값이 필요하면 hb_submit_fighter 범위 검사에도 추가.
  - 세이브 고유 번호 `sid`(SaveData.sid)로 같은 희수 중복 등록 차단 (기기 옮긴 뒤 옛 기기 → 'moved').
  - 의심 기록 보기: `select * from hb_flags order by at desc limit 50;` / 숨기기: `update hb_fighters set hidden = true where nickname = '닉네임';` (본인에겐 계속 보임)
- 닉네임(랭킹 등록)은 첫 걸음 가이드를 끝낸(또는 Lv5·2회차 이상) 세이브가 있을 때만 타이틀에서 물어봄(`entryRegister`). 랭킹·PvP 목록은 `played` 희수만.
- 주간 PvP 시즌 (보상표는 DB hb_season_rollover 와 src/rank.js SEASON_REWARDS 를 같이 바꿀 것): 월요일 0시(KST) `hb_season_rollover()` 정산 (pg_cron + 랭킹/PvP 열 때 `hb_season_info()`가 필요 시 정산). 보상은 선물함(note에 '시즌' → 🏆 문구). 지난 기록 `hb_season_results`.
- 월드 보스 레이드(`src/raid.js`, 보상표는 DB `hb_raid_settle` 와 `RAID_REWARDS` 를 같이): 주간 보스 HP를 모두가 깎음, 60초 도전 하루 3회(`hb_raid_start` 입장 시 차감), 피해는 `dealDamage`→`raidHit` 집계 후 `hb_raid_report`(상한 전투력×250+5만). 보스는 전투 중 안 죽음, 처치 후에도 피해량 경쟁 계속. 보스 공격은 내 최대 HP 약 3.5%/타.
- 친구 희수 데려가기(`src/buddy.js`): HUD 「동료」 → `hb_fighters` played 목록에서 고르면 `hb_borrow_friend(p_friend)` RPC (하루 1번 KST, `hb_borrows`). 동료는 친구 snap 공격의 50%로 15분(플레이 중에만 차감) 같이 싸우고 죽지 않음. 스테이지·할로윈·레이드 OK, PvP 제외. 세이브 `pd.buddy`. 빌려준 사람은 선물함으로 강화석 3 (하루 10번까지, note '데려갔어요' → 🤝 알림).
- **선물 주기** (유저가 다음 접속 때 자동 수령):
  ```sql
  insert into public.hb_grants (user_id, kind, amount, note)
  select user_id, 'gold', 1000000, '운영자 선물' from public.hb_fighters where nickname = '닉네임';
  ```
  kind: `auto`(자동사냥 초) · `gold` · `stones`(강화석) · `stage`(누적 스테이지 번호, 회차당 4: 50회차 STAGE1 = 197) · `awaken`(목표 각성 단계).
  새 kind를 추가할 땐 `rank.js claimGifts`와 `p_kinds` 목록을 먼저 배포한 뒤 지급할 것 (구버전은 `auto`,`gold`만 수령).

## 하지 말 것
- 실존 브랜드 로고·패턴(롯데 자이언츠 엠블럼, 디올 로고 등) 그리기. 이름 텍스트는 유지.
- claude.ai 공개 아티팩트 업데이트는 사용자 명시 승인 후에만.
