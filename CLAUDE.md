# 희수와 보리의 대모험 — 에이전트 작업 안내

아내 희수와 강아지 보리가 주인공인 픽셀 웹게임. 본편 RPG 1장(에버랜드 대탈출)·2장(유료 바다낚시터 대소동)·3장(사직 야구장 직관 대소동)·4장(결혼 대작전)·5장(신혼여행 전날 밤의 꿈), 미니게임(보리 주세요), PvP·랭킹·할로윈파티(무한던전)·자동사냥.
배포: https://byeongjaeyu.github.io/heesoo_bori/ (원터치판 `/onetouch/`)

## 명령
- `npm run dev` — 개발 서버 (src 저장 시 새로고침)
- `npm run check` — **변경 후 반드시 실행**: typecheck → vitest → build → playwright
- `npm run build` — `dist/`에 두 에디션 생성 (커밋하지 않음)
- **배포**: main에 푸시하면 GitHub Actions(`.github/workflows/deploy.yml`)가 검사를 전부 통과한 경우에만 `dist/`를 Pages로 배포. 검사 실패 = 배포 안 됨. 진행 확인: `gh api repos/byeongjaeyu/heesoo_bori/actions/runs?per_page=1`
- 로컬 크롬으로 e2e: `CHROME_PATH=/usr/bin/google-chrome npm run test:e2e` (없으면 `npx playwright install chromium`)

## 코드 구조 (중요)
- **층(폴더) 구조**(11/27 구조 개편 ①~③, 11/28 ④ 공용 숫자·서버 SQL 생성, ⑤ 화면 문구 json). 실행 순서는 `build/hb-build.mjs`의 `ORDER`.
  | 폴더 | 내용 | 가져다 쓸 수 있는 층 |
  |---|---|---|
  | `sys/` | 바탕: `i18n.js`(tt·화면 문구) · `dom.js`($·캔버스 cv/ctx·숫자 쉼표) · `audio.js`(sfx·bgm) · `input.js`(조이스틱·키보드) | sys·core |
  | `core/` | **규칙·세이브·계산 (화면 없이 돎)**: `util`(clamp·rand·todayKey…) · `rules`(게임·서버 공용 숫자 `RULES`·`powerOf`) · `events`(emit/on) · `data`(장비·스킬·몬스터 표) · `chapter`(장 등록부·진행도) · `state`(G) · `save`(newPD·loadGame·saveGame·헤어) · `items`(개별 장비·도감·calcStats) · `loop`(회차 난이도·드롭 확률) · `enhance`(강화·돌파) · `progress`(경험치·각성·msGot·towerBest) · `refine`(교환소 값·재련 표) · `job`(전직 규칙) | core·sys |
  | `draw/` | 그리기: `sprites`/`sprites2`(도트 표) · `sprite`(makeSpr·sprHi·monSpr) · `hee2`(희수·오빠·보리 2배 도트) · `world`(buildWorld·THEME·공용 소품) · `render`(한 프레임 합성·HUD 캔버스·컷신 무대) | draw·core·sys (+render 예외) |
  | `play/` | 필드: `player`·`skills`·`bori`·`enemies`(AI)·`drops`(줍기)·`food`·`zone`(소환·보스·출구·회차 대사·오빠 구조)·`fx`·`chapter-flow`(장 고르기·프롤로그·엔딩 화면)·`auto`·`inf`(할로윈)·`tower` | 아무 층 |
  | `ui/` | 화면: `common`(얼굴·아이콘 URL) · `dialog`(toast·배너·대화창) · `hud` · `menu`(메뉴 탭 전부) · `lobby`(로비·결과) | 아무 층 |
  | `features/` | 기능별 화면 + 아직 안 나눈 규칙: daily·guide·achv·idle·pack·goal·share, `refine`/`job`(화면만 — 규칙은 core) | 아무 층 |
  | `net/` | Supabase: `pvp`(SB 연결·PvP)·rank·cloud·account·trade·auction·xchg·raid·buddy·plaza | 아무 층 |
  | `story/` · `chapters/` · `minigame/` | 컷신 엔진·이야기 다시보기 / 장 파일 / 보리 주세요(원터치판) | 아무 층 |
  - **core 는 화면·필드·서버를 import 하지 않음** — 알릴 게 있으면 `emit('toast'|'bubble'|'text'|'daily'|'guide'|'saved', …)`(core/events.js), 받는 쪽(ui/dialog·play/player·features/daily·guide·net/cloud)이 `on`으로 등록. 예: `saveGame` → emit('saved') → net/cloud 가 랭킹·클라우드 동기화. 장 배경 위 움직이는 그림은 THEME 훅 `drawOver`(3장 응원석 경기).
  - `tests/unit/modules.test.mjs` 「층 규칙」이 sys·core·draw 의 import 를 검사. 남은 예외(목록에 고정, 줄이기만): draw/render → play/player·ui/lobby·net/pvp·features/achv·net/plaza(한 프레임 합성), sys/input → ui/dialog·minigame/ep2core.
  - 옛 파일 → 새 위치: engine.js → sys/dom·core/util·draw/sprite·sys/audio·sys/input / game.js → core/state·save·items·loop·enhance·progress + play/player·skills·bori·enemies·drops·food·zone·fx / ui.js → ui/common·dialog·hud·menu·lobby / chapter.js → core/chapter + play/chapter-flow.
- **모듈 문법 + 이어 붙이는 배포본**: 파일마다 `import { a, b } from './x.js';`(한 줄)로 가져다 쓰고, 다른 파일이 쓰는 이름은 선언 앞에 `export`. `tsc`가 모듈로 검사 → 안 가져온 이름·다른 파일 변수에 대입하면 에러.
  - 배포본은 아직 `build/hb-build.mjs`의 `stripModule`이 import 줄·`export `를 걷어내고 **`ORDER` 순서로 이어 붙인 전역 스크립트**(HTML 문자열 속 `onclick="rankJoin()"`·e2e `page.evaluate`가 전역 이름을 써서). 그래서 실행 순서는 여전히 ORDER: 앞 파일 최상위 코드가 뒤 파일 const 를 바로 쓰면 안 됨(함수 안에서 쓰는 건 괜찮음, function 선언은 어디 둬도 됨).
  - 새 파일 = ORDER에 넣고 import/export 적기. `export default`·여러 줄 import 는 빌드가 거부. 다른 파일의 `let`을 바꿀 땐 주인 파일의 setter(`setCUTK`·`setMTab`·`setSaveLock`·`setSmNext`·`setTitlePd`·`setSBP`)를 씀.
  - 선언을 다른 파일로 크게 옮길 땐: 모듈 문법을 걷어낸 전역 스크립트 상태에서 옮기고 → TypeScript 검사기로 import/export 를 다시 만드는 방식이 안전(11/27 개편 때 쓴 방법).
  - `tests/unit/modules.test.mjs`: 두 파일에 같은 최상위 이름 금지(이어 붙이면 덮어씀)·src 파일 전부 ORDER에 있는지·빌드가 모듈 문법을 걷어내는지·층 규칙.
  - 진짜 번들러(Vite/esbuild 모듈 번들)로 바꾸려면 먼저 onclick 문자열을 addEventListener 로 바꾸고, e2e 가 쓰는 전역은 `window`에 따로 연결할 것.
  - 파일을 `.ts`로 바꿔도 됨(빌드 시 타입만 제거).
- **화면 문구 = `texts/ko/*.json`**(11/28 구조 개편 ⑤ 다국어 준비): 코드·index.html 에 화면용 한글이 없음. 문구 약 2,270개가 키 `파일경로.번호`(예 `net/raid.5` = "{d}일 {h}시간")로 묶음 파일에 있음 — 장 파일(대사·장비·몬스터 이름)은 `ch1~ch4.json`, 나머지는 폴더별(`core`·`ui`·`net`·`play`·`features`·`story`·`minigame`·`draw`·`main`), index.html 은 `html.json`.
  - 코드: `tt('net/raid.5', { d, h })`(`src/sys/i18n.js`, ORDER 맨 앞). 빌드가 texts 를 `__TEXTS`로 맨 앞에 넣음(폰트 서브셋도 이 글자로). index.html 은 `data-tt="html.3"`(안쪽 HTML)·`data-tta="alt=html.4"`(속성) → i18n.js 가 시작할 때 채움(그래서 그런 요소 안의 id 요소도 그때 만들어짐).
  - **문구 고치기 = json 만 고치면 됨.** 새 기능에서 한글을 코드에 그냥 써도 되고 `npm run texts`(build/i18n.mjs)가 json 으로 옮겨 tt(…)로 바꿔 줌(`-n` = 목록만). 안 옮기면 `tests/unit/i18n.test.mjs`가 실패. 로직에 쓰는 한글(비교·키·includes 인자 등)은 자동으로 안 옮김, 그 밖에 남길 건 줄 끝 `// i18n-keep`(예 광장 욕설 단어) / 파일 맨 위 `// i18n-keep-file`(core/rules.js — 서버 SQL 생성기가 node 로 읽음).
  - 테스트: 남은 화면용 한글 없음·tt 키가 다 있음·넘기는 {이름} = 글의 {이름}·안 쓰는 키 없음·다른 언어 파일 키/이름 검사. 키를 지울 땐 코드와 json 같이.
  - **영어판 있음**(11/28, `texts/en/*.json` — ko 와 같은 키·같은 {이름}·같은 HTML 태그, 테스트가 검사). 언어 = localStorage `hb_lang` → 없으면 브라우저 언어(한국어면 ko, 아니면 en). 로비 ⚙ 설정 시트 「English / 한국어」(`#tLang` → `langToggle`, 새로고침). 용어: 희수 Heesu · 보리 Bori · 오빠 Oppa · 회차 Run · 강화석 Enhance Stones · 각성 Awakening · 도감 Collection · 재련 Reforge · 한계 돌파 Limit Break · 자동사냥 Auto-hunt · 등급 Common/Rare/Epic/Legendary/Mythic/Transcendent · 미니게임 「보리 주세요」 Bori Begs. **한국어 문구를 고치거나 새로 넣으면 en 에도 같은 키를 넣을 것**(없으면 한국어가 그대로 나옴 — 테스트는 안 막음).
  - 언어별로 다른 코드: 큰 골드 표시 `fmtGold`(rank.js, 한국어 「300만」 / 영어 3M), 숫자 뒤에 붙이는 단위 글(「회차」「개」 등)은 영어 json 에서 앞 공백 포함(" runs") 또는 빈 글. 서버가 만든 글(선물 메모·시즌 결과 문구)은 한국어 그대로.
  - 테스트는 한국어 기준(load-game 이 `hb_lang`='ko', playwright `locale: 'ko-KR'`), 영어는 `tests/e2e/i18n.spec.mjs`(en-US: 로비·메뉴에 한글 없음, 언어 버튼 왕복).
  - 다른 언어 더 추가 = `texts/<언어>/*.json` + 언어 버튼을 고르기 창으로. 주의: 장비·몬스터 이름 일부가 로직 비교에 쓰이는 곳(ep2easy 「고양이 털」 비교 등 — `build/i18n.mjs` 의 `scanAll().kept` 로 목록 확인)은 번역 시 같이 볼 것. 빌드 HTML `<title>`·og 문구(`EDITIONS`, hb-build.mjs)는 아직 한국어 고정.
