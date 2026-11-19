// 빌드 때 주입되거나 브라우저/외부에서 오는 전역들 (src/*.js 는 하나로 이어 붙는 전역 스크립트)

/** build.py 가 맨 앞에 넣는 상수: true = 원터치 에디션(onetouch/index.html) */
declare const FORCE_EASY: boolean;

interface Window {
  /** 구형 Safari */
  webkitAudioContext?: typeof AudioContext;
}

// Supabase 는 CDN ESM 을 동적 import 해서 씀 (pvp.js)
declare module 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm' {
  export const createClient: any;
}
