
// ═══════════════════════════════════════════════════════════
// EXCEL UPLOAD — parsea .xlsx/.xls y reconstruye DATA + PRES
// ═══════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════
// EXCEL UPLOAD — PRESUPUESTO (sección independiente)
// ═══════════════════════════════════════════════════════════
function handlePresUpload(event) {
  const file = event.target.files[0];
  const statusEl = document.getElementById('presUploadStatus');
  if (!file) return;

  const ext = file.name.split('.').pop().toLowerCase();
  if (!['xlsx','xls'].includes(ext)) {
    statusEl.className = 'section-upload-status err';
    statusEl.textContent = '✗ Formato inválido';
    showToast('✗ El archivo debe ser .xlsx o .xls', 'err');
    event.target.value = ''; return;
  }

  statusEl.className = 'section-upload-status loading';
  statusEl.textContent = '⟳ Procesando…';

  const reader = new FileReader();
  reader.onload = function(e) {
    let wb;
    try { wb = XLSX.read(e.target.result, { type: 'array' }); }
    catch(err) {
      statusEl.className = 'section-upload-status err';
      statusEl.textContent = '✗ Archivo corrupto';
      showToast('✗ No se pudo leer el archivo de presupuesto. Puede estar corrupto.', 'err', 6000);
      event.target.value = ''; return;
    }

    const sheetNames = wb.SheetNames;
    function getSheet(name) {
      const ws = wb.Sheets[name];
      return ws ? XLSX.utils.sheet_to_json(ws, { header:1, defval:0 }) : null;
    }

    // Detectar hoja: por nombre → por columna CENTRO COSTO → fallback primera hoja
    let sheetName = sheetNames.find(n => {
      const nl = n.toLowerCase();
      return ['presupuest','devengado','ejecucion','budget','financi','pres','bd'].some(k => nl.includes(k));
    });
    if (!sheetName) {
      // sniff por columnas características del BD.xlsx
      for (const sn of sheetNames) {
        const raw = getSheet(sn);
        if (!raw || raw.length < 2) continue;
        const hdrs = raw[0].map(h => String(h).trim().toUpperCase());
        const hasCentro = hdrs.some(h => h === 'CENTRO COSTO' || h === 'CENTRO DE COSTO' || h === 'CC');
        const hasDevengado = hdrs.some(h => h.startsWith('DEVENGADO'));
        const hasMeses = ['ENERO','FEBRERO','MARZO'].every(m => hdrs.includes(m));
        if (hasCentro || hasDevengado || hasMeses) { sheetName = sn; break; }
      }
    }
    if (!sheetName) sheetName = sheetNames[0]; // fallback

    const raw = getSheet(sheetName);
    if (!raw || raw.length < 2) {
      statusEl.className = 'section-upload-status err';
      statusEl.textContent = '✗ Hoja vacía';
      showToast('✗ La hoja "' + sheetName + '" no tiene datos suficientes. Hojas disponibles: ' + sheetNames.join(', '), 'err', 8000);
      event.target.value = ''; return;
    }

    parsePresupuestoSheet(raw);

    presFilter = 'TODOS';
    updatePres();
    updatePresHeaderBadge();

    const dlBtn = document.getElementById('downloadHtmlBtn');
    if (dlBtn) dlBtn.style.display = 'flex';

    const ts1 = new Date().toLocaleString('es-PE', {day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
    statusEl.className = 'section-upload-status ok';
    statusEl.textContent = '✓ ' + file.name + ' · ' + ts1;
    showToast('✓ Presupuesto actualizado desde "' + sheetName + '" · ' + file.name + ' · ' + ts1, 'ok');
    event.target.value = '';
  };
  reader.onerror = function() {
    statusEl.className = 'section-upload-status err';
    statusEl.textContent = '✗ Error de lectura';
    showToast('✗ Error al leer el archivo de presupuesto.', 'err');
    event.target.value = '';
  };
  reader.readAsArrayBuffer(file);
}

// ═══════════════════════════════════════════════════════════
// EXCEL UPLOAD — ACTIVIDADES (sección independiente)
// ═══════════════════════════════════════════════════════════
function handleActUpload(event) {
  const file = event.target.files[0];
  const statusEl = document.getElementById('actUploadStatus');
  if (!file) return;

  const ext = file.name.split('.').pop().toLowerCase();
  if (!['xlsx','xls'].includes(ext)) {
    statusEl.className = 'section-upload-status err';
    statusEl.textContent = '✗ Formato inválido';
    showToast('✗ El archivo debe ser .xlsx o .xls', 'err');
    event.target.value = ''; return;
  }

  statusEl.className = 'section-upload-status loading';
  statusEl.textContent = '⟳ Procesando…';

  const reader = new FileReader();
  reader.onload = function(e) {
    let wb;
    try { wb = XLSX.read(e.target.result, { type: 'array' }); }
    catch(err) {
      statusEl.className = 'section-upload-status err';
      statusEl.textContent = '✗ Archivo corrupto';
      showToast('✗ No se pudo leer el archivo de actividades. Puede estar corrupto.', 'err', 6000);
      event.target.value = ''; return;
    }

    const sheetNames = wb.SheetNames;
    function getSheet(name) {
      const ws = wb.Sheets[name];
      return ws ? XLSX.utils.sheet_to_json(ws, { header:1, defval:0 }) : null;
    }

    // Detectar hoja: por nombre → por contenido → fallback primera hoja
    let sheetName = sheetNames.find(n => {
      const nl = n.toLowerCase();
      return ['actividad','poi','seguimiento','act'].some(k => nl.includes(k));
    });
    if (!sheetName) {
      for (const sn of sheetNames) {
        const raw = getSheet(sn);
        if (!raw || raw.length < 2) continue;
        const hdrs = raw[0].map(h => String(h).trim().toLowerCase()).join(' ');
        const hasOrgano = ['organo','órgano','org'].some(k => hdrs.includes(k));
        const hasUnidad = ['unidad','producto','entregable','tipo'].some(k => hdrs.includes(k));
        if (hasOrgano || hasUnidad) { sheetName = sn; break; }
      }
    }
    if (!sheetName) sheetName = sheetNames[0]; // fallback

    const raw = getSheet(sheetName);
    if (!raw || raw.length < 2) {
      statusEl.className = 'section-upload-status err';
      statusEl.textContent = '✗ Hoja vacía';
      showToast('✗ La hoja "' + sheetName + '" no tiene datos. Hojas disponibles: ' + sheetNames.join(', '), 'err', 8000);
      event.target.value = ''; return;
    }

    parseActividadesSheet(raw);

    activeFilter = 'TODOS';
    document.querySelectorAll('.filter-btn[data-org]').forEach(b => {
      b.className = 'filter-btn';
      if (b.dataset.org === 'TODOS') b.classList.add('active');
    });
    updateAll();

    const dlBtn = document.getElementById('downloadHtmlBtn');
    if (dlBtn) dlBtn.style.display = 'flex';

    const ts2 = new Date().toLocaleString('es-PE', {day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
    statusEl.className = 'section-upload-status ok';
    statusEl.textContent = '✓ ' + file.name + ' · ' + ts2;
    showToast('✓ Actividades actualizadas desde "' + sheetName + '" · ' + file.name + ' · ' + ts2, 'ok');
    event.target.value = '';
  };
  reader.onerror = function() {
    statusEl.className = 'section-upload-status err';
    statusEl.textContent = '✗ Error de lectura';
    showToast('✗ Error al leer el archivo de actividades.', 'err');
    event.target.value = '';
  };
  reader.readAsArrayBuffer(file);
}

// handleXlsxUpload — mantenido por compatibilidad, redirige a ambos handlers
function handleXlsxUpload(event) { handleActUpload(event); }

// ═══════════════════════════════════════════════════════════
// PARSER: Hoja de Actividades / POI
// ═══════════════════════════════════════════════════════════
function parseActividadesSheet(rows) {
  // ══════════════════════════════════════════════════════════════
  // PARSER EXACTO — estructura DMA_POI_2026.xlsx  (hoja: DMA)
  //
  // Columnas fijas:
  //   A=Meta  B=Codigo  C=Tematica  D=Actividad Operativa
  //   E=Unidad de medida (actividad)  F=Accion UGP  G=Unidad de medida (acción)
  //   H=Organo
  //   I..T  = PROGRAM ENE … PROGRAM DIC   (12 cols)
  //   U     = PROGRAM Total
  //   V..AG = EJECUCIÓN ENE … EJECUCIÓN DIC  (12 cols)
  //   AH    = EJECUCIÓN Total
  // ══════════════════════════════════════════════════════════════

  if (!rows || rows.length < 2) return;

  const rawHeaders = rows[0].map(h => String(h ?? '').trim());
  const headers    = rawHeaders.map(h => h.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')); // quitar tildes para comparar

  // ── Función de búsqueda tolerante ──────────────────────────
  function findCol(exact, fallbacks) {
    // 1) coincidencia exacta (sin tildes, sin mayúsculas)
    const norm = exact.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    let idx = headers.indexOf(norm);
    if (idx >= 0) return idx;
    // 2) includes con cada fallback keyword
    for (const kw of (fallbacks || [])) {
      idx = headers.findIndex(h => h.includes(kw));
      if (idx >= 0) return idx;
    }
    return -1;
  }

  // ── Mapeo de columnas ────────────────────────────────────────
  // Órgano: columna H (índice 7). Buscamos por nombre y luego por contenido.
  let iOrgano = findCol('organo', ['organo','órgano','org']);
  if (iOrgano < 0) {
    // fallback por contenido: la columna cuyas celdas coinciden más con organos conocidos
    for (let c = 0; c < rawHeaders.length; c++) {
      let hits = 0;
      for (let r = 1; r < Math.min(rows.length, 30); r++) {
        const v = String(rows[r][c] ?? '').trim().toUpperCase();
        if (DATA.organos.some(o => v === o || v.includes(o) || (o.length > 2 && o.includes(v)))) hits++;
      }
      if (hits >= 3) { iOrgano = c; break; }
    }
  }
  if (iOrgano < 0) { console.warn('parseActividadesSheet: no se encontró columna Órgano'); return; }

  // Meta: columna A (índice 0)
  const iMeta = findCol('meta', ['meta']);

  // Unidad de medida de la ACCIÓN (col G, índice 6 — segunda aparición de "unidad de medida")
  // Buscamos la última columna que contiene "unidad" antes de la columna Órgano
  let iUnidad = -1;
  for (let c = iOrgano - 1; c >= 0; c--) {
    if (headers[c].includes('unidad') || headers[c].includes('medida')) { iUnidad = c; break; }
  }
  // fallback: primera columna con "unidad"
  if (iUnidad < 0) iUnidad = findCol('unidad de medida', ['unidad','medida']);

  // Columnas de PROGRAMADO mensual: buscar "program" + mes
  // El Excel usa "PROGRAM ENE", "PROGRAM FEB", etc.
  const MESES_KEY = ['ene','feb','mar','abr','may','jun','jul','ago','set','oct','nov','dic'];
  const MESES_ALT = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

  function findMesCols(prefix) {
    return MESES_KEY.map((m, i) => {
      let idx = headers.findIndex(h => h.includes(prefix) && (h.includes(m) || h.includes(MESES_ALT[i])));
      return idx;
    });
  }

  const progMCols = findMesCols('prog');
  const ejecMCols = findMesCols('ejec');

  // Totales: "PROGRAM Total" y "EJECUCIÓN Total"
  let iProgTot = findCol('program total', ['prog_total','prog total','total prog','programado total','total programado']);
  // Segunda opción: columna después de los 12 meses de prog
  if (iProgTot < 0) {
    const lastProgM = progMCols.filter(c => c >= 0);
    if (lastProgM.length === 12) iProgTot = Math.max(...lastProgM) + 1;
  }

  let iEjecTot = findCol('ejecucion total', ['ejec_total','ejec total','total ejec','ejecutado total','total ejecutado']);
  if (iEjecTot < 0) {
    const lastEjecM = ejecMCols.filter(c => c >= 0);
    if (lastEjecM.length === 12) iEjecTot = Math.max(...lastEjecM) + 1;
  }

  // ── Estructuras de acumulación ───────────────────────────────
  const byOrgano = {};
  const byMeta   = {};
  const byUnidad = { TODOS: {} };
  DATA.organos.forEach(o => {
    byOrgano[o] = { prog: 0, ejec: 0, acts: 0,
                    progM: new Array(12).fill(0),
                    ejecM: new Array(12).fill(0) };
    byUnidad[o] = {};
  });

  // ── Recorrido de filas ───────────────────────────────────────
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every(c => c === 0 || c === '' || c == null)) continue;

    // Mapear órgano
    // IMPORTANTE: 'ENANDES' es subcadena de 'ENANDES+', así que primero
    // se intenta una coincidencia EXACTA (ignorando espacios) entre TODOS
    // los órganos antes de recurrir al matching difuso por subcadena.
    // Sin este orden, cualquier fila de 'ENANDES+' terminaba sumándose a
    // 'ENANDES' porque aparece antes en el arreglo DATA.organos.
    const orgRaw = String(row[iOrgano] ?? '').trim().toUpperCase();
    const orgRawNorm = orgRaw.replace(/\s+/g, '');
    let orgKey = DATA.organos.find(o => orgRawNorm === o.replace(/\s+/g, ''));
    if (!orgKey) {
      orgKey = DATA.organos.find(o =>
        orgRaw === o ||
        orgRaw.includes(o) ||
        (o.length > 2 && o.includes(orgRaw))
      );
    }
    if (!orgKey) continue;

    // Totales de la fila
    const prog = iProgTot >= 0 ? (Number(row[iProgTot]) || 0) : 0;
    const ejec = iEjecTot >= 0 ? (Number(row[iEjecTot]) || 0) : 0;

    byOrgano[orgKey].prog  += prog;
    byOrgano[orgKey].ejec  += ejec;
    byOrgano[orgKey].acts  += 1;

    // Mensuales
    progMCols.forEach((c, i) => {
      if (c >= 0) byOrgano[orgKey].progM[i] += Number(row[c]) || 0;
    });
    ejecMCols.forEach((c, i) => {
      if (c >= 0) byOrgano[orgKey].ejecM[i] += Number(row[c]) || 0;
    });

    // Por tipo de producto (col G — Unidad de medida de la acción)
    if (iUnidad >= 0) {
      const uni = String(row[iUnidad] ?? 'OTROS').trim().toUpperCase() || 'OTROS';
      if (!byUnidad.TODOS[uni]) byUnidad.TODOS[uni] = { prog: 0, ejec: 0 };
      byUnidad.TODOS[uni].prog += prog;
      byUnidad.TODOS[uni].ejec += ejec;
      if (!byUnidad[orgKey][uni]) byUnidad[orgKey][uni] = { prog: 0, ejec: 0 };
      byUnidad[orgKey][uni].prog += prog;
      byUnidad[orgKey][uni].ejec += ejec;
    }

    // Por meta presupuestal (col A)
    if (iMeta >= 0) {
      const meta = Number(row[iMeta]);
      if (meta && isFinite(meta)) {
        if (!byMeta[meta]) byMeta[meta] = { prog: 0, ejec: 0 };
        byMeta[meta].prog += prog;
        byMeta[meta].ejec += ejec;
      }
    }
  }

  // ── Totales globales ─────────────────────────────────────────
  let totalProg = 0, totalEjec = 0, totalActs = 0;
  const mensualTotal = { prog: new Array(12).fill(0), ejec: new Array(12).fill(0) };
  DATA.organos.forEach(o => {
    totalProg += byOrgano[o].prog;
    totalEjec += byOrgano[o].ejec;
    totalActs += byOrgano[o].acts;
    for (let i = 0; i < 12; i++) {
      mensualTotal.prog[i] += byOrgano[o].progM[i];
      mensualTotal.ejec[i] += byOrgano[o].ejecM[i];
    }
  });

  // Detectar el último mes con ejecución registrada
  let mesesEjec = 0;
  for (let i = 11; i >= 0; i--) {
    if (mensualTotal.ejec[i] > 0) { mesesEjec = i + 1; break; }
  }

  // Nombre del corte para el subtítulo (ej. "Ene – Abr")
  const MESES_LABEL = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Set','Oct','Nov','Dic'];
  const corteLabel  = mesesEjec > 0
    ? 'Ene – ' + MESES_LABEL[mesesEjec - 1] + ' ejecutado'
    : 'Sin ejecución registrada';

  // ── Mutar DATA ────────────────────────────────────────────────
  DATA.mesesEjec    = mesesEjec;
  DATA.byOrgano     = byOrgano;
  if (Object.keys(byMeta).length)    DATA.byMeta   = byMeta;
  if (Object.keys(byUnidad.TODOS).length) DATA.byUnidad = byUnidad;
  DATA.totalProg    = totalProg;
  DATA.totalEjec    = totalEjec;
  DATA.totalActs    = totalActs;
  DATA.mensualTotal = mensualTotal;

  // ── Actualizar subtítulo del header de sección ────────────────
  const subEl = document.querySelector('.section-header-sub');
  if (subEl) {
    const nOrganos = DATA.organos.filter(o => byOrgano[o].acts > 0).length;
    subEl.textContent =
      'POI 2026 · ' + totalActs + ' actividades operativas · ' +
      nOrganos + ' órganos · Corte: ' + corteLabel + ' · ' +
      new Date().toLocaleDateString('es-PE',{month:'long',year:'numeric'});
  }

  // ── Alertas dinámicas post-parse ─────────────────────────────
  // Detectar déficit: meses donde ejec < prog (solo meses con ejecución)
  DATA._deficits = [];
  DATA.organos.forEach(o => {
    for (let i = 0; i < mesesEjec; i++) {
      const p = byOrgano[o].progM[i], e = byOrgano[o].ejecM[i];
      if (p > 0 && e < p) {
        DATA._deficits.push({ org: o, mes: DATA.meses[i], prog: p, ejec: e, diff: e - p });
      }
    }
  });

  // Órganos sin ejecución en todo el período (pero con prog > 0) — NO es incumplimiento
  DATA._sinEjecucion = DATA.organos.filter(o =>
    byOrgano[o].acts > 0 && byOrgano[o].ejec === 0 && byOrgano[o].prog > 0
  );

  // Órganos con cumplimiento 100% en todos los meses ejecutados
  DATA._cumplidos = DATA.organos.filter(o => {
    if (byOrgano[o].acts === 0 || mesesEjec === 0) return false;
    let ok = true;
    for (let i = 0; i < mesesEjec; i++) {
      const p = byOrgano[o].progM[i], e = byOrgano[o].ejecM[i];
      if (p > 0 && e < p) { ok = false; break; }
    }
    return ok && byOrgano[o].ejec > 0;
  });
}

// ═══════════════════════════════════════════════════════════
// PARSER: Hoja de Presupuesto
// ═══════════════════════════════════════════════════════════
function parsePresupuestoSheet(rows) {
  const headers = rows[0].map(h => String(h).trim().toUpperCase());

  // ── Mapa de columnas exacto para BD.xlsx ──
  // Programado mensual: ENERO, FEBRERO, … DICIEMBRE (sin prefijo)
  // Devengado mensual:  DEVENGADO ENERO, DEVENGADO FEBRERO, … DEVENGADO DICIEMBRE
  const MESES_PROG = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO',
                      'JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
  const MESES_EJEC = MESES_PROG.map(m => 'DEVENGADO ' + m);

  // Índices de columna de programado mensual
  const progMCols = MESES_PROG.map(m => headers.indexOf(m));
  // Índices de columna de devengado mensual
  const ejecMCols = MESES_EJEC.map(m => headers.indexOf(m));

  // Columna de centro de costo: buscar 'CENTRO COSTO' o variantes
  let iCentro = headers.findIndex(h =>
    h === 'CENTRO COSTO' || h === 'CENTRO DE COSTO' || h === 'CC' ||
    h.includes('CENTRO') || h.includes('ORGANO') || h.includes('ÓRGANO')
  );

  // Fallback por contenido de filas si el header no coincide
  if (iCentro < 0) {
    for (let c = 0; c < (rows[0] || []).length; c++) {
      let hits = 0;
      for (let r = 1; r < Math.min(rows.length, 20); r++) {
        const val = String(rows[r][c] || '').trim().toUpperCase();
        if (PRES.centros.some(cc => val === cc || val.startsWith(cc))) hits++;
      }
      if (hits >= 2) { iCentro = c; break; }
    }
  }
  if (iCentro < 0) return;

  // Normalizar nombre de centro: 'ENANDES+' y 'ENANDES +' → 'ENANDES+'
  function normCentro(raw) {
    const v = raw.trim().toUpperCase().replace(/\s+\+/, '+');
    return PRES.centros.find(c => v === c || v.startsWith(c + ' ') || c === v.replace(/\s/g,'')) || null;
  }

  // Columna de Fuente de Financiamiento (para el filtro de Ejecución Presupuestal)
  const iFuente = headers.findIndex(h => h.includes('FUENTE') && h.includes('FINANCI'));
  // Columnas usadas para reconstruir Clasificador de Gasto y Metas Presupuestales
  const iRubro = headers.indexOf('RUBRO');
  const iMeta = headers.indexOf('META');
  const iClas = headers.indexOf('CLASIFICADOR');

  // Construir PRES_ROWS: una fila cruda por registro (Centro + Fuente + mensuales),
  // única pasada sobre el Excel. La agregación (por centro/trimestre/semestre/total)
  // se delega a buildPresData() para no duplicar esa lógica.
  const newRows = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || !row[iCentro]) continue;
    const cKey = normCentro(String(row[iCentro]));
    if (!cKey) continue;
    const fuenteVal = (iFuente >= 0 && row[iFuente] != null && String(row[iFuente]).trim() !== '')
      ? String(row[iFuente]).trim() : 'SIN ESPECIFICAR';
    const rubroVal = (iRubro >= 0 && row[iRubro] != null && String(row[iRubro]).trim() !== '')
      ? String(row[iRubro]).trim() : 'SIN RUBRO';
    const metaVal = (iMeta >= 0 && row[iMeta] != null && String(row[iMeta]).trim() !== '')
      ? String(row[iMeta]).trim() : 'SIN META';
    const clasVal = (iClas >= 0 && row[iClas] != null && String(row[iClas]).trim() !== '')
      ? String(row[iClas]).trim() : 'SIN CLASIFICADOR';
    newRows.push({
      centro: cKey,
      fuente: fuenteVal,
      rubro: rubroVal,
      meta: metaVal,
      clas: clasVal,
      prog: progMCols.map(c => c >= 0 ? (Number(row[c]) || 0) : 0),
      ejec: ejecMCols.map(c => c >= 0 ? (Number(row[c]) || 0) : 0)
    });
  }
  PRES_ROWS.length = 0;
  PRES_ROWS.push(...newRows);

  presFuenteFilter = 'TODOS';
  PRES.data = buildPresData('TODOS');
  PRES_CLAS = buildPresClas('TODOS');
  PRES_METAS = buildPresMetas('TODOS');
  populatePresFuenteOptions();

  // Detectar meses con ejecución registrada
  let mesesEjec = 0;
  for (let i = 0; i < 12; i++) {
    if (PRES.data['TODOS'].ejec_monthly[i] > 0) mesesEjec = i + 1;
  }
  PRES.mesesEjec = mesesEjec;
}

// ═══════════════════════════════════════════════════════════
// EXPORTAR HTML actualizado con datos en memoria
// ═══════════════════════════════════════════════════════════
function downloadUpdatedHtml() {
  try {
    var dataJson = JSON.stringify(DATA);
    var presJson = (typeof PRES !== 'undefined') ? JSON.stringify(PRES) : null;
    var presRowsJson = (typeof PRES_ROWS !== 'undefined') ? JSON.stringify(PRES_ROWS) : null;
    var presClasJson = (typeof PRES_CLAS !== 'undefined') ? JSON.stringify(PRES_CLAS) : null;
    var presMetasJson = (typeof PRES_METAS !== 'undefined') ? JSON.stringify(PRES_METAS) : null;
    var html2 = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
    html2 = replaceJsVar(html2, 'DATA', dataJson);
    if (presJson) html2 = replaceJsVar(html2, 'PRES', presJson);
    if (presRowsJson) html2 = replaceJsVar(html2, 'PRES_ROWS', presRowsJson);
    if (presClasJson) html2 = replaceJsVar(html2, 'PRES_CLAS', presClasJson);
    if (presMetasJson) html2 = replaceJsVar(html2, 'PRES_METAS', presMetasJson);
    var blob = new Blob([html2], { type: 'text/html;charset=utf-8' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    var ts   = new Date().toISOString().slice(0,16).replace('T','_').replace(':','h');
    a.href     = url;
    a.download = 'dashboard_DMA_' + ts + '.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function() { URL.revokeObjectURL(url); }, 5000);
    showToast('\u2713 HTML exportado con los datos actuales.', 'ok');
  } catch(err) {
    console.error('Export error:', err);
    showToast('\u2717 Error al exportar: ' + err.message, 'err');
  }
}

function replaceJsVar(html, varName, jsonValue) {
  var marker   = 'const ' + varName + ' = ';
  var start    = html.indexOf(marker);
  if (start < 0) return html;
  var valStart = start + marker.length;
  var firstChar = html[valStart];
  var closeChar = (firstChar === '{') ? '}' : (firstChar === '[' ? ']' : null);
  if (!closeChar) return html;
  var depth = 0, inStr = false, strCh = '', escape = false;
  var i = valStart;
  while (i < html.length) {
    var ch = html[i];
    if (escape) { escape = false; i++; continue; }
    if (ch === '\\' && inStr) { escape = true; i++; continue; }
    if (inStr) { if (ch === strCh) inStr = false; i++; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = true; strCh = ch; i++; continue; }
    if (ch === firstChar) { depth++; i++; continue; }
    if (ch === closeChar) {
      depth--;
      if (depth === 0) {
        var j = i + 1;
        while (j < html.length && (html[j] === ' ' || html[j] === '\t')) j++;
        var endIdx = (html[j] === ';') ? j + 1 : i + 1;
        return html.slice(0, start) + marker + jsonValue + ';' + html.slice(endIdx);
      }
      i++; continue;
    }
    i++;
  }
  return html;
}




// ═══════════════════════════════════════════════════════════
// AUTO-CARGA DESDE /data/ — lee automáticamente presupuesto.xlsx y
// actividades.xlsx al cargar la página, para que publicar una
// actualización sea tan simple como reemplazar esos dos archivos
// dentro de la carpeta /data/ (sin tocar HTML/CSS/JS).
// ═══════════════════════════════════════════════════════════

// Detecta la hoja de PRESUPUESTO dentro de un workbook ya leído por XLSX.
// Misma heurística que usa handlePresUpload, extraída aquí para poder
// reutilizarla también en la carga automática sin duplicar lógica.
function detectPresSheet(wb) {
  const sheetNames = wb.SheetNames;
  function getSheet(name) {
    const ws = wb.Sheets[name];
    return ws ? XLSX.utils.sheet_to_json(ws, { header: 1, defval: 0 }) : null;
  }
  let sheetName = sheetNames.find(n => {
    const nl = n.toLowerCase();
    return ['presupuest', 'devengado', 'ejecucion', 'budget', 'financi', 'pres', 'bd'].some(k => nl.includes(k));
  });
  if (!sheetName) {
    for (const sn of sheetNames) {
      const raw = getSheet(sn);
      if (!raw || raw.length < 2) continue;
      const hdrs = raw[0].map(h => String(h).trim().toUpperCase());
      const hasCentro = hdrs.some(h => h === 'CENTRO COSTO' || h === 'CENTRO DE COSTO' || h === 'CC');
      const hasDevengado = hdrs.some(h => h.startsWith('DEVENGADO'));
      const hasMeses = ['ENERO', 'FEBRERO', 'MARZO'].every(m => hdrs.includes(m));
      if (hasCentro || hasDevengado || hasMeses) { sheetName = sn; break; }
    }
  }
  if (!sheetName) sheetName = sheetNames[0];
  return { sheetName, raw: getSheet(sheetName), sheetNames };
}

// Detecta la hoja de ACTIVIDADES/POI — misma heurística que handleActUpload.
function detectActSheet(wb) {
  const sheetNames = wb.SheetNames;
  function getSheet(name) {
    const ws = wb.Sheets[name];
    return ws ? XLSX.utils.sheet_to_json(ws, { header: 1, defval: 0 }) : null;
  }
  let sheetName = sheetNames.find(n => {
    const nl = n.toLowerCase();
    return ['actividad', 'poi', 'seguimiento', 'act'].some(k => nl.includes(k));
  });
  if (!sheetName) {
    for (const sn of sheetNames) {
      const raw = getSheet(sn);
      if (!raw || raw.length < 2) continue;
      const hdrs = raw[0].map(h => String(h ?? '').trim().toLowerCase()).join(' ');
      const hasOrgano = ['organo', 'órgano', 'org'].some(k => hdrs.includes(k));
      const hasUnidad = ['unidad', 'producto', 'entregable', 'tipo'].some(k => hdrs.includes(k));
      if (hasOrgano || hasUnidad) { sheetName = sn; break; }
    }
  }
  if (!sheetName) sheetName = sheetNames[0];
  return { sheetName, raw: getSheet(sheetName), sheetNames };
}

// Carga data/presupuesto.xlsx vía fetch y lo aplica con el mismo parser
// que usa la carga manual (parsePresupuestoSheet). Si el archivo no existe
// o no se puede leer, el dashboard simplemente conserva los datos vigentes
// (los que ya están embebidos en config.js), sin romper nada.
async function autoLoadPresupuesto() {
  try {
    const res = await fetch('data/presupuesto.xlsx?v=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) { console.warn('data/presupuesto.xlsx respondió', res.status); return false; }
    const buf = await res.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const { raw, sheetName } = detectPresSheet(wb);
    if (!raw || raw.length < 2) { console.warn('presupuesto.xlsx: no se detectó una hoja válida'); return false; }
    parsePresupuestoSheet(raw);
    presFilter = 'TODOS';
    console.log('Presupuesto actualizado desde data/presupuesto.xlsx (hoja: ' + sheetName + ')');
    return true;
  } catch (err) {
    console.warn('No se pudo cargar data/presupuesto.xlsx automáticamente:', err);
    return false;
  }
}

// Carga data/actividades.xlsx vía fetch y lo aplica con el mismo parser
// que usa la carga manual (parseActividadesSheet).
async function autoLoadActividades() {
  try {
    const res = await fetch('data/actividades.xlsx?v=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) { console.warn('data/actividades.xlsx respondió', res.status); return false; }
    const buf = await res.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const { raw, sheetName } = detectActSheet(wb);
    if (!raw || raw.length < 2) { console.warn('actividades.xlsx: no se detectó una hoja válida'); return false; }
    parseActividadesSheet(raw);
    activeFilter = 'TODOS';
    console.log('Actividades actualizadas desde data/actividades.xlsx (hoja: ' + sheetName + ')');
    return true;
  } catch (err) {
    console.warn('No se pudo cargar data/actividades.xlsx automáticamente:', err);
    return false;
  }
}

// Punto de entrada llamado al iniciar el dashboard (ver app.js). Intenta
// leer ambos Excel de /data/; si alguno falla o no existe, el dashboard
// sigue funcionando con los datos ya incluidos en config.js.
async function autoLoadExcelData() {
  await Promise.all([autoLoadPresupuesto(), autoLoadActividades(), autoLoadPublicaciones()]);
}

// ═══════════════════════════════════════════════════════════
// PUBLICACIONES — carga manual y automática desde Excel
// ═══════════════════════════════════════════════════════════

// Encuentra la fila de encabezados dentro de las primeras filas de la
// hoja (en la base de origen el encabezado real está en la fila 3,
// con un título de la base en la fila 1). Busca la fila que contenga
// simultáneamente columnas "Categoría" y "Estado".
function findPubHeaderRow(rows) {
  const norm = s => String(s ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (let r = 0; r < Math.min(rows.length, 15); r++) {
    const hdrs = (rows[r] || []).map(norm);
    if (hdrs.some(h => h.includes('categoria')) && hdrs.some(h => h.includes('estado'))) {
      return r;
    }
  }
  return -1;
}

function parsePublicacionesSheet(rows) {
  const headerRow = findPubHeaderRow(rows);
  if (headerRow < 0) { console.warn('parsePublicacionesSheet: no se encontró la fila de encabezados'); return; }

  const norm = s => String(s ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const headers = rows[headerRow].map(norm);

  function findCol(keywords) {
    for (const kw of keywords) {
      const idx = headers.findIndex(h => h.includes(kw));
      if (idx >= 0) return idx;
    }
    return -1;
  }

  const iAnio = findCol(['registrado en memoria']);
  const iCategoria = findCol(['categoria']);
  const iEstado = findCol(['estado']);
  const iIndicador = findCol(['indicador']);
  const iArea = findCol(['area responsable', 'are\nresponsable', 'responsable']);
  const iTitulo = findCol(['titulo']);
  const iAutor = findCol(['autor']);
  const iEnlace = findCol(['enlace']);
  const iRevista = findCol(['revista']);

  if (iCategoria < 0 || iEstado < 0) { console.warn('parsePublicacionesSheet: columnas mínimas no encontradas'); return; }

  const normCat = v => {
    const s = String(v ?? '').trim();
    const sl = s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (sl.includes('articulo cientif')) return 'Artículo Científico';
    return s || 'Sin categoría';
  };

  const out = [];
  for (let r = headerRow + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every(v => v === null || v === undefined || v === '' || v === 0)) continue;
    const titulo = String(row[iTitulo] ?? '').trim();
    const autor = String(row[iAutor] ?? '').trim();
    if (!titulo && !autor) continue;
    let anio = iAnio >= 0 ? row[iAnio] : null;
    if (typeof anio === 'string') anio = parseInt(anio, 10);
    if (!Number.isInteger(anio)) anio = null;
    out.push({
      anio,
      categoria: normCat(row[iCategoria]),
      estado: String(row[iEstado] ?? '').trim() || 'Sin estado',
      indicador: String(row[iIndicador] ?? '').trim() || 'N/D',
      area: String(row[iArea] ?? '').trim() || 'Sin definir',
      titulo,
      autor,
      enlace: String(row[iEnlace] ?? '').trim(),
      revista: String(row[iRevista] ?? '').trim(),
    });
  }

  if (out.length === 0) { console.warn('parsePublicacionesSheet: no se extrajeron registros'); return; }
  PUBLICACIONES = out;
  pubFilter = 'TODOS';
}

// Carga manual desde el botón "Cargar Excel" de la sección Publicaciones.
function handlePubUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const wb = XLSX.read(e.target.result, { type: 'array' });
      let sheetName = wb.SheetNames.find(n => /investigaci|public/i.test(n)) || wb.SheetNames[0];
      const raw = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: null });
      parsePublicacionesSheet(raw);
      updatePublicaciones();
      showToast('Publicaciones actualizadas desde ' + file.name, 'ok');
      const status = document.getElementById('pubUploadStatus');
      if (status) status.textContent = '✓ ' + file.name + ' · ' + new Date().toLocaleString('es-PE');
    } catch (err) {
      console.error(err);
      showToast('No se pudo leer el archivo de publicaciones', 'warn');
    }
  };
  reader.readAsArrayBuffer(file);
}

// Detecta la hoja de PUBLICACIONES dentro de un workbook ya leído.
function detectPubSheet(wb) {
  const sheetName = wb.SheetNames.find(n => /investigaci|public/i.test(n)) || wb.SheetNames[0];
  const raw = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: null });
  return { sheetName, raw };
}

// Carga data/publicaciones.xlsx vía fetch (mismo patrón que presupuesto y
// actividades — ver autoLoadExcelData).
async function autoLoadPublicaciones() {
  try {
    const res = await fetch('data/publicaciones.xlsx?v=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) { console.warn('data/publicaciones.xlsx respondió', res.status); return false; }
    const buf = await res.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const { raw, sheetName } = detectPubSheet(wb);
    if (!raw || raw.length < 2) { console.warn('publicaciones.xlsx: no se detectó una hoja válida'); return false; }
    parsePublicacionesSheet(raw);
    console.log('Publicaciones actualizadas desde data/publicaciones.xlsx (hoja: ' + sheetName + ')');
    return true;
  } catch (err) {
    console.warn('No se pudo cargar data/publicaciones.xlsx automáticamente:', err);
    return false;
  }
}
