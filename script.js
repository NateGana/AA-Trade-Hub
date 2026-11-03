const KEY = "aatradehub_v1";
const NAV = [["home","Home","⌂"],["explore","Explore","✦"],["trading","Trading","⇄"],["saved","Saved","★"],["collection","My Collection","▣"],["progress","Progress","▤"],["history","History","↺"],["calc","Utilities","⚖"],["settings","Settings","⚙"],["more","More","⋯"]];
const UNITS = [
["Shinobi (Awakened)","Mythic",false,900,5,2,"Awakened ninja unit shown in the featured banner."],
["Dreamer","Mythic",false,1200,5,2,"Mythic support-style unit from the featured banner."],
["Toad Sensei","Mythic",false,800,4,3,"Mythic sage unit from the featured banner."],
["Crimson Reaper","Secret",false,1500,5,1,"Sample secret unit."],
["Void Emperor","Secret",false,1800,5,1,"Sample secret unit."],
["Frost Monarch","Secret",false,1100,4,2,"Sample secret unit."],
["Festival Fox","Limited",true,700,4,2,"Sample limited-time event unit."],
["Winter Blade","Limited",true,650,3,3,"Sample limited-time event unit."],
["Solar Knight","Exclusive",false,500,3,3,"Sample exclusive unit."],
["Neon Ronin","Exclusive",false,450,2,4,"Sample exclusive unit."],
["Thunder Duelist","Legendary",false,300,3,4,"Sample legendary unit."],
["Iron Guardian","Legendary",false,250,2,5,"Sample legendary unit."]
].map((u,i)=>({id:i+1,name:u[0],rar:u[1],lim:u[2],val:u[3],dem:u[4],sup:u[5],desc:u[6],upd:"2026-11-03"}));
const COLORS = {Secret:["#FF168B","#5424B8"],Limited:["#ffd54a","#FF168B"],Exclusive:["#00D9FF","#168DFF"],Mythic:["#b388ff","#168DFF"],Legendary:["#ffa040","#5424B8"]};
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const unit = id => UNITS.find(u=>u.id===+id);
const fmt = n => n.toLocaleString();
const today = () => new Date().toISOString().slice(0,10);
const uid = () => Date.now()+Math.floor(Math.random()*1000);

function seedListings(){
  const mk=(id,user,type,o,w,d)=>({id,user,type,offer:o,want:w,desc:d,status:"Open",date:"2026-10-30",demo:true});
  return [
    mk(1,"DemoTrader01","Secret Unit Exchange",[4],[5],"Sample listing. Looking to upgrade."),
    mk(2,"DemoTrader02","Offering",[7,8],[],"Sample listing. Offering two limited units."),
    mk(3,"DemoTrader03","Looking For",[],[2],"Sample listing. Looking for Dreamer."),
    mk(4,"DemoTrader04","Trading",[9],[3],"Sample listing. Open to offers.")
  ];
}
function defaults(){
  return {user:null,users:[],listings:seedListings(),collection:[],saved:[],favs:[],calcs:[],searches:[],viewed:[],prefs:{fairPct:10},notifs:[{id:1,text:"Welcome to AA TRADEHUB demo.",read:false}]};
}
const Store = {
  load(){ try{ return Object.assign(defaults(),JSON.parse(localStorage.getItem(KEY))||{}); }catch(e){ return defaults(); } },
  save(){ localStorage.setItem(KEY,JSON.stringify(S)); }
};
let S = Store.load();
let route = "home";
const F = {q:"",rar:"",lim:"",dem:"",sort:"name"};
const T = {q:"",type:""};
const C = {mine:[],theirs:[]};

function toast(t){ const el=$("#toast"); el.textContent=t; el.classList.add("show"); setTimeout(()=>el.classList.remove("show"),2200); }
function notify(t){ S.notifs.unshift({id:uid(),text:t,read:false}); Store.save(); renderAuth(); }
function openModal(html){ const m=$("#modal"); m.innerHTML=`<div class="mbox">${html}</div>`; m.classList.remove("hidden"); }
function closeModal(){ $("#modal").classList.add("hidden"); }
function needLogin(){ if(S.user) return false; openAuth("login"); toast("Please sign in first"); return true; }

