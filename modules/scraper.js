function extractName() {
  return (
    document.querySelector('h1[class*="break-words"]')?.innerText?.trim() ||
    document.querySelector('h1[class*="t-24"]')?.innerText?.trim() ||
    document.querySelector('h1')?.innerText?.trim() ||
    ''
  );
}

function extractCompany() {
  const raw = document.querySelector('#experience ~ div li:first-child [class*="t-14"][class*="normal"]')?.innerText?.trim() || '';
  return raw.split('\n')[0]; // take only first line
}

function extractTitle() {
  const raw = document.querySelector('#experience ~ div li:first-child [class*="t-bold"]')?.innerText?.trim() || '';
  return raw.split('\n')[0];
}