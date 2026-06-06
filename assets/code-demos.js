(function() {
  const containerId = 'codeDemosContainer';

  function createActionLink(href, label, iconHtml) {
    if (!href) return '';
    const icon = iconHtml ? `${iconHtml} ` : '';
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="action-btn">${icon}${label}</a>`;
  }

  function renderItems(items) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!Array.isArray(items) || !items.length) {
      container.innerHTML = '<p>No code demos found.</p>';
      return;
    }

    const cards = items.map((item) => {
      const title = (item && item.title ? String(item.title).trim() : 'Untitled');
      const rawDescription = item && (item.descreption || item.description) ? (item.descreption || item.description) : '';
      const description = String(rawDescription).trim();
      const repo = item && item.repo ? String(item.repo).trim() : '';
      const paper = item && item.paper ? String(item.paper).trim() : '';
      const liveDemo = item && item['live demo'] ? String(item['live demo']).trim() : '';

      const actions = [
        createActionLink(repo, 'Repo', '<img alt="GitHub" style="width: 1.5em;" src="https://cdn.simpleicons.org/git/black"/>'),
        createActionLink(paper, 'Paper', '📄'),
        createActionLink(liveDemo, 'Live Demo', '▶')
      ].filter(Boolean).join('');

      return `
        <div class="card">
          <div class="card-title">${title}</div>
          <div class="card-description">${description}</div>
          <div class="card-actions">${actions}</div>
        </div>`;
    }).join('\n');

    container.innerHTML = cards;
  }

  async function loadCodeDemos() {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
      const res = await fetch('assets/data/code_demos.json');
      if (!res.ok) throw new Error('Failed to load code_demos.json');
      const items = await res.json();
      renderItems(items);
    } catch (err) {
      container.innerHTML = '<p style="color: var(--text-light);">Failed to load code demos.</p>';
      console.error(err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadCodeDemos);
  } else {
    loadCodeDemos();
  }
})();