- `FORCE_EASY` — 빌드가 맨 앞에 주입. `true`면 원터치 에디션(2탄만, 큰 글씨, 서버 기능 없음).
- 정적 파일(og 이미지, `.nojekyll`, 개인정보처리방침 `privacy.html`)은 `public/` → `dist/`로 그대로 복사.
  - 소개(랜딩) 페이지 `public/landing/index.html` → `/heesoo_bori/landing/` (11/27, 사용자가 만든 한 파일: 도트 이미지·Galmuri·GSAP·Lenis 인라인). 게임 소스와 별개라 장·몬스터·보스가 바뀌어도 자동 반영 안 됨 — 안의 `MONS`·`BOSSES`·`SPR`을 손으로 고칠 것.
- 주요 파일: 위 층 표 참고. 아래 설명에서 `game.js`·`ui.js`·`engine.js`라고 적힌 함수는 위 「옛 파일 → 새 위치」로 찾을 것(파일 이름 대신 함수 이름으로 검색하면 빠름).
- 타입: `src/types.d.ts`(SaveData, ItemDef), `src/globals.d.ts`. JS 파일도 `checkJs`로 검사됨.
- PC(마우스·900px 이상): `#hud`·`#ctrl`을 CSS `zoom` 1.3(1600×1000 이상 1.5)으로 키우고 버튼에 단축키 배지(`data-key`), 키보드 안내 `#keyHint`(대화창 뜨면 숨김).

## 세이브 호환성 (유저 데이터 날리지 말 것)
- localStorage 키: 1탄 `heesu_bori_save_v1`, 2탄 `heesu_bori_ep2_v1` / 원터치 `heesu_bori_ep2_onetouch_v1`.
- **필드 삭제·이름 변경 금지.** 새 필드는 `SaveData`에 선택(`?`)으로 추가하고 `loadGame()`에서 기본값 처리. `tests/unit/progress.test.mjs`의 "예전 세이브" 테스트 유지.
- 밸런스를 바꿔도 기존 유저의 장비·강화 단계는 소급해서 깎지 않는 게 원칙.

## 밸런스 기준 (테스트로 고정됨: tests/unit)
- 강화: 모든 장비(보리 포함) +25까지. 0→+25 기대 비용 약 500만G (+17 약 15만, +20 약 52만). 파괴 시 +20 미만은 +12, 이상은 +17.
- **한계 돌파**(+26~+30, game.js `tryBreak`, 장비 탭에서 +25 장비는 돌파 카드 `brkCardHtml`): 회당 강화석 `BRK_STONE` 1,000·1,500·2,000·2,500·3,000 + `enhCost(en)` 골드, 성공률 `BRK_P` 9·7·5·4·3%(10% 미만), 실패해도 하락·파괴 없음. 단계마다 장비 기본 능력치 +3%(`brkMul`, calcStats) + 부위 강화 효과(ENH_FX)도 계속 붙음. +30까지 장비당 기대 강화석 약 23만 개(장기 소모처 — 강화석 상품 여지). 연출: +20 이상 강화·돌파 성공 시 화면 전체 `enhFx`(ui.js, +20 파랑·+25 금색·돌파 무지개), 강화 카드 아이콘 빛(`.glow20`/`.glow25`/`.glowB`), 필드·PvP·광장 발밑 오라 `enhAura`(render.js, 장비 중 최고 강화 단계 / 남은 snap.enh·tenh). 서버 `hb_submit_fighter`의 enh·tenh 상한은 30.
- 강화석(+10%·파괴 방지): +20~24는 회당 50·80·120·160·200개. 매번 쓰면 +25 = 장비당 약 128만G + 강화석 약 2,700개 (강화석이 병목).
- 강화석 수입: 사냥 중 중복 장비 `DUP_YIELD` [0.5,1.5,4,10,25,60](소수는 확률), 분해 `STONE_YIELD` [1,2,4,10,25,60]. 엔드급 자동사냥(시간당 약 4,000마리) 시간당 약 350개 → +25 1개 ≈ 8시간. **사냥·보스전 직접 드롭**(11/24, `STONE_DROP`·`killStones`, game.js): 일반 몬스터 1%로 1개(땅에 떨어지는 `stone` 드롭, 사라지지 않음) · 정예 10%로 1~2개 · 보스 확정 2 + 회차 단계/4(최대 20, 바로 지급 — 보스 타워 포함), PvP·레이드 없음. 엔드급 시간당 약 +370개. 출석·미션·시즌은 별도(하루 약 30개).
- 드롭(일반 몬스터 1마리 기준, 1회차): 일반 1/80 · 희귀 1/250 · 영웅 1/800 · 전설 1/2000 · 신화 1/5000(2회차~) · 초월 1/12000(3회차~). 정예 ×5, 보스 ×25.
- 장비 레벨: 착용 장비와 같은 부위·같은 등급 5개 → Lv+1, 기본 스탯 +5%/Lv.
- **개별 장비**(2026-11-22, 거래 대비): `pd.inv`·`enh`·`ilv`·`iexp`·`ref`·`eq`·`beq`는 **장비 키** 기준. 같은 장비 첫 개는 키 = 장비 이름(예전 세이브 그대로 호환), 둘째부터 `이름#xxxx`. `ITEMS`는 data.js에서 Proxy라 `ITEMS[키]`가 원래 정의를 돌려줌(`Object.keys(ITEMS)`엔 이름만). 장비 추가는 `addItem(pd, id, enh?)`(키 반환·도감 등록), 제거는 `dropItem(pd, k)`(강화·레벨·재련 기록도 삭제), 보유 확인은 `ownsDef`/`keysOf`. 세이브 밖(스냅샷 eq·w.id·beq·vis, 도감, 아이콘 캐시)으로 나갈 땐 `defOf(k)`로 이름만 — `visEqRaw`·`pvpSnap`. `pd.inv[이름]`으로 보유 여부를 판단하지 말 것.
  - 중복 드롭: 기본은 예전처럼 강화석/장비 레벨 재료. 장비 탭 「같은 장비 또 나오면」(`pd.keepDup` = 전설↑3·신화↑4·초월 5)이면 그 등급 이상은 가방에 따로 보관(가방 `BAG_MAX` 300개 넘으면 강화석).
- 장비 도감(`BOOK_SETS`, data.js / `bookStats`, game.js): 시작·전직 장비 제외 65칸(11/25). 보유하면 자동 등록(분해해도 기록 유지), 1칸 최대 HP +5, 등급별·보리 용품 세트 완성 보너스. 새 장비 획득 경로를 추가하면 `bookNotify(id)` 호출.
- **2배 도트**(11/25, `src/draw/hee2.js`, ORDER에서 engine 뒤): 희수·오빠·보리는 캔버스 2배(희수·오빠 28×42, 보리 앉음 24×24·달리기 30×20)로 그리고 `makeSpr(c, 2)` — 스프라이트 `W`·`H`는 화면 크기(예전 14×21 등) 그대로라 충돌·배치 코드는 안 바뀜. 몬스터는 `monSpr` → `sprHi`(EPX `scale2x` 자동 2배). 다른 캔버스에 옮겨 그릴 땐 `s.n`을 원래 크기로 쓰지 말고 `sprBlit(g, s, x, y, k)`(화면 크기 × k)나 2배 캔버스를 쓸 것(rank.js `fighterURL`, pvp.js `pvpFaceURL`, ui.js `hiURL`·보리 아이콘 참고).
  - 희수 외형 = `heeLook(pd, over)` → `heePaint(L, dir, fr)`. 장비 → 모양은 `HEE_LOOK`(없으면 아이콘으로 짐작 `heeLookOf`): 모자 cap·capTiara·capRainbow·ballcap·bucket·pin(진주 핀, 모자 없이 머리)·veil(티아라+레이스 면사포) / 옷 fleece·hoodie·pad·longpad·coat·vest·jersey·dress·gown(볼가운, 발까지 덮음) / 신발 sneaker·slipon·chunky·sandal·boots·cleat·heel / 가방 shoulder·tote·cross·backpack·handbag·clutch·box. 새 꾸미기 장비를 추가하면 `HEE_LOOK`에 모양을 넣을 것. 얼굴은 큰 눈(3×5 눈동자·갈색 홍채·반짝이 2개·속눈썹, 11/25 「눈 크게·비호감상」 지적), 몸통은 줄마다 폭을 정한 모양(`spans`: 둥근 어깨·잘록한 허리·살짝 퍼진 밑단)으로 그리고 그 모양으로 잘라 테두리(「허리 얇게」), 팔은 몸 옆으로 곧게 내려오는 둥근 팔 + 동그란 손(`blob`, 「팔이 로봇 같다」→「팔 너무 벌어짐」 11/25). 머리는 `heeSeam`으로 단색 줄·칸을 빼서 작게(「얼굴 조금만 작게」, 앞 24→20칸·높이 3줄 줄임, 턱·몸 위치는 그대로) — 머리·긴 머리·면사포를 그리는 좌표는 원래 크기 기준이고 마지막에 `layer()`/`done()`이 줄임. 다리는 허벅지 4칸 → 종아리 3칸(`leg`), 신발은 둥근 앞코, 걷기는 앞모습 한 발씩 2칸 들기·옆모습 다리를 비스듬히 앞뒤로 벌림. 컷신 웨딩은 `WED_PAL`(hat veil·cloth gown·shoe heel·bag none).
  - **장비 아이콘도 모양별**(`ITEM_ICON`·`iconKey`·`ICON_PAL`, render.js / ICONS `i_*`, sprites.js): 장비 정의 `icon`은 서버 장비표와 맞춰 두고 그림만 바꿈(벙거지·응원모자·티아라 볼캡·무지개 볼캡·진주 핀·후드·패딩·롱패딩·코트·구명조끼·유니폼·볼가운·하이힐·스파이크·어글리·봉투 클러치·백팩·에코백·크로스백·태클박스). 새 꾸미기 장비는 `HEE_LOOK`과 `ITEM_ICON` 둘 다 넣을 것.
  - 오빠 `husPaint({tux, sleep})`, 보리 `boriPaint(kind, 옷)`. 예전 1배 도트 표(HS·HUS·BORI)는 남아 있지만 그리기엔 안 씀.
