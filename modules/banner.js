function showBanner(contact) {
  document.getElementById('aiesec-banner')?.remove();

  const banner = document.createElement('div');
  banner.id    = 'aiesec-banner';
  banner.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: #0050B3;
    color: white;
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
    z-index: 999999;
    font-family: Arial, sans-serif;
    font-size: 14px;
    max-width: 320px;
    animation: aiesecSlideIn 0.3s ease;
  `;

  banner.innerHTML = `
    <style>
      @keyframes aiesecSlideIn {
        from { transform: translateX(120px); opacity: 0; }
        to   { transform: translateX(0); opacity: 1; }
      }
    </style>

    <div style="font-weight: bold; font-size: 15px; margin-bottom: 10px;">
      📋 SalesQL Contact Detected
    </div>

    <div style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 10px; margin-bottom: 12px; font-size: 13px; line-height: 1.8;">
      <div>👤 <strong>${contact.name    || '—'}</strong></div>
      <div>🏢 ${contact.company || '—'}</div>
      <div>💼 ${contact.title   || '—'}</div>
      <div>📧 ${contact.email   || 'No email'}</div>
      <div>📞 ${contact.phone   || 'No phone'}</div>
    </div>

    <div style="display: flex; gap: 8px;">
      <button id="aiesec-confirm-btn" style="
        background: white; color: #0050B3; border: none;
        padding: 9px 14px; border-radius: 8px;
        font-weight: bold; cursor: pointer; font-size: 13px; flex: 1;
      ">➕ Add to Sheet</button>
      <button id="aiesec-dismiss-btn" style="
        background: transparent; color: white;
        border: 1px solid rgba(255,255,255,0.5);
        padding: 9px 14px; border-radius: 8px;
        cursor: pointer; font-size: 13px; flex: 1;
      ">Dismiss</button>
    </div>
  `;

  document.body.appendChild(banner);

  // confirm insertion
  document.getElementById('aiesec-confirm-btn').addEventListener('click', () => {
    const btn       = document.getElementById('aiesec-confirm-btn');
    btn.textContent = 'Inserting...';
    btn.disabled    = true;

    chrome.runtime.sendMessage({ type: 'INSERT_CONTACT', contact }, (response) => {
      if (response?.success) {
        banner.style.background = '#006B3F';
        banner.innerHTML = `
          <div style="font-weight: bold; font-size: 15px; margin-bottom: 8px;">✅ Added to Main Database!</div>
          <div style="font-size: 13px; line-height: 1.8;">
            <div>👤 ${contact.name}</div>
            <div>🏢 ${contact.company || '—'}</div>
            <div style="margin-top: 6px; opacity: 0.85;">PIC: ${response.pic} | Row: ${response.row}</div>
          </div>
        `;
        setTimeout(() => banner.remove(), 4000);
      } else {
        banner.style.background = '#8B0000';
        banner.innerHTML = `
          <div style="font-weight: bold; font-size: 15px; margin-bottom: 8px;">❌ Insert Failed</div>
          <div style="font-size: 13px; margin-bottom: 10px;">${response?.error || 'Unknown error'}</div>
          <button id="aiesec-close-err" style="
            background: white; color: #8B0000; border: none;
            padding: 7px 14px; border-radius: 8px;
            cursor: pointer; font-weight: bold; width: 100%;
          ">Close</button>
        `;
        document.getElementById('aiesec-close-err').addEventListener('click', () => banner.remove());
      }
    });
  });

  // dismiss handler
  document.getElementById('aiesec-dismiss-btn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'CLEAR_PENDING_CONTACT' });
    window._aiesecLastDetectedKey = null;
    banner.remove();
  });

  // auto-remove after 30s
  setTimeout(() => {
    document.getElementById('aiesec-banner')?.remove();
  }, 30000);
}