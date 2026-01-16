(function(){
  async function fetchJson(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
      return await res.json();
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  function parseFundingAmount(value) {
    if (!value) return 0;
    const txt = String(value).trim().toUpperCase();
    const hasM = txt.includes('M');
    const hasB = txt.includes('B');
    const hasK = txt.includes('K');
    const numStr = txt.replace(/[^0-9.]/g, '');
    const base = parseFloat(numStr || '0');
    if (Number.isNaN(base)) return 0;
    if (hasB) return base * 1e9;
    if (hasM) return base * 1e6;
    if (hasK) return base * 1e3;
    return base;
  }

  function formatUSD(amount) {
    const n = Math.round(amount);
    if (n >= 1e9) {
      const v = n / 1e9;
      const s = v >= 10 ? v.toFixed(0) : v.toFixed(1);
      return `$${s}B`;
    }
    if (n >= 1e6) {
      const v = n / 1e6;
      const s = v >= 10 ? v.toFixed(0) : v.toFixed(1);
      return `$${s}M`;
    }
    if (n >= 1e3) {
      const v = n / 1e3;
      const s = v >= 10 ? v.toFixed(0) : v.toFixed(1);
      return `$${s}K`;
    }
    return `$${n.toLocaleString('en-US')}`;
  }

  function renderStats(projects, grants) {
    const statsEl = document.querySelector('#projects .stats-grid');
    if (!statsEl) return;

    const pList = Array.isArray(projects) ? projects : [];
    const gList = Array.isArray(grants) ? grants : [];

    const pCount = pList.length;
    const gCount = gList.length;

    const pPiCount = pList.reduce((acc, item) => acc + (String(item.role || '').toLowerCase() === 'pi' ? 1 : 0), 0);
    const gPiCount = gList.reduce((acc, item) => acc + (String(item.role || '').toLowerCase() === 'pi' ? 1 : 0), 0);

    const pFunding = pList.reduce((sum, item) => sum + parseFundingAmount(item.funding), 0);
    const gFunding = gList.reduce((sum, item) => sum + parseFundingAmount(item.funding), 0);

    function sectionMarkup(title, totalCount, piCount, funding, totalLabel) {
      const parts = [];
      parts.push(`
        <div class="stat-group">
          <div class="group-title">${title}</div>
          <div class="group-stats">
            <div class="stat">
              <div class="stat-number">${totalCount}</div>
              <div class="stat-label">${totalLabel}</div>
            </div>
      `);
      if (piCount > 0) {
        parts.push(`
            <div class="stat">
              <div class="stat-number">${piCount}</div>
              <div class="stat-label">Principal Investigator</div>
            </div>
        `);
      }
      if (funding > 0) {
        parts.push(`
            <div class="stat">
              <div class="stat-number">${formatUSD(funding)}</div>
              <div class="stat-label">Total Funding</div>
            </div>
        `);
      }
      parts.push(`
          </div>
        </div>
      `);
      return parts.join('\n');
    }

    const sections = [
      sectionMarkup('Projects', pCount, pPiCount, pFunding, 'Total Projects')
    ];
    if (gCount > 0) {
      sections.push(sectionMarkup('Grants', gCount, gPiCount, gFunding, 'Total Grants'));
    }

    statsEl.innerHTML = sections.join('\n');
  }

  function roleClass(role) {
    if (!role) return '';
    const r = String(role).toLowerCase();
    if (r === 'pi') return 'badge-pi';
    if (r === 'co-pi' || r === 'copi' || r === 'co pi') return 'badge-copi';
    return 'badge-member';
  }

  function renderItems(containerId, items) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    items.forEach(item => {
      const titleText = (item && item.name ? String(item.name).trim() : '');
      if (!titleText) return; // skip if no meaningful title

      const metaParts = [];
      if (item.duration) metaParts.push(`Duration: ${item.duration}`);
      if (item.funding) metaParts.push(`Funding: ${item.funding}`);
      if (item.collaborators) metaParts.push(`Collaborators: ${item.collaborators}`);
      const metaText = metaParts.join(' | ');

        const detailLines = [];
        if (item.pi) detailLines.push(`PI: ${item.pi}`);
        if (item["co-pi"]) detailLines.push(`Co-PI: ${item["co-pi"]}`);
        if (item.keywords) detailLines.push(`Keywords: ${item.keywords}`);

      const card = document.createElement('div');
      card.className = 'card';

      const titleEl = document.createElement('div');
      titleEl.className = 'card-title';

      // Title text block (justified)
      const titleTextEl = document.createElement('span');
      titleTextEl.className = 'card-title-text';
      titleTextEl.textContent = titleText;
      titleEl.appendChild(titleTextEl);

      // Intentionally ignore any logo fields; no logo is shown anywhere

      card.appendChild(titleEl);

      if (metaText) {
        const metaEl = document.createElement('div');
        metaEl.className = 'card-meta';
        metaEl.textContent = metaText;
        card.appendChild(metaEl);
      }

      if (detailLines.length > 0) {
        const detailsEl = document.createElement('div');
        detailsEl.className = 'card-description';
        detailsEl.innerHTML = detailLines.join('<br>');
        card.appendChild(detailsEl);
      }

      // Actions: role badge + optional Details button when website exists
      if (item.role || item.website) {
        const actionsEl = document.createElement('div');
        actionsEl.className = 'card-actions';

        if (item.role) {
          const badge = document.createElement('span');
          badge.className = `badge ${roleClass(item.role)}`;
          badge.textContent = `Role: ${item.role}`;
          actionsEl.appendChild(badge);
        }

        if (item.website) {
          const link = document.createElement('a');
          link.className = 'action-btn';
          link.href = item.website;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.textContent = 'Details';
          actionsEl.appendChild(link);
        }

        card.appendChild(actionsEl);
      }

      container.appendChild(card);
    });
  }

  async function init() {
    const [projects, grants] = await Promise.all([
      fetchJson('assets/data/projects.json'),
      fetchJson('assets/data/grants.json')
    ]);

    renderItems('projectsContainer', projects);
    renderItems('grantsContainer', grants);
    renderStats(projects, grants);
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
