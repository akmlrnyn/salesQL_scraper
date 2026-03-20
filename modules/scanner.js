window._aiesecLastDetectedKey = null;

function scanForContact() {
  const allValueDivs = document.querySelectorAll('div.el-tooltip.value.value--lite');
  if (!allValueDivs.length) return;

  let mainContact      = null;
  let secondaryContact = null;

  allValueDivs.forEach(div => {
    const value = div.innerText?.trim();
    if (!value) return;

    const parent = div.parentElement;

    const hasVerified = parent?.querySelector('[class*="verified"]') !== null ||
                        parent?.innerHTML?.includes('verified');

    const hasError    = parent?.querySelector('[class*="error"]') !== null ||
                        parent?.innerHTML?.includes('error');

    if (hasVerified && !mainContact) {
      // main contact for verified label values
      mainContact = value;
    } else if (hasError && !secondaryContact) {
      // secondary contact for error label values
      secondaryContact = value;
    } else if (!mainContact && !hasError) {
      // main contact fallback
      mainContact = value;
    }
  });

  if (!mainContact && !secondaryContact) return;

  const allValues  = [mainContact, secondaryContact].filter(Boolean);
  const emailValue = allValues.find(v => v.includes('@'))  || '';
  const phoneValue = allValues.find(v => !v.includes('@')) || '';

  const contact = {
    name:    extractName(),
    company: extractCompany(),
    title:   extractTitle(),
    email:   emailValue,
    phone:   phoneValue,
  };

  const contactKey = emailValue + phoneValue;
  if (!contactKey || contactKey === window._aiesecLastDetectedKey) return;
  window._aiesecLastDetectedKey = contactKey;

  console.log('[AIESEC] Contact detected:', contact);

  chrome.storage.local.set({ pendingContact: contact });
  showBanner(contact);
}