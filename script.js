// =====================================================
// ANIME MINING - SCRIPT PRINCIPAL
// =====================================================

// 1. CONFIGURACIÓN GENERAL
const BOT_USERNAME = "@Animemiming_bot";

// URL CORRECTA DE SUPABASE
const SUPABASE_URL = "https://cnwthrmgzqfydtpenmkj.supabase.co";

// PEGA AQUÍ TU CLAVE PÚBLICA ANON DE SUPABASE
const SUPABASE_KEY = "sb_publishable_1dlROt_qD3hkPCOV_eFjlA_OGpR7MJ8";


// =====================================================
// 2. CONEXIÓN CON SUPABASE
// =====================================================

let supabase = null;

try {
  if (
    window.supabase &&
    SUPABASE_URL &&
    !SUPABASE_URL.includes("PEGA")
  ) {
    supabase = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );
  }
} catch (e) {
  console.error("Error iniciando Supabase:", e);
}


// =====================================================
// 3. TELEGRAM
// =====================================================

const tg = window.Telegram
  ? window.Telegram.WebApp
  : null;

if (tg) {
  tg.expand();
  tg.ready();
}


// =====================================================
// 4. DATOS DEL USUARIO
// =====================================================

const userObj = tg?.initDataUnsafe?.user;

const userId = userObj
  ? String(userObj.id)
  : "demo123";

const userName = userObj
  ? (userObj.first_name || "Minero Anime")
  : "Minero Anime";


// Mostrar nombre
const usernameEl = document.getElementById("username");

if (usernameEl) {
  usernameEl.innerText = userName;
}


// =====================================================
// 5. ESTADO DEL JUGADOR
// =====================================================

let balance = 0;

let miningRate = 0.001;

let upgradeCost = 10;

let level = 1;

let refCount = 0;

let isClaiming = false;


// Enlace de referido
const refLink =
  `https://t.me/${BOT_USERNAME}/app?startapp=${userId}`;


// =====================================================
// 6. ELEMENTOS DE LA INTERFAZ
// =====================================================

const tokenCountEl =
  document.getElementById("token-count");

const mineRateEl =
  document.getElementById("mine-rate");

const userLevelEl =
  document.getElementById("user-level");

const upgradeCostEl =
  document.getElementById("upgrade-cost");


// Este es el botón central COBRAR
const mineBtn =
  document.getElementById("mine-button");


const upgradeBtn =
  document.getElementById("upgrade-button");

const adBtn =
  document.getElementById("ad-button");


// =====================================================
// 7. ACTUALIZAR INTERFAZ
// =====================================================

function updateUI() {

  if (tokenCountEl) {
    tokenCountEl.innerText =
      balance.toFixed(3);
  }

  if (mineRateEl) {
    mineRateEl.innerText =
      miningRate.toFixed(3);
  }

  if (userLevelEl) {
    userLevelEl.innerText =
      level;
  }

  if (upgradeCostEl) {
    upgradeCostEl.innerText =
      Math.floor(upgradeCost);
  }

  const refCountEl =
    document.getElementById("ref-count-val");

  if (refCountEl) {
    refCountEl.innerText =
      refCount;
  }
}


// =====================================================
// 8. NOTIFICACIONES
// =====================================================

function notify(mensaje) {

  if (tg && tg.showAlert) {
    tg.showAlert(mensaje);
  } else {
    alert(mensaje);
  }
}


// =====================================================
// 9. CARGAR USUARIO
// =====================================================

async function initUser() {

  if (!supabase) {
    console.warn(
      "Supabase no está conectado."
    );

    updateUI();

    return;
  }

  try {

    const startParam =
      tg?.initDataUnsafe?.start_param;


    // Buscar usuario
    let { data: user, error } =
      await supabase
        .from("users")
        .select("*")
        .eq("telegram_id", userId)
        .maybeSingle();


    if (error) {
      throw error;
    }


    // =================================================
    // USUARIO NUEVO
    // =================================================

    if (!user) {

      const referredBy =
        (
          startParam &&
          startParam !== userId
        )
          ? startParam
          : null;


      const initialBalance =
        referredBy ? 50.0 : 0.0;


      const result =
        await supabase
          .from("users")
          .insert([
            {
              telegram_id: userId,
              username: userName,
              balance: initialBalance,
              mining_rate: 0.001,
              upgrade_cost: 10,
              level: 1,
              referred_by: referredBy
            }
          ])
          .select()
          .single();


      if (result.error) {
        throw result.error;
      }


      user = result.data;


      // Recompensa por referido
      if (referredBy) {

        notify(
          "🎁 ¡Recibiste +50.0 ANIM por unirte con invitación!"
        );

        await rewardReferrer(
          referredBy
        );
      }
    }


    // =================================================
    // CARGAR DATOS
    // =================================================

    if (user) {

      balance =
        parseFloat(user.balance) || 0;

      miningRate =
        parseFloat(user.mining_rate) || 0.001;

      upgradeCost =
        parseFloat(user.upgrade_cost) || 10;

      level =
        parseInt(user.level) || 1;
    }

  } catch (err) {

    console.error(
      "Error cargando usuario:",
      err
    );
  }


  updateUI();

  loadReferrals();
}


