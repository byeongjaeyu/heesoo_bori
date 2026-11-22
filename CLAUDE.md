# 희수와 보리의 대모험 — 에이전트 작업 안내

아내 희수와 강아지 보리가 주인공인 픽셀 웹게임. 본편 RPG 1장(에버랜드 대탈출)·2장(유료 바다낚시터 대소동)·3장(사직 야구장 직관 대소동), 미니게임(보리 주세요), PvP·랭킹·할로윈파티(무한던전)·자동사냥.
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
- PC(마우스·900px 이상): `#hud`·`#ctrl`을 CSS `zoom` 1.3(1600×1000 이상 1.5)으로 키우고 버튼에 단축키 배지(`data-key`), 키보드 안내 `#keyHint`(대화창 뜨면 숨김).

## 세이브 호환성 (유저 데이터 날리지 말 것)
- localStorage 키: 1탄 `heesu_bori_save_v1`, 2탄 `heesu_bori_ep2_v1` / 원터치 `heesu_bori_ep2_onetouch_v1`.
- **필드 삭제·이름 변경 금지.** 새 필드는 `SaveData`에 선택(`?`)으로 추가하고 `loadGame()`에서 기본값 처리. `tests/unit/progress.test.mjs`의 "예전 세이브" 테스트 유지.
- 밸런스를 바꿔도 기존 유저의 장비·강화 단계는 소급해서 깎지 않는 게 원칙.

## 밸런스 기준 (테스트로 고정됨: tests/unit)
- 강화: 모든 장비(보리 포함) +25까지. 0→+25 기대 비용 약 500만G (+17 약 15만, +20 약 52만). 파괴 시 +20 미만은 +12, 이상은 +17.
- **한계 돌파**(+26~+30, game.js `tryBreak`, 장비 탭에서 +25 장비는 돌파 카드 `brkCardHtml`): 회당 강화석 `BRK_STONE` 1,000·1,500·2,000·2,500·3,000 + `enhCost(en)` 골드, 성공률 `BRK_P` 9·7·5·4·3%(10% 미만), 실패해도 하락·파괴 없음. 단계마다 장비 기본 능력치 +3%(`brkMul`, calcStats) + 부위 강화 효과(ENH_FX)도 계속 붙음. +30까지 장비당 기대 강화석 약 23만 개(장기 소모처 — 강화석 상품 여지). 연출: +20 이상 강화·돌파 성공 시 화면 전체 `enhFx`(ui.js, +20 파랑·+25 금색·돌파 무지개), 강화 카드 아이콘 빛(`.glow20`/`.glow25`/`.glowB`), 필드·PvP·광장 발밑 오라 `enhAura`(render.js, 장비 중 최고 강화 단계 / 남은 snap.enh·tenh). 서버 `hb_submit_fighter`의 enh·tenh 상한은 30.
- 강화석(+10%·파괴 방지): +20~24는 회당 50·80·120·160·200개. 매번 쓰면 +25 = 장비당 약 128만G + 강화석 약 2,700개 (강화석이 병목).
- 강화석 수입: 사냥 중 중복 장비 `DUP_YIELD` [0.5,1.5,4,10,25,60](소수는 확률), 분해 `STONE_YIELD` [1,2,4,10,25,60]. 엔드급 자동사냥(시간당 약 4,000마리) 시간당 약 350개 → +25 1개 ≈ 8시간. 출석·미션·시즌은 별도(하루 약 30개).
- 드롭(일반 몬스터 1마리 기준, 1회차): 일반 1/80 · 희귀 1/250 · 영웅 1/800 · 전설 1/2000 · 신화 1/5000(2회차~) · 초월 1/12000(3회차~). 정예 ×5, 보스 ×25.
- 장비 레벨: 착용 장비와 같은 부위·같은 등급 5개 → Lv+1, 기본 스탯 +5%/Lv.
- **개별 장비**(2026-11-22, 거래 대비): `pd.inv`·`enh`·`ilv`·`iexp`·`ref`·`eq`·`beq`는 **장비 키** 기준. 같은 장비 첫 개는 키 = 장비 이름(예전 세이브 그대로 호환), 둘째부터 `이름#xxxx`. `ITEMS`는 data.js에서 Proxy라 `ITEMS[키]`가 원래 정의를 돌려줌(`Object.keys(ITEMS)`엔 이름만). 장비 추가는 `addItem(pd, id, enh?)`(키 반환·도감 등록), 제거는 `dropItem(pd, k)`(강화·레벨·재련 기록도 삭제), 보유 확인은 `ownsDef`/`keysOf`. 세이브 밖(스냅샷 eq·w.id·beq·vis, 도감, 아이콘 캐시)으로 나갈 땐 `defOf(k)`로 이름만 — `visEqRaw`·`pvpSnap`. `pd.inv[이름]`으로 보유 여부를 판단하지 말 것.
  - 중복 드롭: 기본은 예전처럼 강화석/장비 레벨 재료. 장비 탭 「같은 장비 또 나오면」(`pd.keepDup` = 전설↑3·신화↑4·초월 5)이면 그 등급 이상은 가방에 따로 보관(가방 `BAG_MAX` 300개 넘으면 강화석).