function art(u){
  const c=COLORS[u.rar]||COLORS.Legendary;
  const ini=u.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c[0]}"/><stop offset="1" stop-color="${c[1]}"/></linearGradient></defs><rect width="300" height="200" fill="#10102B"/><circle cx="150" cy="100" r="80" fill="url(#g)" opacity=".85"/><text x="150" y="122" font-size="64" font-weight="800" text-anchor="middle" fill="#F4F2FF" font-family="Arial">${ini}</text></svg>`;
  return "data:image/svg+xml;utf8,"+encodeURIComponent(svg);
}
function meter(v){ return `<div class="meter"><i style="width:${v*20}%"></i></div>`; }
function chips(ids){ return ids.length?ids.map(i=>`<span class="chip">${esc(unit(i).name)}</span>`).join(""):`<span class="small">None</span>`; }

function unitCard(u){
  const n=S.listings.filter(l=>l.status==="Open"&&(l.offer.includes(u.id)||l.want.includes(u.id))).length;
  return `<div class="card"><img src="${art(u)}" alt=""><div class="in"><b>${esc(u.name)}</b><span class="tag ${u.rar}">${u.rar}${u.lim?" · Limited":""}</span>
  <span class="small">Demand</span>${meter(u.dem)}<span class="small">Est. value (sample): ${fmt(u.val)} · ${n} listing(s)</span>
  <button class="btn sm" data-act="unit" data-id="${u.id}">View details</button></div></div>`;
}
function listingCard(l,own){
  const mine=S.user&&S.user.name===l.user;
  return `<div class="lcard"><div class="row" style="margin:0"><span class="av">${esc(l.user[0].toUpperCase())}</span><b>${esc(l.user)}</b><span class="tag Exclusive">${esc(l.type)}</span><span class="tag ${l.status==="Open"?"Limited":"Secret"}">${l.status}</span><span class="small">${l.date}${l.demo?" · sample":""}</span></div>
  <div class="small">Offering</div><div class="chips">${chips(l.offer)}</div><div class="small">Wanted</div><div class="chips">${chips(l.want)}</div>
  <p class="small">${esc(l.desc||"")}</p>
  <div class="row" style="margin:0"><button class="btn sm" data-act="viewOffer" data-id="${l.id}">View Offer</button><button class="btn sm" data-act="contact" data-id="${l.id}">Contact Trader</button><button class="btn sm" data-act="saveListing" data-id="${l.id}">${S.saved.includes(l.id)?"Unsave":"Save"}</button>
  ${mine?`<button class="btn sm" data-act="editListing" data-id="${l.id}">Edit</button><button class="btn sm danger" data-act="delListing" data-id="${l.id}">Delete</button>`:""}</div></div>`;
}

