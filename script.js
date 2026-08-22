// 1. Configuración de Telegram
const BOT_USERNAME = "@Animemiming_bot"; 
const tg = window.Telegram ? window.Telegram.WebApp : null;

if (tg) {
  tg.expand();
  tg.ready();
  if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
    const user = tg.initDataUnsafe.user;
    document.getElementById('username').innerText = user.first_name || 'Minero Anime';
  }
}

// 2. Estado del usuario
let userId = tg && tg.initDataUnsafe?.user ? tg.initDataUnsafe.user.id : "demo123";
let balance = parseFloat(localStorage.getItem('anim_balance')) || 0;
let miningRate = parseFloat(localStorage.getItem('anim_rate')) || 0.001;
let upgradeCost = parseFloat(localStorage.getItem('anim_cost')) || 10;
let level = parseInt(localStorage.getItem('anim_level')) || 1;
let refCount = parseInt(localStorage.getItem('anim_ref_count')) || 0;

// Enlace de referido
const refLink = `https://t.me/${BOT_USERNAME}/app?startapp=${userId}`;

// 3. Referencias DOM
const tokenCountEl = document.getElementById('token-count');
const mineRateEl = document.getElementById('mine-rate');
const userLevelEl = document.getElementById('user-level');
const upgradeCostEl = document.getElementById('upgrade-cost');
const mineBtn = document.getElementById('mine-button');
const upgradeBtn = document.getElementById('upgrade-button');
const adBtn = document.getElementById('ad-button');

// 4. Actualización de Interfaz
function updateUI() {
  tokenCountEl.innerText = balance.toFixed(3);
  mineRateEl.innerText = miningRate.toFixed(3);
  userLevelEl.innerText = 'Nv. ' + level;
  upgradeCostEl.innerText = Math.floor(upgradeCost);
  document.getElementById('ref-count-val').innerText = refCount;
}

function saveData() {
  localStorage.setItem('anim_balance', balance);
  localStorage.setItem('anim_rate', miningRate);
  localStorage.setItem('anim_cost', upgradeCost);
  localStorage.setItem('anim_level', level);
  localStorage.setItem('anim_ref_count', refCount);
}

function notify(mensaje) {
  if (tg && tg.showAlert) {
    tg.showAlert(mensaje);
  } else {
    alert(mensaje);
  }
}

// 5. Minería Automática y Guardado Frecuente
setInterval(() => {
  balance += miningRate;
  updateUI();
}, 1000);

setInterval(saveData, 10000);

// 6. Eventos de la Vista Principal
mineBtn.addEventListener('click', () => {
  balance += (miningRate * 0.5);
  updateUI();
});

upgradeBtn.addEventListener('click', () => {
  if (balance >= upgradeCost) {
    balance -= upgradeCost;
    miningRate += 0.002;
    level += 1;
    upgradeCost = Math.round(upgradeCost * 1.8);
    updateUI();
    saveData();
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
    AdController.show().then((result) => {
      if (result.done) {
        balance += 10.0;
        updateUI();
        saveData();
        notify('¡Felicidades! Ganaste +10.0 ANIM por ver el anuncio.');
      }
    }).catch((error) => {
      console.log('Error Adsgram:', error);
      notify('No se pudo completar el anuncio.');
    });
  } else {
    balance += 10.0;
    updateUI();
    saveData();
    notify('[MODO DEMO] Ganaste +10.0 ANIM');
  }
});

// 7. Lógica de Navegación entre Pestanias
function switchTab(tabName) {
  const miningSection = document.getElementById('mining-section');
  const friendsSection = document.getElementById('friends-section');
  const navMine = document.getElementById('nav-mine');
  const navFriends = document.getElementById('nav-friends');

  if (tabName === 'mining') {
    miningSection.style.display = 'block';
    friendsSection.style.display = 'none';
    navMine.classList.add('active');
    navFriends.classList.remove('active');
  } else if (tabName === 'friends') {
    miningSection.style.display = 'none';
    friendsSection.style.display = 'block';
    navMine.classList.remove('active');
    navFriends.classList.add('active');
  }
}

function showSoon(seccion) {
  notify('Próximamente: ' + seccion + ' 🚀');
}

// 8. Eventos de la Sección de Referidos
document.getElementById('ref-link').value = refLink;

document.getElementById('copy-btn').addEventListener('click', () => {
  navigator.clipboard.writeText(refLink);
  notify('¡Enlace copiado al portapapeles!');
});

document.getElementById('share-btn').addEventListener('click', () => {
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent("¡Únete a Anime Mining y gana tokens ANIM gratis! 🏮")}`;
  if (tg) {
    tg.openTelegramLink(shareUrl);
  } else {
    window.open(shareUrl, '_blank');
  }
});

// Verificar si entró mediante referido
function checkReferral() {
  const startParam = tg?.initDataUnsafe?.start_param;
  const hasBeenReferred = localStorage.getItem('anim_referred');

  if (startParam && !hasBeenReferred && startParam !== String(userId)) {
    balance += 50.0;
    localStorage.setItem('anim_referred', 'true');
    updateUI();
    saveData();
    notify('🎁 ¡Recibiste +50.0 ANIM por unirte mediante invitación!');
  }
}

window.addEventListener('beforeunload', saveData);

// Inicializar
updateUI();
checkReferral();
    