- 장비 도감(`BOOK_SETS`, data.js / `bookStats`, game.js): 시작 장비 제외 44종. 보유하면 자동 등록(분해해도 기록 유지), 1칸 최대 HP +5, 등급별·보리 용품 세트 완성 보너스. 새 장비 획득 경로를 추가하면 `bookNotify(id)` 호출.
- 꾸미기(`LOOK_SLOTS`/`HAIRS`, data.js / `visEq`·`hairOk`, game.js): 능력치 없음. 모자·옷·신발·가방은 **도감에 있는** 장비 모습으로, 헤어(기본 3색 + 도감·회차·+25·각성·2장 클리어 조건색 + 한정색). 그리기는 `heePal()`이 visEq+헤어 사용, 스냅샷 `vis`/`hair`로 랭킹·PvP 반영.
- 타이틀 = 게임 로비(`showTitle`, ui.js): 상단 내 희수(얼굴·닉·Lv·전투력)+소리, 왼쪽 아이콘(출석·랭킹·카드 공유·기기 이동), 오른쪽 방치 보상·미니게임(보리 주세요), 하단 모드 타일(할로윈·PvP·월드 보스)+「모험 계속하기」. 「장비·스킬」(tBag)·프로필 탭 → `lobbyMenu()`: state `lobbyMenu`로 메뉴를 열고(음식 탭 제외, G.P 없음) 닫으면 로비로. 버튼 id(tCont/tNew/tEp2/tInf/tPvp/tRaid/tRank/tDaily/tShare/tCloud/tSnd/tBag)는 e2e가 씀. 타이틀 희수는 `TITLE_PD`(세이브) 꾸미기로 그림. 양옆 버튼 줄 위치는 `titleLayout()`이 프로필·로고 아래로 계산(글꼴 로드·화면 크기 변경 때 다시) — CSS 고정 top 쓰지 말 것.
- 「보리 주세요」(ep2*)는 본편과 별개인 **미니게임** 취급(화면 문구에 '2탄' 쓰지 않음). 데이터·세이브 키는 그대로.
- 업적·칭호(`src/achv.js`): `ACH` 표(40개 넘음, 티어 1~4 → 강화석 5·15·40·100). 1초마다 `achvCheck`가 조건 검사 → `pd.ach[id]` 등록·보상(예전 기록도 소급 달성). 메뉴 「칭호」 탭에서 장착(`pd.title`) → snap `ttl`(달성한 것만)·`achN`. 표시는 `achTag(id)`(모르는 id는 빈 문자열) — 랭킹·PvP·동료 목록·로비·카드·이름표. 통계 `stats.boss`·`pvpW`·`raidBest` 추가. 업적 id는 바꾸지 말 것(세이브·랭킹에 저장됨).
- 방치 보상(`src/idle.js`): `pd.idleT`부터 쌓임(최대 12시간, 10분부터 받기). 플레이 중 `saveGame`이 idleT를 지금으로 갱신(타이틀·로비 메뉴에선 안 함). 지금 스테이지·회차 몬스터 시간당 300마리 기준 골드·경험치(Lv50 이후 각성)·강화석(처치당 0.03, 12시간 ≈ 108개). 로비 오른쪽 상자 타일 `#tIdle` → `idleClaim`.
- 성장 패키지(뉴비 세트 2, `pack.js` `PACK2`): 첫 패키지가 끝난(받았거나 24시간 지난) 뒤 1장 클리어 또는 Lv10이면 48시간, 상단 타일 `#tPack2`. 영웅 무기 「롯데 자이언츠 응원봉」 +10(더 세면 자동 착용)·강화석 500·30만G, 정가 표기 ₩3,300·베타 무료. 세이브 `pd.pack2 {seen, got}`.
- 뉴비 패키지(`src/pack.js`, 베타 기간 무료 · 정가 표기 ₩1,000): 로비에서 처음 본 순간 `pd.pack.seen` 저장 → 24시간 동안 상단 「뉴비 패키지」 타일. 받으면 자동사냥 3시간(autoBonus)·강화석 300·한정 헤어 `lavender`(HAIRS `excl`, 받은 사람만 보임)·한정 칭호 `beta`(ACH `sp`: 보상 없음·가진 사람만 목록에). 유료화 땐 결제 확인 후 서버 지급(hb_grants)으로 바꿀 것.
- **챕터**(`src/chapter.js`, 컷신 `src/story2.js`): ZONES 0~3 = 1장 에버랜드, 4~7 = 2장 유료 바다낚시터(주차장·낮낚시·밤낚시·대물탕). 진행도는 장별 — 1장 `pd.zone`/`pd.cleared`, 2장 `pd.ch2 {zone, cleared, intro, seen}`, 고른 장 `pd.chap`. 「모험 계속하기」= `adventureGo` → `curZone(pd)`. 스테이지 이동은 `setCurZone`.
  - 2장 해금: 1장 1번 클리어 + Lv30(`CH2_LV`). 난이도 `zoneL`: 2장은 `CH2_BASE_L`(9 = 1장 10회차) + loopEff(2장 회차). `G.zone >= 3` 같은 식으로 1장 마지막 판단 금지 → `zoneCh`/`isChLast` 사용. 운영자 선물 `stage`·할로윈·레이드는 1장 기준(`CH1_N`).
  - 2장 첫 회차 이야기: 프롤로그(주차장) · STAGE 6 입장(밥하러 온 거지?) · STAGE 7 입장(장비만 좋았다면→당장 팔아 / 잠만 잘 거면 오지 마 / 오빠 납치) · 엔딩(연장할까..? → 다음 데이트는 희수 마음대로, 3장 떡밥). 2장 중간 이야기는 스테이지별로 처음 한 번(`ch2.seen`), 자동사냥이어도 나옴.
  - 밤낚시(theme `night`)는 `drawDarkness`로 희수·랜턴·출구 주변만 보임. 바다 테마는 가장자리 산울타리 대신 바다(`THEME.sea`).
  - 보스: 주차 빌런 트럭(돌진·경적) · 핑크 참돔 왕(점프 물보라) · 대물 농어 장군(연속 돌진) · 월척 중국 대왕자바리(빨아들이기·물대포). 낚시 장비 7종(`bossOnly`: 보스 확정 드롭 전용, 일반 드롭 풀 제외, 도감 별도 세트 「2장 낚시 장비」 공격·방어 +4%). 도감 총 51칸. 업적 c2n·c2·c2x5, 헤어 「바다 블루」(2장 클리어).
