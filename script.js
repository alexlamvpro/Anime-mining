// 1. Configuración de Telegram y Supabase
const BOT_USERNAME = "Animemiming_bot"; 

// PEGA AQUÍ TUS DATOS DE SUPABASE (entre las comillas):
const SUPABASE_URL = "https://supabase.com/dashboard/project/cnwthrmgzqfydtpenmkj/settings/api-keys"; 
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNud3Rocm1nenFmeWR0cGVubWtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0MDcyNTcsImV4cCI6MjEwMjk4MzI1N30.K57rO8UN6YunnpWWvkL-hlsjYQjCeTmzydMi3Mxf-ec";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const tg = window.Telegram ? window.Telegram.WebApp : null;

if (tg) {
  tg.expand();
  tg.ready();
}

// 2. Datos del Usuario Telegram
const userObj = tg?.initDataUnsafe?.user;
const userId = userObj ? String(userObj.id) : "demo123";
const userName = userObj ? (userObj.first_name || "Minero Anime") : "Minero Anime";

document.getElementById('username').innerText = userName;

// Estado en Memoria
let balance = 0;
let miningRate = 0.001;
let upgradeCost = 10;
let level = 1;
let refCount = 0;

const refLink = `https://t.me/${BOT_USERNAME}/app?startapp=${userId}`;

// DOM Elements
const tokenCountEl = document.getElementById('token-count');
const mineRateEl = document.getElementById('mine-rate');
const userLevelEl = document.getElementById('user-level');
const upgradeCostEl = document.getElementById('upgrade-cost');
const mineBtn = document.getElementById('mine-button');
const upgradeBtn = document.getElementById('upgrade-button');
const adBtn = document.getElementById('ad-button');

function updateUI() {
  tokenCountEl.innerText = balance.toFixed(3);
  mineRateEl.innerText = miningRate.toFixed(3);
  userLevelEl.innerText = level;
  upgradeCostEl.innerText = Math.floor(upgradeCost);
  document.getElementById('ref-count-val').innerText = refCount;
}

function notify(mensaje) {
  if (tg && tg.showAlert) tg.showAlert(mensaje);
  else alert(mensaje);
}

// 3. Lógica Backend Supabase
async function initUser() {
  const startParam = tg?.initDataUnsafe?.start_param;

  let { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', userId)
    .single();

  if (!user) {
    let referredBy = (startParam && startParam !== userId) ? startParam : null;
    let initialBalance = referredBy ? 50.0 : 0.0;

    const { data: newUser } = await supabase
      .from('users')
      .insert([{
        telegram_id: userId,
        username: userName,
        balance: initialBalance,
        mining_rate: 0.001,
        upgrade_cost: 10,
        level: 1,
        referred_by: referredBy
      }])
      .select()
      .single();

    user = newUser;

    if (referredBy) {
      notify('🎁 ¡Recibiste +50.0 ANIM por unirte con invitación!');
      await rewardReferrer(referredBy);
    }
  }

  balance = parseFloat(user.balance);
  miningRate = parseFloat(user.mining_rate);
  upgradeCost = parseFloat(user.upgrade_cost);
  level = parseInt(user.level);

  updateUI();
  loadReferrals();
}

async function rewardReferrer(referrerId) {
  const { data: referrer } = await supabase
    .from('users')
    .select('balance')
    .eq('telegram_id', referrerId)
    .single();

  if (referrer) {
    await supabase
      .from('users')
      .update({ balance: parseFloat(referrer.balance) + 50.0 })
      .eq('telegram_id', referrerId);
  }
}

async function saveData() {
  await supabase
    .from('users')
    .update({
      balance: balance,
      mining_rate: miningRate,
      upgrade_cost: upgradeCost,
      level: level
    })
    .eq('telegram_id', userId);
}

async function loadReferrals() {
  const { data: friends } = await supabase
    .from('users')
    .select('username, created_at')
    .eq('referred_by', userId);

  const listEl = document.getElementById('friends-list');
  if (!friends || friends.length === 0) {
    refCount = 0;
    listEl.innerHTML = '<li class="empty-list">Aún no has invitado a nadie 🚀</li>';
  } else {
    refCount = friends.length;
    listEl.innerHTML = friends.map(f => `
      <li>
        <span>👤 ${f.username}</span>
        <span class="reward-badge">+50.0 ANIM</span>
      </li>
    `).join('');
  }
  updateUI();
}

async function loadLeaderboard() {
  const { data: topUsers } = await supabase
    .from('users')
    .select('username, balance')
    .order('balance', { ascending: false })
    .limit(10);

  const listEl = document.getElementById('leaderboard-list');
  if (topUsers && topUsers.length > 0) {
    listEl.innerHTML = topUsers.map((u, i) => `
      <li>
        <span>${i + 1}. 👤 ${u.username}</span>
        <span class="reward-badge">${parseFloat(u.balance).toFixed(1)} ANIM</span>
      </li>
    `).join('');
  } else {
    listEl.innerHTML = '<li class="empty-list">Sin datos de clasificación aún.</li>';
  }
}

// 4. Interacciones y Bucle
setInterval(() => {
  balance += miningRate;
  updateUI();
}, 1000);

setInterval(saveData, 15000);

mineBtn.addEventListener('click', () => {
  balance += (miningRate * 0.5);
  updateUI();
});

upgradeBtn.addEventListener('click', async () => {
  if (balance >= upgradeCost) {
    balance -= upgradeCost;
    miningRate += 0.002;
    level += 1;
    upgradeCost = Math.round(upgradeCost * 1.8);
    updateUI();
    await saveData();
    notify('¡Pico Mejorado! ⚡');
  } else {
    notify('No tienes suficientes tokens ANIM.');
  }
});

// Adsgram
const ADSGRAM_BLOCK_ID = "int-43985";
adBtn.addEventListener('click', () => {
  if (typeof window.Adsgram !== 'undefined') {
    const AdController = window.Adsgram.init({ blockId: ADSGRAM_BLOCK_ID });
    AdController.show().then(async (result) => {
      if (result.done) {
        balance += 10.0;
        updateUI();
        await saveData();
        notify('¡Felicidades! Ganaste +10.0 ANIM por ver el anuncio.');
      }
    }).catch(() => notify('No se pudo completar el anuncio.'));
  } else {
    balance += 10.0;
    updateUI();
    saveData();
    notify('[MODO DEMO] Ganaste +10.0 ANIM');
  }
});

// Navegación entre Pestañas (4 Pestañas)
function switchTab(tabName) {
  const tabs = ['mining', 'friends', 'wallet', 'top'];
  
  tabs.forEach(tab => {
    const section = document.getElementById(`${tab}-section`);
    const nav = document.getElementById(`nav-${tab}`);
    
    if (tab === tabName) {
      if (section) section.style.display = 'block';
      if (nav) nav.classList.add('active');
    } else {
      if (section) section.style.display = 'none';
      if (nav) nav.classList.remove('active');
    }
  });

  if (tabName === 'friends') loadReferrals();
  if (tabName === 'top') loadLeaderboard();
}

document.getElementById('ref-link').value = refLink;

document.getElementById('copy-btn').addEventListener('click', () => {
  navigator.clipboard.writeText(refLink);
  notify('¡Enlace copiado al portapapeles!');
});

document.getElementById('share-btn').addEventListener('click', () => {
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent("¡Únete a Anime Mining y gana tokens ANIM gratis! 🏮")}`;
  if (tg) tg.openTelegramLink(shareUrl);
  else window.open(shareUrl, '_blank');
});

window.addEventListener('beforeunload', saveData);

// Iniciar app
initUser();
