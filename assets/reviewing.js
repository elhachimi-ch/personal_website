(function() {
  const containerId = 'reviewingContainer';

  function renderItems(items) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!Array.isArray(items) || !items.length) {
      container.innerHTML = '<p>No reviewing records found.</p>';
      return;
    }

    const cards = items.map((item) => {
      const journal = item && item.Journal ? String(item.Journal).trim() : '';
      const publisher = item && item.Publisher ? String(item.Publisher).trim() : '';
      const link = item && item.Link ? String(item.Link).trim() : '';

      const title = journal || 'Unknown Journal';
      const meta = publisher ? `Publisher: ${publisher}` : '';
      const action = link
        ? `<div class="card-actions"><a href="${link}" target="_blank" rel="noopener noreferrer" class="action-btn">Open Journal</a></div>`
        : '';

      return `
        <div class="card">
          <div class="card-title">${title}</div>
          ${meta ? `<div class="card-meta">${meta}</div>` : ''}
          ${action}
        </div>`;
    }).join('\n');

    container.innerHTML = cards;
  }

  async function loadReviewing() {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
      const res = await fetch('assets/data/reviewing.json');
      if (!res.ok) throw new Error('Failed to load reviewing.json');
      const items = await res.json();
      renderItems(items);
    } catch (err) {
      container.innerHTML = '<p style="color: var(--text-light);">Failed to load reviewing information.</p>';
      console.error(err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadReviewing);
  } else {
    loadReviewing();
  }
})();