- **3장 사직 야구장**(ZONES 8~11, 컷신 `src/story3.js`): 챕터 코드는 1~3장 공통(`zoneCh`·`chOf(pd, c)`·`chFinish(c)`·`chStageStory`·`showEndCh`, `CH_Z0`/`CH_BASE_L`). 해금: 2장 1번 클리어 + Lv50(`CH3_LV`), 난이도 `CH3_BASE_L`=20. 진행도 `pd.ch3`. 로비 챕터 버튼은 2장을 깬 뒤 3개.
  - 스테이지: 매표소(새치기 아저씨·암표상·비둘기 / 새치기 대마왕: 예고 원→순간이동 끼어들기) · 먹거리 존(치킨 박스·떡볶이 컵·음료 컵 / 통닭 대장: 돌진·닭다리 부채꼴) · 1루 응원석(파울볼·막대풍선·상대팀 깃발 / 상대팀 응원단장: 확성기 부채꼴·응원가 음표) · 9회말 그라운드(비 `drawRain`, 우천취소 먹구름: 번개 예고 원 여러 개·소나기). 테마 `gate/food/stand/field`(`THEME.wall`: 가장자리 콘크리트 외벽).
  - 이야기(실제 에피소드 없음 → 희수 말버릇으로): 새치기에 「뭐?????!!!!!!」, 치킨만 먹는 오빠 「…진짜 이 남자가.」, 「몇 회야? 공 어디 갔어?」→ 상대 홈런 → 멘헤라 → 「소리 안 지르면 집에 혼자 가. 표 값 아까우니까」, 9회말 우천취소, 엔딩 끝내기 역전 → 4장 떡밥(보리랑 애견 운동장).
  - 경기 장면(`story3.js` `bbGeo`·`bbDiamond`·`bbPlay`, 컷신·스테이지 공용): 응원석 컷신은 경기장(외야 관중석·펜스·내야·선수)과 투구 반복, `A.hr`=상대 홈런(담장 넘김·베이스 일주), 엔딩 `A.walk`=끝내기 안타, 우천은 방수포. 응원석 스테이지는 위쪽(y<196)이 그라운드(`W.field`)고 14초마다 홈런. 그라운드는 못 들어감(`W.top` = 희수·보리·몬스터 위쪽 한계, 기본 34), 출구는 가운데 계단 맨 위(`W.gate.y` = FY+74).
  - 응원 장비 7종(신화·`bossOnly`·`ch: 3`, 구단 로고 없음): 응원 야구 배트·홈 유니폼·응원 야구모자·야구 스파이크·응원 도구 가방·보리 응원 조끼·보리 야구공 장난감. 도감 세트 「3장 응원 장비」(공격·방어 +5%) → 도감 58칸. 업적 c3r·c3·c3x5, 헤어 「응원 레드」(3장 클리어). 시뮬레이션: Lv50 봇 첫 회차 약 14분·사망 0.