- 꾸미기(`LOOK_SLOTS`/`HAIRS`, data.js / `visEq`·`hairOk`, game.js): 능력치 없음. 모자·옷·신발·가방은 **도감에 있는** 장비 모습으로, 헤어(기본 3색 + 도감·회차·+25·각성·2장 클리어 조건색 + 한정색). 그리기는 `heeLook()`이 visEq+헤어 사용, 스냅샷 `vis`/`hair`로 랭킹·PvP 반영.
- 타이틀 = 게임 로비(`showTitle`, ui/lobby.js) — **11/28 개편**(사용자 「버튼 너무 많고 산만」, 22개 → 13개): 상단 내 희수 카드(누르면 메뉴 「내 희수」=꾸미기) + ⚙(`#tGear` → 설정 시트) / 골드·강화석 칩 `.tcur` · 오른쪽 줄 `#tsideR` = 기간 한정(`#tPack`·`#tPack2`·`#tJob`)+보상함 `#tRew`(받을 수 = 출석·미션 + 방치 + 회차 이정표, `rewCount`) · 아래 장 고르기+「모험 계속하기」 한 카드 `.tadv` · 맨 아래 탭 `#tnav` 5개 = 홈 `#tHome` · 성장 `#tBag`(→ `lobbyMenu()`) · 도전 `#tPlay` · 상점·거래 `#tShop` · 소셜 `#tSoc`.
  - 시트 `#tsheet`(`sheetShow(k)`, 패널 `.tsp[data-nav]`): play = `#tInf`·`#tPvp`·`#tRaid`·`#tTower`(2×2) / shop = `#tXch`(→ 메뉴 배달앱 교환소)·`#tAuc`·`#tXc`(`aucOpen('xchg')`) / soc = `#tRank`·`#tPlaza`·`#tShare` / set = `#tSnd`·`#tLang`·`#tCloud`·`#tInfo`(→ 메뉴 도움말) / rew = `#tDaily`·`#tIdle`·`#tGoal`·「모두 받기」`#tRewAll`(`rewAll`: `dailyTakeAll`·`idleTake`·`msTake` 한 번에 → 보상 창). 로비 위 창을 닫고 돌아오면(state 그대로 title) 열려 있던 시트를 다시 엶, 게임·메뉴에서 돌아오면 닫힘. 뒤 배경(`.tsh-bg`)·홈 탭 누르면 닫힘.
  - e2e: 시트 안 버튼은 `tap(page, '#tX')`(fixtures — 그 시트를 먼저 엶). 새 로비 버튼은 시트 패널에 넣고 id를 붙일 것. 시트 안 줄은 `.trow`(아이콘·제목·설명·오른쪽 `.tget`).
  - 「장비·스킬」(tBag)·프로필 → `lobbyMenu()`: state `lobbyMenu`로 메뉴를 열고(음식 탭 제외, G.P 없음) 닫으면 로비로. 타이틀 희수는 `TITLE_PD`(세이브) 꾸미기로 그림. 오른쪽 줄 위치는 `titleLayout()`이 프로필 아래로 계산하고 로고를 그 줄과 안 겹치게 줄임(모험 카드에 닿으면 `.tight`/scale) — CSS 고정 top 쓰지 말 것. e2e 360×660 겹침 검사(오른쪽 줄·로고·모험 카드·아래 탭·시트).
- 「보리 주세요」(ep2*)는 본편과 별개인 **미니게임** 취급(화면 문구에 '2탄' 쓰지 않음). 데이터·세이브 키는 그대로. **11/27부터 메인판 로비에서 뺌**(사용자 요청: 「나중에 미니게임 다시 제대로 만들게」) — 원터치판(`FORCE_EASY`)에만 남음. 메인 일일 미션에서도 `ep2` 안 뽑힘(`dailyPicks`, 예전에 뽑힌 건 `dailyState`가 다른 미션으로 바꿈). 코드·세이브(`E2KEY`·클라우드 ep2)는 그대로 둠.
- 업적·칭호(`src/features/achv.js`): `ACH` 표(40개 넘음, 티어 1~4 → 강화석 5·15·40·100). 1초마다 `achvCheck`가 조건 검사 → `pd.ach[id]` 등록·보상(예전 기록도 소급 달성). 메뉴 「칭호」 탭에서 장착(`pd.title`) → snap `ttl`(달성한 것만)·`achN`. 표시는 `achTag(id)`(모르는 id는 빈 문자열) — 랭킹·PvP·동료 목록·로비·카드·이름표. 통계 `stats.boss`·`pvpW`·`raidBest` 추가. 업적 id는 바꾸지 말 것(세이브·랭킹에 저장됨).
- 방치 보상(`src/features/idle.js`): `pd.idleT`부터 쌓임(최대 12시간, 10분부터 받기). **첫 걸음 가이드를 끝내야 쌓임**(`idleOn`, 11/23 — Lv1 세이브를 며칠 두고 열면 12시간치로 Lv16까지 건너뛰던 문제), 그 전엔 타일 「잠김」. 플레이 중 `saveGame`이 idleT를 지금으로 갱신(타이틀·로비 메뉴에선 안 함). 지금 스테이지·회차 몬스터 시간당 300마리 기준 골드·경험치(Lv50 이후 각성)·강화석(처치당 0.03, 12시간 ≈ 108개). 로비 보상함 시트 `#tIdle` → `idleClaim`.
- 성장 패키지(뉴비 세트 2, `pack.js` `PACK2`): 첫 패키지가 끝난(받았거나 24시간 지난) 뒤 1장 클리어 또는 Lv10이면 48시간, 상단 타일 `#tPack2`. 영웅 무기 「롯데 자이언츠 응원봉」 +10(더 세면 자동 착용)·강화석 500·30만G, 정가 표기 ₩3,300·베타 무료. 세이브 `pd.pack2 {seen, got}`.
- 뉴비 패키지(`src/features/pack.js`, 베타 기간 무료 · 정가 표기 ₩1,000): 로비에서 처음 본 순간 `pd.pack.seen` 저장 → 24시간 동안 상단 「뉴비 패키지」 타일. 받으면 자동사냥 3시간(autoBonus)·강화석 300·한정 헤어 `lavender`(HAIRS `excl`, 받은 사람만 보임)·한정 칭호 `beta`(ACH `sp`: 보상 없음·가진 사람만 목록에). 유료화 땐 결제 확인 후 서버 지급(hb_grants)으로 바꿀 것.
- **장 단위 파일**(11/27 구조 개편, `src/chapters/ch1~4.js` + 등록부 `src/core/chapter.js`): 장 하나 = 파일 하나. 그 파일에 컷신(장면 그리기·대사)·스테이지(`zones`)·몬스터(`mons`)·보스 패턴(`ai`)·스테이지 배경(`themes`: 팔레트 + `ground`/`decor` 함수, 그 장 소품 `d*`)·장비(`items`)·도감 세트(`book`, `mul` = 모으면 공격·방어 배수)·착용 세트(`eqSets`)·헤어(`hair`, need `chN`)·업적(`ach`)·컷신 장면 이름(`cut`)·이야기(`story` = prologue / stages{장 안 스테이지 순번: [제목, 장면]} / ending)·엔딩 화면 문구(`end`)를 모으고 맨 아래 `regChapter({...})`.
  - `regChapter`가 공용 표(ZONES·MONS·ITEM_DEFS·BOOK_ALL·BOOK_SETS·EQ_SETS·HAIRS)에 넣고 `CHAPTERS[c]`·`CH_Z0[c]`(첫 스테이지 번호)·`CH_BASE_L[c]`를 채움. 보스 패턴(`AI`, game.js)·배경(`THEME`, world.js)·업적(`ACH`, achv.js — 기본 업적 사이에 장 순서로)·컷신 장면(story.js `renderCut`)·이야기 다시보기(`REPLAY`, replay.js)는 CHAPTERS를 읽어 씀. ORDER: data → chapter → chapters/ch1~4 → world …
  - **새 장 추가** = `src/chapters/chN.js` 하나(위 항목) + ORDER에 `'chapters/chN'` + 몬스터 도트(sprites) + 장비 아이콘·희수 모양(`ITEM_ICON`·`HEE_LOOK`) + 서버 장비표 갱신. `tests/unit/chapter.test.mjs` 「장 등록부」가 스테이지·몬스터·보스 패턴·이야기·헤어·도감 세트를 자동 검사. 공용 함수는 장 번호로: `chOpen(pd, c)`(앞 장 1번 클리어 + 그 장 `lv`, 각성하면 레벨 조건 통과)·`chClr(pd, c)`·`chOf`·`zoneCh`·`chFinish`·`showEndCh`.
