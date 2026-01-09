(function() {
  const containerId = 'publicationsContainer';
  let rendered = false;

  function parseBibTeX(text) {
    const entries = [];
    const blocks = text.split(/\n?@/).filter(b => b.trim().length);
    for (const block of blocks) {
      const raw = '@' + block.trim();
      const typeMatch = raw.match(/^@(\w+)\s*\{/);
      const keyMatch = raw.match(/^@\w+\s*\{\s*([^,]+)\s*,/);
      if (!typeMatch || !keyMatch) continue;
      const type = typeMatch[1].toLowerCase();
      const key = keyMatch[1].trim();
      const fields = {};
      // Simple field parser (handles {value} or "value")
      const fieldRegex = /(\w+)\s*=\s*(\{([^}]*)\}|"([^"]*)")\s*,?/g;
      let m;
      while ((m = fieldRegex.exec(raw)) !== null) {
        const name = m[1].toLowerCase();
        const value = (m[3] || m[4] || '').trim();
        fields[name] = value;
      }
      entries.push({ type, key, fields });
    }
    return entries;
  }

  function formatAuthors(auth) {
    if (!auth) return 'Unknown';
    const parts = auth.split(/\s+and\s+/i).map(s => s.trim());
    if (parts.length <= 3) return parts.join(', ');
    return parts.slice(0, 2).join(', ') + ', et al.';
  }

  function venue(fields) {
    return fields.journal || fields.booktitle || fields.publisher || '';
  }

  function makeLink(href, label) {
    if (!href) return '';
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="action-btn">${label}</a>`;
  }

  function doiToUrl(doi) {
    if (!doi) return '';
    if (/^10\./.test(doi)) return `https://doi.org/${doi}`;
    return doi; // already a URL
  }

  function render(entries) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const cards = entries.map(e => {
      const f = e.fields;
      const title = f.title || e.key;
      const authors = formatAuthors(f.author);
      const year = f.year || '';
      const v = venue(f);
      const metaParts = [];
      if (authors) metaParts.push(`Authors: ${authors}`);
      if (year) metaParts.push(year);
      if (v) metaParts.push(v);
      const meta = metaParts.join(' | ');
      const pdfLink = makeLink(f.pdf, '📄 PDF');
      const doiLink = makeLink(doiToUrl(f.doi), '🔗 DOI');
      const urlLink = makeLink(f.url, '📰 Publisher');
      return `
        <div class="card">
          <div class="card-title">${title}</div>
          <div class="card-meta">${meta}</div>
          <div class="card-actions">${[pdfLink, doiLink, urlLink].filter(Boolean).join('')}</div>
        </div>`;
    }).join('\n');
    container.innerHTML = cards || '<p>No publications found.</p>';
  }

  async function loadAndRender() {
    if (rendered) return;
    try {
      const res = await fetch('assets/data/publications.bib');
      if (!res.ok) throw new Error('Failed to load publications.bib');
      const text = await res.text();
      const entries = parseBibTeX(text);
      render(entries);
      rendered = true;
    } catch (err) {
      const container = document.getElementById(containerId);
      if (container) container.innerHTML = `<p style="color: var(--text-light);">Failed to load publications.</p>`;
      console.error(err);
    }
  }

  // Render once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAndRender);
  } else {
    loadAndRender();
  }
})();