const Pages = {
  home(){
    const open=S.listings.filter(l=>l.status==="Open");
    const listed=new Set(open.flatMap(l=>[...l.offer,...l.want])).size;
    const trending=[...UNITS].sort((a,b)=>b.dem-a.dem).slice(0,4);
    return `<h2>Home</h2><div class="stats"><div class="stat"><b>${S.users.length}</b>Registered demo traders</div><div class="stat"><b>${open.length}</b>Active listings</div><div class="stat"><b>${listed}</b>Units in listings</div><div class="stat"><b>${UNITS.length}</b>Units in catalog</div></div>
    <h3>Featured Secret Units</h3><div class="grid">${UNITS.filter(u=>u.rar==="Secret").map(unitCard).join("")}</div>
    <h3>Featured Limited Units</h3><div class="grid">${UNITS.filter(u=>u.lim).map(unitCard).join("")}</div>
    <h3>Trending / Most Wanted</h3><div class="grid">${trending.map(unitCard).join("")}</div>
    <h3>Latest Trading Offers</h3>${S.listings.slice().reverse().slice(0,3).map(l=>listingCard(l)).join("")||"<p class='small'>No listings yet.</p>"}`;
  },
  explore(){
    return `<h2>Explore Units</h2><p class="small">All values are sample demonstration data, not verified market prices.</p>
    <div class="row"><input data-f="q" placeholder="Search units" value="${esc(F.q)}"><select data-f="rar"><option value="">All rarities</option>${Object.keys(COLORS).map(r=>`<option ${F.rar===r?"selected":""}>${r}</option>`).join("")}</select>
    <select data-f="lim"><option value="">Any status</option><option value="1" ${F.lim==="1"?"selected":""}>Limited</option><option value="0" ${F.lim==="0"?"selected":""}>Permanent</option></select>
    <select data-f="dem"><option value="">Any demand</option>${[5,4,3,2,1].map(d=>`<option value="${d}" ${F.dem==d?"selected":""}>Demand ${d}+</option>`).join("")}</select>
    <select data-f="sort"><option value="name">A–Z</option><option value="val" ${F.sort==="val"?"selected":""}>Value high–low</option><option value="dem" ${F.sort==="dem"?"selected":""}>Demand</option></select></div>
    <div class="grid" id="results">${exploreList()}</div>`;
  },
  trading(){
    return `<h2>Trading Marketplace</h2><div class="row"><input data-t="q" placeholder="Search listings" value="${esc(T.q)}"><select data-t="type"><option value="">All types</option>${["Trading","Looking For","Offering","Limited Unit Exchange","Secret Unit Exchange"].map(t=>`<option ${T.type===t?"selected":""}>${t}</option>`).join("")}</select><button class="btn pri" data-act="newListing">+ New Listing</button></div><div id="tresults">${tradeList()}</div>`;
  },
  saved(){
    const ls=S.listings.filter(l=>S.saved.includes(l.id));
    return `<h2>Saved</h2><h3>Saved listings</h3>${ls.map(l=>listingCard(l)).join("")||"<p class='small'>Nothing saved.</p>"}<h3>Favorite units</h3><div class="grid">${S.favs.map(unit).map(unitCard).join("")||"<p class='small'>No favorites. Open a unit to add one.</p>"}</div>`;
  },
  collection(){
    if(!S.user) return `<h2>My Collection</h2><p>Sign in to build your collection.</p><button class="btn pri" data-act="login">Sign In</button>`;
    const mine=S.collection.filter(c=>c.owner===S.user.name);
    const total=mine.reduce((a,c)=>a+unit(c.unit).val*c.qty,0);
    return `<h2>My Collection</h2><div class="stats"><div class="stat"><b>${mine.length}</b>Unit types</div><div class="stat"><b>${fmt(total)}</b>Est. value (sample)</div></div>
    <div class="row" style="margin-top:14px"><select id="colUnit">${UNITS.map(u=>`<option value="${u.id}">${esc(u.name)}</option>`).join("")}</select><input id="colQty" type="number" min="1" value="1" style="width:80px"><input id="colNote" placeholder="Private note"><label class="small"><input id="colTrade" type="checkbox" style="width:auto"> For trade</label><button class="btn pri" data-act="addCol">Add</button></div>
    <div class="grid">${mine.map(c=>{const u=unit(c.unit);return `<div class="card"><img src="${art(u)}" alt=""><div class="in"><b>${esc(u.name)} ×${c.qty}</b><span class="tag ${u.rar}">${u.rar}</span><span class="small">Acquired ${c.date}${c.trade?" · For trade":""}</span><span class="small">${esc(c.note)}</span><button class="btn sm danger" data-act="delCol" data-id="${c.id}">Remove</button></div></div>`}).join("")||"<p class='small'>Empty.</p>"}</div>`;
  },
  progress(){
    return `<h2>Progress</h2><p class="small">Your collection value by rarity (sample values).</p><canvas id="chart" height="120"></canvas>`;
  },
  history(){
    return `<h2>History</h2><h3>Recently viewed units</h3><div class="grid">${S.viewed.slice(0,6).map(unit).map(unitCard).join("")||"<p class='small'>None yet.</p>"}</div>
    <h3>Trade calculations</h3>${S.calcs.length?`<table><tr><th>Date</th><th>Mine</th><th>Theirs</th><th>Result</th></tr>${S.calcs.map(c=>`<tr><td>${c.date}</td><td>${fmt(c.m)}</td><td>${fmt(c.t)}</td><td class="${c.v}">${c.v}</td></tr>`).join("")}</table>`:"<p class='small'>None saved.</p>"}
    <h3>Search history</h3><p class="small">${S.searches.slice(0,10).map(esc).join(", ")||"None"}</p>
    <h3>My listings</h3>${S.listings.filter(l=>S.user&&l.user===S.user.name).map(l=>listingCard(l)).join("")||"<p class='small'>None.</p>"}`;
  },
  calc(){ return `<h2>Trade Calculator</h2><div id="calcBody">${calcBody()}</div>`; },
  settings(){
    return `<h2>Settings</h2><p class="small">Demo only: anyone using this browser can change these.</p><label class="small">Fair range (±% difference counted as Fair)</label><div class="row"><input id="fairPct" type="number" min="0" max="100" value="${S.prefs.fairPct}" style="width:100px"><button class="btn pri" data-act="saveSettings">Save</button></div>
    <div class="row"><button class="btn danger" data-act="reset">Reset all demo data</button></div>`;
  },
  more(){
    return `<h2>More</h2><p>AA TRADEHUB is an independent fan-made demonstration. It is not affiliated with Roblox, Anime Adventures, or its developers. It does not execute trades.</p><p class="small">Data is stored in this browser's localStorage. Demo accounts are not real server accounts and are not secure. Real multi-user sync, moderation and an admin panel would need a backend.</p>`;
  }
};