// =====================================================
// 10. RECOMPENSA DE REFERIDO
// =====================================================

async function rewardReferrer(
  referrerId
) {

  if (!supabase) return;

  try {

    const { data: referrer } =
      await supabase
        .from("users")
        .select("balance")
        .eq("telegram_id", referrerId)
        .maybeSingle();


    if (referrer) {

      const newBalance =
        (parseFloat(referrer.balance) || 0)
        + 50.0;


      await supabase
        .from("users")
        .update({
          balance: newBalance
        })
        .eq(
          "telegram_id",
          referrerId
        );
    }

  } catch (e) {

    console.error(
      "Error recompensando referido:",
      e
    );
  }
}


// =====================================================
// 11. GUARDAR DATOS
// =====================================================

async function saveData() {

  if (!supabase) return;

  try {

    const { error } =
      await supabase
        .from("users")
        .update({
          balance: balance,
          mining_rate: miningRate,
          upgrade_cost: upgradeCost,
          level: level
        })
        .eq(
          "telegram_id",
          userId
        );


    if (error) {
      console.error(
        "Error guardando:",
        error
      );
    }

  } catch (e) {

    console.error(
      "Error al guardar datos:",
      e
    );
  }
}


// =====================================================
// 12. COBRAR MINERÍA
// =====================================================

async function claimMining() {

  // Evitar doble clic
  if (isClaiming) return;


  // No hay nada que cobrar
  if (balance <= 0) {

    notify(
      "⛏️ Todavía no tienes ANIM disponible para cobrar."
    );

    return;
  }


  isClaiming = true;


  const amount =
    parseFloat(balance.toFixed(6));


  // Desactivar botón temporalmente
  if (mineBtn) {
    mineBtn.disabled = true;
    mineBtn.style.opacity = "0.6";
  }


  try {

    // =================================================
    // SIN SUPABASE
    // =================================================

    if (!supabase) {

      balance = 0;

      updateUI();

      notify(
        `[MODO DEMO] Cobraste ${amount.toFixed(3)} ANIM`
      );

      return;
    }


    // =================================================
    // GUARDAR EL COBRO
    // =================================================

    const { error: claimError } =
      await supabase
        .from("claims")
        .insert([
          {
            telegram_id: userId,
            amount: amount
          }
        ]);


    if (claimError) {
      throw claimError;
    }


    // =================================================
    // REINICIAR BALANCE DE MINERÍA
    // =================================================

    const { error: balanceError } =
      await supabase
        .from("users")
        .update({
          balance: 0
        })
        .eq(
          "telegram_id",
          userId
        );


    if (balanceError) {
      throw balanceError;
    }


    // Reiniciar contador local
    balance = 0;


    updateUI();


    notify(
      `💰 ¡Cobro realizado!\n\n+${amount.toFixed(3)} ANIM`
    );


  } catch (error) {

    console.error(
      "Error realizando cobro:",
      error
    );


    notify(
      "❌ No se pudo realizar el cobro. Inténtalo nuevamente."
    );

  } finally {

    isClaiming = false;


    if (mineBtn) {

      mineBtn.disabled = false;

      mineBtn.style.opacity = "1";
    }
  }
}


// =====================================================
// 13. BOTÓN COBRAR
// =====================================================

if (mineBtn) {

  mineBtn.addEventListener(
    "click",
    claimMining
  );
}


// =====================================================
// 14. MINERÍA AUTOMÁTICA
// =====================================================

setInterval(() => {

  balance += miningRate;

  updateUI();

}, 1000);


// =====================================================
// 15. GUARDADO AUTOMÁTICO
// =====================================================

setInterval(
  saveData,
  15000
);


// =====================================================
// 16. MEJORAR PICO
// =====================================================

if (upgradeBtn) {

  upgradeBtn.addEventListener(
    "click",
    async () => {

      if (balance >= upgradeCost) {

        balance -= upgradeCost;

        miningRate += 0.002;

        level += 1;

        upgradeCost =
          Math.round(
            upgradeCost * 1.8
          );


        updateUI();

        await saveData();


        notify(
          "⛏️ ¡Pico mejorado! ⚡"
        );

      } else {

        notify(
          "❌ No tienes suficientes tokens ANIM."
        );
      }
    }
  );
}


// =====================================================
// 17. ADSGRAM
// =====================================================

const ADSGRAM_BLOCK_ID =
  "int-43985";


if (adBtn) {

  adBtn.addEventListener(
    "click",
    async () => {

      if (
        typeof window.Adsgram !==
        "undefined"
      ) {

        const AdController =
          window.Adsgram.init({
            blockId:
              ADSGRAM_BLOCK_ID
          });


        AdController
          .show()
          .then(async (result) => {

            if (result.done) {

              balance += 10.0;

              updateUI();

              await saveData();

              notify(
                "🎁 ¡Felicidades!\nGanaste +10.0 ANIM por ver el anuncio."
              );
            }

          })
          .catch(() => {

            notify(
              "❌ No se pudo completar el anuncio."
            );
          });


      } else {

        // Modo demo
        balance += 10.0;

        updateUI();

        await saveData();

        notify(
          "[MODO DEMO] Ganaste +10.0 ANIM"
        );
      }

    }
  );
}


