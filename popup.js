function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return 'Invalid URL';
  }
}

function renderDomains(domainMap, domainMostRecentTab, filter = '') {
  const domainList = document.getElementById('domainList');
  const totalTabsElem = document.getElementById('totalTabs');
  domainList.innerHTML = '';

  const sortedDomains = Object.entries(domainMap)
    .filter(([domain]) => domain.includes(filter))
    .sort((a, b) => b[1].length - a[1].length);

  const totalTabs = sortedDomains.reduce((sum, [, tabs]) => sum + tabs.length, 0);
  totalTabsElem.textContent = `Total: ${totalTabs}`;

  for (const [domain, tabObjs] of sortedDomains) {
    const container = document.createElement('div');
    container.className = 'domain';

    const label = document.createElement('span');
    label.className = 'domain-name';
    label.textContent = `${domain} (${tabObjs.length})`;
    label.setAttribute('data-title', domainMostRecentTab[domain]?.title || '');
    label.onclick = () => {
      const tab = domainMostRecentTab[domain];
      if (tab && tab.id !== undefined) {
        chrome.tabs.update(tab.id, { active: true });
        chrome.windows.update(tab.windowId, { focused: true });
      }
    };

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.onclick = () => {
      const tabIds = tabObjs.map(t => t.id);
      chrome.tabs.remove(tabIds);
      container.remove();
    };

    container.appendChild(label);
    container.appendChild(closeBtn);
    domainList.appendChild(container);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const tabs = await chrome.tabs.query({});
  const domainMap = {};
  const domainMostRecentTab = {};

  for (const tab of tabs) {
    const domain = getDomain(tab.url);
    if (!domainMap[domain]) domainMap[domain] = [];
    domainMap[domain].push(tab);
    if (!domainMostRecentTab[domain] || (tab.lastAccessed > domainMostRecentTab[domain].lastAccessed)) {
      domainMostRecentTab[domain] = tab;
    }
  }

  renderDomains(domainMap, domainMostRecentTab);

  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', () => {
    const filter = searchInput.value.trim();
    renderDomains(domainMap, domainMostRecentTab, filter);
  });
});