function exploreList(){
  let a=UNITS.filter(u=>(!F.q||u.name.toLowerCase().includes(F.q.toLowerCase()))&&(!F.rar||u.rar===F.rar)&&(F.lim===""||u.lim===(F.lim==="1"))&&(!F.dem||u.dem>=+F.dem));
  a.sort((x,y)=>F.sort==="val"?y.val-x.val:F.sort==="dem"?y.dem-x.dem:x.name.localeCompare(y.name));
  return a.map(unitCard).join("")||"<p class='small'>No units match.</p>";
}
function tradeList(){
  const q=T.q.toLowerCase();
  const a=S.listings.filter(l=>(!T.type||l.type===T.type)&&(!q||[l.user,l.desc,...l.offer.map(i=>unit(i).name),...l.want.map(i=>unit(i).name)].join(" ").toLowerCase().includes(q)));
  return a.map(l=>listingCard(l)).join("")||"<p class='small'>No listings match.</p>";
}
function calcTotals(){
  const sum=a=>a.reduce((x,i)=>x+unit(i).val,0);
  const m=sum(C.mine),t=sum(C.theirs),diff=t-m,pct=m?diff/m*100:(t?100:0);
  const v=pct>S.prefs.fairPct?"W":pct<-S.prefs.fairPct?"L":"F";
  return {m,t,diff,pct,v};
}
function calcSide(key,title){
  const opts=UNITS.map(u=>`<option value="${u.id}">${esc(u.name)}</option>`).join("");
  return `<div class="box"><b>${title}</b><div class="row"><select id="sel_${key}">${opts}</select><button class="btn sm" data-act="calcAdd" data-k="${key}">Add</button></div>
  ${C[key].map((id,i)=>{const u=unit(id);return `<div class="row" style="margin:4px 0"><span>${esc(u.name)}</span><span class="small">${fmt(u.val)} · D${u.dem} S${u.sup}</span><button class="btn sm danger" data-act="calcDel" data-k="${key}" data-i="${i}">×</button></div>`}).join("")}</div>`;
}
function calcBody(){
  const r=calcTotals();
  const label={W:"Win",F:"Fair",L:"Lose"}[r.v];
  return `<div class="cols">${calcSide("mine","MY OFFER")}${calcSide("theirs","THEIR OFFER")}</div>
  <div class="stats" style="margin-top:14px"><div class="stat"><b>${fmt(r.m)}</b>My total</div><div class="stat"><b>${fmt(r.t)}</b>Their total</div><div class="stat"><b>${r.diff>0?"+":""}${fmt(r.diff)}</b>Difference</div><div class="stat"><b>${r.pct.toFixed(1)}%</b>Percent</div></div>
  <div class="verdict ${r.v}">${r.v}: ${label}</div>
  <p class="small">Estimates from sample demonstration values, not guaranteed market prices. Fair range: ±${S.prefs.fairPct}%. Win means you receive more value than you give.</p>
  <div class="row"><button class="btn pri" data-act="calcSave">Save calculation</button><button class="btn" data-act="calcClear">Clear</button></div>`;
}