- **챕터 진행**(`src/core/chapter.js`): ZONES 0~3 = 1장 에버랜드, 4~7 = 2장 유료 바다낚시터(주차장·낮낚시·밤낚시·대물탕). 진행도는 장별 — 1장 `pd.zone`/`pd.cleared`, 2장 `pd.ch2 {zone, cleared, intro, seen}`, 고른 장 `pd.chap`. 「모험 계속하기」= `adventureGo` → `curZone(pd)`. 스테이지 이동은 `setCurZone`.
  - 2장 해금: 1장 1번 클리어 + Lv30(`CH2_LV`). 난이도 `zoneL`: 2장은 `CH2_BASE_L`(9 = 1장 10회차) + loopEff(2장 회차). `G.zone >= 3` 같은 식으로 1장 마지막 판단 금지 → `zoneCh`/`isChLast` 사용. 운영자 선물 `stage`·레이드는 1장 기준(`CH1_N`). **할로윈파티**(11/28, `infBasis`, play/inf.js): 맵·몬스터는 1장 진행 위치(에버랜드), 난이도 단계는 1~4장 중 가장 어려운 곳(장마다 진행 중 회차 — 첫 스테이지면 마지막으로 깬 회차 — 의 `zoneL` 최대, 시작 안 한 장은 제외). 시작 배너 「N장 M회차 난이도 · 맵」. 테스트 `tests/unit/inf.test.mjs`.
  - 2장 첫 회차 이야기: 프롤로그(주차장) · STAGE 6 입장(밥하러 온 거지?) · STAGE 7 입장(장비만 좋았다면→당장 팔아 / 잠만 잘 거면 오지 마 / 오빠 납치) · 엔딩(연장할까..? → 다음 데이트는 희수 마음대로, 3장 떡밥). 2장 중간 이야기는 스테이지별로 처음 한 번(`ch2.seen`), 자동사냥이어도 나옴.
  - 밤낚시(theme `night`)는 `drawDarkness`로 희수·랜턴·출구 주변만 보임. 바다 테마는 가장자리 산울타리 대신 바다(`THEME.sea`).
  - 보스: 주차 빌런 트럭(돌진·경적) · 핑크 참돔 왕(점프 물보라) · 대물 농어 장군(연속 돌진) · 월척 중국 대왕자바리(빨아들이기·물대포). 낚시 장비 7종(`bossOnly`: 보스 확정 드롭 전용, 일반 드롭 풀 제외, 도감 별도 세트 「2장 낚시 장비」 공격·방어 +4%). 도감 총 51칸. 업적 c2n·c2·c2x5, 헤어 「바다 블루」(2장 클리어).
- **3장 사직 야구장**(ZONES 8~11, `src/chapters/ch3.js`): 챕터 코드는 1~3장 공통(`zoneCh`·`chOf(pd, c)`·`chFinish(c)`·`chStageStory`·`showEndCh`, `CH_Z0`/`CH_BASE_L`). 해금: 2장 1번 클리어 + Lv50(`CH3_LV`), 난이도 `CH3_BASE_L`=20. 진행도 `pd.ch3`. 로비 챕터 버튼은 2장을 깬 뒤 3개.
  - 스테이지: 매표소(새치기 아저씨·암표상·비둘기 / 새치기 대마왕: 예고 원→순간이동 끼어들기) · 먹거리 존(치킨 박스·떡볶이 컵·음료 컵 / 통닭 대장: 돌진·닭다리 부채꼴) · 1루 응원석(파울볼·막대풍선·상대팀 깃발 / 상대팀 응원단장: 확성기 부채꼴·응원가 음표) · 9회말 그라운드(비 `drawRain`, 우천취소 먹구름: 번개 예고 원 여러 개·소나기). 테마 `gate/food/stand/field`(`THEME.wall`: 가장자리 콘크리트 외벽).
  - 이야기(실제 에피소드 없음 → 희수 말버릇으로): 새치기에 「뭐?????!!!!!!」, 치킨만 먹는 오빠 「…진짜 이 남자가.」, 「몇 회야? 공 어디 갔어?」→ 상대 홈런 → 멘헤라 → 「소리 안 지르면 집에 혼자 가. 표 값 아까우니까」, 9회말 우천취소, 엔딩 끝내기 역전 → 4장 떡밥(보리랑 애견 운동장).
  - 경기 장면(`ch3.js` `bbGeo`·`bbDiamond`·`bbPlay`, 컷신·스테이지 공용): 응원석 컷신은 경기장(외야 관중석·펜스·내야·선수)과 투구 반복, `A.hr`=상대 홈런(담장 넘김·베이스 일주), 엔딩 `A.walk`=끝내기 안타, 우천은 방수포. 응원석 스테이지는 위쪽(y<196)이 그라운드(`W.field`)고 14초마다 홈런. 그라운드는 못 들어감(`W.top` = 희수·보리·몬스터 위쪽 한계, 기본 34), 출구는 가운데 계단 맨 위(`W.gate.y` = FY+74).
  - 응원 장비 7종(신화·`bossOnly`·`ch: 3`, 구단 로고 없음): 응원 야구 배트·홈 유니폼·응원 야구모자·야구 스파이크·응원 도구 가방·보리 응원 조끼·보리 야구공 장난감. 도감 세트 「3장 응원 장비」(공격·방어 +5%) → 도감 58칸. 업적 c3r·c3·c3x5, 헤어 「응원 레드」(3장 클리어). 시뮬레이션: Lv50 봇 첫 회차 약 14분·사망 0.
- **4장 결혼 대작전**(ZONES 12~15, `src/chapters/ch4.js`, 11/25): 해금 3장 1번 클리어 + Lv50(`CH4_LV`), 난이도 `CH4_BASE_L`=24, 진행도 `pd.ch4`(챕터 코드는 `chKey(c)`='ch'+c로 일반화). 로비 챕터 버튼은 3장을 깬 뒤 4개 — **한 줄 4칸**(`.tchap.c4`, 「N장」 아래 이름, 모험 카드 `.tadv` 안).
  - 이야기(사용자 실제 에피소드): 프롤로그 낚시터 프러포즈(지렁이 통 옆 반지 → 빡침) → 웨딩홀 투어(견적서·추가금) / STAGE 14 입장 드레스 투어(오빠가 「응 좋아, 너무 좋아」만 = 좋아무새 → 멘헤라) / STAGE 15 입장 웨딩 촬영(턱시도 단추 안 잠김 = 감량 실패) / FINAL 입장 사진 셀렉(오빠 모바일게임 → 핸드폰에서 게임 마왕 → 「사진 다 고를 때까지 아무 데도 못 가」, FINAL 스테이지는 **사진 셀렉실**에서 싸움 — 본식으로 바로 건너뛰지 말 것) / 엔딩 본식(「사진도 다 골랐다 → 본식 날 · 오빠 핸드폰 줘」 → 「응! 좋아!」 → 「평생 잘할게요」, 「오빠, 평생 잘해」) → 5장 신혼여행 떡밥. 3장 엔딩 떡밥도 「낚시터에서 할 말이 있어」로 바꿈.
  - 컷신 장면 `whall`·`wdress`·`wstudio`·`wselect`·`wwed`(`drawWedCut`, 좌표는 화면 폭 `SW` 비율로 — 모바일 컷신 폭은 약 130), 배우 `A.hee.wed`(웨딩 팔레트 `WED_PAL` → `drawHeeAt` opts.pal / `heeSet(over)`)·`bouquet`, `A.hus.tux`(턱시도 `husTuxSpr`)·`phone`, `A.ring`, `A.bori.ring`.
  - 스테이지·테마: 웨딩홀 투어 `hall`(영업왕 웨딩플래너·날아다니는 견적서·추가금 옵션 / 추가금 대마왕: 견적서 사방 발사·「부가세 별도」 도장 예고 원·옵션 호출) · 드레스 숍 `dress`(피팅룸 마네킹·레이스 리본·시침핀 / 좋아무새: 「응 좋아!」 돌진·하트 소용돌이·리본 호출) · 웨딩 스튜디오 `studio`(플래시 조명·금빛 반사판·연사 카메라 / 감량 실패 턱시도: 숨 참고 점프 내려찍기·단추 부채꼴·치킨 호출) · 사진 셀렉실 `select`(모니터 벽·셀렉 책상·인화 사진, 가챠 캡슐·연사 카메라·견적서·플래시 / 모바일 게임 마왕: 3갈래 레이저·과금 코인 소나기·가챠 10연차). 새 탄 `heart`·`coin`·`button`·`flash`.
  - 웨딩 준비 장비 7종(신화·`bossOnly`·`ch: 4`, 거래 가능): 프러포즈 반지 상자(무기, 반짝이 던지기)·본식 2부 드레스·진주 헤어핀·웨딩 하이힐·축의금 봉투 클러치·보리 링베어러 턱시도·반지 쿠션. 도감 세트 「4장 웨딩 준비 장비」(모으면 공격·방어 +6%, 도감 65칸)와 별개로 **착용 세트**(`EQ_SETS` wed4, data.js / `eqSetN`, game.js — 사용자 요청 11/25: 7개를 모두 끼고 있어야) 공격·방어·최대 HP +15% — 도감은 도감, 착용은 착용(둘 다 붙음). 장비·보리 탭에 세트 카드 `eqSetHtml`(조각 하나라도 있으면 보임). 업적 c4s·c4·c4x5, 헤어 「웨딩 펄」(4장 클리어). 서버 장비표 73종(거래 가능 45종).
