console.log("Konsumentkollen cart embed loaded");

(function () {
  if (window.__KK_CART_DRAWER_LOADED__) return;
  window.__KK_CART_DRAWER_LOADED__ = true;

  function ensureStyles() {
    if (document.getElementById("kk-widget-styles")) return;

    var style = document.createElement("style");
    style.id = "kk-widget-styles";
    style.textContent = `
      .kk-widget-card{
        width: 100%;
        max-width: 360px;
        margin: 12px auto;
        background: #fff;
        border: 1px solid rgba(0,0,0,0.08);
        border-radius: 14px;
        padding: 16px 16px 14px;
        box-sizing: border-box;
        text-align: left;
      }

      .kk-widget-row{
        display: flex;
        gap: 12px;
        align-items: flex-start;
      }

      .kk-widget-logo{
        width: 64px;
        height: 64px;
        flex: 0 0 64px;
        object-fit: contain;
      }

      .kk-widget-title{
        font-weight: 800;
        font-size: 15px;
        line-height: 1.25;
        margin: 0 0 6px 0;
      }

      .kk-widget-desc{
        font-size: 12px;
        line-height: 1.35;
        margin: 0;
        opacity: 0.9;
      }

      .kk-widget-actions{
        margin-top: 14px;
        display: flex;
        justify-content: center;
      }

      .kk-widget-btn{
        width: 100%;
        max-width: 320px;
        height: 30px;
        border-radius: 10px;
        background: #ff6610;
        color: #fff;
        font-weight: 700;
        border: 2px solid #ff6610;
        cursor: pointer;
        transition: background-color 0.2s ease, color 0.2s ease;
      }

      .kk-widget-btn:hover{
        background: #ffffff;
        color: #ff6610;
        border: 2px solid #ff6610; /* samma tjocklek som normal, så den inte hoppar */
      }

      .kk-widget-btn:active{
        transform: translateY(1px);
      }
    `;
    document.head.appendChild(style);
  }

  function getConfig() {
    var root = document.getElementById("kk-embed-root");
    var scriveUrl = root && root.dataset ? root.dataset.scriveUrl : "";
    var logoUrl = root && root.dataset ? root.dataset.logoUrl : "";

    if (!scriveUrl) {
      scriveUrl = "https://scrive.com/form/190f283d-af8a-4b0e-b0f8-f3dbd761e342";
    }

    return { scriveUrl: scriveUrl, logoUrl: logoUrl };
  }

  function findDrawer() {
    return (
      document.querySelector("cart-drawer") ||
      document.querySelector(".cart-drawer") ||
      document.querySelector('[role="dialog"][aria-label*="cart"]')
    );
  }

  function findInsertBeforeTarget(drawer) {
    return (
      drawer.querySelector("[data-cart-subtotal]") ||
      drawer.querySelector(".cart-subtotal") ||
      drawer.querySelector(".totals") ||
      drawer.querySelector(".cart__footer")
    );
  }

  function findCheckoutButton(drawer) {
    return (
      drawer.querySelector('button[name="checkout"]') ||
      drawer.querySelector('a[href*="/checkout"]') ||
      drawer.querySelector('button[type="submit"][name="checkout"]')
    );
  }

  function inject() {
    var drawer = findDrawer();
    if (!drawer) return;

    // undvik dubletter
    if (drawer.querySelector("#kk-widget")) return;

    var checkoutButton = findCheckoutButton(drawer);
    if (!checkoutButton) return;

    ensureStyles();

    var cfg = getConfig();

    var el = document.createElement("div");
    el.id = "kk-widget";
    el.className = "kk-widget-card";

    var logoHtml = cfg.logoUrl
      ? '<img class="kk-widget-logo" src="' + cfg.logoUrl + '" alt="ViPo Säkerhet" />'
      : "";

    el.innerHTML =
      '' +
      '<div class="kk-widget-row">' +
      logoHtml +
      '<div>' +
      '<div class="kk-widget-title">Skydda din identitet – få omedelbara larm!</div>' +
      '<p class="kk-widget-desc">Med Konsumentkollen får du bevakning av ditt personnummer dygnet runt.</p>' +
      "</div>" +
      "</div>" +
      '<div class="kk-widget-actions">' +
      '<button type="button" class="kk-widget-btn" id="kk-bevaka-btn">Bevaka</button>' +
      "</div>";

    var beforeTarget = findInsertBeforeTarget(drawer);

    if (beforeTarget && beforeTarget.parentElement) {
      beforeTarget.parentElement.insertBefore(el, beforeTarget);
    } else if (checkoutButton.parentElement) {
      checkoutButton.parentElement.insertBefore(el, checkoutButton);
    } else {
      drawer.appendChild(el);
    }

    var btn = el.querySelector("#kk-bevaka-btn");
    if (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();

        // Öppna Scrive i ny flik (så checkout-fliken inte försvinner)
        window.open(cfg.scriveUrl, "_blank", "noopener,noreferrer");
      });
    }
  }

  // Cart drawer är dynamisk -> observera DOM
  var observer = new MutationObserver(inject);
  observer.observe(document.body, { childList: true, subtree: true });

  // kör direkt
  inject();
})();
