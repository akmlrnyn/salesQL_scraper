let _observer    = null;
let _debounce    = null;

function startObserver() {
  if (_observer) _observer.disconnect();

  _observer = new MutationObserver(() => {
    clearTimeout(_debounce);
    _debounce = setTimeout(() => {
      scanForContact();
    }, 600);
  });

  _observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}