- **5장 신혼여행 전날 밤의 꿈**(ZONES 16~19, `src/chapters/ch5.js`, 11/28 사용자 시나리오): 해금 4장 1번 클리어 + Lv50, 난이도 `baseL` 28, 진행도 `pd.ch5 {…, sword}`. 장 정의 `kid: true`(어린 시절)·`noBori: true`(보리 없음 — startZone 이 G.bori 안 만듦, HUD 보리 칸 숨김)·`onZone`(입장 처리)·`gate`(「모험 계속하기」 전 조건, adventureGo).
  - 어린 시절 판정 `kidNow()`(core/chapter.js — 필드·메뉴 중이고 컷신·로비·다른 모드 아님): 희수 그림이 어린 희수 `kidSet()`(hee2 `kidPaint`, 양갈래·노란 티·분홍 치마), 대화 얼굴도 어린 희수, 쓰러지면 오빠 대신 아빠가 일으켜 줌(fx 'dad'). 컷신에선 배우 `A.hee.kid`·말하는 사람 'kid'/'dad'(아빠)/'bro'(동네 형들), 아빠 `dadPaint`·형들 `broPaint(v)`.
  - 이야기: 프롤로그 신혼집 짐 싸기(오빠 낚싯대 → 「빼.」) → 잠듦 → 공장 옆 골목(형들과 숨바꼭질하다 길 잃음, 「보리가 누구였더라?」) / STAGE 18 아빠 목공소(아빠 낚시 생각 사념 → 「왜 내 주변 남자들은 다 낚시야」) / STAGE 19 공터(아빠가 나무자재를 나무칼로 → 형들과 칼싸움) / FINAL 집으로 가는 길(「나 신혼여행 가야 했던 것 같은데…?」, 5분만 더 시계) / 엔딩 알람에 깸·손에 나무칼 → 6장 신혼여행 떡밥.
  - 보스: 술래 그림자(반투명 숨기→「찾았다!」·조약돌 소용돌이) · 월척 사념(낚싯줄 3갈래·내려찍기) · 골목대장 형(회전베기 원·돌진·나무 조각 부채꼴) · 5분만 더 시계(Zzz 소용돌이·가짜 알람 원·째깍 시계 호출). 새 탄 `pebble`·`chip`·`zzz`, 몬스터 `m.stick`(나무 막대 그림)·`e.ghost`(투명도). 보스 확정 장비·도감 세트 없음.
  - **버려진 나무자재**(`woodplank`, 일반) / **기억을 되찾은 나무칼**(`woodsword`, 초월 = 맥북프로와 같은 능력치): 둘 다 `quest`(판매·거래·분해·도감·드롭 제외 — tradableKey·canDismantle·BOOK_ALL·bookIds·item_defs 생성기). 나무자재는 배달앱 맨 위에서 10만G(`WOOD_PRICE`), 4장 클리어 후 나무자재·나무칼 둘 다 없을 때 하나만(`woodBuyable`·`buyWood`).
  - 첫 회차 STAGE 17~18(`ch5NeedWood`): 나무자재를 무기로 껴야 들어감(`ch5Gate` 확인 창 — 없으면 배달앱으로), 필드에선 무기 못 바꿈(`ch5WeaponLocked`, 메뉴 equip). 5장 필드에서 나무자재(`memory`)를 들면 `memoryKey`가 가진 가장 센 무기의 능력치·강화·레벨·돌파를 빌림(무기 모양은 나무자재). STAGE 19 입장(`ch5OnZone` → `ch5Sword`, 한 번): 나무자재 → 나무칼(강화·레벨·재련 이어받고 착용, `pd.ch5.sword`), 그 뒤엔 무기 자유. 업적 k5s·k5·k5x5, 헤어 「추억 브라운」. 서버 장비표 75종(거래 가능 45종). 테스트 `chapter.test.mjs` 「5장」·`tests/e2e/ch5.spec.mjs`.
- **이야기 다시보기**(`src/story/replay.js`, ORDER에서 story 뒤, 11/25): 메뉴 「이야기」 탭(`MREN.story` → `replayHtml`, 클릭 `data-m="replay"` data-v=`장:번호` → `replayPlay`). `REPLAY` 표 = 장별 프롤로그·스테이지 입장 이야기·엔딩, 본 것만 열림(1장 프롤로그 항상·엔딩은 1회 클리어, 2~4장 프롤로그 `intro`·스테이지 `seen[z]`·엔딩 `cleared`). 보고 나면 로비 메뉴(또는 플레이 중 메뉴)의 「이야기」 탭으로 돌아옴, 세이브는 안 바뀜. `REPLAY`는 장 파일의 `story`(prologue·stages·ending)에서 자동으로 만듦 — 스테이지 입장 이야기는 `story.stages`에 넣으면 끝.
- **회차 보상**(`src/features/goal.js`): 총 회차 `loopsTotal` = 1~3장 클리어 합계. `LOOP_MS` 이정표 3·5·10·15·20·30·40·50·75·100(이후 25마다): 강화석(11/22 축소: 3~100 합계 2,430개, 100 이후 25회차마다 500)·자동사냥·`tr`(초월 장비 확정, 안 가진 것 중에서·다 있으면 강화석 120)·한정 헤어(20회차 `wine`, 50회차 `aurora`). 칭호는 ACH `lp30`·`lp50`·`lp100`. 로비 보상함 시트 `#tGoal` → `msOpen`(목록·한 번에 받기 `msClaim(0)`), 예전 기록도 소급. 세이브 `pd.ms {회차: 받은 시각}`, `pd.msSeen`(플레이 중 새 이정표 알림 `msWatch`). 보상 반영 공통 함수 `applyRewards(pd, [[kind, v]])`.
- **보스 타워**(`src/play/tower.js`, 1장 1번 클리어 후): 로비 모드 타일 `#tTower` → `#tower` 로비 → `startTower(f)`. 층마다 보스 1마리(`TOWER_BOSSES` 1~3장 순서로 반복)·90초, 다음 층(최고+1)만 도전·횟수 무제한. 보스 능력치는 `TOWER_REF`로 통일: 체력 `towerHpL`(10층 이후 층당 2단계)·공격 `towerL`(층당 1.2단계), 10층마다 대장(체력 ×1.6/1.3). `G.tower`가 있으면 `loopLv`=towerL, 스포너 대신 `towerUpdate`, 보스 처치→`towerEnd(true)`, 사망·시간 초과→`towerEnd(false)`. 첫 돌파 보상 `towerReward`: 강화석 10+4f(10층마다 2배)·5층마다 자동사냥 30분·10층마다 초월 장비·30층 헤어 `flame`. 칭호 ACH `tw10`·`tw30`·`tw50`. 세이브 `pd.tower {best}`. 시뮬레이션(실제 세이브·자동): 2장 진입급 약 11층 · 안녀엉급(+15~20) 약 34층(30층 대장이 벽) · 전부 +25 약 54층.
  - 도전 모드 4개(할로윈·PvP·월드 보스·보스 타워)는 로비 「도전」 탭 시트에 2×2.
- **골드 소모처**(`src/features/refine.js`, 엔드급 골드 수입 ≈ 시간당 110만~300만G):
  - 강화석 교환소(배달앱 탭 맨 위): 하루 300개(`XCH_MAX`), 1~100개 3,000G · 101~200 6,000G · 201~300 12,000G (300개 = 210만G). 「살 수 있는 만큼」은 `xchPlan`으로 개수·값을 보여주는 확인 창 후 교환. 세이브 `pd.xch {day, n}`.
  - 장비 재련(장비·보리 탭 강화 카드 아래): 장비마다 추가 옵션 일반·희귀 1줄 / 영웅·전설 2줄 / 신화·초월 3줄, 옵션 등급 일반 70·희귀 22·전설 7·신화 1%(신화는 최대치 1.5배까지). 값 `REF_COST` 등급별 5만~150만G × (1 + 잠근 줄 수). 옵션: 공격·방어·HP·치명·치명 피해·이동·보스 피해·골드(보리 장비는 보리 공격·HP·보스·골드). 세이브 `pd.ref[itemId] {lines, n}`. `calcStats`가 `refSum`으로 반영 → snap 값에 자연히 들어가서 서버 전투력 공식 변경 불필요. 보스 피해(`st.bossMul`)는 `dealDamage`에서 보스에게만(PvP 제외).
- 카드 공유(`src/features/share.js`): 랭킹 「내 카드 공유」 → 1080×1350 PNG(꾸민 희수·보리, 전투력 순위, PvP, 도감, 최고 강화). 모바일은 Web Share(파일), PC는 저장·링크 복사. 링크 `?from=닉네임` → 초대 알림 + 랭킹 열림.
- **전직**(11/25, `src/features/job.js`, ORDER에서 game 뒤): Lv50(`JOB_LV`)부터 직업 1개. 첫 전직 무료, 바꾸면 강화석 2,000 + 1,000만G(`JOB_COST`) — **베타 기간은 자유 전직 무료**(`JOB_BETA.free = true`, 정식 때 false로). 세이브 `pd.job`·`jobN`·`jobGift`. `jobApply`가 calcStats 끝에서 적용(→ snap atk·def·hp에 자연히 반영, 서버 공식 변경 없음), snap `job` → `jobTag`(로비 프로필·랭킹·PvP·광장 목록). 로비 프로필은 1줄 칭호 / 2줄 `[직업] 닉네임`(`.tpnm`, 사용자 요청 11/25).
  - 개발자(맥북프로 `starstick`: 공격 ×1.2, 신화 무기도 맥북 장비 레벨 재료 `jobFeedOk` / 항상 스킬 위력 +15%) · 커리어우먼(사원증 `goldpan`: 공격 속도 `st.rateMul` 1.2·카드 관통 `st.pierce` 3, 핸드백 `limitbag`/`clutch` 치명 +5% / 항상 골드 ×1.2) · 응원단장(응원 장비 1개당 공격 +4% 최대 5 / 항상 보리 +20%·동료 `st.buddyMul` 1.3) · 새신부(웨딩 장비 1개당 HP·방어 +7%, 3개면 5초마다 HP 3% 회복 `st.regen`·`jobTick`, 보리 +10% / 항상 HP ×1.15·방어 ×1.1) · 낚시왕(낚시 장비 1개당 공격 +4%·드롭 `st.dropMul` +6% 최대 5 / 항상 보스 피해 +15%).
  - **직업 장비 보정**(11/25, `jobSigDef`·`JOB_TOP`): 지금 직업의 대표 장비(`JOBS[j].sig`)는 calcStats에서 기본 능력치가 능력치마다 max(원래 값, 그 부위 초월 장비 값)으로 올라감 — 대표 장비가 신화·전설이라 끼면 약해지던 문제. 무기 모양(사거리·속도)은 그대로, 장비 정의(ITEMS)는 안 바뀜. 같은 +25 기준 전투력: 직업 없음 초월 4,192 → 응원단장·낚시왕 대표 5종 약 4,500 · 새신부 약 5,080 · 개발자 약 4,570 · 커리어우먼 약 4,210(+공격 속도·관통).
  - 웨딩 세트 `bouquet`·`wdress`·`veil`(신화, `job: 'bride'`, `bossOnly`): 새신부로 처음 전직할 때 받고 바로 착용(`JOB_GIFT`, 한 번만). `job` 플래그 장비는 거래·도감·드롭·분해 제외(`tradableKey`·`bookIds`·`BOOK_ALL`·`canDismantle`, item_defs 생성기도). 서버 장비표 66종·거래 가능 38종.
  - UI: 메뉴 「전직」 탭(`MREN.job` → `jobHtml`, 클릭 `data-m="job"` → `jobAsk` 확인 창), 로비 상단 「전직 가능!」 타일 `#tJob`(Lv50·직업 없음) → `lobbyMenu('job')`. 메뉴를 열 때 고른 탭이 보이게 가로 스크롤.