- **회차 보상**(`src/goal.js`): 총 회차 `loopsTotal` = 1~3장 클리어 합계. `LOOP_MS` 이정표 3·5·10·15·20·30·40·50·75·100(이후 25마다): 강화석(11/22 축소: 3~100 합계 2,430개, 100 이후 25회차마다 500)·자동사냥·`tr`(초월 장비 확정, 안 가진 것 중에서·다 있으면 강화석 120)·한정 헤어(20회차 `wine`, 50회차 `aurora`). 칭호는 ACH `lp30`·`lp50`·`lp100`. 로비 오른쪽 타일 `#tGoal` → `msOpen`(목록·한 번에 받기 `msClaim(0)`), 예전 기록도 소급. 세이브 `pd.ms {회차: 받은 시각}`, `pd.msSeen`(플레이 중 새 이정표 알림 `msWatch`). 보상 반영 공통 함수 `applyRewards(pd, [[kind, v]])`.
- **보스 타워**(`src/tower.js`, 1장 1번 클리어 후): 로비 모드 타일 `#tTower` → `#tower` 로비 → `startTower(f)`. 층마다 보스 1마리(`TOWER_BOSSES` 1~3장 순서로 반복)·90초, 다음 층(최고+1)만 도전·횟수 무제한. 보스 능력치는 `TOWER_REF`로 통일: 체력 `towerHpL`(10층 이후 층당 2단계)·공격 `towerL`(층당 1.2단계), 10층마다 대장(체력 ×1.6/1.3). `G.tower`가 있으면 `loopLv`=towerL, 스포너 대신 `towerUpdate`, 보스 처치→`towerEnd(true)`, 사망·시간 초과→`towerEnd(false)`. 첫 돌파 보상 `towerReward`: 강화석 10+4f(10층마다 2배)·5층마다 자동사냥 30분·10층마다 초월 장비·30층 헤어 `flame`. 칭호 ACH `tw10`·`tw30`·`tw50`. 세이브 `pd.tower {best}`. 시뮬레이션(실제 세이브·자동): 2장 진입급 약 11층 · 안녀엉급(+15~20) 약 34층(30층 대장이 벽) · 전부 +25 약 54층.
  - 로비 모드 타일 4개(할로윈·PvP·월드 보스·보스 타워). 오른쪽 줄(방치·회차 보상·미니게임)이 모드 타일에 닿으면 `titleLayout`이 `.tight`(작은 타일)로 바꿈.
