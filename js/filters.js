
function getMetasForFilter(f) {
  if (f === 'TODOS') return DATA.byMeta;
  // Filter metas by organo by summing row-level data
  // We use the pre-aggregated data as approximation (exact same data since we computed at org level)
  return DATA.byMeta; // shown for all
}

// ═══════════════════════════════════════════════════════════
// FILTRO GLOBAL UNIFICADO
// ═══════════════════════════════════════════════════════════
function setGlobalFilter(f) {
  activeFilter = f;
  // Mapear org → pres (ENANDES + → ENANDES+)
  const presKey = f === 'ENANDES +' ? 'ENANDES+' : f;
  presFilter = presKey;

  // Actualizar botones del filtro global
  document.querySelectorAll('.filter-btn[data-org]').forEach(b => {
    b.className = 'filter-btn';
    if (b.dataset.org === f) {
      b.classList.add('active');
      if (f !== 'TODOS') b.classList.add('active-' + f.replace(/\s+/g,''));
    }
  });

  // Actualizar badges de los section headers
  const labelAct = f === 'TODOS' ? 'Todos los Centros' : (DATA.orgLabels[f] || f);
  const presLabel2 = f === 'TODOS' ? 'Todos los Centros' : (PRES.centroLabels[presKey] || f);
  const elActOrgano = document.getElementById('actHdrOrgano');
  if (elActOrgano) elActOrgano.textContent = labelAct;
  const elPresCentro = document.getElementById('presHdrCentro');
  if (elPresCentro) elPresCentro.textContent = presLabel2;

  updateAll();
  updatePres();
  updatePresHeaderBadge();
  updatePublicaciones();
}

function setFilter(f) { setGlobalFilter(f); } // compatibilidad

function setActMesFilter(m) {
  actMesFilter = m;
  document.querySelectorAll('#actMesFilterRow .filter-btn[data-mes]').forEach(b => {
    b.classList.toggle('active', String(b.dataset.mes) === String(m));
  });
  renderKPIs();
}

function updatePresHeaderBadge() {
  const d = presData(presFilter);
  const totalEjecCorte2 = d.ejec_monthly.slice(0, PRES.mesesEjec).reduce((a,b)=>a+b,0);
  const pct2 = d.total_prog > 0 ? (totalEjecCorte2 / d.total_prog * 100) : 0;
  const elPct = document.getElementById('presHdrPct');
  if (elPct) elPct.textContent = '▲ ' + pct2.toFixed(1) + '% devengado';
  const elProg = document.getElementById('presHdrProg');
  if (elProg) elProg.textContent = fmtS(d.total_prog) + ' programado';
}

// Llena los botones de Fuente de Financiamiento con valores únicos de PRES_ROWS, orden alfabético
// (mismo patrón visual que el filtro de Mes: botones con clase .active)
function populatePresFuenteOptions() {
  const row = document.getElementById('presFuenteFilterRow');
  if (!row) return;
  const fuentes = [...new Set(PRES_ROWS.map(r => r.fuente))].sort((a,b) => a.localeCompare(b, 'es'));
  const esc = s => s.replace(/'/g, "\\'");
  row.innerHTML = '<button class="filter-btn' + (presFuenteFilter === 'TODOS' ? ' active' : '') +
    '" data-fuente="TODOS" onclick="setPresFuenteFilter(\'TODOS\')">Todos</button>' +
    fuentes.map(f => `<button class="filter-btn${presFuenteFilter === f ? ' active' : ''}" data-fuente="${f}" onclick="setPresFuenteFilter('${esc(f)}')">${f}</button>`).join('');
}

// Cambia el filtro de Fuente de Financiamiento. Afecta SOLO Ejecución Presupuestal:
// recalcula PRES.data (única fuente que consumen renderPresKPIs/Mensual/Trimestre/
// Semestre/Ranking/DetalleTable/Calendar) y vuelve a pintar la sección.
function setPresFuenteFilter(fuente) {
  presFuenteFilter = fuente;
  document.querySelectorAll('#presFuenteFilterRow .filter-btn[data-fuente]').forEach(b => {
    b.classList.toggle('active', b.dataset.fuente === fuente);
  });
  PRES.data = buildPresData(presFuenteFilter);
  PRES_CLAS = buildPresClas(presFuenteFilter);
  PRES_METAS = buildPresMetas(presFuenteFilter);
  updatePresHeaderBadge();
  updatePres();
}

// Ícono representativo por subdirección/dirección (según el filtro activo),
// mostrado en el KPI "Presupuesto Programado 2026" en vez de la barra de carga.
function presOrgIconPaths(key) {
  const icons = {
    'TODOS':    '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.8 2.6 4.3 5.7 4.3 9s-1.5 6.4-4.3 9c-2.8-2.6-4.3-5.7-4.3-9s1.5-6.4 4.3-9z"/>',
    'SPC':      '<path d="M11 3.5a1.5 1.5 0 0 1 3 0v8.7a4 4 0 1 1-3 0V3.5z"/><path d="M11 8h3"/>',
    'SPM':      '<path d="M7 16a4 4 0 0 1 .7-7.9A5.5 5.5 0 0 1 18 10a3.5 3.5 0 0 1-.4 6.9H7z"/><path d="M8.5 19v1.3M12 19v1.8M15.5 19v1.3"/>',
    'SEA':      '<path d="M3 8h11.5a2.3 2.3 0 1 0-2.2-3"/><path d="M3 12.3h14.5a2.3 2.3 0 1 1-2.2 3"/><path d="M3 16.6h8.5"/>',
    'SMN':      '<rect x="7" y="7" width="10" height="10" rx="1.6"/><path d="M9.5 7V4.3M13 7V4.3M9.5 20v-2.7M13 20v-2.7M17 9.5h2.7M17 13h2.7M4.3 9.5H7M4.3 13H7"/>',
    'DMA':      '<path d="M4 21h16"/><path d="M6 21V10l6-5.3L18 10v11"/><path d="M9.3 21v-6.2h5.4V21"/>',
    'ENANDES':  '<path d="M2.5 19.5 8 9l3.6 5.4L14.5 10l7 9.5H2.5z"/>',
    'ENANDES+': '<path d="M2.5 19.5 8 9l3.6 5.4L14.5 10l7 9.5H2.5z"/><path d="M18.5 3.3v4M16.5 5.3h4"/>'
  };
  return icons[key] || icons['TODOS'];
}

function setPresFilter(f) {
  presFilter = f;
  updatePres();
}

function setPresMesFilter(m) {
  presMesFilter = m;
  document.querySelectorAll('#presMesFilterRow .filter-btn[data-mes]').forEach(b => {
    b.classList.toggle('active', String(b.dataset.mes) === String(m));
  });
  renderPresKPIs();
  renderPresMetas();
}

// ═══════════════════════════════════════════════════════════
// FILTRO — Publicaciones (por año)
// ═══════════════════════════════════════════════════════════
function setPubFilter(anio) {
  pubFilter = anio;
  document.querySelectorAll('#pubAnioFilterRow .filter-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.anio === String(anio));
  });
  renderPublicaciones();
}