- 레벨 상한 50, 이후 각성(★): 경험치로 각성 포인트 → 능력치/스킬 위력/보리 공격.
  - 곡선(2026-11-22 크게 늦춤): `xpNeed(lv) = 20·lv^XP_EXP(2.5)`, `awkNeed(aw) = AWK_BASE(60000)·(1 + AWK_STEP(0.25)·aw)`, 회차 경험치 보너스 `LM_XP` 0.2/단계(예전 0.5). 기존 레벨·각성은 깎지 않음.
- 스킬 포인트: 시작 1 + 레벨업 49 + 보리 합류 1 = 51 = 모든 스킬 max 합 (테스트 고정). 스킬 max를 바꾸면 이 합을 맞출 것. 멘헤라 공격 max 4(쿨 40·35·30·25).
- 회차(cleared) 난이도 단계는 `loopEff(cl)`: 10회차까지 1씩, 11회차부터는 `LOOP_AFTER`(0.75)씩 계속 오름(50회차 = 40단계, `LOOP_CAP`=꺾이는 지점). 화면 표시는 실제 회차.
  - 단계당 몬스터 배수 `loopMul`: 체력 +`LM_HP`(1.3)·공격 +`LM_ATK`(1.0)·골드 +`LM_GOLD`(0.4)·경험치 +`LM_XP`(0.2). 1장 첫 클리어 전엔 보스 체력 ×0.7·공격 ×0.75(`FIRST_BOSS`).
  - **고회차 가속**(`lmFast`): 30단계(`LM_FAST`, 1장 약 37회차·2장 약 39회차·3장 약 15회차)를 넘으면 단계마다 체력 ×1.05·공격 ×1.03·골드 ×1.02가 더 곱해짐(경험치는 그대로). 할로윈(가장 어려운 장 기준)도 같이 적용, 보스 타워는 자체 공식이라 영향 없음. 시뮬레이션(원조희수 전부 +25): 1장 51회차 한 바퀴 약 9분 → 57회차 약 13분(보스에서 HP 25%) → 63회차 STAGE 4 보스에서 막힘. 3장 15회차 약 14분 → 23회차 약 22분(HP 5%·남편 부활). 안녀엉(+15~20): 2장 27회차 약 21분 → 39회차 스테이지당 약 8분·HP 6%. 막히면 돌파·재련으로 뚫는 구조.
  - 2026-11-22 목표 = **성장 느리게 + 자주 막힘**. 시뮬레이션(새 세이브·자동·간단한 강화 판단): 1장 첫 클리어 약 8분·사망 0, 1장 2·3·5·6·9회차 보스에서 20~70분씩 막힘, Lv30(2장 해금) 약 5시간, 2장 1회차 STAGE 5~7 각 약 1시간, 2장 5·6회차 80~95분 막힘, 13시간에 Lv49. 보스 타워 공격력은 자체 계수(0.35/단계) 유지.
- **자동사냥 베타 무제한**(11/27 사용자 요청, `AUTO_BETA.free = true`, auto.js): 하루 쿠폰·보너스 시간을 줄이지 않고 언제든 켜짐, HUD 버튼 「무제한」. 받은 보너스 시간은 그대로 쌓여 있다가 정식 때(false) 쓰임.
- 자동사냥: 출구가 열리면 근처 드롭만 줍고 출구로 이동 → 다음 스테이지에서도 계속. **이야기는 자동사냥 중에도 전부 나옴** — 컷신·필드 대사는 `dlgAuto`가 2.4초마다 저절로 넘김. 마지막 스테이지는 (첫 클리어가 아니면) 엔딩 컷신 후 결과 화면 없이 바로 다음 회차 STAGE 1.
- **오빠는 언제나 찌낚시대를 들고 있음**(사용자 요청 11/25): 컷신·필드 등장·미니게임 모두 `drawHusRod(hx, gy, T, lying?)`(render.js — 대·릴·낚싯줄·찌 `drawFloat`), 잠잘 땐 옆에 눕혀 둠. 낚싯대를 내려놓는 연출 만들지 말 것. `A.hus.rodUp`은 들어 올린 자세.
- 메달·리본은 픽셀 아이콘 `PXI(k)`/`MEDAL(rank)`(rank.js, ICONS.medal1~4·rosette·trophy). 이모지 메달 쓰지 말 것.
- 출석·일일 미션(`src/features/daily.js`): 출석 7일 주기(누적, 빠져도 초기화 X, 7일차 골드×5+강화석 50+자동사냥 2시간). 미션은 날짜로 4개(항상 몬스터 150마리 포함), 4개 다 받으면 자동사냥 30분. 골드 보상은 `dailyGold(pd)`(레벨·회차 비례) 배수.
  - 진행 집계는 `dailyAdd(kind)`: kill/boss(killEnemy) · enh(tryEnhance) · pvp(pvpEnd) · wave(infKill) · ep2(e2End). 새 미션은 `MISSIONS`에 넣고 해당 지점에서 dailyAdd 호출.
  - e2e `withSave`는 기본으로 오늘 출석 완료 상태(출석 창이 다른 테스트를 가리지 않게).
- 첫 걸음 가이드(`src/features/guide.js`): 신규 세이브 `guide: 0` → 7단계(5마리·스매싱 배우기·써보기·무기 착용·강화·보리 합류·STAGE1 보스), 단계마다 확정 보상, 상단 카드 + 대상 버튼 `.gpulse`. 사건은 `guideEv('kill'|'skill:<id>'|'enh'|'boss')`, 상태 단계는 0.5초마다 `guideCheck`. 예전 세이브는 Lv5+·2스테이지 이후면 건너뜀. e2e `withSave` 기본 `guide: 99`.

## Supabase (project ref `ujxuzduomfssguibnjux`)
- **공용 숫자 한 곳 + 서버 SQL 자동 생성**(11/28 구조 개편 ④): 게임과 서버가 같이 쓰는 숫자는 `src/core/rules.js` `RULES` 하나 — 전투력 계수(`power`, 게임 `powerOf`)·랭킹 스냅샷 상한(`snapMax`)·시즌 보상(`season`, 이름표 `seasonLabel`·글 `rewardTxt`)·월드 보스(`raid`: 하루 횟수·피해 상한·보상)·동료 데려가기(`buddy`)·경매장(`auc`)·1:1 교환(`xchg`)·서버 세이브 검사 한도(`save`).
  - 서버 함수 틀 `supabase/fn/<함수>.sql`(운영 DB `pg_get_functiondef` 모양 그대로, 숫자 자리는 `{{raid.tries}}`·`{{tier season.s r.rk}}`·`{{list auc.hours}}`·`{{pct auc.fee}}`·`{{below xchg.minGold}}`) → `npm run sql`(`build/gen-sql.mjs`) → `supabase/gen/functions.sql`(운영 DB 에 실행) + `supabase/gen/check.sql`(운영 DB 에서 돌리면 생성본과 다른 함수만 나옴 — 빈 결과 = 같음). 지금 틀 15개: hb_power·hb_submit_fighter·hb_season_rollover·hb_raid_info/start/report/settle·hb_borrow_friend·hb_auc_min/list/close·hb_xchg_ok/propose/pay·hb_save_push.
  - **숫자를 바꾸는 순서**: rules.js 수정 → `npm run sql` → `npm run check` → 운영 DB 에 `supabase/gen/functions.sql`(바뀐 함수만이라도) 실행 → `check.sql` 빈 결과 확인 → 푸시. 서버 함수 로직을 고칠 땐 틀 파일을 고치고 같은 순서(운영 DB 를 직접 고치면 check.sql 에 걸림).
  - 테스트: `tests/unit/sql.test.mjs`(생성본 최신·틀 문법·rules 값이 전부 어느 틀에선가 쓰이는지·전투력 식), `tests/unit/rules.test.mjs`(MAX_LV·BRK_MAX = 서버 상한, 스냅샷 전투력 = powerOf, 회차·패키지·출석 한 번 보상 < 세이브 검사 기본 한도).
  - 아직 틀로 안 옮긴 서버 함수(거래 보관·광장·전송 코드 등)는 숫자를 클라와 안 나눠 써서 그대로 둠. `supabase/schema.sql`·trade/auction/xchg.sql 은 처음 만들 때 기록(최신 아님) — 최신은 운영 DB, 틀로 옮긴 건 supabase/fn.