- **골드 소모처**(`src/refine.js`, 엔드급 골드 수입 ≈ 시간당 110만~300만G):
  - 강화석 교환소(배달앱 탭 맨 위): 하루 300개(`XCH_MAX`), 1~100개 3,000G · 101~200 6,000G · 201~300 12,000G (300개 = 210만G). 「살 수 있는 만큼」은 `xchPlan`으로 개수·값을 보여주는 확인 창 후 교환. 세이브 `pd.xch {day, n}`.
  - 장비 재련(장비·보리 탭 강화 카드 아래): 장비마다 추가 옵션 일반·희귀 1줄 / 영웅·전설 2줄 / 신화·초월 3줄, 옵션 등급 일반 70·희귀 22·전설 7·신화 1%(신화는 최대치 1.5배까지). 값 `REF_COST` 등급별 5만~150만G × (1 + 잠근 줄 수). 옵션: 공격·방어·HP·치명·치명 피해·이동·보스 피해·골드(보리 장비는 보리 공격·HP·보스·골드). 세이브 `pd.ref[itemId] {lines, n}`. `calcStats`가 `refSum`으로 반영 → snap 값에 자연히 들어가서 서버 전투력 공식 변경 불필요. 보스 피해(`st.bossMul`)는 `dealDamage`에서 보스에게만(PvP 제외).
- 카드 공유(`src/share.js`): 랭킹 「내 카드 공유」 → 1080×1350 PNG(꾸민 희수·보리, 전투력 순위, PvP, 도감, 최고 강화). 모바일은 Web Share(파일), PC는 저장·링크 복사. 링크 `?from=닉네임` → 초대 알림 + 랭킹 열림.
- 레벨 상한 50, 이후 각성(★): 경험치로 각성 포인트 → 능력치/스킬 위력/보리 공격.
  - 곡선(2026-11-22 크게 늦춤): `xpNeed(lv) = 20·lv^XP_EXP(2.5)`, `awkNeed(aw) = AWK_BASE(60000)·(1 + AWK_STEP(0.25)·aw)`, 회차 경험치 보너스 `LM_XP` 0.2/단계(예전 0.5). 기존 레벨·각성은 깎지 않음.
