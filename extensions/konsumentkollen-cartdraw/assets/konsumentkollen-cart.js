console.log("Konsumentkollen cart embed loaded");

(function () {
  if (window.__KK_CART_DRAWER_LOADED__) return;
  window.__KK_CART_DRAWER_LOADED__ = true;

  var WIDGET_ID = "kk-widget";
  var STYLE_ID = "kk-widget-styles";
  var ROOT_ID = "kk-embed-root";

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;

    var style = document.createElement("style");
    style.id = STYLE_ID;
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
        display:block;
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
        border: 2px solid #ff6610; /* samma tjocklek så den inte hoppar */
      }

      .kk-widget-btn:active{
        transform: translateY(1px);
      }
    `;
    document.head.appendChild(style);
  }

  function normalizeUrl(url) {
    if (!url) return "";
    var u = String(url).trim();
    if (!u) return "";
    // Tillåt bara http/https här så du inte råkar öppna "javascript:" osv.
    if (!/^https?:\/\//i.test(u)) return "";
    return u;
  }

  // Försöker läsa Scrive URL från samma “källa” som du använder för app blocket:
  // 1) #kk-embed-root data-scrive-url
  // 2) meta[name="kk-scrive-url"]
  // 3) script#kk-config { "scriveUrl": "..." }
  function readScriveUrlFromStorefront() {
    var root = document.getElementById(ROOT_ID);

    // data-scrive-url => dataset.scriveUrl (camelCase)
    var url =
      (root && root.dataset && (root.dataset.scriveUrl || root.dataset.scriveurl)) ||
      "";

    url = normalizeUrl(url);
    if (url) return url;

    var meta = document.querySelector('meta[name="kk-scrive-url"]');
    url = normalizeUrl(meta && meta.getAttribute("content"));
    if (url) return url;

    var cfgScript = document.getElementById("kk-config");
    if (cfgScript) {
      try {
        var json = JSON.parse(cfgScript.textContent || "{}");
        url = normalizeUrl(json.scriveUrl);
        if (url) return url;
      } catch (e) {
        // ignore
      }
    }

    return "";
  }

  function getConfig() {
    var root = document.getElementById(ROOT_ID);

    var scriveUrl = readScriveUrlFromStorefront();
    var logoUrl = (root && root.dataset && root.dataset.logoUrl) || "";

    // Fallback om inget hittas (men helst ska den komma från settings)
    if (!scriveUrl) {
      scriveUrl = "https://scrive.com/form/190f283d-af8a-4b0e-b0f8-f3dbd761e342";
    }

    return { scriveUrl: scriveUrl, logoUrl: logoUrl };
  }

  function findDrawer() {
    return (
      document.querySelector("cart-drawer") ||
      document.querySelector("#CartDrawer") ||
      document.querySelector(".cart-drawer") ||
      document.querySelector('[role="dialog"][aria-label*="cart"]') ||
      document.querySelector('[role="dialog"][aria-label*="Cart"]')
    );
  }

  // Hittar "produkterna"-delen i så många teman som möjligt.
  // Målet: vi vill lägga widgeten DIREKT EFTER den containern.
  function findProductsContainer(drawer) {
    if (!drawer) return null;

    var selectors = [
      "cart-drawer-items", // Dawn (web component)
      "#CartDrawer-Items",
      '[id*="CartDrawer-Items"]',
      ".cart-drawer__items",
      ".cart-drawer-items",
      "[data-cart-drawer-items]",
      "[data-cart-items]",
      ".drawer__items",
      ".ajaxcart__inner",
      ".ajaxcart__content",
      ".mini-cart__items",
      ".minicart__items",
    ];

    for (var i = 0; i < selectors.length; i++) {
      var el = drawer.querySelector(selectors[i]);
      if (el) return el;
    }

    var rowSelectors = [
      "[data-cart-item]",
      ".cart-item",
      ".cart__item",
      ".ajaxcart__row",
      "li.cart-item",
      "tr.cart-item",
    ].join(",");

    var rows = drawer.querySelectorAll(rowSelectors);
    if (!rows || rows.length === 0) return null;

    var lastRow = rows[rows.length - 1];

    var container =
      lastRow.closest(
        "cart-drawer-items, .cart-drawer__items, .cart-drawer-items, ul, ol, tbody, .cart-items, .cart__items, .ajaxcart__inner, .ajaxcart__content"
      ) || lastRow.parentElement;

    return container || null;
  }

  function buildWidget(cfg) {
    var el = document.createElement("div");
    el.id = WIDGET_ID;
    el.className = "kk-widget-card";

    var logoHtml = cfg.logoUrl
      ? '<img class="kk-widget-logo" src="' +
        cfg.logoUrl +
        '" alt="ViPo Säkerhet" />'
      : "";

    el.innerHTML =
      "" +
      '<div class="kk-widget-row">' +
      logoHtml +
      "<div>" +
      '<div class="kk-widget-title">Skydda din identitet – få omedelbara larm!</div>' +
      '<p class="kk-widget-desc">Med <strong>Konsumentkollen</strong> får du bevakning av ditt personnummer dygnet runt.</p>' +
      "</div>" +
      "</div>" +
      '<div class="kk-widget-actions">' +
      '<button type="button" class="kk-widget-btn" id="kk-bevaka-btn">STARTA BEVAKNING</button>' +
      "</div>";

    return el;
  }

  function updateWidgetDom(el, cfg) {
    if (!el) return;

    var img = el.querySelector("img.kk-widget-logo");
    if (cfg.logoUrl) {
      if (!img) {
        // om den saknas, lägg in den
        var row = el.querySelector(".kk-widget-row");
        if (row) {
          var tmp = document.createElement("div");
          tmp.innerHTML =
            '<img class="kk-widget-logo" src="' +
            cfg.logoUrl +
            '" alt="ViPo Säkerhet" />';
          row.insertBefore(tmp.firstChild, row.firstChild);
        }
      } else if (img.getAttribute("src") !== cfg.logoUrl) {
        img.setAttribute("src", cfg.logoUrl);
      }
    } else if (img) {
      img.remove();
    }
  }

  function bindWidget(el) {
    if (!el || el.__kkBound) return;

    var btn = el.querySelector("#kk-bevaka-btn");
    if (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();

        // HÄMTA URL “LIVE” VID KLICK — så den alltid matchar settings
        var cfgNow = getConfig();
        var url = cfgNow.scriveUrl;

        window.open(url, "_blank", "noopener,noreferrer");
      });
    }

    el.__kkBound = true;
  }

  function placeAfter(anchor, el) {
    if (!anchor || !anchor.parentElement || !el) return;

    var correct =
      el.parentElement === anchor.parentElement &&
      el.previousElementSibling === anchor;

    if (!correct) {
      anchor.insertAdjacentElement("afterend", el);
    }
  }

  // Debounce så MutationObserver inte spammar inject
  var scheduled = false;
  function scheduleInject() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () {
      scheduled = false;
      inject();
    });
  }

  function inject() {
    var drawer = findDrawer();
    if (!drawer) return;

    var productsContainer = findProductsContainer(drawer);
    if (!productsContainer) return;

    // Om det inte finns produkter (tom cart) – lägg inte in widgeten
    if (productsContainer.children && productsContainer.children.length === 0) {
      return;
    }

    ensureStyles();

    var cfg = getConfig();

    var widget = drawer.querySelector("#" + WIDGET_ID);
    if (!widget) {
      widget = buildWidget(cfg);
    } else {
      // om URL/logga ändras över tid, håll DOM uppdaterad
      updateWidgetDom(widget, cfg);
    }

    bindWidget(widget);

    // Nyckeln: alltid DIREKT EFTER produkterna
    placeAfter(productsContainer, widget);
  }

  // Observera DOM (cart drawer renderas om ofta)
  var observer = new MutationObserver(scheduleInject);
  observer.observe(document.body, { childList: true, subtree: true });

  // Kör direkt också
  inject();
})();

