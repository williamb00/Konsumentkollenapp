console.log('Konsumentkollen cart embed loaded');

(function () {
  if (window.__KK_CART_DRAWER_LOADED__) return;
  window.__KK_CART_DRAWER_LOADED__ = true;

  function inject() {
    // 1. Hitta cart drawer (olika teman)
    const drawer =
      document.querySelector('cart-drawer') ||
      document.querySelector('.cart-drawer') ||
      document.querySelector('[role="dialog"][aria-label*="cart"]');

    if (!drawer) return;

    // 2. Undvik dubletter
    if (drawer.querySelector('#kk-widget')) return;

    // 3. Hitta checkout-knappen
    const checkoutButton =
      drawer.querySelector('button[name="checkout"]') ||
      drawer.querySelector('a[href*="/checkout"]');

    if (!checkoutButton) return;

    // 4. Skapa widget
    const el = document.createElement('div');
    el.id = 'kk-widget';
    el.innerHTML = `
      <div class="kk-bar-wrapper">
        <div class="kk-bar">
          <div class="kk-bar-content">
            <strong>Skydda din identitet – få omedelbara larm!</strong>
            <p>
              Med Konsumentkollen får du bevakning av ditt personnummer dygnet runt.
            </p>
          </div>
          <div class="kk-bar-action">
            <button id="kk-bevaka-btn" class="kk-bar-button">
              Bevaka
            </button>
          </div>
        </div>
      </div>
    `;

    // 5. Placera widgeten före checkout
    checkoutButton.parentElement.insertBefore(el, checkoutButton);

    // 6. Klick → Scrive
    el.querySelector('#kk-bevaka-btn')?.addEventListener('click', () => {
      window.location.href = 'https://scrive.com/form/190f283d-af8a-4b0e-b0f8-f3dbd761e342';
    });
  }

  // 7. Cart drawer är dynamisk → observera DOM
  const observer = new MutationObserver(inject);
  observer.observe(document.body, { childList: true, subtree: true });

  // 8. Kör direkt också
  inject();
})();