- 스킬 포인트: 시작 1 + 레벨업 49 + 보리 합류 1 = 51 = 모든 스킬 max 합 (테스트 고정). 스킬 max를 바꾸면 이 합을 맞출 것. 멘헤라 공격 max 4(쿨 40·35·30·25).
- 회차(cleared) 난이도 단계는 `loopEff(cl)`: 10회차까지 1씩, 11회차부터는 `LOOP_AFTER`(0.75)씩 계속 오름(50회차 = 40단계, `LOOP_CAP`=꺾이는 지점). 화면 표시는 실제 회차.
  - 단계당 몬스터 배수 `loopMul`: 체력 +`LM_HP`(1.3)·공격 +`LM_ATK`(1.0)·골드 +`LM_GOLD`(0.4)·경험치 +`LM_XP`(0.2). 1장 첫 클리어 전엔 보스 체력 ×0.7·공격 ×0.75(`FIRST_BOSS`).
  - **고회차 가속**(`lmFast`): 30단계(`LM_FAST`, 1장 약 37회차·2장 약 39회차·3장 약 15회차)를 넘으면 단계마다 체력 ×1.05·공격 ×1.03·골드 ×1.02가 더 곱해짐(경험치는 그대로). 할로윈(1장 회차 기준)도 같이 적용, 보스 타워는 자체 공식이라 영향 없음. 시뮬레이션(원조희수 전부 +25): 1장 51회차 한 바퀴 약 9분 → 57회차 약 13분(보스에서 HP 25%) → 63회차 STAGE 4 보스에서 막힘. 3장 15회차 약 14분 → 23회차 약 22분(HP 5%·남편 부활). 안녀엉(+15~20): 2장 27회차 약 21분 → 39회차 스테이지당 약 8분·HP 6%. 막히면 돌파·재련으로 뚫는 구조.
  - 2026-11-22 목표 = **성장 느리게 + 자주 막힘**. 시뮬레이션(새 세이브·자동·간단한 강화 판단): 1장 첫 클리어 약 8분·사망 0, 1장 2·3·5·6·9회차 보스에서 20~70분씩 막힘, Lv30(2장 해금) 약 5시간, 2장 1회차 STAGE 5~7 각 약 1시간, 2장 5·6회차 80~95분 막힘, 13시간에 Lv49. 보스 타워 공격력은 자체 계수(0.35/단계) 유지.
- 자동사냥: 출구가 열리면 근처 드롭만 줍고 출구로 이동 → 다음 스테이지에서도 계속. **이야기는 자동사냥 중에도 전부 나옴** — 컷신·필드 대사는 `dlgAuto`가 2.4초마다 저절로 넘김. 마지막 스테이지는 (첫 클리어가 아니면) 엔딩 컷신 후 결과 화면 없이 바로 다음 회차 STAGE 1.
- 메달·리본은 픽셀 아이콘 `PXI(k)`/`MEDAL(rank)`(rank.js, ICONS.medal1~4·rosette·trophy). 이모지 메달 쓰지 말 것.
- 출석·일일 미션(`src/daily.js`): 출석 7일 주기(누적, 빠져도 초기화 X, 7일차 골드×5+강화석 50+자동사냥 2시간). 미션은 날짜로 4개(항상 몬스터 150마리 포함), 4개 다 받으면 자동사냥 30분. 골드 보상은 `dailyGold(pd)`(레벨·회차 비례) 배수.
  - 진행 집계는 `dailyAdd(kind)`: kill/boss(killEnemy) · enh(tryEnhance) · pvp(pvpEnd) · wave(infKill) · ep2(e2End). 새 미션은 `MISSIONS`에 넣고 해당 지점에서 dailyAdd 호출.
  - e2e `withSave`는 기본으로 오늘 출석 완료 상태(출석 창이 다른 테스트를 가리지 않게).
- 첫 걸음 가이드(`src/guide.js`): 신규 세이브 `guide: 0` → 7단계(5마리·스매싱 배우기·써보기·무기 착용·강화·보리 합류·STAGE1 보스), 단계마다 확정 보상, 상단 카드 + 대상 버튼 `.gpulse`. 사건은 `guideEv('kill'|'skill:<id>'|'enh'|'boss')`, 상태 단계는 0.5초마다 `guideCheck`. 예전 세이브는 Lv5+·2스테이지 이후면 건너뜀. e2e `withSave` 기본 `guide: 99`.

