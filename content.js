function init() {
  setTimeout(() => scanForContact(), 1500);

  startObserver();

  window.addEventListener('popstate', () => {
    window._aiesecLastDetectedKey = null;
    setTimeout(() => scanForContact(), 1500);
    startObserver();
  });

  const originalPushState = history.pushState;
  history.pushState = function(...args) {
    originalPushState.apply(this, args);
    window._aiesecLastDetectedKey = null;
    document.getElementById('aiesec-banner')?.remove();
    setTimeout(() => scanForContact(), 1500);
  };
}

init();