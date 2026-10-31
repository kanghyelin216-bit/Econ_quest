const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const store={get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set:(k,v)=>localStorage.setItem(k,JSON.stringify(v))};
function nav(active){
  const L=[['index.html','STAGE 1 · 용어 공부'],['note.html','STAGE 2 · 경제 노트'],['journal.html','STAGE 3 · 매매 일지']];
  $('#nav').innerHTML=`<div class="top"><a class="px logo" href="index.html">▲ ECON QUEST</a><nav>${L.map(([h,t])=>`<a href="${h}" class="${h===active?'on':''}">${t}</a>`).join('')}</nav></div>`;
}
// ---------- 금융용어 API (한국예탁결제원, XML) ----------
const SAMPLE=[
 ['인플레이션','물가가 지속적으로 오르는 현상입니다. 같은 돈으로 살 수 있는 물건이 줄어들어 화폐의 구매력이 떨어집니다.'],
 ['기준금리','한국은행이 정하는 금융시장의 기준이 되는 금리입니다. 기준금리가 오르면 대출·예금 금리도 따라 오르는 경향이 있습니다.'],
 ['배당','기업이 영업활동으로 얻은 이익의 일부를 주주에게 지분율에 따라 나누어 주는 것입니다.'],
 ['PER(주가수익비율)','주가를 주당순이익(EPS)으로 나눈 값입니다. 이익 대비 주가가 높은지 낮은지를 가늠하는 지표입니다.'],
 ['공매도','주식을 빌려서 먼저 판 뒤, 나중에 값이 떨어지면 싸게 사서 갚아 차익을 얻는 거래 방식입니다.'],
 ['유상증자','기업이 자금을 마련하기 위해 새 주식을 발행하여 주주나 투자자에게 돈을 받고 파는 것입니다.']
].map(([n,d])=>({n,d}));
function clean(h){
  const t=String(h||'').replace(/<\s*br\s*\/?>|<\/p>/gi,'\n').replace(/&nbsp;/g,' ');
  return (new DOMParser().parseFromString(t,'text/html').body.textContent||'').replace(/\n{3,}/g,'\n\n').trim();
}
async function callTerm(p){
  if(!CONFIG.TERM_URL||CONFIG.TERM_URL.startsWith('여기에'))throw new Error('config.js에 요청주소(TERM_URL)가 아직 없습니다');
  let k=CONFIG.API_KEY;try{k=decodeURIComponent(k)}catch{}
  const q=Object.entries(p).map(([a,b])=>`${a}=${encodeURIComponent(b)}`).join('&');
  const r=await fetch(`${CONFIG.TERM_URL}?serviceKey=${encodeURIComponent(k)}&${q}`);
  const x=new DOMParser().parseFromString(await r.text(),'text/xml');
  const e=x.querySelector('returnAuthMsg,errMsg');
  if(!r.ok||(e&&!x.querySelector('item')))throw new Error('API 오류 '+(e?e.textContent:r.status));
  const rc=x.querySelector('resultCode');
  if(rc&&!/^0+$/.test(rc.textContent))throw new Error(x.querySelector('resultMsg')?.textContent||'API 오류');
  return{total:+(x.querySelector('totalCount')?.textContent||0),
    items:[...x.querySelectorAll('item')].map(i=>({n:(i.querySelector('fnceDictNm')?.textContent||'').trim(),d:clean(i.querySelector('ksdFnceDictDescContent')?.textContent)})).filter(t=>t.n&&t.d)};
}