## Supabase (project ref `ujxuzduomfssguibnjux`)
- `hb_fighters`(랭킹·PvP 등록, 익명 로그인 user_id), `hb_battles`, `hb_grants`(운영자 선물함), `hb_saves`(클라우드 세이브), `hb_transfer_codes`(기기 옮기기). 스키마: `supabase/schema.sql`.
- 클라우드 세이브(`src/cloud.js`): `saveGame`/`e2SaveNow` 때 1분에 한 번 업로드. 기기 옮기기 = 옛 기기 코드 발급 → 새 기기 `hb_use_transfer_code` (세이브·닉네임·전투기록·미수령 선물 이동) → localStorage 덮어쓰고 새로고침.
- **계정 연결**(`src/account.js`, 기기 옮기기 창 맨 위 「계정 연결」): 익명 계정에 `SB.auth.linkIdentity`로 구글·카카오 연결(같은 user_id 유지 → 세이브·랭킹·선물 그대로). 다른 기기는 「로그인해서 불러오기」= `signInWithOAuth` → 돌아오면 `accBoot`가 `hb_saves`를 localStorage에 쓰고 새로고침(`accApply`). 그 계정에 희수가 없으면 `hb_acc_release()`로 빈 계정 삭제 후 원래 익명 세션 복구(`hb_acc_prev`). 로그인한 계정은 시작할 때(타이틀) 서버 세이브 `svT`가 이 기기보다 최근이면 자동으로 받아옴(`saveGame`이 `svT` 기록). 켜진 로그인 방법은 공개 `/auth/v1/settings`(`accFetchProv`)로 확인 — 없으면 「곧 열려요」. e2e 가짜 SB에 `auth`(`__user`·`__oauth`)와 `accFetchProv`(`__prov`) 있음.
  - 대시보드 설정(운영자): Auth → Providers 에서 Google·Kakao 켜기(각 개발자 콘솔 키), "Allow manual linking" 켜기, URL Configuration → Redirect URLs 에 `https://byeongjaeyu.github.io/heesoo_bori/**`.
- **서버 세이브 검사**(`hb_save_push(p_data, p_ep2)`, cloud.js `cloudPushNow`): 클라이언트는 `hb_saves`에 직접 못 씀(insert·update 권한 없음). 서버가 지난 세이브와 비교해 지난 시간(최대 24시간)·그 사이 받은 선물(`hb_grants`)로 설명 안 되는 증가(골드 5천만+3천만/시간, 강화석 5천+1,500/시간, 각성 30+15/시간, 회차 5+15/시간, 자동사냥 12시간+2시간/시간)나 범위 밖 값(Lv>50, 강화>30, 음수)이면 거절 → 마지막 정상 세이브를 돌려줌 → `cloudRevert`가 그걸로 되돌리고 새로고침(`SAVE_LOCK`으로 그 사이 저장 막음). 시작할 때 `accBoot`가 한 번 검사 업로드. 거절 기록: `select * from hb_flags where kind = 'save_reject' order by at desc;`. 새 재화·큰 보상을 만들면 이 한도를 넘지 않는지 확인할 것.
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
- **온라인 광장**(`src/plaza.js`): 로비 「모험 계속하기」 왼쪽 `#tPlaza` → `plazaOpen`(랭킹에 닉네임 등록된 희수만) → 1장 정문 광장 맵(`buildWorld(0)`, 몬스터·출구 없음, `G.plaza`, body `.inPlaza`로 전투 버튼 숨김). Supabase Realtime 비공개 채널 `plaza-1`(`private: true`): Presence = 닉네임·Lv·★·칭호·꾸미기·위치(20초마다 다시 track), Broadcast `mv`(움직일 때 0.33초마다) · `chat`. 다른 희수는 `drawRival`로 그림·보간 이동.
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

## 하지 말 것
- 실존 브랜드 로고·패턴(롯데 자이언츠 엠블럼, 디올 로고 등) 그리기. 이름 텍스트는 유지.
- claude.ai 공개 아티팩트 업데이트는 사용자 명시 승인 후에만.