function renderNav(){
  $("#side").innerHTML=NAV.map(n=>`<button class="${route===n[0]?"on":""}" data-act="nav" data-r="${n[0]}" data-tip="${n[1]}"><span>${n[2]}</span>${n[1].replace("My ","")}</button>`).join("");
}
function renderAuth(){
  const un=S.notifs.filter(n=>!n.read).length;
  $("#auth").innerHTML=S.user
    ?`<button class="btn sm" data-act="notifs">🔔 ${un}</button><span class="av">${esc(S.user.name[0].toUpperCase())}</span><span>${esc(S.user.name)}</span><button class="btn sm" data-act="logout">Log out</button>`
    :`<button class="btn" data-act="login">Sign In</button><button class="btn pri" data-act="register">Create Account</button>`;
}
function render(){
  renderNav(); renderAuth();
  $("#view").innerHTML=Pages[route]();
  $("#view").style.animation="none"; void $("#view").offsetWidth; $("#view").style.animation="";
  if(route==="progress") drawChart();
  $("#side").classList.remove("open");
}
function go(r){ route=r; render(); window.scrollTo(0,0); }

function drawChart(){
  if(typeof Chart==="undefined") return;
  const mine=S.user?S.collection.filter(c=>c.owner===S.user.name):[];
  const rs=Object.keys(COLORS);
  const data=rs.map(r=>mine.filter(c=>unit(c.unit).rar===r).reduce((a,c)=>a+unit(c.unit).val*c.qty,0));
  new Chart($("#chart"),{type:"bar",data:{labels:rs,datasets:[{label:"Estimated value (sample)",data,backgroundColor:["#FF168B","#ffd54a","#00D9FF","#b388ff","#ffa040"]}]},options:{plugins:{legend:{labels:{color:"#F4F2FF"}}},scales:{x:{ticks:{color:"#F4F2FF"}},y:{ticks:{color:"#F4F2FF"}}}}});
}