- `hb_fighters`(랭킹·PvP 등록, 익명 로그인 user_id), `hb_battles`, `hb_grants`(운영자 선물함), `hb_saves`(클라우드 세이브), `hb_transfer_codes`(기기 옮기기). 스키마: `supabase/schema.sql`.
- 클라우드 세이브(`src/net/cloud.js`): `saveGame`/`e2SaveNow` 때 1분에 한 번 업로드. 기기 옮기기 = 옛 기기 코드 발급 → 새 기기 `hb_use_transfer_code` (세이브·닉네임·전투기록·미수령 선물 이동) → localStorage 덮어쓰고 새로고침.
- **계정 연결**(`src/net/account.js`, 기기 옮기기 창 맨 위 「계정 연결」): 익명 계정에 `SB.auth.linkIdentity`로 구글·카카오 연결(같은 user_id 유지 → 세이브·랭킹·선물 그대로). 다른 기기는 「로그인해서 불러오기」= `signInWithOAuth` → 돌아오면 `accBoot`가 `hb_saves`를 localStorage에 쓰고 새로고침(`accApply`). 그 계정에 희수가 없으면 `hb_acc_release()`로 빈 계정 삭제 후 원래 익명 세션 복구(`hb_acc_prev`). 로그인한 계정은 시작할 때(타이틀) 서버 세이브 `svT`가 이 기기보다 최근이면 자동으로 받아옴(`saveGame`이 `svT` 기록). 켜진 로그인 방법은 공개 `/auth/v1/settings`(`accFetchProv`)로 확인 — 없으면 「곧 열려요」. e2e 가짜 SB에 `auth`(`__user`·`__oauth`)와 `accFetchProv`(`__prov`) 있음.
  - **연결 필수**(11/24, `accGate`·`accGateShow`, `#accGate` z-index 92·닫기 없음): 로비(타이틀)에서 구글·카카오에 연결 안 된 희수는 연결 창이 떠서 못 넘어감 — 「○○ 계정으로 연결」(세이브 없으면 「시작」) / 「로그인해서 불러오기」. 연결 취소·실패·빈 계정 로그인 후에도 다시 뜸. 서버에 못 붙거나(오프라인·테스트 차단) 켜진 로그인 방법이 없거나 원터치판이면 막지 않음. `showTitle`마다 `accGateShow`.
  - 대시보드 설정(운영자): Auth → Providers 에서 Google·Kakao 켜기(각 개발자 콘솔 키), "Allow manual linking" 켜기, URL Configuration → Redirect URLs 에 `https://byeongjaeyu.github.io/heesoo_bori/**`.
- **서버 세이브 검사**(`hb_save_push(p_data, p_ep2)`, cloud.js `cloudPushNow`): 클라이언트는 `hb_saves`에 직접 못 씀(insert·update 권한 없음). 서버가 지난 세이브와 비교해 지난 시간(최대 24시간)·그 사이 받은 선물(`hb_grants`)로 설명 안 되는 증가(골드 5천만+3천만/시간, 강화석 5천+1,500/시간, 각성 30+15/시간, 회차 5+15/시간, 자동사냥 12시간+2시간/시간)나 범위 밖 값(Lv>50, 강화>30, 음수)이면 거절 → 마지막 정상 세이브를 돌려줌 → `cloudRevert`가 그걸로 되돌리고 새로고침(`SAVE_LOCK`으로 그 사이 저장 막음). 시작할 때 `accBoot`가 한 번 검사 업로드. 거절 기록: `select * from hb_flags where kind = 'save_reject' order by at desc;`. 새 재화·큰 보상을 만들면 이 한도를 넘지 않는지 확인할 것.
- **거래 기반**(돈·장비, 거래 방식은 아직 — `supabase/trade.sql`, `src/net/trade.js`): 
  - 서버 장비표 `hb_item_defs`(= `supabase/item_defs.sql`, `tests/unit/itemdefs.test.mjs`가 ITEMS에서 자동 생성·비교. **장비를 추가·변경하면 `UPDATE_ITEM_DEFS=1 npx vitest run tests/unit/itemdefs.test.mjs` 후 운영 DB에 적용**). 거래 가능 = 전설(3) 이상·시작 장비 제외(`TRADE_MIN_RAR`, 게임·생성기 같게 테스트 고정).
  - 장비 등록부 `hb_items`(owner·okey=세이브 키·def·강화/레벨/재련·state own/escrow/deliver/gone·src legacy/save/trade): `hb_save_push`가 세이브에 새로 생긴 거래 가능 장비를 자동 등록(신화↑ 새 장비 한 번에 6+3/시간+`items` 선물 7개 넘으면 거절 'items'), 세이브에서 사라지면 gone, 강화 등 최신값 반영. 넘긴 키는 `hb_item_gone`(묘비) → 다시 올리면 거절 'item_gone', 보관 중 키가 있으면 'escrow'.
  - 보관(에스크로) `hb_escrow`: `hb_escrow_put(kind, amount, key, ref)`(돈 gold·stones 또는 장비 키, 서버 세이브에서 바로 빼고 보관, 착용 중·미등록·50개 초과 거절) → `hb_escrow_settle(id, to, reason)`(**서버 전용**: 거래 방식 함수가 부를 것. 돈은 받는 사람 `hb_grants`, 장비는 `hb_items` state 'deliver' + 새 키 `이름#t…`) / `hb_escrow_cancel(id)`(맡긴 사람에게 같은 방식으로 반환) / `hb_escrow_mine()` / `hb_claim_items()`(받을 장비 목록, 읽기만 — 세이브에 넣고 올리면 own 확정). 기록 `hb_ledger`. 보관한 돈은 `hb_save_push` 증가 한도에서 빼서 되살리기 막음.
  - 클라: `tradePut(kind, v, ref)`(먼저 `cloudSync`, 성공하면 세이브에서 빼고 장비 키는 `pd.tkeys`에 — `newItemKey`가 다시 안 씀), `tradeCancel(id)`, `tradeMine()`, `tradeClaim()`(rankSyncNow에서 선물 받은 뒤 자동). e2e 가짜 SB에 `__escrow`·`__deliver`.
  - 기기 옮기기(`hb_use_transfer_code`)는 등록부·묘비·보관 중인 것도 같이 옮김.
- **경매장**(`src/net/auction.js`, 서버 `supabase/auction.sql`): 로비 「상점·거래」 시트 「경매장」 `#tAuc` → `#auc`(z-index 82, 로비 위). 랭킹 닉네임 등록(숨김 아님) 희수만(`hb_auc_ok`).
  - 올리기 `hb_auc_list(key, 시작가≥1,000, 즉시구매가|null, 12/24/48시간)`: 전설↑·안 낀 장비를 보관(`hb_escrow_put`)하고 `hb_auctions`에 강화·레벨·재련 그대로 기록. 한 사람 동시 10개.
  - 입찰 `hb_auc_bid(id, 금액)`: 최소 = 시작가, 이후 현재가 +5%(`hb_auc_min`). 입찰 골드는 보관, 밀린 사람은 바로 선물함 반환. 즉시 구매가 이상이면 즉시 구매 → 바로 마감. 마감 1분 전 입찰이면 1분 연장. 자기 물건·이미 최고 입찰이면 거절.
  - 마감 `hb_auc_close`(서버 전용): 낙찰자에게 장비(받을 장비), 판매자에게 골드 - 수수료 5%(선물함, 수수료는 사라짐 = 골드 소모처, `hb_ledger` 'auction_fee'). 입찰 없으면 유찰 → 판매자에게 장비 반환. pg_cron `hb_auc_close_due` 5분마다 + 둘러보기·입찰·내 경매 열 때도.
  - 취소 `hb_auc_cancel`(입찰 없을 때만), 목록 `hb_auc_browse(부위|'bori'|'', 최소 등급, end/low/high/new)`·`hb_auc_mine()`(판매 중·입찰 중·7일 결과).
  - 클라: 열 때마다 `claimGifts`+`tradeClaim`으로 반환·대금·장비부터 받음. 입찰·올리기 전 `cloudSync(true)`, 성공하면 로컬 골드 차감/장비 제거(`pd.tkeys`). e2e 가짜 SB `__auc`·`__aucCalls`.
- **1:1 교환**(`src/net/xchg.js`, 서버 `supabase/xchg.sql`, 경매장 창 4번째 탭 「1:1 교환」): 제안 → 수락. 상대가 접속해 있지 않아도 됨. **하루 한도 없음**(사용자 요청).
  - 자격 `hb_xchg_ok`: 랭킹 닉네임(숨김 아님) + 서버 세이브 Lv30 이상 + 구글·카카오 연결 계정(`auth.identities`). 안 되면 'nick'/'lv'/'link' → 탭 위 안내(계정 연결 버튼).
  - `hb_xchg_find(닉네임)`: 상대의 전설↑·착용 안 한 장비 목록(hb_items id). `hb_xchg_propose(닉네임, 내 장비 키[], 골드, 상대 장비 id[], 원하는 골드, 한마디 40자)`: 한쪽 장비 5개까지, 골드 0 또는 100G 이상, 양쪽 다 뭔가 줘야 하고 장비가 최소 1개(골드끼리 교환 불가), 강화석 불가, 보낸 제안 10개까지. 내 것은 바로 보관(`hb_escrow_put`).
  - `hb_xchg_accept(id)`: 받는 사람(B)의 장비·골드를 보관한 뒤 한 번에 맞바꿈(`hb_xchg_pay`: 장비 → `hb_escrow_settle` 받을 장비, 골드 → 받는 쪽에 **수수료 5%** 뗀 금액 선물함, 수수료 `hb_ledger` 'trade_fee' = 골드 소모처). `hb_xchg_cancel(id)`: 보낸 사람 = 취소, 받은 사람 = 거절 → 보낸 사람에게 반환. 24시간 지나면 `hb_xchg_expire_due`(pg_cron 10분마다 + mine·accept 때)가 반환. `hb_xchg_mine()` = {why, list(in/out, 받는 쪽에만 내 장비 key)}.
  - 클라: 제안·수락 전 `cloudSync(true)`, 성공하면 로컬에서 장비 제거(`pd.tkeys`)·골드 차감, 수락하면 `claimGifts`+`tradeClaim`. 표 `hb_trades`. e2e 가짜 SB `__xc`(why·list·partner)·`__xcCalls`.
- 서버 함수는 운영 DB에서 `do $$ ... raise exception 'RESULT: %' ... $$` 로 감싸 실행하면 롤백되므로 안전하게 검증 가능.
- 클라이언트는 공개(anon) 키로 RLS 범위만 접근. 테스트는 Supabase·CDN 요청을 차단하고 가짜 SB로 돔 — 운영 DB를 건드리지 말 것.
- **랭킹 등록·갱신은 `hb_submit_fighter(snap, nick)` RPC로만** (직접 쓰기 권한 없음). 서버가 `hb_power(snap)`로 전투력을 계산하고 범위 밖 값은 거절.
  - 전투력 공식은 `RULES.power`(core/rules.js) 하나 — 게임 `powerOf`와 서버 `hb_power`(틀)가 같이 씀. snap 에 새 값이 필요하면 `RULES.snapMax`·hb_submit_fighter 틀에도 추가.
  - 세이브 고유 번호 `sid`(SaveData.sid)로 같은 희수 중복 등록 차단 (기기 옮긴 뒤 옛 기기 → 'moved').
  - 의심 기록 보기: `select * from hb_flags order by at desc limit 50;` / 숨기기: `update hb_fighters set hidden = true where nickname = '닉네임';` (본인에겐 계속 보임)
