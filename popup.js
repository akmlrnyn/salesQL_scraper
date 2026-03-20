const emailMapping = {
  // Email map
};

let currentContact = null;

document.addEventListener("DOMContentLoaded", async () => {
  chrome.identity.getAuthToken({ interactive: false }, async (token) => {
    if (token) {
      try {
        const res      = await fetch("https://www.googleapis.com/oauth2/v1/userinfo?alt=json", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const userInfo = await res.json();
        const pic      = emailMapping[userInfo.email];

        if (pic) {
          document.getElementById("footer-pic").textContent = `Logged in as: ${pic} (${userInfo.email})`;
        } else {
          document.getElementById("footer-pic").textContent = `⚠️ ${userInfo.email} not registered`;
          document.getElementById("footer-pic").style.color = "#B00020";
        }
      } catch (e) {
        document.getElementById("footer-pic").textContent = "Could not load account info";
      }
    } else {
      document.getElementById("footer-pic").textContent = "Not logged in";
    }
  });

  chrome.runtime.sendMessage({ type: "GET_PENDING_CONTACT" }, (response) => {
    if (response?.contact) {
      currentContact = response.contact;
      renderContact(currentContact);
    }
  });

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.pendingContact?.newValue) {
      currentContact = changes.pendingContact.newValue;
      renderContact(currentContact);
    }
    if (changes.pendingContact?.newValue === undefined) {
      currentContact = null;
      renderEmpty();
    }
  });

  document.getElementById("insert-btn").addEventListener("click", () => {
    if (!currentContact) return;

    const btn       = document.getElementById("insert-btn");
    btn.textContent = "Inserting...";
    btn.disabled    = true;

    chrome.runtime.sendMessage({ type: "INSERT_CONTACT", contact: currentContact }, (response) => {
      if (response?.success) {
        showResult("success", `✅ ${currentContact.name} added! PIC: ${response.pic} | Row: ${response.row}`);
        document.getElementById("action-buttons").style.display = "none";
        currentContact = null;
        setTimeout(() => renderEmpty(), 3000);
      } else {
        showResult("error", `❌ ${response?.error || "Unknown error"}`);
        btn.textContent = "➕ Add to Main Database";
        btn.disabled    = false;
      }
    });
  });

  document.getElementById("dismiss-btn").addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "CLEAR_PENDING_CONTACT" });
    currentContact = null;
    renderEmpty();
    hideResult();
  });
});

function renderContact(contact) {
  hideResult();
  document.getElementById("contact-display").innerHTML = `
    <div class="contact-name">${contact.name    || '—'}</div>
    <div class="contact-detail">🏢 ${contact.company || '—'}</div>
    <div class="contact-detail">💼 ${contact.title   || '—'}</div>
    <div class="contact-detail">📧 ${contact.email   || 'No email found'}</div>
    <div class="contact-detail">📞 ${contact.phone   || 'No phone found'}</div>
    ${contact.linkedin ? `<div class="contact-detail" style="margin-top:4px;"><a href="${contact.linkedin}" target="_blank" style="color:#0050B3;font-size:11px;">View LinkedIn →</a></div>` : ""}
  `;
  document.getElementById("action-buttons").style.display = "block";
}

function renderEmpty() {
  document.getElementById("contact-display").innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">🔍</div>
      <div>No contact detected yet.</div>
      <div style="margin-top: 4px;">Reveal a contact in SalesQL on LinkedIn.</div>
    </div>
  `;
  document.getElementById("action-buttons").style.display = "none";
}

function showResult(type, message) {
  const el     = document.getElementById("result-msg");
  el.textContent  = message;
  el.className    = `result-msg result-${type}`;
  el.style.display = "block";
}

function hideResult() {
  document.getElementById("result-msg").style.display = "none";
}