function openAuth(mode){
  const reg=mode==="register";
  openModal(`<h2>${reg?"Create demo account":"Sign in"}</h2><p class="small">Demo only. Stored in this browser, not secure.</p><form data-form="${mode}"><label>Username</label><input name="name" required minlength="3" maxlength="20"><label>Password</label><input name="pass" type="password" required minlength="4"><div class="row" style="margin-top:14px"><button class="btn pri">${reg?"Create account":"Sign in"}</button><button type="button" class="btn" data-act="close">Cancel</button></div></form>`);
}
function openUnit(id){
  const u=unit(id);
  S.viewed=[u.id,...S.viewed.filter(x=>x!==u.id)].slice(0,12); Store.save();
  openModal(`<img src="${art(u)}" style="width:100%;border-radius:12px" alt=""><h2 style="margin-top:12px">${esc(u.name)}</h2><span class="tag ${u.rar}">${u.rar}</span> <span class="tag Exclusive">${u.lim?"Limited":"Permanent"}</span> <span class="tag Mythic">Available</span>
  <p>${esc(u.desc)}</p><p class="small">Est. value (sample data): ${fmt(u.val)} · Demand ${u.dem}/5 · Supply ${u.sup}/5 · Updated ${u.upd}</p>
  <div class="row"><button class="btn" data-act="fav" data-id="${u.id}">${S.favs.includes(u.id)?"Remove favorite":"Add to favorites"}</button><button class="btn" data-act="close">Close</button></div>`);
}
function listingForm(l){
  const opts=ids=>UNITS.map(u=>`<option value="${u.id}" ${ids.includes(u.id)?"selected":""}>${esc(u.name)}</option>`).join("");
  const o=l||{offer:[],want:[],type:"Trading",desc:"",status:"Open"};
  openModal(`<h2>${l?"Edit":"New"} listing</h2><form data-form="listing" data-id="${l?l.id:""}"><label>Type</label><select name="type">${["Trading","Looking For","Offering","Limited Unit Exchange","Secret Unit Exchange"].map(t=>`<option ${o.type===t?"selected":""}>${t}</option>`).join("")}</select>
  <label>Units I'm offering (Ctrl/Cmd for multiple)</label><select name="offer" multiple>${opts(o.offer)}</select><label>Units I want</label><select name="want" multiple>${opts(o.want)}</select>
  <label>Description / requirements</label><textarea name="desc" maxlength="300" rows="3">${esc(o.desc)}</textarea><label>Status</label><select name="status">${["Open","Pending","Closed"].map(s=>`<option ${o.status===s?"selected":""}>${s}</option>`).join("")}</select>
  <div class="row" style="margin-top:14px"><button class="btn pri">Save</button><button type="button" class="btn" data-act="close">Cancel</button></div></form>`);
}

const Actions = {
  nav:d=>go(d.r), close:closeModal, drawer:()=>$("#side").classList.toggle("open"),
  login:()=>openAuth("login"), register:()=>openAuth("register"),
  logout:()=>{ S.user=null; Store.save(); toast("Signed out"); render(); },
  unit:d=>openUnit(d.id),
  fav:d=>{ if(needLogin()) return; const i=+d.id; S.favs=S.favs.includes(i)?S.favs.filter(x=>x!==i):[...S.favs,i]; Store.save(); closeModal(); toast("Favorites updated"); render(); },
  newListing:()=>{ if(!needLogin()) listingForm(); },
  editListing:d=>listingForm(S.listings.find(l=>l.id==d.id)),
  delListing:d=>{ const l=S.listings.find(x=>x.id==d.id); if(!S.user||l.user!==S.user.name) return; S.listings=S.listings.filter(x=>x.id!=d.id); Store.save(); toast("Listing deleted"); render(); },
  saveListing:d=>{ if(needLogin()) return; const i=+d.id; S.saved=S.saved.includes(i)?S.saved.filter(x=>x!==i):[...S.saved,i]; Store.save(); render(); },
  viewOffer:d=>{ const l=S.listings.find(x=>x.id==d.id); const sum=a=>a.reduce((x,i)=>x+unit(i).val,0); openModal(`<h2>${esc(l.type)} by ${esc(l.user)}</h2><p>Offering: ${chips(l.offer)}</p><p>Wanted: ${chips(l.want)}</p><p class="small">Sample value: ${fmt(sum(l.offer))} vs ${fmt(sum(l.want))}</p><p>${esc(l.desc)}</p><div class="row"><button class="btn" data-act="loadCalc" data-id="${l.id}">Open in calculator</button><button class="btn" data-act="close">Close</button></div>`); },
  loadCalc:d=>{ const l=S.listings.find(x=>x.id==d.id); C.mine=[...l.want]; C.theirs=[...l.offer]; closeModal(); go("calc"); },
  contact:d=>{ if(needLogin()) return; const l=S.listings.find(x=>x.id==d.id); openModal(`<h2>Contact ${esc(l.user)}</h2><p class="small">Demo: the message is only saved as a notification in your browser. Trades happen in-game between players.</p><form data-form="contact" data-u="${esc(l.user)}"><textarea name="msg" required rows="3" style="width:100%"></textarea><div class="row" style="margin-top:12px"><button class="btn pri">Send</button><button type="button" class="btn" data-act="close">Cancel</button></div></form>`); },
  addCol:()=>{ if(needLogin()) return; S.collection.push({id:uid(),owner:S.user.name,unit:+$("#colUnit").value,qty:Math.max(1,+$("#colQty").value||1),note:$("#colNote").value.slice(0,100),trade:$("#colTrade").checked,date:today()}); Store.save(); toast("Added"); render(); },
  delCol:d=>{ S.collection=S.collection.filter(c=>c.id!=d.id); Store.save(); render(); },
  calcAdd:d=>{ C[d.k].push(+$("#sel_"+d.k).value); $("#calcBody").innerHTML=calcBody(); },
  calcDel:d=>{ C[d.k].splice(+d.i,1); $("#calcBody").innerHTML=calcBody(); },
  calcClear:()=>{ C.mine=[]; C.theirs=[]; $("#calcBody").innerHTML=calcBody(); },
  calcSave:()=>{ if(needLogin()) return; const r=calcTotals(); S.calcs.unshift({date:today(),m:r.m,t:r.t,v:r.v}); Store.save(); toast("Calculation saved"); },
  notifs:()=>{ openModal(`<h2>Notifications</h2>${S.notifs.map(n=>`<p>${esc(n.text)}</p>`).join("")}<button class="btn" data-act="close">Close</button>`); S.notifs.forEach(n=>n.read=true); Store.save(); renderAuth(); },
  saveSettings:()=>{ S.prefs.fairPct=Math.min(100,Math.max(0,+$("#fairPct").value||0)); Store.save(); toast("Saved"); },
  reset:()=>{ if(confirm("Delete all demo data in this browser?")){ localStorage.removeItem(KEY); S=Store.load(); render(); } }
};