- 닉네임(랭킹 등록)은 첫 걸음 가이드를 끝낸(또는 Lv5·2회차 이상) 세이브가 있을 때만 타이틀에서 물어봄(`entryRegister`). 랭킹·PvP 목록은 `played` 희수만.
- 주간 PvP 시즌 (보상표 = `RULES.season` 하나 → 화면 SEASON_REWARDS·서버 hb_season_rollover 틀): 월요일 0시(KST) `hb_season_rollover()` 정산 (pg_cron + 랭킹/PvP 열 때 `hb_season_info()`가 필요 시 정산). 보상은 선물함(note에 '시즌' → 🏆 문구). 지난 기록 `hb_season_results`.
- 월드 보스 레이드(`src/net/raid.js`, 보상·횟수·피해 상한 = `RULES.raid` → 화면 RAID_REWARDS·서버 hb_raid_* 틀): 주간 보스 HP를 모두가 깎음, 60초 도전 하루 3회(`hb_raid_start` 입장 시 차감), 피해는 `dealDamage`→`raidHit` 집계 후 `hb_raid_report`(상한 전투력×250+5만). 보스는 전투 중 안 죽음, 처치 후에도 피해량 경쟁 계속. 보스 공격은 내 최대 HP 약 3.5%/타.
- 친구 희수 데려가기(`src/net/buddy.js`): HUD 「동료」 → `hb_fighters` played 목록에서 고르면 `hb_borrow_friend(p_friend)` RPC (하루 1번 KST, `hb_borrows`). 동료는 친구 snap 공격의 50%로 15분(플레이 중에만 차감) 같이 싸우고 죽지 않음. 스테이지·할로윈·레이드 OK, PvP 제외. 세이브 `pd.buddy`. 빌려준 사람은 선물함으로 강화석 3 (하루 10번까지, note '데려갔어요' → 🤝 알림).
- **온라인 광장**(`src/net/plaza.js`): 로비 「소셜」 시트 `#tPlaza` → `plazaOpen`(랭킹에 닉네임 등록된 희수만) → 1장 정문 광장 맵(`buildWorld(0)`, 몬스터·출구 없음, `G.plaza`, body `.inPlaza`로 전투 버튼 숨김). Supabase Realtime 비공개 채널 `plaza-1`(`private: true`): Presence = 닉네임·Lv·★·칭호·꾸미기·위치(20초마다 다시 track), Broadcast `mv`(움직일 때 0.33초마다) · `chat`. 다른 희수는 `drawRival`로 그림·보간 이동.
  - 서버 권한: `realtime.messages` 정책 `hb_plaza_read`/`hb_plaza_write` → `hb_plaza_ok()`(hb_fighters에 있고 hidden 아님 + `hb_plaza_bans`에 없음). **광장에서 내보내기**: `insert into hb_plaza_bans(user_id, reason) select user_id, '사유' from hb_fighters where nickname = '닉네임';` · 신고 보기: `select * from hb_plaza_reports order by at desc;`
  - 채팅: 자유 채팅 60자, `plazaClean` 욕설 필터(글자 사이 기호·띄어쓰기도), 1.2초 간격·같은 말 반복 막기, 말풍선 6초(12자씩 3줄), 채팅 기록 최근 30줄. 접속자 목록에서 차단(내 기기 localStorage `hb_plaza_block`)·신고(`hb_plaza_report` RPC, 1시간 10건).
  - **자동 분리**: `plazaJoin(no)` — 처음 받은 접속자가 `PLAZA_CAP`(30)명 이상이면 다음 번호(`plaza-2`…, 최대 `PLAZA_MAX_CH` 20)로. HUD에 「희수 광장 N」. 무료 플랜 Realtime 한도: 동시 접속 200·초당 메시지 100·월 200만.
  - **자동 이용 정지**: `hb_plaza_report`가 서로 다른 희수 3명이 24시간 안에 신고하면 `hb_plaza_bans`에 24시간(`until`) 정지. 운영자 차단은 `until` 비움(영구). 신고는 광장 이용 가능한 희수만, 자기 자신 불가. 입장 전 `hb_plaza_status()`로 정지 안내.
  - PC: Enter=채팅 입력, Esc=빠져나오기.
  - e2e 가짜 SB에 `channel()`이 있음(`__chan.emit('presence'|'broadcast', event, payload)`, 보낸 메시지 `__sent`).
- **선물 주기** (유저가 다음 접속 때 자동 수령):
  ```sql
  insert into public.hb_grants (user_id, kind, amount, note)
  select user_id, 'gold', 1000000, '운영자 선물' from public.hb_fighters where nickname = '닉네임';
  ```
  kind: `auto`(자동사냥 초) · `gold` · `stones`(강화석) · `stage`(누적 스테이지 번호, 회차당 4: 50회차 STAGE1 = 197) · `awaken`(목표 각성 단계) · `level`(목표 레벨, 오른 만큼 스킬 포인트) · `items`(등급, 5 = 초월 장비 전 부위·보스 전용 제외, 더 높은 등급이면 자동 착용). level·items는 서버가 같은 종류를 합산하니 한 번에 1줄만 넣을 것.
  새 kind를 추가할 땐 `rank.js claimGifts`와 `p_kinds` 목록을 먼저 배포한 뒤 지급할 것 (구버전은 `auto`,`gold`만 수령).

## 메뉴 (11/28 묶음)
- 메뉴 탭 12개를 묶음 4개로(`MGROUPS`, ui/menu.js): 성장(장비·보리·스킬·전직) · 내 희수(꾸미기·도감·칭호·이야기) · 상점(음식(플레이 중만)·배달앱) · 더보기(미션·도움말). 위 줄 묶음 버튼 `.mg`(`data-m="grp" data-g`), 아래 줄 그 묶음 탭 `.msub .tab`(`data-m="tab" data-v`) — 탭이 하나뿐인 묶음은 묶음 버튼이 바로 그 탭(`data-v`). 새 탭은 `TABS`·`MREN`·`MGROUPS` 셋 다.
- 장비·보리 탭: 능력치 한 줄 → 부위 고르기 `.eqpick`(`enhSel`) → 그 부위 카드 `.eqdet` 위 [강화(+25면 한계 돌파) | 재련] 탭(`enhMode`, 시작 장비는 재련 없음) + 「장비 바꾸기 ↓」(`eqJump` → `#eqsl-부위`) → 강화석 스위치 `enhStone`(켜면 버튼이 `enhanceS`, 강화석 모자라면 꺼짐) + 「강화하기」 하나 `.egbtn` · 「가방 정리」(일괄 분해·중복 보관)는 접어 둠(`tidy`).

## 모달·팝업 만들 때 (사용자가 여러 번 지적함 — 꼭 지킬 것)
- 헤더(`.mhead`) 아래 첫 줄(탭·필터·본문)은 위 여백 **최소 10px**, 본문 좌우 여백 **10~12px**, 맨 아래 여백 14px 이상. 테두리·헤더에 버튼이나 글이 붙으면 안 됨.
- 새 모달은 배포 전에 모바일 390×844 스크린샷으로 여백을 직접 보고, e2e에 「헤더 아래 간격 ≥ 8px·좌우 ≥ 10px」 검사를 넣을 것(예: `tests/e2e/auction.spec.mjs`).
- 로비(#title z-index 60) 위에 뜨는 모달은 z-index를 그보다 높게(80대).
- 버튼 묶음이 여러 개면(탭·필터·실행 버튼) **모양을 다르게**(탭 = 큰 `.btn`, 필터 = 작은 흰 칩 `.aucchip` 같은 것, 실행 = `.btn pk`) 하고, 묶음마다 이름표(부위·등급·정렬 등)와 묶음 사이 위아래 여백 8px 이상. 같은 모양 버튼을 줄줄이 늘어놓지 말 것.

## 한글 줄바꿈 (11/25 「문구 줄바꿈 장난하나」)
- `body`에 `word-break: keep-all; overflow-wrap: anywhere` — 띄어쓰기 단위로만 줄을 넘기고(「세져/요」「무/료」 금지), 한 단어가 칸보다 길 때만 단어 안에서 끊음. 새 요소에 `word-break: break-all`을 쓰지 말 것. 좁은 칸(아이콘 아래 장비 이름 등)은 칸 폭을 넉넉히.

## 숫자 표시 (사용자 요청: 화면 숫자는 전부 쉼표)
- 4자리 이상 숫자는 항상 `1,234` 형식. HTML 글은 `numFmtBoot`(engine.js, MutationObserver)가 자동으로 쉼표를 넣고, 캔버스 글은 `txt()`·`addText()`가 `fmtNumText`로 처리. 새로 그리는 캔버스 숫자(`ctx.fillText` 직접 사용)는 `fmtNumText`/`numF`를 직접 쓸 것.
- 쉼표가 들어가면 안 되는 곳(옮기기 코드·채팅 기록 등)은 요소에 `data-raw`. 글자 바로 뒤 숫자(닉네임 `희수1234`)·날짜(`2026-11-23`, `2026년`)·장비 키(`#`)·소수는 자동으로 건너뜀(`NUM_RE`, 단위 테스트 고정).
- 숫자 입력칸은 `type="text" inputmode="numeric" class="numin"`(치는 동안 쉼표) + 읽을 땐 `numVal(selector)`(auction.js). `type="number"` 쓰지 말 것.

## 하지 말 것
- 실존 브랜드 로고·패턴(롯데 자이언츠 엠블럼, 디올 로고 등) 그리기. 이름 텍스트는 유지.
- claude.ai 공개 아티팩트 업데이트는 사용자 명시 승인 후에만.
