
const tg = window.Telegram ? window.Telegram.WebApp : null;
if (tg) {
  tg.expand();
  if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
    const user = tg.initDataUnsafe.user;
    document.getElementById('username').innerText = user.first_name || 'Minero Anime';
  }
}
let balance = parseFloat(localStorage.getItem('anim_balance')) || 0;
let miningRate = parseFloat(localStorage.getItem('anim_rate')) || 0.001;
let upgradeCost = parseFloat(localStorage.getItem('anim_cost')) || 10;
let level = parseInt(localStorage.getItem('anim_level')) || 1;
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
  userLevelEl.innerText = 'Nv. ' + level;
  upgradeCostEl.innerText = upgradeCost.toFixed(0);
}
function saveData() {
  localStorage.setItem('anim_balance', balance);
  localStorage.setItem('anim_rate', miningRate);
  localStorage.setItem('anim_cost', upgradeCost);
  localStorage.setItem('anim_level', level);
}
setInterval(() => {
  balance += miningRate;
  updateUI();
  saveData();
}, 1000);
mineBtn.addEventListener('click', () => {
  balance += (miningRate * 0.5);
  updateUI();
  saveData();
});
upgradeBtn.addEventListener('click', () => {
  if (balance >= upgradeCost) {
    balance -= upgradeCost;
    miningRate += 0.002;
    level += 1;
    upgradeCost *= 1.8;
    updateUI();
    saveData();
    alert('¡Pico Mejorado!');
  } else {
    alert('No tienes suficientes tokens ANIM.');
  }
});
const ADSGRAM_BLOCK_ID = "int-43971";
adBtn.addEventListener('click', () => {
  if (typeof window.Adsgram !== 'undefined') {
    const AdController = window.Adsgram.init({ blockId: ADSGRAM_BLOCK_ID });
    AdController.show().then((result) => {
      if (result.done) {
        balance += 10.0;
        updateUI();
        saveData();
        alert('¡Felicidades! Ganaste +10.0 ANIM por ver el anuncio.');
      }
    }).catch((error) => {
      console.log('Error:', error);
      alert('No se pudo completar el anuncio.');
    });
  } else {
    balance += 10.0;
    updateUI();
    saveData();
    alert('[MODO DEMO] Ganaste +10.0 ANIM');
  }
});
updateUI();