const Forms = {
  login(f){ const u=S.users.find(x=>x.name===f.name.value&&x.pass===btoa(f.pass.value)); if(!u) return toast("Wrong username or password"); S.user={name:u.name}; Store.save(); closeModal(); toast("Signed in"); render(); },
  register(f){ const n=f.name.value.trim(); if(S.users.some(x=>x.name.toLowerCase()===n.toLowerCase())) return toast("Username taken"); S.users.push({name:n,pass:btoa(f.pass.value),joined:today()}); S.user={name:n}; Store.save(); closeModal(); toast("Account created"); render(); },
  listing(f){
    const offer=[...f.offer.selectedOptions].map(o=>+o.value), want=[...f.want.selectedOptions].map(o=>+o.value);
    if(!offer.length&&!want.length) return toast("Pick at least one unit");
    const data={type:f.type.value,offer,want,desc:f.desc.value.trim(),status:f.status.value};
    if(f.dataset.id){ const l=S.listings.find(x=>x.id==f.dataset.id); if(l.user!==S.user.name) return; Object.assign(l,data); }
    else S.listings.push({id:uid(),user:S.user.name,date:today(),demo:false,...data});
    Store.save(); closeModal(); toast("Listing saved"); render();
  },
  contact(f){ notify(`Message to ${f.dataset.u}: ${f.msg.value.slice(0,80)}`); closeModal(); toast("Message saved (demo)"); }
};

document.addEventListener("click",e=>{
  const el=e.target.closest("[data-act]");
  if(el&&Actions[el.dataset.act]) Actions[el.dataset.act](el.dataset);
  if(e.target.id==="modal") closeModal();
});
document.addEventListener("submit",e=>{
  const f=e.target; if(!f.dataset.form) return;
  e.preventDefault(); Forms[f.dataset.form](f);
});
document.addEventListener("input",e=>{
  const t=e.target;
  if(t.dataset.f){ F[t.dataset.f]=t.value; $("#results").innerHTML=exploreList(); if(t.dataset.f==="q"&&t.value.length>2){ S.searches=[t.value,...S.searches.filter(x=>x!==t.value)].slice(0,20); Store.save(); } }
  if(t.dataset.t){ T[t.dataset.t]=t.value; $("#tresults").innerHTML=tradeList(); if(t.dataset.t==="q"&&t.value.length>2){ S.searches=[t.value,...S.searches.filter(x=>x!==t.value)].slice(0,20); Store.save(); } }
});
render();
