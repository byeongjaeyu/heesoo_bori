# 희수와 보리의 대모험

희수와 강아지 보리가 주인공인 도트 웹게임 시리즈.

| 버전 | 주소 |
|---|---|
| 1탄 에버랜드 대탈출 + 2탄 보리 주세요 | https://byeongjaeyu.github.io/heesoo_bori/ |
| 2탄 원터치 에디션 (탭만으로, 큰 글씨) | https://byeongjaeyu.github.io/heesoo_bori/onetouch/ |

## 구조
- `src/` — 게임 소스 (JS 모듈, CSS, HTML 템플릿)
- `build.py` — 소스를 합치고 Galmuri 폰트를 서브셋해 한 파일짜리 HTML로 빌드
- `index.html`, `onetouch/index.html` — 빌드 결과물 (GitHub Pages가 그대로 서빙)
- `fonts/` — [Galmuri](https://github.com/quiple/galmuri) 폰트 (SIL OFL 1.1, `fonts/OFL.md`)

## 빌드
```bash
pip install fonttools brotli
python3 build.py
```
