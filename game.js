const SAVE_KEY="poketea_v1_save";

const recipes=[
  {id:"milk",name:"Trà sữa truyền thống",icon:"🧋",price:25,stock:1,unlock:1,exp:12},
  {id:"matcha",name:"Matcha Berry",icon:"🍵",price:38,stock:2,unlock:2,exp:18},
  {id:"mango",name:"Mango Boba",icon:"🥭",price:48,stock:3,unlock:3,exp:24},
  {id:"choco",name:"Chocolate Cream",icon:"🍫",price:60,stock:3,unlock:5,exp:30},
  {id:"berry",name:"Berry Special",icon:"🫐",price:78,stock:4,unlock:7,exp:40}
];

const staffData=[
  {id:"pikachu",name:"Pikachu",icon:"⚡",role:"Phục vụ",desc:"Tăng 8% tiền bán hàng.",baseCost:180},
  {id:"eevee",name:"Eevee",icon:"🦊",role:"Thu ngân",desc:"Tăng 10% EXP nhận được.",baseCost:240},
  {id:"bulbasaur",name:"Bulbasaur",icon:"🌱",role:"Pha chế",desc:"Giảm 1 nguyên liệu cho mỗi đơn.",baseCost:300},
  {id:"psyduck",name:"Psyduck",icon:"🦆",role:"Chăm khách",desc:"Tăng danh tiếng khi phục vụ.",baseCost:360}
];

const upgradeData=[
  {id:"tables",name:"Bàn ghế",icon:"🪑",desc:"Tăng số khách có thể chờ.",base:180,max:6},
  {id:"machine",name:"Máy pha",icon:"⚙️",desc:"Tăng tiền bán mỗi đơn.",base:250,max:5},
  {id:"storage",name:"Kho nguyên liệu",icon:"📦",desc:"Tăng số nguyên liệu tối đa.",base:160,max:6},
  {id:"decor",name:"Trang trí",icon:"🌸",desc:"Tăng danh tiếng mỗi đơn.",base:220,max:5}
];

let state={
  money:300,exp:0,level:1,rep:0,
  ingredients:20, served:0,
  upgrades:{tables:1,machine:1,storage:1,decor:1},
  staff:{},
  customers:[],
  currentOrder:null,
  quests:{serve:0,money:0},
  shift:false
};

function loadGame(show=false){
  try{
    const raw=localStorage.getItem(SAVE_KEY);
    if(raw) state={...state,...JSON.parse(raw)};
  }catch(e){}
  render();
  if(show) toast("Đã tải dữ liệu.");
}
function saveGame(show=false){
  localStorage.setItem(SAVE_KEY,JSON.stringify(state));
  if(show) toast("Đã lưu game.");
}
function resetGame(){
  if(confirm("Xóa toàn bộ tiến trình?")){
    localStorage.removeItem(SAVE_KEY);
    location.reload();
  }
}

function levelNeed(){return 100+(state.level-1)*65}
function addExp(n){
  if(state.staff.eevee) n=Math.ceil(n*1.10);
  state.exp+=n;
  while(state.exp>=levelNeed()){
    state.exp-=levelNeed();
    state.level++;
    toast(`🎉 Lên Level ${state.level}! Mở thêm nội dung.`);
  }
}
function maxTables(){return state.upgrades.tables+1}
function maxStorage(){return 20+(state.upgrades.storage-1)*12}

const names=["Minh","An","Lan","Huy","Mai","Nam","Linh","Khoa","Vy","Tú"];
const faces=["🙂","😋","🤩","😊","😎","🥰","🧑‍🎤","👩‍🎨"];

function makeCustomer(){
  const available=recipes.filter(r=>r.unlock<=state.level);
  const recipe=available[Math.floor(Math.random()*available.length)];
  return {id:Date.now()+Math.random(),name:names[Math.floor(Math.random()*names.length)],face:faces[Math.floor(Math.random()*faces.length)],recipeId:recipe.id};
}
function fillCustomers(){
  while(state.customers.length<maxTables() && state.shift) state.customers.push(makeCustomer());
}
function startShift(){
  state.shift=!state.shift;
  if(state.shift){fillCustomers();toast("🟢 Quán đã mở cửa!");}
  else {state.customers=[];state.currentOrder=null;toast("🔴 Đã đóng cửa.");}
  saveGame();render();
}
function serveNext(){
  if(!state.shift){toast("Hãy mở cửa trước.");return}
  if(!state.customers.length){fillCustomers();render();return}
  if(state.ingredients<=0){toast("📦 Hết nguyên liệu! Nâng kho.");return}
  const c=state.customers[0];
  const r=recipes.find(x=>x.id===c.recipeId);
  state.currentOrder=c;
  const cost=r.stock-(state.staff.bulbasaur?1:0);
  state.ingredients=Math.max(0,state.ingredients-cost);
  let revenue=r.price+(state.upgrades.machine-1)*5;
  if(state.staff.pikachu) revenue=Math.ceil(revenue*1.08);
  state.money+=revenue;
  state.served++;
  state.rep+=1+(state.staff.psyduck?1:0)+(state.upgrades.decor-1);
  state.quests.serve++;
  state.quests.money+=revenue;
  addExp(r.exp);
  state.customers.shift();
  fillCustomers();
  toast(`🧋 Bán ${r.name}: +${revenue}💰 +${r.exp} EXP`);
  state.currentOrder=null;
  saveGame();render();
}

