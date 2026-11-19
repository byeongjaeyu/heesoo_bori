import base64, io, re, sys
from fontTools import subset
from fontTools.ttLib import TTFont
SRC='src/'
order=['sprites','sprites2','engine','data','world','game','render','ui','pvp','inf','story','ep2core','ep2stages','ep2easy','ep2story','main']
js='\n'.join(open(SRC+f+'.js',encoding='utf-8').read() for f in order)
js="'use strict';\n"+js
css=open(SRC+'style.css',encoding='utf-8').read()
html=open(SRC+'index.html',encoding='utf-8').read()
chars=set(js+css+html)
chars|=set(chr(c) for c in range(32,127))
chars|=set('♥♪★→↑▼▶✕×·…!?ㅋㅎㅠ%')
text=''.join(sorted(c for c in chars if ord(c)>=32))
def sub(path,flavor):
    f=TTFont(path)
    opt=subset.Options(); opt.flavor=flavor; opt.layout_features=['*']; opt.notdef_outline=True
    s=subset.Subsetter(opt); s.populate(text=text); s.subset(f)
    b=io.BytesIO(); f.flavor=flavor; f.save(b); return b.getvalue()
flavor='woff2'
try:
    import brotli
except Exception:
    flavor='woff'
reg=sub('fonts/Galmuri11.ttf',flavor)
bold=sub('fonts/Galmuri11-Bold.ttf',flavor)
mime='font/'+flavor
fontcss=f"@font-face{{font-family:'HB';src:url(data:{mime};base64,{base64.b64encode(reg).decode()}) format('{flavor}');font-weight:400;font-display:block}}\n@font-face{{font-family:'HB';src:url(data:{mime};base64,{base64.b64encode(bold).decode()}) format('{flavor}');font-weight:700;font-display:block}}"
out=html.replace('/*@@FONT@@*/',fontcss).replace('/*@@CSS@@*/',css).replace('/*@@JS@@*/',js)
import os; os.makedirs('onetouch',exist_ok=True)
BASE='https://byeongjaeyu.github.io/heesoo_bori/'
def og(html, title, desc, url, img):
    tags=(f'<meta name="description" content="{desc}">\n'
      f'<meta property="og:type" content="website">\n<meta property="og:site_name" content="희수와 보리의 대모험">\n<meta property="og:locale" content="ko_KR">\n'
      f'<meta property="og:title" content="{title}">\n<meta property="og:description" content="{desc}">\n<meta property="og:url" content="{url}">\n'
      f'<meta property="og:image" content="{img}">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n<meta property="og:image:alt" content="{title}">\n'
      f'<meta name="twitter:card" content="summary_large_image">\n<link rel="canonical" href="{url}">\n')
    return html.replace('<meta name="theme-color"', tags+'<meta name="theme-color"',1)
main=og(out.replace("'use strict';\n","'use strict';\nconst FORCE_EASY = false;\n",1).replace('<title>희수와 보리의 에버랜드 대탈출</title>','<title>희수와 보리의 대모험</title>'),
  '희수와 보리의 대모험','희수와 강아지 보리의 도트 모험 게임! 1탄 에버랜드 대탈출, 2탄 보리 주세요, 그리고 내가 키운 희수로 겨루는 PvP 아레나.',BASE,BASE+'og.png')
open('index.html','w',encoding='utf-8').write(main)
one=out.replace("'use strict';\n","'use strict';\nconst FORCE_EASY = true;\n",1).replace('<title>희수와 보리의 에버랜드 대탈출</title>','<title>보리 주세요 · 원터치 에디션</title>')
one=og(one,'보리 주세요 · 원터치 에디션','탭 한 번이면 끝! 강아지 보리가 사라진 뼈다구를 찾아 떠나는 원터치 미니게임 모험.',BASE+'onetouch/',BASE+'og_onetouch.png')
open('onetouch/index.html','w',encoding='utf-8').write(one)
print('chars',len(text),'font',flavor,len(reg),len(bold),'total',len(out))
