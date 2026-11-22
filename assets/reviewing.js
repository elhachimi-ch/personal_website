(function() {
  const containerId = 'reviewingContainer';

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderItems(items) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!Array.isArray(items) || !items.length) {
      container.innerHTML = '<p class="news-table-empty">No reviewing records found.</p>';
      return;
    }

    const groups = new Map();
    items.forEach((item) => {
      const publisher = item && item.Publisher ? String(item.Publisher).trim() : '';
      const name = publisher || 'Unknown Publisher';
      const key = name.toLowerCase().replace(/\s*(?:&|\band\b)\s*/g, ' and ').replace(/\s+/g, ' ').trim();
      if (!groups.has(key)) groups.set(key, { name, items: [] });
      groups.get(key).items.push(item);
    });

    container.innerHTML = [...groups.values()]
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
      .map((group) => {
        const journals = group.items.map((item) => {
          const journal = item && item.Journal ? String(item.Journal).trim() : '';
          const link = item && item.Link ? String(item.Link).trim() : '';
          const linkCell = link
            ? `<a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer" class="action-btn" aria-label="Open ${escapeHtml(journal || 'Unknown Journal')}">Open</a>`
            : '<span class="news-table-empty">—</span>';

          return `<li class="reviewing-journal"><span>${escapeHtml(journal || 'Unknown Journal')}</span>${linkCell}</li>`;
        }).join('\n');

        return `
          <details class="reviewing-group">
            <summary>${escapeHtml(group.name)}</summary>
            <ul class="reviewing-journals">${journals}</ul>
          </details>`;
      }).join('\n');
  }

  async function loadReviewing() {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
      const res = await fetch('assets/data/reviewing.json');
      if (!res.ok) throw new Error('Failed to load reviewing.json');
      const items = await res.json();
      const sortedItems = Array.isArray(items)
        ? [...items].sort((a, b) => {
            const nameA = (a && a.Journal ? String(a.Journal) : '').trim();
            const nameB = (b && b.Journal ? String(b.Journal) : '').trim();
            return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
          })
        : [];
      renderItems(sortedItems);
    } catch (err) {
      container.innerHTML = '<p class="news-table-empty">Failed to load reviewing information.</p>';
      console.error(err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadReviewing);
  } else {
    loadReviewing();
  }
})();