function upgradeCost(u){
  return Math.round(u.base*Math.pow(1.55,state.upgrades[u.id]-1));
}
function buyUpgrade(id){
  const u=upgradeData.find(x=>x.id===id);
  if(state.upgrades[id]>=u.max){toast("Đã đạt cấp tối đa.");return}
  const cost=upgradeCost(u);
  if(state.money<cost){toast("💰 Chưa đủ tiền.");return}
  state.money-=cost;state.upgrades[id]++;
  addExp(20);saveGame();render();toast(`⬆️ Đã nâng cấp ${u.name}!`);
}
function hireStaff(id){
  const s=staffData.find(x=>x.id===id);
  if(state.staff[id]){toast("Nhân viên này đã gia nhập.");return}
  const cost=s.baseCost+state.level*20;
  if(state.money<cost){toast("💰 Chưa đủ tiền.");return}
  state.money-=cost;state.staff[id]=1;addExp(30);
  saveGame();render();toast(`🐾 ${s.name} đã gia nhập quán!`);
}
function upgradeStaff(id){
  if(!state.staff[id])return;
  const key=id+"_lv";
  const lv=state.staff[key]||1;
  const cost=120*lv;
  if(state.money<cost){toast("💰 Chưa đủ tiền.");return}
  state.money-=cost;state.staff[key]=lv+1;addExp(15);
  saveGame();render();toast("✨ Nhân viên đã được đào tạo!");
}
function staffLevel(id){return state.staff[id+"_lv"]||1}

function showScreen(id,btn){
  document.querySelectorAll(".screen").forEach(x=>x.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.querySelectorAll(".nav-btn").forEach(x=>x.classList.remove("active"));
  if(btn)btn.classList.add("active");
  render();
}

function render(){
  document.getElementById("money").textContent=state.money;
  document.getElementById("levelText").textContent=`Lv. ${state.level} • EXP ${state.exp}/${levelNeed()}`;
  document.getElementById("expText").textContent=state.exp;
  document.getElementById("repText").textContent=state.rep;
  document.getElementById("tableText").textContent=maxTables();
  document.getElementById("stockText").textContent=state.ingredients+"/"+maxStorage();

  const customers=document.getElementById("customers");
  if(!state.shift){
    customers.innerHTML=`<div class="save-card">🔴 Quán đang đóng. Bấm <b>“Mở cửa / Tiếp khách”</b> để bắt đầu ca.</div>`;
  }else if(!state.customers.length){
    customers.innerHTML=`<div class="save-card">Không còn khách. Hãy chờ hoặc bấm pha bán khi có khách.</div>`;
  }else{
    customers.innerHTML=state.customers.map(c=>{
      const r=recipes.find(x=>x.id===c.recipeId);
      return `<div class="customer"><div class="avatar">${c.face}</div><div class="customer-main"><div class="customer-name">${c.name}</div><div class="order">${r.icon} Muốn gọi <b>${r.name}</b></div></div><span class="tag">Chờ</span></div>`;
    }).join("");
  }
  document.getElementById("orderPanel").classList.toggle("hidden",!state.currentOrder);

  document.getElementById("quests").innerHTML=`
    <div class="quest"><div class="quest-top"><span>🧋 Phục vụ 10 khách</span><span>${Math.min(state.quests.serve,10)}/10</span></div><div class="bar"><i style="width:${Math.min(100,state.quests.serve*10)}%"></i></div></div>
    <div class="quest"><div class="quest-top"><span>💰 Kiếm 500 tiền</span><span>${Math.min(state.quests.money,500)}/500</span></div><div class="bar"><i style="width:${Math.min(100,state.quests.money/5)}%"></i></div></div>
  `;

  document.getElementById("staffList").innerHTML=staffData.map(s=>{
    const owned=!!state.staff[s.id], lv=staffLevel(s.id), cost=s.baseCost+state.level*20;
    return `<div class="staff-card"><div class="staff-head"><div class="poke">${s.icon}</div><div class="grow"><div class="name">${s.name} ${owned?`<span class="level-pill">Lv.${lv}</span>`:""}</div><div class="small">${s.role} • ${s.desc}</div></div></div><div class="card-actions">${owned?`<button onclick="upgradeStaff('${s.id}')">⬆️ Đào tạo (${120*lv}💰)</button>`:`<button class="primary" onclick="hireStaff('${s.id}')">Thuê ${cost}💰</button>`}</div></div>`;
  }).join("");

  document.getElementById("upgradeList").innerHTML=upgradeData.map(u=>{
    const lv=state.upgrades[u.id],max=lv>=u.max,cost=upgradeCost(u);
    return `<div class="upgrade-card"><div class="upgrade-head"><div class="poke">${u.icon}</div><div class="grow"><div class="name">${u.name} <span class="level-pill">Lv.${lv}/${u.max}</span></div><div class="small">${u.desc}</div></div></div><div class="card-actions"><button ${max?"disabled":""} onclick="buyUpgrade('${u.id}')">${max?"MAX":"⬆️ Nâng cấp • "+cost+"💰"}</button></div></div>`;
  }).join("");

  document.getElementById("menuList").innerHTML=recipes.map(r=>{
    const unlocked=r.unlock<=state.level;
    return `<div class="menu-card"><div class="menu-head"><div class="poke">${r.icon}</div><div class="grow"><div class="name">${r.name}</div><div class="small">${unlocked?`Giá bán <span class="price">${r.price}💰</span> • +${r.exp} EXP`:`🔒 Mở ở Level ${r.unlock}`}</div></div><span class="level-pill">${unlocked?"Mở":"Khóa"}</span></div></div>`;
  }).join("");
}
function toast(msg){
  const el=document.getElementById("toast");el.textContent=msg;el.classList.add("show");
  clearTimeout(window._toast);window._toast=setTimeout(()=>el.classList.remove("show"),1800);
}
loadGame();
