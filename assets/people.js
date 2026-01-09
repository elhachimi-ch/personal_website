(function() {
  const containerId = 'coauthorsContainer';

  function renderNames(names) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const cards = names.map(name => `
      <div class="card">
        <div class="card-title">${name}</div>
      </div>`).join('\n');
    el.innerHTML = cards || '<p>No co-authors found.</p>';
  }

  function parseCSV(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (!lines.length) return [];
    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    const nameIndex = header.indexOf('name');
    if (nameIndex === -1) {
      // Fallback: treat each line as a single name after header
      return lines.slice(1);
    }
    const names = [];
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      // Simple CSV split (no quoted commas expected here)
      const cols = row.split(',');
      const name = (cols[nameIndex] || '').trim();
      if (name) names.push(name);
    }
    return names;
  }

  async function loadCoauthors() {
    const el = document.getElementById(containerId);
    if (!el) return;
    try {
      const res = await fetch('assets/data/coauthors.csv');
      if (!res.ok) throw new Error('Failed to load coauthors.csv');
      const text = await res.text();
      const names = parseCSV(text);
      renderNames(names);
    } catch (err) {
      const el2 = document.getElementById(containerId);
      if (el2) el2.innerHTML = '<p style="color: var(--text-light);">Failed to load co-authors.</p>';
      console.error(err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadCoauthors);
  } else {
    loadCoauthors();
  }
})();
