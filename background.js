// Clear any stale contacts on startup
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.remove("pendingContact");
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.remove("pendingContact");
});

const SPREADSHEET_ID = ""; 
const SHEET_NAME     = "Main Database";
const DATA_START_ROW = 10;

const emailMapping = {
  // Email map
};

async function getAuthToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(token);
      }
    });
  });
}

async function getCurrentUserEmail(token) {
  const response = await fetch("https://www.googleapis.com/oauth2/v1/userinfo?alt=json", {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await response.json();
  return data.email || "";
}

async function getSheetMeta(token) {
  const range = `${SHEET_NAME}!C${DATA_START_ROW}:I`;
  const url   = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data   = await response.json();
  const values = data.values || [];

  const lastRow = DATA_START_ROW + values.length;

  const nos    = values.map(r => parseInt(r[0])).filter(n => !isNaN(n));
  const nextNo = nos.length > 0 ? Math.max(...nos) + 1 : 1;

  const existingEmails = values
    .map(r => (r[6] || "").toString().trim().toLowerCase())
    .filter(Boolean);

  return { lastRow, nextNo, existingEmails };
}

async function insertRow(token, contact, pic, nextNo, lastRow) {
  const timestamp = new Date().toISOString();

  // C=No, D=PIC, E=Progress, F=Name, G=Type, H=Title, I=Email, J=Phone, K=Notes, L=Timestamp, M=Event
  const row = [
    nextNo,         // C = No
    pic,            // D = PIC
    "",             // E = Progress
    contact.name,   // F = Name
    "",             // G = Type of Partnership
    contact.title,  // H = Title
    contact.email,  // I = Main Email
    contact.phone,  // J = Additional Contact
    "",             // K = Notes
    timestamp,      // L = Timestamp
    ""              // M = Event
  ];

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(SHEET_NAME + "!C" + lastRow + ":M" + lastRow)}?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        range: `${SHEET_NAME}!C${lastRow}:M${lastRow}`,
        majorDimension: "ROWS",
        values: [row]
      })
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error("Sheets API error: " + JSON.stringify(err));
  }

  return await response.json();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (message.type === "INSERT_CONTACT") {
    (async () => {
      try {
        const token     = await getAuthToken();
        const userEmail = await getCurrentUserEmail(token);
        const pic       = emailMapping[userEmail];

        if (!pic) {
          sendResponse({ success: false, error: "Your account (" + userEmail + ") is not registered in the system." });
          return;
        }

        const { lastRow, nextNo, existingEmails } = await getSheetMeta(token);

        // Duplicate check
        if (message.contact.email && existingEmails.includes(message.contact.email.toLowerCase())) {
          sendResponse({ success: false, error: "Duplicate! " + message.contact.email + " already exists in Main Database." });
          return;
        }

        await insertRow(token, message.contact, pic, nextNo, lastRow);
        await chrome.storage.local.remove("pendingContact");

        sendResponse({ success: true, pic, row: lastRow });

      } catch (err) {
        console.error("[AIESEC] Insert error:", err);
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (message.type === "GET_PENDING_CONTACT") {
    chrome.storage.local.get("pendingContact", (result) => {
      sendResponse({ contact: result.pendingContact || null });
    });
    return true;
  }

  if (message.type === "CLEAR_PENDING_CONTACT") {
    chrome.storage.local.remove("pendingContact");
    sendResponse({ success: true });
    return true;
  }
});