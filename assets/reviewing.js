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
      container.innerHTML = '<tr><td colspan="3" class="news-table-empty">No reviewing records found.</td></tr>';
      return;
    }

    container.innerHTML = items.map((item) => {
      const journal = item && item.Journal ? String(item.Journal).trim() : '';
      const publisher = item && item.Publisher ? String(item.Publisher).trim() : '';
      const link = item && item.Link ? String(item.Link).trim() : '';

      const nameCell = escapeHtml(journal || 'Unknown Journal');
      const publisherCell = escapeHtml(publisher || '—');
      const linkCell = link
        ? `<a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer" class="action-btn">Open</a>`
        : '<span class="news-table-empty">—</span>';

      return `
        <tr>
          <td>${nameCell}</td>
          <td>${publisherCell}</td>
          <td>${linkCell}</td>
        </tr>`;
    }).join('\n');
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
      container.innerHTML = '<tr><td colspan="3" class="news-table-empty">Failed to load reviewing information.</td></tr>';
      console.error(err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadReviewing);
  } else {
    loadReviewing();
  }
})();