// =====================================================
// 18. REFERIDOS
// =====================================================

async function loadReferrals() {

  if (!supabase) return;

  try {

    const { data: friends } =
      await supabase
        .from("users")
        .select(
          "username, created_at"
        )
        .eq(
          "referred_by",
          userId
        );


    const listEl =
      document.getElementById(
        "friends-list"
      );


    if (listEl) {

      if (
        !friends ||
        friends.length === 0
      ) {

        refCount = 0;

        listEl.innerHTML =
          '<li class="empty-list">Aún no has invitado a nadie 🚀</li>';

      } else {

        refCount =
          friends.length;


        listEl.innerHTML =
          friends
            .map(
              f => `
                <li>
                  <span>👤 ${f.username}</span>
                  <span class="reward-badge">
                    +50.0 ANIM
                  </span>
                </li>
              `
            )
            .join("");
      }
    }

  } catch (e) {

    console.error(
      "Error cargando referidos:",
      e
    );
  }


  updateUI();
}


// =====================================================
// 19. RANKING
// =====================================================

async function loadLeaderboard() {

  if (!supabase) return;

  try {

    const { data: topUsers } =
      await supabase
        .from("users")
        .select(
          "username, balance"
        )
        .order(
          "balance",
          {
            ascending: false
          }
        )
        .limit(10);


    const listEl =
      document.getElementById(
        "leaderboard-list"
      );


    if (listEl) {

      if (
        topUsers &&
        topUsers.length > 0
      ) {

        listEl.innerHTML =
          topUsers
            .map(
              (u, i) => `
                <li>
                  <span>
                    ${i + 1}. 👤 ${u.username}
                  </span>

                  <span class="reward-badge">
                    ${parseFloat(
                      u.balance
                    ).toFixed(1)} ANIM
                  </span>
                </li>
              `
            )
            .join("");

      } else {

        listEl.innerHTML =
          '<li class="empty-list">Sin datos de clasificación aún.</li>';
      }
    }

  } catch (e) {

    console.error(
      "Error cargando ranking:",
      e
    );
  }
}


// =====================================================
// 20. NAVEGACIÓN
// =====================================================

function switchTab(tabName) {

  const tabs = [
    "mining",
    "friends",
    "wallet",
    "top"
  ];


  tabs.forEach(tab => {

    const section =
      document.getElementById(
        `${tab}-section`
      );

    const nav =
      document.getElementById(
        `nav-${tab}`
      );


    if (tab === tabName) {

      if (section) {
        section.style.display =
          "block";
      }

      if (nav) {
        nav.classList.add("active");
      }

    } else {

      if (section) {
        section.style.display =
          "none";
      }

      if (nav) {
        nav.classList.remove("active");
      }
    }
  });


  if (
    tabName === "friends"
  ) {
    loadReferrals();
  }


  if (
    tabName === "top"
  ) {
    loadLeaderboard();
  }
}


// =====================================================
// 21. BARRA INFERIOR
// =====================================================

document
  .getElementById("nav-mine")
  ?.addEventListener(
    "click",
    () => switchTab("mining")
  );


document
  .getElementById("nav-friends")
  ?.addEventListener(
    "click",
    () => switchTab("friends")
  );


document
  .getElementById("nav-wallet")
  ?.addEventListener(
    "click",
    () => switchTab("wallet")
  );


document
  .getElementById("nav-top")
  ?.addEventListener(
    "click",
    () => switchTab("top")
  );


// =====================================================
// 22. ENLACE DE REFERIDOS
// =====================================================

const refInput =
  document.getElementById(
    "ref-link"
  );


if (refInput) {
  refInput.value =
    refLink;
}


// Copiar
document
  .getElementById("copy-btn")
  ?.addEventListener(
    "click",
    async () => {

      try {

        await navigator
          .clipboard
          .writeText(refLink);

        notify(
          "✅ ¡Enlace copiado!"
        );

      } catch (e) {

        notify(
          "No se pudo copiar el enlace."
        );
      }
    }
  );


// Compartir
document
  .getElementById("share-btn")
  ?.addEventListener(
    "click",
    () => {

      const shareUrl =
        `https://t.me/share/url?url=${encodeURIComponent(
          refLink
        )}&text=${encodeURIComponent(
          "¡Únete a Anime Mining y gana tokens ANIM gratis! 🏮"
        )}`;


      if (tg) {

        tg.openTelegramLink(
          shareUrl
        );

      } else {

        window.open(
          shareUrl,
          "_blank"
        );
      }
    }
  );


// =====================================================
// 23. GUARDAR AL SALIR
// =====================================================

window.addEventListener(
  "beforeunload",
  saveData
);


// =====================================================
// 24. INICIAR APP
// =====================================================

initUser();
    
