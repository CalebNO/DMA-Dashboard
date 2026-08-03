
// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════
function getProg(org) {
  if (!org || org==='TODOS') return DATA.totalProg;
  return DATA.byOrgano[org].prog;
}
function getEjec(org) {
  if (!org || org==='TODOS') return DATA.totalEjec;
  return DATA.byOrgano[org].ejec;
}
function getActs(org) {
  if (!org || org==='TODOS') return DATA.totalActs;
  return DATA.byOrgano[org].acts;
}
function getMProgM(org) {
  if (!org || org==='TODOS') return DATA.mensualTotal.prog;
  return DATA.byOrgano[org].progM;
}
function getMEjecM(org) {
  if (!org || org==='TODOS') return DATA.mensualTotal.ejec;
  return DATA.byOrgano[org].ejecM;
}
function pct(e,p) { return p>0 ? (e/p*100) : 0; }
function fmt(n) { return n.toLocaleString('es-PE'); }
function color(org) { return DATA.orgColors[org] || '#1A56DB'; }

// ═══════════════════════════════════════════════════════════
// KPIs
// ═══════════════════════════════════════════════════════════
function renderKPIs() {
  const f = activeFilter;
  const prog = getProg(f), acts = getActs(f);
  const _mesesEjec = DATA.mesesEjec || 0;

  const mesProgM = getMProgM(f);
  const mesEjecM = getMEjecM(f);

  // Mes que gobierna la tarjeta "Avance Mensual" y el acumulado mostrado:
  // - 'TODOS' (Acumulado, por defecto) -> último mes con ejecución registrada (comportamiento previo)
  // - mes específico seleccionado por el usuario -> ese mes exacto
  const usaMesEspecifico = actMesFilter !== 'TODOS';
  let ultimoMes;
  if (usaMesEspecifico) {
    ultimoMes = Number(actMesFilter);
  } else {
    ultimoMes = _mesesEjec > 0 ? _mesesEjec - 1 : 0;
    for (let i = 11; i >= 0; i--) { if (mesEjecM[i] > 0) { ultimoMes = i; break; } }
  }
  const mesProg = mesProgM[ultimoMes];
  const mesEjec = mesEjecM[ultimoMes];
  const mesPct = pct(mesEjec, mesProg);
  const mesLabel = DATA.meses[ultimoMes];
  const mesColor = mesPct >= 100 ? '#16A34A' : mesPct > 0 ? '#D97706' : '#DC2626';

  // Ejecutado acumulado Ene → mes que gobierna (selección del usuario, o corte automático)
  const ejec = usaMesEspecifico
    ? mesEjecM.slice(0, ultimoMes + 1).reduce((a,b)=>a+b,0)
    : getEjec(f);
  const pctVal = pct(ejec, prog);
  const pending = prog - ejec;

  const acuProg = getMProgM(f).slice(0, _mesesEjec).reduce((a,b)=>a+b,0);
  const acuEjec = getMEjecM(f).slice(0, _mesesEjec).reduce((a,b)=>a+b,0);

  // Texto descriptivo del filtro de mes activo
  const MES_NOMBRE_COMPLETO = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][ultimoMes];
  const mesFilterSubEl = document.getElementById('actMesFilterSub');
  if (mesFilterSubEl) {
    mesFilterSubEl.textContent = usaMesEspecifico
      ? ('Mostrando solo ' + MES_NOMBRE_COMPLETO + ' · acumulado Ene–' + mesLabel)
      : ('Acumulado Ene–' + mesLabel + ' (corte automático)');
  }

  const kpis = [
    { label:'Pendiente por ejecutar', val: fmt(pending), sub: (100-pctVal).toFixed(1)+'% restante del año', pctBar: pct(pending,prog), color:'#DC2626', icon:'⏳' },
    { label:'N° de Actividades Operativas por Órgano', val: fmt(acts), sub: f==='TODOS'?'7 órganos en seguimiento':'Órgano '+f, pctBar: 100, color:'#7C3AED', icon:'📊' },
    { label:'Meses ejecutados', val: _mesesEjec + ' / 12', sub: _mesesEjec > 0 ? 'Ene → ' + DATA.meses[_mesesEjec-1] + ' · Pendiente ' + (DATA.meses[_mesesEjec] || '—') + '→Dic' : 'Sin ejecución registrada', pctBar: _mesesEjec/12*100, color:'#D97706', icon:'📅' },
    { label:'Avance Mensual — ' + mesLabel, val: mesEjec + ' / ' + mesProg, sub: mesPct.toFixed(1)+'% cumplimiento del mes', pctBar: mesPct, color: mesColor, icon:'📆' },
  ];

  // Render KPIs — POI card unificada: programado + ejecutado + % en un solo cuadro
  const pctAnualPoi = pctVal;
  const poiKpiHtml = `
    <div class="kpi-card kpi-card--poi" style="grid-column:span 2;display:flex;align-items:center;gap:18px;padding:20px 24px;background:linear-gradient(135deg,#0B1F3A 0%,#1A3A6B 100%);border-color:#1A56DB;">
      <div class="kpi-accent" style="background:linear-gradient(90deg,#1A56DB,#0D9488);"></div>
      <div style="position:relative;flex-shrink:0;">
        <svg width="90" height="90" viewBox="0 0 90 90">
          <circle cx="45" cy="45" r="38" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="8"/>
          <circle id="actPoiRingArc" cx="45" cy="45" r="38" fill="none" stroke="#0D9488" stroke-width="8"
            stroke-dasharray="0 238.76"
            stroke-dashoffset="59.69" stroke-linecap="round"/>
          <text id="actPoiRingPct" x="45" y="42" text-anchor="middle" font-size="16" font-weight="700" fill="white" font-family="IBM Plex Sans,sans-serif">0.0%</text>
          <text x="45" y="56" text-anchor="middle" font-size="8" fill="rgba(255,255,255,0.7)" font-family="IBM Plex Sans,sans-serif">AVANCE</text>
        </svg>
      </div>
      <div style="flex:1;">
        <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,0.55);margin-bottom:8px;">Avance del POI 2026</div>
        <div style="display:flex;gap:24px;align-items:flex-end;margin-bottom:10px;">
          <div>
            <div style="font-size:10px;color:rgba(255,255,255,0.45);margin-bottom:2px;">Programado 2026</div>
            <div style="font-size:26px;font-weight:600;color:rgba(255,255,255,0.85);letter-spacing:-.01em;line-height:1;">${fmt(prog)}</div>
          </div>
          <div style="font-size:20px;color:rgba(255,255,255,0.2);padding-bottom:2px;">/</div>
          <div style="background:rgba(13,148,136,0.15);border:1px solid rgba(13,148,136,0.4);border-radius:10px;padding:8px 14px;">
            <div style="font-size:10px;color:rgba(255,255,255,0.65);margin-bottom:4px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;">Ejecutado (Ene–${mesLabel})</div>
            <div style="display:flex;align-items:baseline;gap:6px;">
              <div style="font-size:38px;font-weight:800;color:#2DD4BF;letter-spacing:-.02em;line-height:1;text-shadow:0 0 20px rgba(13,148,136,0.6);">${fmt(ejec)}</div>
              <div style="font-size:13px;font-weight:600;color:rgba(45,212,191,0.75);padding-bottom:3px;">Entregables</div>
            </div>
          </div>
        </div>
        <div style="height:6px;background:rgba(255,255,255,0.12);border-radius:3px;overflow:hidden;">
          <div style="width:0%;height:100%;background:linear-gradient(90deg,#1A56DB,#0D9488);border-radius:3px;" class="kpi-anim-bar" data-target-width="${pctAnualPoi.toFixed(1)}"></div>
        </div>
      </div>
    </div>`;

  const regularKpisHtml = kpis.map(k => `
    <div class="kpi-card">
      <div class="kpi-accent" style="background:${k.color};"></div>
      <span class="kpi-icon">${k.icon}</span>
      <div class="kpi-label">${k.label}</div>
      <div class="kpi-value" style="color:${k.color};">${k.val}</div>
      <div class="kpi-sub">${k.sub}</div>
      <div class="kpi-progress">
        <div class="kpi-bar-track">
          <div class="kpi-bar-fill" style="width:0%;background:${k.color};" data-target-width="${Math.min(k.pctBar,100).toFixed(1)}"></div>
        </div>
      </div>
    </div>
  `).join('');

  const grid = document.getElementById('kpiGrid');
  grid.innerHTML = poiKpiHtml + regularKpisHtml;
  animateKpiBars(grid);
  animatePoiRing('actPoiRingArc', 'actPoiRingPct', pctAnualPoi, 238.76);

  document.getElementById('hdrPct').textContent = '▲ '+pctVal.toFixed(1)+'% avance';
  const elActOrgano = document.getElementById('actHdrOrgano');
  if (elActOrgano) elActOrgano.textContent = (f==='TODOS'?'Todos los Centros':DATA.orgLabels[f]||f);
  const elEntregables = document.getElementById('actHdrEntregables');
  if (elEntregables) elEntregables.textContent = fmt(acts) + ' Actividades Operativas';

  // Actualizar subtítulo del header de sección actividades
  const _actSubEl = document.getElementById('actSectionSub');
  if (_actSubEl) {
    const _mesesLabel = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Set','Oct','Nov','Dic'];
    const _corte = _mesesEjec > 0 ? 'Ene – ' + _mesesLabel[_mesesEjec-1] + ' ejecutado' : 'Sin ejecución registrada';
    const _nOrg = DATA.organos.filter(o => DATA.byOrgano[o].acts > 0).length;
    _actSubEl.textContent = 'POI 2026 · ' + DATA.totalActs + ' actividades operativas · ' + _nOrg + ' órganos · Corte: ' + _corte + ' · ' +
      new Date().toLocaleDateString('es-PE', {month:'long', year:'numeric'});
  }
}

// ═══════════════════════════════════════════════════════════
// ALERTS (automáticas)
// ═══════════════════════════════════════════════════════════
function renderAlerts() {
  const f = activeFilter;
  const mesesEjec = DATA.mesesEjec || 0;
  const MESES_LABEL = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Set','Oct','Nov','Dic'];
  const corte = mesesEjec > 0 ? 'Ene–' + MESES_LABEL[mesesEjec - 1] : '—';
  const alerts = [];

  // ── 1. ALERTAS ROJAS: déficit detectado desde el Excel ────────
  const deficits = (DATA._deficits || []).filter(d =>
    f === 'TODOS' || d.org === f
  );
  if (deficits.length > 0) {
    // Agrupar por órgano
    const byOrg = {};
    deficits.forEach(d => {
      if (!byOrg[d.org]) byOrg[d.org] = [];
      byOrg[d.org].push(d);
    });
    const orgNames = Object.keys(byOrg);
    const rojas = orgNames.map(o =>
      byOrg[o].map(d =>
        `${DATA.orgLabels[o]||o} — ${d.mes}: programó ${fmt(d.prog)}, ejecutó ${fmt(d.ejec)} (diferencia: ${d.diff})`
      ).join(' | ')
    );
    alerts.push({
      type: 'danger', icon: '🔴',
      title: 'Entregables con déficit de ejecución — ' + orgNames.map(o => DATA.orgLabels[o]||o).join(', '),
      desc: rojas.join('<br>'),
      html: true,
      legend: '🔴 Rojo = meses donde lo ejecutado es menor a lo programado'
    });
  }

  // ── 2. ALERTAS AMARILLAS: órganos sin ejecución en el período ─
  const sinEjec = (DATA._sinEjecucion || []).filter(o =>
    f === 'TODOS' || o === f
  );
  if (sinEjec.length > 0 && mesesEjec > 0) {
    const items = sinEjec.map(o => {
      const d = DATA.byOrgano[o];
      // Detectar si la ejecución empieza después del corte (previsto en POI)
      const primerMesProg = d.progM.findIndex(v => v > 0);
      const previsto = primerMesProg >= mesesEjec;
      return `${DATA.orgLabels[o]||o} — ${fmt(d.prog)} entregables programados, sin ejecución registrada a ${MESES_LABEL[mesesEjec-1]}.` +
             (previsto ? ' <strong>Previsto en el calendario del POI — no es incumplimiento.</strong>' :
                         ' Verificar si corresponde al calendario planificado.');
    });
    alerts.push({
      type: 'warning', icon: '⚠️',
      title: 'Órganos sin ejecución en el período ' + corte,
      desc: items.join('<br><br>'),
      html: true
    });
  }

  // ── 3. Metas con 0 ejecución pero con programado (dinámico) ───
  if (f === 'TODOS' || f === 'SPC') {
    const metas0 = Object.keys(DATA.byMeta || {})
      .map(Number)
      .filter(m => DATA.byMeta[m].ejec === 0 && DATA.byMeta[m].prog > 0);
    if (metas0.length > 0) {
      alerts.push({
        type: 'warning', icon: '📋',
        title: 'Metas presupuestales sin ejecución acumulada',
        desc: `Metas ${metas0.sort((a,b)=>a-b).join(', ')} — tienen entregables programados sin ejecución registrada a ${mesesEjec > 0 ? MESES_LABEL[mesesEjec-1] : 'la fecha'}. Corresponde al calendario previsto del POI, <strong>no es incumplimiento</strong>.`,
        html: true
      });
    }
  }

  // ── 4. ALERTA VERDE: órganos con cumplimiento 100% ────────────
  const cumplidos = (DATA._cumplidos || []).filter(o =>
    f === 'TODOS' || o === f
  );
  if (cumplidos.length > 0) {
    const desc = cumplidos.map(o => {
      const d = DATA.byOrgano[o];
      return `${DATA.orgLabels[o]||o} ejecutó ${fmt(d.ejec)} / ${fmt(d.prog)} entregables (${pct(d.ejec,d.prog).toFixed(1)}%)`;
    }).join(' · ');
    alerts.push({
      type: 'success', icon: '✅',
      title: cumplidos.map(o => DATA.orgLabels[o]||o).join(' y ') + ' — Cumplimiento completo (' + corte + ')',
      desc
    });
  }

  // ── 5. Info general si no hay alertas específicas ─────────────
  if (f !== 'TODOS' && alerts.length === 0) {
    const prog = getProg(f), ejec = getEjec(f);
    alerts.push({
      type: 'info', icon: 'ℹ️',
      title: `${DATA.orgLabels[f]||f} — Resumen`,
      desc: `Programado: ${fmt(prog)} entregables · Ejecutado: ${fmt(ejec)} · Avance: ${pct(ejec,prog).toFixed(1)}% · Actividades: ${fmt(getActs(f))}`
    });
  }

  document.getElementById('alertsGrid').innerHTML = alerts.map(a => `
    <div class="alert-card alert-${a.type}">
      <span class="alert-icon">${a.icon}</span>
      <div class="alert-body">
        <div class="alert-title">${a.title}</div>
        <div class="alert-desc">${a.desc}</div>
        ${a.legend ? `<div style="font-size:11px;color:var(--c-sub);margin-top:6px;font-style:italic;">${a.legend}</div>` : ''}
      </div>
    </div>
  `).join('');
}

// ═══════════════════════════════════════════════════════════
// CHART: Mensual prog vs ejec
// ═══════════════════════════════════════════════════════════
function renderMensual() {
  const f = activeFilter;
  const progM = getMProgM(f);
  const ejecM = getMEjecM(f);

  document.getElementById('subMensual').textContent =
    (f==='TODOS'?'Todos los Centros de Costo':DATA.orgLabels[f]) + ' · Enero a Diciembre 2026';

  const ctx = document.getElementById('chartMensual').getContext('2d');
  if (charts.mensual) charts.mensual.destroy();

  charts.mensual = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: DATA.meses,
      datasets: [
        { label:'Programado', data: progM, backgroundColor: 'rgba(26,86,219,0.15)', borderColor:'#1A56DB', borderWidth:1.5, borderRadius:4, order:2 },
        { label:'Ejecutado',  data: ejecM, backgroundColor: (ctx2) => {
            const i = ctx2.dataIndex;
            const diff = ejecM[i] - progM[i];
            if (ejecM[i]===0 && i>=DATA.mesesEjec) return 'rgba(148,163,184,0.2)';
            if (diff < 0) return 'rgba(220,38,38,0.7)';
            return 'rgba(13,148,136,0.85)';
          },
          borderColor: (ctx2) => {
            const i = ctx2.dataIndex;
            const diff = ejecM[i] - progM[i];
            if (ejecM[i]===0 && i>=DATA.mesesEjec) return '#CBD5E1';
            if (diff < 0) return '#DC2626';
            return '#0D9488';
          },
          borderWidth:1.5, borderRadius:4, order:1
        }
      ]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins: { legend:{display:false}, tooltip:{
        callbacks:{
          label: ctx2 => {
            const l = ctx2.dataset.label;
            const v = ctx2.raw;
            const pi = progM[ctx2.dataIndex];
            const ei = ejecM[ctx2.dataIndex];
            if (l==='Ejecutado' && pi>0 && ei>0) {
              const d = ei-pi;
              return `${l}: ${v} (${d>=0?'+':''}${d} vs prog.)`;
            }
            return `${l}: ${v}`;
          }
        }
      }},
      animation:{
        onComplete: function() {
          const chart = this;
          const ctx2 = chart.ctx;
          ctx2.save();
          ctx2.font = 'bold 10px IBM Plex Sans, sans-serif';
          ctx2.textAlign = 'center';
          ctx2.textBaseline = 'bottom';
          const ds = chart.getDatasetMeta(1); // dataset Ejecutado
          ds.data.forEach((bar, i) => {
            const ei = ejecM[i];
            const pi = progM[i];
            if (!pi || pi === 0 || (ei === 0 && i >= DATA.mesesEjec)) return;
            const pctVal = (ei / pi * 100).toFixed(1) + '%';
            const diff = ei - pi;
            ctx2.fillStyle = diff < 0 ? '#DC2626' : '#0D9488';
            ctx2.fillText(pctVal, bar.x, bar.y - 3);
          });
          ctx2.restore();
        }
      },
      scales: {
        x:{grid:{display:false}, ticks:{font:{size:11}}},
        y:{grid:{color:'rgba(0,0,0,.04)'}, ticks:{font:{size:11}}, beginAtZero:true}
      }
    }
  });
}

// ═══════════════════════════════════════════════════════════
// HBAR: Avance por órgano (horizontal ordenado)
// ═══════════════════════════════════════════════════════════
function renderHbarOrgano() {
  const sorted = DATA.organos.slice().sort((a,b) => pct(DATA.byOrgano[b].ejec,DATA.byOrgano[b].prog) - pct(DATA.byOrgano[a].ejec,DATA.byOrgano[a].prog));
  const el = document.getElementById('hbarOrgano');
  el.innerHTML = sorted.map(org => {
    const o = DATA.byOrgano[org];
    const p = pct(o.ejec, o.prog);
    const isActive = activeFilter==='TODOS' || activeFilter===org;
    const opacity = isActive ? '1' : '0.35';
    return `
      <div class="hbar-row" style="opacity:${opacity}">
        <div class="hbar-info">
          <span class="hbar-name" style="font-weight:600;">${DATA.orgLabels[org]}</span>
          <div class="hbar-stats">
            <span class="hbar-pct" style="color:${color(org)};">${p.toFixed(1)}%</span>
            <span class="hbar-nums">${fmt(o.ejec)} / ${fmt(o.prog)}</span>
          </div>
        </div>
        <div class="hbar-track" style="background:#E2E8F0;position:relative;">
            <div class="hbar-fill" style="width:0%;background:${color(org)};" data-target-width="${p.toFixed(1)}"></div>
        </div>
      </div>`;
  }).join('');
  animateKpiBars(el);
}

// ═══════════════════════════════════════════════════════════
// CHART: Donut by órgano
// ═══════════════════════════════════════════════════════════
function renderDonut() {
  const f = activeFilter;
  const orgs = DATA.organos;
  const progs = orgs.map(o => DATA.byOrgano[o].prog);
  const colors = orgs.map(o => DATA.orgColors[o]);
  const total = DATA.totalProg;

  const ctx = document.getElementById('chartDonut').getContext('2d');
  if (charts.donut) charts.donut.destroy();
  charts.donut = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: orgs.map(o => {
        const pv = (DATA.byOrgano[o].prog / total * 100).toFixed(1);
        return `${DATA.orgLabels[o]}  ${pv}%`;
      }),
      datasets:[{
        data: progs, backgroundColor: colors,
        borderWidth: 2, borderColor:'#fff',
        hoverOffset: 6
      }]
    },
    options:{
      responsive:true, maintainAspectRatio:false, cutout:'58%',
      plugins:{
        legend:{ position:'right', labels:{font:{size:11},padding:10,boxWidth:12,usePointStyle:true} },
        tooltip:{ callbacks:{ label: c => {
          const v = c.raw; const pv = (v/total*100).toFixed(1);
          return `${fmt(v)} entregables (${pv}%)`;
        }}}
      }
    }
  });
}

// ═══════════════════════════════════════════════════════════
// HBAR: Tipo de producto (filtrado por órgano)
// ═══════════════════════════════════════════════════════════
function renderHbarUnidad() {
  const f = activeFilter;
  const key = (f === 'TODOS') ? 'TODOS' : f;
  const source = DATA.byUnidad[key] || DATA.byUnidad['TODOS'];

  document.getElementById('subUnidad').textContent =
    (f === 'TODOS' ? 'Todos los Centros de Costo' : DATA.orgLabels[f]) + ' · Programado vs Ejecutado por tipo de entregable';

  const items = Object.entries(source)
    .filter(([,v]) => v.prog > 0)
    .sort((a,b) => pct(b[1].ejec,b[1].prog) - pct(a[1].ejec,a[1].prog))
    .slice(0, 12);

  const el = document.getElementById('hbarUnidad');
  el.innerHTML = items.map(([name,v]) => {
    const p = pct(v.ejec, v.prog);
    const c = p >= 50 ? '#0D9488' : p >= 20 ? '#EA580C' : '#DC2626';
    return `
      <div class="hbar-row">
        <div class="hbar-info">
          <span class="hbar-name">${name}</span>
          <div class="hbar-stats">
            <span class="hbar-pct" style="color:${c};">${p.toFixed(1)}%</span>
            <span class="hbar-nums">${fmt(v.ejec)}/${fmt(v.prog)}</span>
          </div>
        </div>
        <div class="hbar-track">
          <div class="hbar-fill" style="width:0%;background:${c};" data-target-width="${p.toFixed(1)}"></div>
        </div>
      </div>`;
  }).join('');
  animateKpiBars(el);
}

// ═══════════════════════════════════════════════════════════
// CHART: Metas — % avance (horizontal bar)
// ═══════════════════════════════════════════════════════════
function renderMeta() {
  const metas = Object.entries(DATA.byMeta).sort((a,b)=>pct(b[1].ejec,b[1].prog)-pct(a[1].ejec,a[1].prog));
  const labels = metas.map(([m])=>'Meta '+m);
  const pcts = metas.map(([,v])=>pct(v.ejec,v.prog));
  const bgColors = pcts.map(p => p>=50?'rgba(13,148,136,0.85)': p>=20?'rgba(234,88,12,0.7)':'rgba(220,38,38,0.5)');

  const barLabelPlugin = {
    id:'barLabels',
    afterDatasetsDraw(chart){
      const {ctx:c2, data, scales:{x,y}} = chart;
      c2.save();
      c2.font = '600 10px IBM Plex Sans, system-ui, sans-serif';
      c2.fillStyle = '#475569';
      c2.textAlign = 'left';
      c2.textBaseline = 'middle';
      data.datasets[0].data.forEach((val,i)=>{
        if(val > 0){
          const xPos = x.getPixelForValue(val) + 5;
          const yPos = y.getPixelForValue(data.labels[i]);
          c2.fillText(val.toFixed(1)+'%', xPos, yPos);
        }
      });
      c2.restore();
    }
  };

  const ctx = document.getElementById('chartMeta').getContext('2d');
  if (charts.meta) charts.meta.destroy();
  charts.meta = new Chart(ctx, {
    type:'bar',
    data:{
      labels,
      datasets:[{
        label:'% Ejecución',
        data: pcts,
        backgroundColor: bgColors,
        borderColor: bgColors.map(c=>c.replace('0.5','1').replace('0.7','1').replace('0.85','1')),
        borderWidth:1.5, borderRadius:3,
        barPercentage:.7,
      }]
    },
    options:{
      indexAxis:'y', responsive:true, maintainAspectRatio:false,
      layout:{padding:{right:45}},
      plugins:{
        legend:{display:false},
        tooltip:{ callbacks:{ label: c => {
          const [meta] = metas[c.dataIndex];
          const v = DATA.byMeta[meta];
          return [`${c.parsed.x.toFixed(1)}% ejecución`,`Prog: ${fmt(v.prog)} · Ejec: ${fmt(v.ejec)}`];
        }}}
      },
      scales:{
        x:{max:100, ticks:{callback:v=>v+'%',font:{size:11}}, grid:{color:'rgba(0,0,0,.04)'}},
        y:{ticks:{font:{size:11}}, grid:{display:false}}
      }
    },
    plugins:[barLabelPlugin]
  });
}

// ═══════════════════════════════════════════════════════════
// CHART: Stacked mensual por órgano
// ═══════════════════════════════════════════════════════════
function renderStacked() {
  const _nMeses = DATA.mesesEjec || 0;
  const meses4 = DATA.meses.slice(0, _nMeses);
  const orgs = DATA.organos;
  const datasets = orgs.map(org => ({
    label: org,
    data: DATA.byOrgano[org].ejecM.slice(0, _nMeses),
    backgroundColor: DATA.orgColors[org]+'CC',
    borderColor: DATA.orgColors[org],
    borderWidth:1, borderRadius:3,
  }));

  const ctx = document.getElementById('chartStacked').getContext('2d');
  if (charts.stacked) charts.stacked.destroy();
  charts.stacked = new Chart(ctx, {
    type:'bar',
    data:{ labels:meses4, datasets },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{
        legend:{ position:'bottom', labels:{font:{size:11},padding:8,boxWidth:10,usePointStyle:true} },
        tooltip:{ mode:'index' }
      },
      scales:{
        x:{stacked:true, grid:{display:false}, ticks:{font:{size:12,weight:'600'}}},
        y:{stacked:true, ticks:{font:{size:11}}, grid:{color:'rgba(0,0,0,.04)'}}
      }
    }
  });
}

// ═══════════════════════════════════════════════════════════
// TABLE: Diferencias Prog - Ejec por mes
// ═══════════════════════════════════════════════════════════
function renderDiffTable() {
  const f = activeFilter;
  const progM = getMProgM(f);
  const ejecM = getMEjecM(f);
  const meses4 = DATA.meses.slice(0, DATA.mesesEjec || 0);

  const table = document.getElementById('diffTable');
  table.innerHTML = `
    <thead>
      <tr>
        <th>Mes</th>
        <th>Programado</th>
        <th>Ejecutado</th>
        <th>Diferencia</th>
        <th>Estado</th>
      </tr>
    </thead>
    <tbody>
      ${meses4.map((m,i)=>{
        const diff = ejecM[i] - progM[i];
        const cls = diff < 0 ? 'diff-neg' : diff > 0 ? 'diff-pos' : 'diff-zero';
        const estado = diff < 0 ? '🔴 Déficit' : diff === 0 ? '✅ Cumplido' : '🟢 Superado';
        return `<tr>
          <td style="font-weight:600;color:var(--c-text);">${m}</td>
          <td>${fmt(progM[i])}</td>
          <td>${fmt(ejecM[i])}</td>
          <td class="${cls}">${diff>=0?'+':''}${diff}</td>
          <td style="font-size:12px;">${estado}</td>
        </tr>`;
      }).join('')}
    </tbody>
  `;
}



// ═══════════════════════════════════════════════════════════
// CALENDAR
// ═══════════════════════════════════════════════════════════
function renderCalendar() {
  const f = activeFilter;
  const progM = getMProgM(f);
  const ejecM = getMEjecM(f);

  document.getElementById('subCalendar').textContent =
    (f==='TODOS'?'Todos los Centros de Costo':DATA.orgLabels[f]) + ' · Verde = ejecutado · Amarillo = diferencia · Gris = pendiente';

  const cal = document.getElementById('calendarView');
  cal.innerHTML = DATA.meses.map((m,i) => {
    const p = progM[i], e = ejecM[i];
    const isEjec = i < DATA.mesesEjec;
    let cls, val, sub;
    if (!isEjec) {
      cls = 'cal-pending'; val = fmt(p); sub = 'pendiente';
    } else {
      const diff = e - p;
      if (diff < 0) { cls='cal-partial'; val=fmt(e); sub='déficit '+(diff); }
      else if (diff === 0) { cls='cal-done'; val=fmt(e); sub='✓ cumplido'; }
      else { cls='cal-done'; val=fmt(e); sub='+'+diff+' extra'; }
    }
    return `
      <div class="cal-month">
        <div class="cal-label">${m}</div>
        <div class="cal-chip ${cls}">
          <div class="cal-val">${val}</div>
          <div class="cal-sub">${sub}</div>
        </div>
      </div>`;
  }).join('');
}

// ═══════════════════════════════════════════════════════════
// UPDATE ALL
// ═══════════════════════════════════════════════════════════
function updateAll() {
  renderKPIs();
  renderAlerts();
  renderMensual();
  renderHbarOrgano();
  renderHbarUnidad();
  renderDiffTable();
  renderCalendar();
  renderDonut();
  renderMeta();
  renderStacked();
}

function fmtS(n) {
  return 'S/ ' + n.toLocaleString('es-PE', {minimumFractionDigits:2, maximumFractionDigits:2});
}
function fmtSk(n) {
  if (n >= 1000000) return 'S/ ' + (n/1000000).toLocaleString('es-PE',{minimumFractionDigits:2,maximumFractionDigits:2}) + 'M';
  if (n >= 1000) return 'S/ ' + (n/1000).toLocaleString('es-PE',{minimumFractionDigits:1,maximumFractionDigits:1}) + 'K';
  return fmtS(n);
}
function presColor(c) { return PRES.centroColors[c] || '#475569'; }
function presLabel(c) { return PRES.centroLabels[c] || c; }
function presData(c) { return PRES.data[c] || PRES.data['TODOS']; }

// ═══════════════════════════════════════════════════════════
// PRES: Construye PRES.data agregando PRES_ROWS, opcionalmente filtrado
// por Fuente de Financiamiento. Función central: la reutilizan tanto
// parsePresupuestoSheet (carga inicial / re-upload) como setPresFuenteFilter,
// para no duplicar la lógica de acumulación. Recorre PRES_ROWS una sola vez.
// ═══════════════════════════════════════════════════════════
function buildPresData(fuente) {
  const rows = (fuente && fuente !== 'TODOS')
    ? PRES_ROWS.filter(r => r.fuente === fuente)
    : PRES_ROWS;

  const newData = {};
  [...PRES.centros, 'TODOS'].forEach(c => {
    newData[c] = {
      prog_monthly: new Array(12).fill(0),
      ejec_monthly: new Array(12).fill(0),
      trimestres: { prog: [0,0,0,0], ejec: [0,0,0,0] },
      semestres:  { prog: [0,0],     ejec: [0,0] },
      total_prog: 0, total_ejec: 0
    };
  });

  rows.forEach(r => {
    for (let i = 0; i < 12; i++) {
      newData[r.centro].prog_monthly[i] += r.prog[i];
      newData['TODOS'].prog_monthly[i]  += r.prog[i];
      newData[r.centro].ejec_monthly[i] += r.ejec[i];
      newData['TODOS'].ejec_monthly[i]  += r.ejec[i];
    }
  });

  const triRanges = [[0,2],[3,5],[6,8],[9,11]];
  const semRanges = [[0,5],[6,11]];
  [...PRES.centros, 'TODOS'].forEach(c => {
    const d = newData[c];
    d.total_prog = d.prog_monthly.reduce((a,b) => a+b, 0);
    d.total_ejec = d.ejec_monthly.reduce((a,b) => a+b, 0);
    triRanges.forEach(([s,e], i) => {
      d.trimestres.prog[i] = d.prog_monthly.slice(s, e+1).reduce((a,b) => a+b, 0);
      d.trimestres.ejec[i] = d.ejec_monthly.slice(s, e+1).reduce((a,b) => a+b, 0);
    });
    semRanges.forEach(([s,e], i) => {
      d.semestres.prog[i] = d.prog_monthly.slice(s, e+1).reduce((a,b) => a+b, 0);
      d.semestres.ejec[i] = d.ejec_monthly.slice(s, e+1).reduce((a,b) => a+b, 0);
    });
  });

  return newData;
}

// Construye PRES_CLAS[centro/TODOS] (Análisis por Clasificador de Gasto) desde PRES_ROWS,
// opcionalmente filtrado por Fuente de Financiamiento. Reutilizada por el parser y por el filtro.
function buildPresClas(fuente) {
  const rows = (fuente && fuente !== 'TODOS')
    ? PRES_ROWS.filter(r => r.fuente === fuente)
    : PRES_ROWS;

  const acc = {}; // acc[centro][clas] = {code, rubro, prog, ejec}
  [...PRES.centros, 'TODOS'].forEach(c => { acc[c] = {}; });

  rows.forEach(r => {
    const prog = r.prog.reduce((a,b) => a+b, 0);
    const ejec = r.ejec.reduce((a,b) => a+b, 0);
    [r.centro, 'TODOS'].forEach(c => {
      if (!acc[c][r.clas]) acc[c][r.clas] = { code: r.clas, rubro: r.rubro, prog: 0, ejec: 0 };
      acc[c][r.clas].prog += prog;
      acc[c][r.clas].ejec += ejec;
    });
  });

  const out = {};
  [...PRES.centros, 'TODOS'].forEach(c => { out[c] = Object.values(acc[c]); });
  return out;
}

// Construye PRES_METAS[centro/TODOS] (Metas Presupuestales) desde PRES_ROWS,
// opcionalmente filtrado por Fuente de Financiamiento.
function buildPresMetas(fuente) {
  const rows = (fuente && fuente !== 'TODOS')
    ? PRES_ROWS.filter(r => r.fuente === fuente)
    : PRES_ROWS;

  const acc = {}; // acc[centro][meta] = {meta, prog, ejec, prog_m[12], ejec_m[12]}
  [...PRES.centros, 'TODOS'].forEach(c => { acc[c] = {}; });

  rows.forEach(r => {
    [r.centro, 'TODOS'].forEach(c => {
      if (!acc[c][r.meta]) acc[c][r.meta] = { meta: r.meta, prog: 0, ejec: 0, prog_m: new Array(12).fill(0), ejec_m: new Array(12).fill(0) };
      const d = acc[c][r.meta];
      for (let i = 0; i < 12; i++) {
        d.prog_m[i] += r.prog[i];
        d.ejec_m[i] += r.ejec[i];
      }
      d.prog += r.prog.reduce((a,b) => a+b, 0);
      d.ejec += r.ejec.reduce((a,b) => a+b, 0);
    });
  });

  const out = {};
  [...PRES.centros, 'TODOS'].forEach(c => { out[c] = Object.values(acc[c]); });
  return out;
}

// ═══════════════════════════════════════════════════════════
// PRES KPIs
// ═══════════════════════════════════════════════════════════
function renderPresKPIs() {
  const f = presFilter;
  const d = presData(f);
  const pctAnual = d.total_prog > 0 ? (d.total_ejec / d.total_prog * 100) : 0;
  const pending = d.total_prog - d.total_ejec;
  const ejecAcum = d.ejec_monthly.reduce((a,b)=>a+b,0);

  const label = f === 'TODOS' ? 'Todos los Centros' : presLabel(f);
  const color = f === 'TODOS' ? '#1A56DB' : presColor(f);

  // Mes que gobierna la tarjeta destacada y los acumulados:
  // - 'TODOS' (Acumulado, por defecto) -> usa el último mes con ejecución registrada (comportamiento previo)
  // - mes específico seleccionado por el usuario -> usa ese mes
  const usaMesEspecifico = presMesFilter !== 'TODOS';
  const MES_ACTUAL_IDX = usaMesEspecifico ? Number(presMesFilter) : (PRES.mesesEjec - 1);
  const MES_ACTUAL_LABEL = PRES.meses[MES_ACTUAL_IDX];
  const progMesActual = d.prog_monthly[MES_ACTUAL_IDX] || 0;
  const ejecMesActual = d.ejec_monthly[MES_ACTUAL_IDX] || 0;
  const pctMesActual = progMesActual > 0 ? (ejecMesActual / progMesActual * 100) : 0;
  const colorMesActual = pctMesActual >= 100 ? '#16A34A' : pctMesActual > 0 ? '#D97706' : '#1A56DB';

  const NOMBRES_MES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Set','Oct','Nov','Dic'];
  const mesCorteLabel = usaMesEspecifico ? NOMBRES_MES[MES_ACTUAL_IDX] : ('Ene\u2013' + NOMBRES_MES[MES_ACTUAL_IDX]);
  const MES_NOMBRE_COMPLETO = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][MES_ACTUAL_IDX];
  // Calcular devengado acumulado hasta el mes seleccionado (o hasta el corte automático)
  const totalEjecCorte = usaMesEspecifico
    ? d.ejec_monthly.slice(0, MES_ACTUAL_IDX + 1).reduce((a,b)=>a+b,0)
    : d.ejec_monthly.slice(0, PRES.mesesEjec).reduce((a,b)=>a+b,0);
  const pctCorte = d.total_prog > 0 ? (totalEjecCorte / d.total_prog * 100) : 0;
  const pendingCorte = d.total_prog - totalEjecCorte;
  // Programado acumulado hasta el mes seleccionado (o hasta el corte automático)
  const totalProgCorte = usaMesEspecifico
    ? d.prog_monthly.slice(0, MES_ACTUAL_IDX + 1).reduce((a,b)=>a+b,0)
    : d.prog_monthly.slice(0, PRES.mesesEjec).reduce((a,b)=>a+b,0);
  const pctProgCorte = d.total_prog > 0 ? (totalProgCorte / d.total_prog * 100) : 0;

  // Texto descriptivo del filtro de mes activo
  const mesFilterSubEl = document.getElementById('presMesFilterSub');
  if (mesFilterSubEl) {
    mesFilterSubEl.textContent = usaMesEspecifico
      ? ('Mostrando solo ' + MES_NOMBRE_COMPLETO + ' · acumulado Ene–' + NOMBRES_MES[MES_ACTUAL_IDX])
      : ('Acumulado Ene–' + NOMBRES_MES[MES_ACTUAL_IDX] + ' (corte automático)');
  }

  const kpis = [
    { label:'Presupuesto Programado 2026', val:fmtS(d.total_prog), sub: label, color:'#1A56DB', icon:'💰' },
  ];

  const regularPresHtml = kpis.map(k=>`
    <div class="kpi-card">
      <div class="kpi-accent" style="background:${k.color};"></div>
      <span class="kpi-icon">${k.icon}</span>
      <div class="kpi-label">${k.label}</div>
      <div class="kpi-value" style="color:${k.color};font-size:22px;letter-spacing:-.01em;">${k.val}</div>
      <div class="kpi-sub">${k.sub}</div>
      <div style="display:flex;justify-content:center;margin-top:10px;">
        <div style="width:44px;height:44px;border-radius:50%;background:var(--c-bg);display:flex;align-items:center;justify-content:center;flex-shrink:0;" title="${label}">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${presOrgIconPaths(f)}</svg>
        </div>
      </div>
    </div>`).join('');

  // KPIs "Total Devengado" y "Saldo por Ejecutar" con anillo de carga
  // (número compacto + porcentaje dentro del anillo) en vez de barra
  const pctSaldoCorte = d.total_prog > 0 ? (pendingCorte / d.total_prog * 100) : 0;
  const RING_R2 = 28, RING_CIRC2 = 2 * Math.PI * RING_R2;
  const ringKpis = [
    { label:'Programado Acumulado (Ene\u2013' + NOMBRES_MES[MES_ACTUAL_IDX] + ')', valCompact: fmtS(totalProgCorte), pct: pctProgCorte, subTxt: '% del programado anual', color:'#7C3AED', icon:'📊', arcId:'presProgAcumRingArc', pctId:'presProgAcumRingPct' },
    { label:'Total Devengado (Ene\u2013' + NOMBRES_MES[MES_ACTUAL_IDX] + ')', valCompact: fmtS(totalEjecCorte), pct: pctCorte, subTxt: 'de avance anual', color:'#0D9488', icon:'✅', arcId:'presDevRingArc', pctId:'presDevRingPct' },
    { label:'Saldo por Ejecutar', valCompact: fmtS(pendingCorte), pct: pctSaldoCorte, subTxt: 'restante del año', color:'#DC2626', icon:'⏳', arcId:'presSaldoRingArc', pctId:'presSaldoRingPct' },
  ];

  const ringKpisHtml = ringKpis.map(k=>`
    <div class="kpi-card">
      <div class="kpi-accent" style="background:${k.color};"></div>
      <span class="kpi-icon">${k.icon}</span>
      <div class="kpi-label">${k.label}</div>
      <div style="display:flex;flex-direction:column;align-items:center;text-align:center;margin-top:2px;">
        <div style="font-size:22px;font-weight:700;letter-spacing:-.01em;color:${k.color};font-family:'IBM Plex Sans',sans-serif;margin-bottom:2px;line-height:1.05;">${k.valCompact}</div>
        <svg width="78" height="78" viewBox="0 0 68 68" style="flex-shrink:0;">
          <circle cx="34" cy="34" r="${RING_R2}" fill="none" stroke="var(--c-border)" stroke-width="8"/>
          <circle id="${k.arcId}" cx="34" cy="34" r="${RING_R2}" fill="none" stroke="${k.color}" stroke-width="8"
            stroke-dasharray="0 ${RING_CIRC2.toFixed(2)}" stroke-dashoffset="${(RING_CIRC2/4).toFixed(2)}" stroke-linecap="round"/>
          <text id="${k.pctId}" x="34" y="39" text-anchor="middle" font-size="14" font-weight="800" fill="${k.color}" font-family="IBM Plex Sans,sans-serif">0.0%</text>
        </svg>
        <div class="kpi-sub" style="margin-top:4px;">${k.subTxt}</div>
      </div>
    </div>`).join('');

  // KPI "% Avance Presupuestal Anual" con anillo de carga en vez de barra
  const avanceRingHtml = `
    <div class="kpi-card">
      <div class="kpi-accent" style="background:${color};"></div>
      <span class="kpi-icon">📈</span>
      <div class="kpi-label">% Avance Presupuestal Anual</div>
      <div style="display:flex;flex-direction:column;align-items:center;text-align:center;margin-top:2px;">
        <svg width="72" height="72" viewBox="0 0 64 64" style="flex-shrink:0;">
          <circle cx="32" cy="32" r="26" fill="none" stroke="var(--c-border)" stroke-width="7"/>
          <circle id="presAvanceRingArc" cx="32" cy="32" r="26" fill="none" stroke="${color}" stroke-width="7"
            stroke-dasharray="0 163.36" stroke-dashoffset="40.84" stroke-linecap="round"/>
          <text id="presAvanceRingPct" x="32" y="37" text-anchor="middle" font-size="13" font-weight="700" fill="${color}" font-family="IBM Plex Sans,sans-serif">0.0%</text>
        </svg>
        <div class="kpi-sub" style="margin-top:4px;">Devengado / Programado anual</div>
      </div>
    </div>`;

  // Mayo card expandida y muy destacada
  const mayoBorderColor = pctMesActual >= 100 ? '#16A34A' : pctMesActual > 0 ? '#D97706' : '#1A56DB';
  const mayoBg = pctMesActual >= 100 ? 'linear-gradient(135deg,#052e16,#166534)' : pctMesActual > 0 ? 'linear-gradient(135deg,#431407,#92400e)' : 'linear-gradient(135deg,#0c1445,#1e3a8a)';
  const mayoTagBg = pctMesActual >= 100 ? 'rgba(134,239,172,0.2)' : pctMesActual > 0 ? 'rgba(252,211,77,0.2)' : 'rgba(147,197,253,0.2)';
  const mayoTagColor = pctMesActual >= 100 ? '#86EFAC' : pctMesActual > 0 ? '#FDE047' : '#BFDBFE';
  const mayoIcon = pctMesActual >= 100 ? '✅' : pctMesActual > 0 ? '⚠️' : '📅';
  const mayoStatus = pctMesActual >= 100 ? 'Cumplido' : pctMesActual > 0 ? 'En progreso' : 'Pendiente';

  const mayoPresHtml = `
    <div class="kpi-card" style="background:${mayoBg};border-color:${mayoBorderColor};padding:18px 20px;position:relative;overflow:hidden;">
      <div class="kpi-accent" style="background:${mayoBorderColor};height:4px;"></div>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
        <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:rgba(255,255,255,0.5);">📅 Programado ${MES_ACTUAL_LABEL}</div>
        <span style="padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;background:${mayoTagBg};color:${mayoTagColor};">${mayoIcon} ${mayoStatus}</span>
      </div>
      <div style="font-size:11px;color:rgba(255,255,255,0.5);margin-bottom:1px;">Programado</div>
      <div style="font-size:16px;font-weight:600;color:rgba(255,255,255,0.7);margin-bottom:10px;">${fmtS(progMesActual)}</div>
      <div style="background:rgba(255,255,255,0.1);border-radius:8px;padding:10px 12px;margin-bottom:10px;border:1px solid rgba(255,255,255,0.12);">
        <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,0.5);margin-bottom:3px;">Devengado ${MES_ACTUAL_LABEL.charAt(0)+MES_ACTUAL_LABEL.slice(1).toLowerCase()}</div>
        <div style="font-size:22px;font-weight:700;color:#fff;letter-spacing:-.02em;line-height:1;">${fmtS(ejecMesActual)}</div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <svg width="52" height="52" viewBox="0 0 52 52" style="flex-shrink:0;">
          <circle cx="26" cy="26" r="20" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="6"/>
          <circle cx="26" cy="26" r="20" fill="none" stroke="${mayoBorderColor}" stroke-width="6"
            stroke-dasharray="${(Math.min(pctMesActual,100)/100*125.66).toFixed(1)} ${(125.66 - Math.min(pctMesActual,100)/100*125.66).toFixed(1)}"
            stroke-dashoffset="31.41" stroke-linecap="round"/>
          <text x="26" y="30" text-anchor="middle" font-size="11" font-weight="700" fill="white" font-family="IBM Plex Sans,sans-serif">${pctMesActual.toFixed(0)}%</text>
        </svg>
        <div style="flex:1;">
          <div style="font-size:10px;color:rgba(255,255,255,0.5);margin-bottom:2px;">% Avance del Mes</div>
          <div style="font-size:22px;font-weight:800;color:${mayoTagColor};letter-spacing:-.02em;line-height:1;">${pctMesActual.toFixed(1)}<span style="font-size:12px;font-weight:500;">%</span></div>
          <div style="margin-top:5px;height:4px;background:rgba(255,255,255,0.12);border-radius:2px;overflow:hidden;">
            <div style="width:0%;height:100%;background:${mayoBorderColor};border-radius:2px;" class="kpi-anim-bar" data-target-width="${Math.min(pctMesActual,100).toFixed(1)}"></div>
          </div>
        </div>
      </div>
    </div>`;

  const presGrid = document.getElementById('presKpiGrid');
  presGrid.innerHTML = regularPresHtml + ringKpisHtml + avanceRingHtml + mayoPresHtml;
  animateKpiBars(presGrid);
  animatePoiRing('presProgAcumRingArc', 'presProgAcumRingPct', pctProgCorte, RING_CIRC2);
  animatePoiRing('presDevRingArc', 'presDevRingPct', pctCorte, RING_CIRC2);
  animatePoiRing('presSaldoRingArc', 'presSaldoRingPct', pctSaldoCorte, RING_CIRC2);
  animatePoiRing('presAvanceRingArc', 'presAvanceRingPct', pctCorte, 163.36);
}

// ═══════════════════════════════════════════════════════════
// PRES: Avance mensual chart
// ═══════════════════════════════════════════════════════════
function renderPresMensual() {
  const f = presFilter;
  const d = presData(f);
  const label = f==='TODOS' ? 'Todos los Centros de Costo' : presLabel(f);
  document.getElementById('presMensualSub').textContent = label + ' · Montos en S/ · Rojo = devengado menor al programado';

  const ctx = document.getElementById('chartPresMensual').getContext('2d');
  if (presCharts.mensual) presCharts.mensual.destroy();

  presCharts.mensual = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: PRES.meses,
      datasets: [
        { label:'Programado', data: d.prog_monthly, backgroundColor:'rgba(26,86,219,0.15)', borderColor:'#1A56DB', borderWidth:1.5, borderRadius:4, order:2 },
        { label:'Devengado — cumplido', data: d.ejec_monthly.map((e,i)=>{
            if(e===0&&i>=PRES.mesesEjec) return null;
            return (e-d.prog_monthly[i])>=0 ? e : null;
          }), backgroundColor:'rgba(13,148,136,0.85)', borderColor:'#0D9488', borderWidth:1.5, borderRadius:4, order:1 },
        { label:'Devengado — déficit (< programado)', data: d.ejec_monthly.map((e,i)=>{
            if(e===0&&i>=PRES.mesesEjec) return null;
            return (e-d.prog_monthly[i])<0 ? e : null;
          }), backgroundColor:'rgba(220,38,38,0.75)', borderColor:'#DC2626', borderWidth:1.5, borderRadius:4, order:1 },
        { label:'Pendiente', data: d.ejec_monthly.map((e,i)=> (e===0&&i>=PRES.mesesEjec) ? d.prog_monthly[i] : null),
          backgroundColor:'rgba(148,163,184,0.15)', borderColor:'#CBD5E1', borderWidth:1.5, borderRadius:4, order:2 }
      ]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{
        legend:{
          display:true, position:'top',
          labels:{font:{size:11}, usePointStyle:true, padding:12,
            filter: item => item.text !== 'Pendiente'
          }
        },
        tooltip:{callbacks:{label:c=>{
          if(c.raw===null) return null;
          const v=c.raw; const m=c.dataIndex;
          const prog=d.prog_monthly[m]; const ejec=d.ejec_monthly[m];
          if(c.datasetIndex>=1&&c.datasetIndex<=2&&prog>0&&ejec>0){
            const diff=ejec-prog;
            return [`${c.dataset.label.split('—')[0].trim()}: ${fmtS(v)}`, `Diferencia: ${diff>=0?'+':''}${fmtS(diff)}`];
          }
          return `${c.dataset.label.split('—')[0].trim()}: ${fmtS(v)}`;
        }}}
      },
      animation:{
        onComplete: function() {
          const chart = this;
          const ctx2 = chart.ctx;
          ctx2.save();
          ctx2.font = 'bold 10px IBM Plex Sans, sans-serif';
          ctx2.textAlign = 'center';
          ctx2.textBaseline = 'bottom';
          [1, 2].forEach(dsIdx => {
            const ds = chart.getDatasetMeta(dsIdx);
            ds.data.forEach((bar, i) => {
              const val = chart.data.datasets[dsIdx].data[i];
              if (val === null || val === undefined) return;
              const prog = d.prog_monthly[i];
              if (!prog || prog === 0) return;
              const pct = (val / prog * 100).toFixed(1) + '%';
              ctx2.fillStyle = dsIdx === 1 ? '#0D9488' : '#DC2626';
              ctx2.fillText(pct, bar.x, bar.y - 3);
            });
          });
          ctx2.restore();
        }
      },
      scales:{
        x:{grid:{display:false},ticks:{font:{size:11}}},
        y:{ticks:{callback:v=>fmtS(v),font:{size:10}},grid:{color:'rgba(0,0,0,.04)'},beginAtZero:true}
      }
    }
  });
}

// ═══════════════════════════════════════════════════════════
// PRES: Ranking mensual
// ═══════════════════════════════════════════════════════════
function renderPresRankingMes() {
  const f = presFilter;
  // Show last month with data per centro
  const lastMesIdx = PRES.mesesEjec - 1; // May (index 4)
  const meLabel = PRES.meses[lastMesIdx];

  document.getElementById('presRankingMesSub').textContent = `${meLabel} — Devengado por Centro de Costo`;

  let items;
  if (f === 'TODOS') {
    items = PRES.centros.map(c => ({
      label: c, color: presColor(c),
      prog: PRES.data[c].prog_monthly[lastMesIdx],
      ejec: PRES.data[c].ejec_monthly[lastMesIdx]
    })).sort((a,b)=>{
      const pa = a.prog>0?(a.ejec/a.prog*100):0;
      const pb = b.prog>0?(b.ejec/b.prog*100):0;
      return pb-pa;
    });
  } else {
    // Show monthly breakdown for selected centro
    items = PRES.meses.map((m,i)=>({
      label: m, color: presColor(f),
      prog: PRES.data[f].prog_monthly[i],
      ejec: PRES.data[f].ejec_monthly[i]
    })).filter(x=>x.prog>0||x.ejec>0).sort((a,b)=>{
      const pa = a.prog>0?(a.ejec/a.prog*100):0;
      const pb = b.prog>0?(b.ejec/b.prog*100):0;
      return pb-pa;
    });
    document.getElementById('presRankingMesSub').textContent = presLabel(f) + ' — Devengado mensual ordenado';
  }

  const el = document.getElementById('presRankingMes');
  el.innerHTML = items.map(item=>{
    const pct = item.prog>0?(item.ejec/item.prog*100):0;
    const pctClamped = Math.min(pct, 100);
    const c = pct>=50?'#0D9488':pct>=20?'#EA580C':'#DC2626';
    return `<div class="hbar-row">
      <div class="hbar-info">
        <span class="hbar-name" style="font-weight:600;color:${item.color};">${item.label}</span>
        <div class="hbar-stats">
          <span class="hbar-pct" style="color:${c};">${pct.toFixed(1)}%</span>
          <span class="hbar-nums">${fmtSk(item.ejec)} / ${fmtSk(item.prog)}</span>
        </div>
      </div>
      <div class="hbar-track">
        <div style="position:relative;height:100%;border-radius:4px;background:#E2E8F0;">
          <div style="position:absolute;top:0;left:0;height:100%;width:100%;background:rgba(26,86,219,0.15);border-radius:4px;"></div>
          <div class="kpi-anim-bar" style="position:absolute;top:0;left:0;height:100%;width:0%;background:${c};border-radius:4px;" data-target-width="${pctClamped.toFixed(1)}"></div>
        </div>
      </div>
    </div>`;
  }).join('');
  animateKpiBars(el);
}

// ═══════════════════════════════════════════════════════════
// PRES: Trimestral chart
// ═══════════════════════════════════════════════════════════
function renderPresTrimestre() {
  const f = presFilter;
  const d = presData(f);
  const color = f==='TODOS'?'#1A56DB':presColor(f);
  document.getElementById('presTriSub').textContent =
    (f==='TODOS'?'Todos los Centros':presLabel(f)) + ' · Agrupado por Trimestre · Montos en S/ · % = Devengado / Programado';

  const ctx = document.getElementById('chartPresTrimestre').getContext('2d');
  if (presCharts.trimestre) presCharts.trimestre.destroy();

  // Calcular porcentajes por trimestre
  const pctTrim = d.trimestres.prog.map((p,i) => p>0 ? parseFloat((d.trimestres.ejec[i]/p*100).toFixed(1)) : 0);

  // Porcentaje que representa cada trimestre respecto al total anual programado
  const totalProgTrim = d.total_prog || d.trimestres.prog.reduce((a,b)=>a+b,0);
  const pctProgTrim = d.trimestres.prog.map(p => totalProgTrim > 0 ? parseFloat((p / totalProgTrim * 100).toFixed(1)) : 0);

  const pluginProgLabelTrim = {
    id: 'progLabelTrim',
    afterDraw(chart) {
      const ctx2 = chart.ctx;
      const ds = chart.getDatasetMeta(0); // dataset Programado
      ctx2.save();
      ctx2.font = 'bold 11px IBM Plex Sans, sans-serif';
      ctx2.textAlign = 'center';
      ctx2.textBaseline = 'bottom';
      ctx2.fillStyle = '#1A56DB';
      ds.data.forEach((bar, i) => {
        const val = chart.data.datasets[0].data[i];
        if (!val) return;
        const pct = pctProgTrim[i];
        ctx2.fillText(pct + '% del anual', bar.x, bar.y - 4);
      });
      ctx2.restore();
    }
  };

  presCharts.trimestre = new Chart(ctx, {
    type:'bar',
    data:{
      labels: PRES.trimestres,
      datasets:[
        { label:'Programado', data:d.trimestres.prog, backgroundColor:'rgba(26,86,219,0.15)', borderColor:'#1A56DB', borderWidth:1.5, borderRadius:5, yAxisID:'y' },
        { label:'Devengado', data:d.trimestres.ejec, backgroundColor:color+'CC', borderColor:color, borderWidth:1.5, borderRadius:5, yAxisID:'y' },
        { label:'% Avance', data:pctTrim, type:'line', yAxisID:'y2',
          borderColor:'#F59E0B', backgroundColor:'rgba(245,158,11,0.12)',
          pointBackgroundColor:'#F59E0B', pointRadius:5, pointHoverRadius:7,
          borderWidth:2, borderDash:[4,3], tension:0.3, fill:false, order:0 }
      ]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      layout:{ padding:{ top:22 } },
      plugins:{
        legend:{display:false},
        tooltip:{callbacks:{
          label:c=>{
            if(c.dataset.label==='% Avance') return `% Avance: ${c.raw}%`;
            const i=c.dataIndex;
            const prog=d.trimestres.prog[i], ejec=d.trimestres.ejec[i];
            const diff=ejec-prog;
            if(c.dataset.label==='Devengado')
              return [`Devengado: ${fmtS(c.raw)}`, `Diferencia: ${diff>=0?'+':''}${fmtS(diff)}`];
            return [`Programado: ${fmtS(c.raw)}`, `Representa: ${pctProgTrim[i]}% del total anual`];
          }
        }}
      },
      scales:{
        x:{grid:{display:false},ticks:{font:{size:11}}},
        y:{ticks:{callback:v=>fmtS(v),font:{size:10}},grid:{color:'rgba(0,0,0,.04)'},beginAtZero:true, title:{display:true,text:'Monto (S/)',font:{size:10},color:'#64748B'}},
        y2:{position:'right', min:0, max:100, ticks:{callback:v=>v+'%',font:{size:10},color:'#F59E0B'}, grid:{display:false}, title:{display:true,text:'% Avance',font:{size:10},color:'#F59E0B'}}
      }
    },
    plugins:[pluginProgLabelTrim]
  });

  // Renderizar leyenda HTML en el card-header
  const trimColor = f==='TODOS'?'#1A56DB':presColor(f);
  document.getElementById('legendPresTrimestre').innerHTML = `
    <span style="display:flex;align-items:center;gap:5px;font-size:12px;color:#475569;">
      <span style="width:12px;height:12px;border-radius:3px;background:rgba(26,86,219,0.15);border:1.5px solid #1A56DB;display:inline-block;flex-shrink:0;"></span>Programado
    </span>
    <span style="display:flex;align-items:center;gap:5px;font-size:12px;color:#475569;">
      <span style="width:12px;height:12px;border-radius:3px;background:${trimColor}CC;border:1.5px solid ${trimColor};display:inline-block;flex-shrink:0;"></span>Devengado
    </span>
    <span style="display:flex;align-items:center;gap:5px;font-size:12px;color:#475569;">
      <span style="width:18px;height:2px;background:#F59E0B;display:inline-block;flex-shrink:0;position:relative;">
        <span style="width:8px;height:8px;background:#F59E0B;border-radius:50%;display:inline-block;position:absolute;top:-3px;left:5px;"></span>
      </span>% Avance
    </span>`;
}

// ═══════════════════════════════════════════════════════════
// PRES: Semestral chart
// ═══════════════════════════════════════════════════════════
function renderPresSemestre() {
  const f = presFilter;
  const d = presData(f);
  const color = f==='TODOS'?'#7C3AED':presColor(f);
  document.getElementById('presSemSub').textContent =
    (f==='TODOS'?'Todos los Centros':presLabel(f)) + ' · Primer y Segundo Semestre · Montos en S/ · % = Devengado / Programado';

  const ctx = document.getElementById('chartPresSemestre').getContext('2d');
  if (presCharts.semestre) presCharts.semestre.destroy();

  // Calcular porcentajes por semestre
  const pctSem = d.semestres.prog.map((p,i) => p>0 ? parseFloat((d.semestres.ejec[i]/p*100).toFixed(1)) : 0);

  // Porcentaje que representa cada semestre respecto al total anual programado
  const totalProgSem = d.total_prog || d.semestres.prog.reduce((a,b)=>a+b,0);
  const pctProgSem = d.semestres.prog.map(p => totalProgSem > 0 ? parseFloat((p / totalProgSem * 100).toFixed(1)) : 0);

  const pluginProgLabelSem = {
    id: 'progLabelSem',
    afterDraw(chart) {
      const ctx2 = chart.ctx;
      const ds = chart.getDatasetMeta(0); // dataset Programado
      ctx2.save();
      ctx2.font = 'bold 11px IBM Plex Sans, sans-serif';
      ctx2.textAlign = 'center';
      ctx2.textBaseline = 'bottom';
      ctx2.fillStyle = '#1A56DB';
      ds.data.forEach((bar, i) => {
        const val = chart.data.datasets[0].data[i];
        if (!val) return;
        const pct = pctProgSem[i];
        ctx2.fillText(pct + '% del anual', bar.x, bar.y - 4);
      });
      ctx2.restore();
    }
  };

  presCharts.semestre = new Chart(ctx, {
    type:'bar',
    data:{
      labels: PRES.semestres,
      datasets:[
        { label:'Programado', data:d.semestres.prog, backgroundColor:'rgba(26,86,219,0.15)', borderColor:'#1A56DB', borderWidth:1.5, borderRadius:5, yAxisID:'y' },
        { label:'Devengado', data:d.semestres.ejec, backgroundColor:color+'CC', borderColor:color, borderWidth:1.5, borderRadius:5, yAxisID:'y' },
        { label:'% Avance', data:pctSem, type:'line', yAxisID:'y2',
          borderColor:'#F59E0B', backgroundColor:'rgba(245,158,11,0.12)',
          pointBackgroundColor:'#F59E0B', pointRadius:6, pointHoverRadius:8,
          borderWidth:2, borderDash:[4,3], tension:0, fill:false, order:0 }
      ]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      layout:{ padding:{ top:22 } },
      plugins:{
        legend:{display:false},
        tooltip:{callbacks:{
          label:c=>{
            if(c.dataset.label==='% Avance') return `% Avance: ${c.raw}%`;
            const i=c.dataIndex;
            const prog=d.semestres.prog[i], ejec=d.semestres.ejec[i];
            const diff=ejec-prog;
            if(c.dataset.label==='Devengado')
              return [`Devengado: ${fmtS(c.raw)}`, `Diferencia: ${diff>=0?'+':''}${fmtS(diff)}`];
            return [`Programado: ${fmtS(c.raw)}`, `Representa: ${pctProgSem[i]}% del total anual`];
          }
        }}
      },
      scales:{
        x:{grid:{display:false},ticks:{font:{size:12,weight:'600'}}},
        y:{ticks:{callback:v=>fmtS(v),font:{size:10}},grid:{color:'rgba(0,0,0,.04)'},beginAtZero:true, title:{display:true,text:'Monto (S/)',font:{size:10},color:'#64748B'}},
        y2:{position:'right', min:0, max:100, ticks:{callback:v=>v+'%',font:{size:10},color:'#F59E0B'}, grid:{display:false}, title:{display:true,text:'% Avance',font:{size:10},color:'#F59E0B'}}
      }
    },
    plugins:[pluginProgLabelSem]
  });

  // Renderizar leyenda HTML en el card-header
  const semColor = color;
  document.getElementById('legendPresSemestre').innerHTML = `
    <span style="display:flex;align-items:center;gap:5px;font-size:12px;color:#475569;">
      <span style="width:12px;height:12px;border-radius:3px;background:rgba(26,86,219,0.15);border:1.5px solid #1A56DB;display:inline-block;flex-shrink:0;"></span>Programado
    </span>
    <span style="display:flex;align-items:center;gap:5px;font-size:12px;color:#475569;">
      <span style="width:12px;height:12px;border-radius:3px;background:${semColor}CC;border:1.5px solid ${semColor};display:inline-block;flex-shrink:0;"></span>Devengado
    </span>
    <span style="display:flex;align-items:center;gap:5px;font-size:12px;color:#475569;">
      <span style="width:18px;height:2px;background:#F59E0B;display:inline-block;flex-shrink:0;position:relative;">
        <span style="width:8px;height:8px;background:#F59E0B;border-radius:50%;display:inline-block;position:absolute;top:-3px;left:5px;"></span>
      </span>% Avance
    </span>`;
}

// ═══════════════════════════════════════════════════════════
// PRES: Ranking anual
// ═══════════════════════════════════════════════════════════
function renderPresRankingAnual() {
  const f = presFilter;
  let items;

  if (f === 'TODOS') {
    items = PRES.centros.map(c=>({
      label: presLabel(c), color: presColor(c),
      prog: PRES.data[c].total_prog,
      ejec: PRES.data[c].total_ejec
    })).sort((a,b)=>{
      const pa = a.prog>0?(a.ejec/a.prog*100):0;
      const pb = b.prog>0?(b.ejec/b.prog*100):0;
      return pb-pa;
    });
  } else {
    // Show trimestres as ranking
    const d = PRES.data[f];
    items = PRES.trimestres.map((t,i)=>({
      label: t, color: presColor(f),
      prog: d.trimestres.prog[i],
      ejec: d.trimestres.ejec[i]
    })).sort((a,b)=>{
      const pa = a.prog>0?(a.ejec/a.prog*100):0;
      const pb = b.prog>0?(b.ejec/b.prog*100):0;
      return pb-pa;
    });
  }

  const el = document.getElementById('presRankingAnual');
  el.innerHTML = items.map((item,idx)=>{
    const pct = item.prog>0?(item.ejec/item.prog*100):0;
    const pctClamped = Math.min(pct, 100);
    const c = pct>=50?'#0D9488':pct>=20?'#EA580C':'#DC2626';
    const medal = idx===0?'🥇':idx===1?'🥈':idx===2?'🥉':'';
    return `<div class="hbar-row">
      <div class="hbar-info">
        <span class="hbar-name"><span style="margin-right:4px;">${medal}</span>${item.label}</span>
        <div class="hbar-stats">
          <span class="hbar-pct" style="color:${c};font-weight:700;">${pct.toFixed(1)}%</span>
          <span class="hbar-nums">${fmtSk(item.ejec)} / ${fmtSk(item.prog)}</span>
        </div>
      </div>
      <div class="hbar-track">
        <div style="position:relative;height:100%;border-radius:4px;background:#E2E8F0;">
          <div style="position:absolute;top:0;left:0;height:100%;width:100%;background:rgba(26,86,219,0.12);border-radius:4px;"></div>
          <div class="kpi-anim-bar" style="position:absolute;top:0;left:0;height:100%;width:0%;background:${c};border-radius:4px;" data-target-width="${pctClamped.toFixed(1)}"></div>
        </div>
      </div>
    </div>`;
  }).join('');
  animateKpiBars(el);
}

// ═══════════════════════════════════════════════════════════
// PRES: Tabla detalle anual
// ═══════════════════════════════════════════════════════════
function renderPresDetalleTable() {
  const f = presFilter;
  document.getElementById('presDetalleSub').textContent =
    (f==='TODOS'?'Todos los Centros de Costo':presLabel(f)) + ' · Montos totales anuales en S/';

  let rows;
  if (f === 'TODOS') {
    rows = PRES.centros.map(c=>{
      const d = PRES.data[c];
      return { label: presLabel(c), color: presColor(c), prog: d.total_prog, ejec: d.total_ejec };
    });
    // Add total row
    const tot = PRES.data['TODOS'];
    rows.push({ label:'TOTAL', color:'#0F172A', prog:tot.total_prog, ejec:tot.total_ejec, isTotal:true });
  } else {
    const d = PRES.data[f];
    rows = PRES.meses.map((m,i)=>({
      label:m, color:presColor(f), prog:d.prog_monthly[i], ejec:d.ejec_monthly[i]
    }));
    rows.push({ label:'TOTAL ANUAL', color:'#0F172A', prog:d.total_prog, ejec:d.total_ejec, isTotal:true });
  }

  const table = document.getElementById('presDetalleTable');
  table.innerHTML = `
    <thead>
      <tr>
        <th>${f==='TODOS'?'Centro de Costo':'Mes'}</th>
        <th>Programado (S/)</th>
        <th>Devengado (S/)</th>
        <th>Saldo (S/)</th>
        <th>% Avance</th>
      </tr>
    </thead>
    <tbody>
      ${rows.map(r=>{
        const saldo = r.ejec - r.prog;
        const p = r.prog>0?(r.ejec/r.prog*100):0;
        const cls = r.isTotal?'font-weight:700;background:#F8FAFC;':'';
        const clsDiff = saldo<0?'diff-neg':saldo>0?'diff-pos':'diff-zero';
        const barColor = p>=50?'#0D9488':p>=20?'#EA580C':'#DC2626';
        return `<tr style="${cls}">
          <td style="font-weight:${r.isTotal?700:500};color:${r.color};">${r.label}</td>
          <td>${fmtS(r.prog)}</td>
          <td>${fmtS(r.ejec)}</td>
          <td class="${clsDiff}">${saldo>=0?'+':''}${fmtS(saldo)}</td>
          <td>
            <div style="display:flex;align-items:center;gap:6px;">
              <div style="flex:1;height:6px;background:#E2E8F0;border-radius:3px;overflow:hidden;">
                <div class="kpi-anim-bar" style="width:0%;height:100%;background:${barColor};border-radius:3px;" data-target-width="${Math.min(p,100).toFixed(1)}"></div>
              </div>
              <span style="font-weight:600;color:${p>=50?'#0D9488':p>=20?'#EA580C':'#DC2626'};min-width:38px;text-align:right;">${p.toFixed(1)}%</span>
            </div>
          </td>
        </tr>`;
      }).join('')}
    </tbody>`;
  animateKpiBars(table);
}

// ═══════════════════════════════════════════════════════════
// PRES: Análisis x Clasificadores de Gasto
// ═══════════════════════════════════════════════════════════
function presClasData(f) {
  return PRES_CLAS[f] || PRES_CLAS['TODOS'];
}

function renderPresClasificador() {
  const f = presFilter;
  const color = f === 'TODOS' ? '#1A56DB' : presColor(f);
  const label = f === 'TODOS' ? 'Todos los Centros de Costo' : presLabel(f);

  // Datos completos, sin modificar el código de clasificador (tal como figura en el Excel)
  const shown = presClasData(f).slice().sort((a, b) => b.prog - a.prog);
  const totalCount = shown.length;

  document.getElementById('presClasSub').textContent =
    label + ' · Programado vs Devengado por clasificador de gasto (SIAF) · Montos en S/' +
    ` · ${totalCount} clasificador${totalCount === 1 ? '' : 'es'}`;

  const labels = shown.map(it => it.code + ' · ' + it.rubro);
  const progData = shown.map(it => it.prog);
  const ejecData = shown.map(it => it.ejec);
  const pctData = shown.map(it => it.prog > 0 ? parseFloat((it.ejec / it.prog * 100).toFixed(1)) : 0);

  // Alto dinámico: suficiente espacio por barra para que las etiquetas de monto sean legibles
  const rowHeight = 34;
  const chartHeightPx = Math.max(340, totalCount * rowHeight);
  const canvasEl = document.getElementById('chartPresClasificador');
  canvasEl.parentElement.style.height = chartHeightPx + 'px';

  const ctx = canvasEl.getContext('2d');
  if (presCharts.clasificador) presCharts.clasificador.destroy();

  // Plugin: muestra el monto completo al final de cada barra
  const pluginBarValueLabels = {
    id: 'barValueLabelsClas',
    afterDatasetsDraw(chart) {
      const ctx2 = chart.ctx;
      ctx2.save();
      ctx2.font = '600 10px IBM Plex Sans, sans-serif';
      ctx2.textBaseline = 'middle';
      chart.data.datasets.forEach((ds, dsIdx) => {
        const meta = chart.getDatasetMeta(dsIdx);
        if (meta.hidden) return;
        ctx2.fillStyle = dsIdx === 0 ? '#1A56DB' : color;
        meta.data.forEach((bar, i) => {
          const val = ds.data[i];
          if (val === null || val === undefined) return;
          ctx2.textAlign = 'left';
          ctx2.fillText(fmtS(val), bar.x + 6, bar.y);
        });
      });
      ctx2.restore();
    }
  };

  presCharts.clasificador = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        { label: 'Programado', data: progData.map(() => 0), backgroundColor: 'rgba(26,86,219,0.15)', borderColor: '#1A56DB', borderWidth: 1.5, borderRadius: 4 },
        { label: 'Devengado', data: ejecData.map(() => 0), backgroundColor: color + 'CC', borderColor: color, borderWidth: 1.5, borderRadius: 4 }
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true, maintainAspectRatio: false,
      layout: { padding: { right: 70 } },
      animation: { duration: 900, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: true, position: 'top', labels: { font: { size: 11 }, usePointStyle: true, padding: 12 } },
        tooltip: {
          callbacks: {
            label: c => `${c.dataset.label}: ${fmtS(c.raw)}`,
            afterLabel: c => {
              const i = c.dataIndex;
              return c.datasetIndex === 1 ? `% Avance: ${pctData[i]}%` : null;
            }
          }
        }
      },
      scales: {
        x: { ticks: { callback: v => fmtSk(v), font: { size: 10 } }, grid: { color: 'rgba(0,0,0,.04)' }, beginAtZero: true, title: { display: true, text: 'Monto (S/)', font: { size: 10 }, color: '#64748B' } },
        y: { grid: { display: false }, ticks: { font: { size: 10 } } }
      }
    },
    plugins: [pluginBarValueLabels]
  });
  // Forzar animación de entrada: partir de 0 y animar hacia los valores reales en el siguiente frame
  requestAnimationFrame(() => {
    if (!presCharts.clasificador) return;
    presCharts.clasificador.data.datasets[0].data = progData;
    presCharts.clasificador.data.datasets[1].data = ejecData;
    presCharts.clasificador.update();
  });
}

// ═══════════════════════════════════════════════════════════
// PRES: Análisis de Ejecución por Metas Presupuestales
// ═══════════════════════════════════════════════════════════
function presMetasData(f) {
  return PRES_METAS[f] || PRES_METAS['TODOS'];
}

function renderPresMetas() {
  const f = presFilter;
  const color = f === 'TODOS' ? '#7C3AED' : presColor(f);
  const label = f === 'TODOS' ? 'Todos los Centros de Costo' : presLabel(f);

  const raw = presMetasData(f);
  const usaMesEspecifico = presMesFilter !== 'TODOS';
  const NOMBRES_MES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Set','Oct','Nov','Dic'];

  // Modo dinámico: 'Acumulado' -> totales anuales (prog completo, ejec ya acumulado a la fecha
  // porque los meses futuros están en 0) · mes específico -> solo ese mes
  let shown;
  let periodoLabel;
  if (usaMesEspecifico) {
    const mIdx = Number(presMesFilter);
    periodoLabel = NOMBRES_MES[mIdx];
    shown = raw
      .map(it => ({ meta: it.meta, prog: it.prog_m[mIdx], ejec: it.ejec_m[mIdx] }))
      .filter(it => it.prog > 0 || it.ejec > 0);
  } else {
    periodoLabel = 'Acumulado anual';
    shown = raw.map(it => ({ meta: it.meta, prog: it.prog, ejec: it.ejec }));
  }
  shown = shown.slice().sort((a, b) => b.prog - a.prog);
  const totalCount = shown.length;

  document.getElementById('presMetasSub').textContent =
    label + ' · ' + periodoLabel + ' · Programado vs Devengado por Meta Presupuestal · Montos en S/' +
    ` · ${totalCount} meta${totalCount === 1 ? '' : 's'}`;

  const labels = shown.map(it => 'Meta ' + it.meta);
  const progData = shown.map(it => it.prog);
  const ejecData = shown.map(it => it.ejec);
  const pctData = shown.map(it => it.prog > 0 ? parseFloat((it.ejec / it.prog * 100).toFixed(1)) : 0);

  // Alto dinámico: suficiente espacio por barra para que las etiquetas de monto sean legibles
  const rowHeight = 34;
  const chartHeightPx = Math.max(280, totalCount * rowHeight);
  const canvasEl = document.getElementById('chartPresMetas');
  canvasEl.parentElement.style.height = chartHeightPx + 'px';

  const ctx = canvasEl.getContext('2d');
  if (presCharts.metas) presCharts.metas.destroy();

  if (totalCount === 0) {
    return;
  }

  // Plugin: muestra el monto completo al final de cada barra
  const pluginBarValueLabelsMetas = {
    id: 'barValueLabelsMetas',
    afterDatasetsDraw(chart) {
      const ctx2 = chart.ctx;
      ctx2.save();
      ctx2.font = '600 10px IBM Plex Sans, sans-serif';
      ctx2.textBaseline = 'middle';
      chart.data.datasets.forEach((ds, dsIdx) => {
        const meta = chart.getDatasetMeta(dsIdx);
        if (meta.hidden) return;
        ctx2.fillStyle = dsIdx === 0 ? '#1A56DB' : color;
        meta.data.forEach((bar, i) => {
          const val = ds.data[i];
          if (val === null || val === undefined) return;
          ctx2.textAlign = 'left';
          ctx2.fillText(fmtS(val), bar.x + 6, bar.y);
        });
      });
      ctx2.restore();
    }
  };

  presCharts.metas = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        { label: 'Programado', data: progData.map(() => 0), backgroundColor: 'rgba(26,86,219,0.15)', borderColor: '#1A56DB', borderWidth: 1.5, borderRadius: 4 },
        { label: 'Devengado', data: ejecData.map(() => 0), backgroundColor: color + 'CC', borderColor: color, borderWidth: 1.5, borderRadius: 4 }
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true, maintainAspectRatio: false,
      layout: { padding: { right: 70 } },
      animation: { duration: 900, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: true, position: 'top', labels: { font: { size: 11 }, usePointStyle: true, padding: 12 } },
        tooltip: {
          callbacks: {
            label: c => `${c.dataset.label}: ${fmtS(c.raw)}`,
            afterLabel: c => {
              const i = c.dataIndex;
              return c.datasetIndex === 1 ? `% Avance: ${pctData[i]}%` : null;
            }
          }
        }
      },
      scales: {
        x: { ticks: { callback: v => fmtSk(v), font: { size: 10 } }, grid: { color: 'rgba(0,0,0,.04)' }, beginAtZero: true, title: { display: true, text: 'Monto (S/)', font: { size: 10 }, color: '#64748B' } },
        y: { grid: { display: false }, ticks: { font: { size: 10 } } }
      }
    },
    plugins: [pluginBarValueLabelsMetas]
  });
  // Forzar animación de entrada: partir de 0 y animar hacia los valores reales en el siguiente frame
  requestAnimationFrame(() => {
    if (!presCharts.metas) return;
    presCharts.metas.data.datasets[0].data = progData;
    presCharts.metas.data.datasets[1].data = ejecData;
    presCharts.metas.update();
  });
}

// ═══════════════════════════════════════════════════════════
// UPDATE PRES
// ═══════════════════════════════════════════════════════════
function updatePres() {
  renderPresKPIs();
  renderPresMensual();
  renderPresRankingMes();
  renderPresTrimestre();
  renderPresSemestre();
  renderPresRankingAnual();
  renderPresDetalleTable();
  renderPresClasificador();
  renderPresMetas();
  renderPresCalendar();
}

// ═══════════════════════════════════════════════════════════
// PRES: Calendario anual
// ═══════════════════════════════════════════════════════════
function renderPresCalendar() {
  const f = presFilter;
  const d = presData(f);
  const label = f === 'TODOS' ? 'Todos los Centros de Costo' : presLabel(f);
  const mesesEjec = PRES.mesesEjec; // 5 meses con datos (Ene–May)

  document.getElementById('presSubCalendar').textContent =
    label + ' · Verde = devengado completo · Amarillo = diferencia · Gris = pendiente · Montos en S/';

  const cal = document.getElementById('presCalendarView');
  cal.innerHTML = PRES.meses.map((m, i) => {
    const prog = d.prog_monthly[i] || 0;
    const ejec = d.ejec_monthly[i] || 0;
    const isEjec = i < mesesEjec;
    let cls, val, sub;

    if (!isEjec) {
      cls = 'cal-pending';
      val = prog > 0 ? fmtS(prog) : '—';
      sub = prog > 0 ? 'pendiente' : 'sin prog.';
    } else {
      const diff = ejec - prog;
      const diffAbs = Math.abs(diff);
      if (prog === 0 && ejec === 0) {
        cls = 'cal-pending'; val = '—'; sub = 'sin mov.';
      } else if (diff < 0) {
        cls = 'cal-partial';
        val = fmtS(ejec);
        sub = '−' + fmtS(diffAbs);
      } else if (diff === 0) {
        cls = 'cal-done';
        val = fmtS(ejec);
        sub = '✓ cumplido';
      } else {
        cls = 'cal-done';
        val = fmtS(ejec);
        sub = '+' + fmtS(diff);
      }
    }

    return `
      <div class="cal-month">
        <div class="cal-label">${m}</div>
        <div class="cal-chip ${cls}">
          <div class="cal-val" style="font-size:10px;">${val}</div>
          <div class="cal-sub">${sub}</div>
        </div>
      </div>`;
  }).join('');
}

// ═══════════════════════════════════════════════════════════
// PUBLICACIONES — KPIs, gráficos y tabla de detalle
// ═══════════════════════════════════════════════════════════

const PUB_ESTADOS_PROCESO = ['En proceso', 'En proceso de publicación', 'En desarrollo'];
const PUB_INDICADORES_CALIDAD = ['Q1', 'Q2', 'Q3', 'Q4'];

// Comprueba si un centro de costo aparece dentro del campo `area`, que a veces
// combina varios nombres (ej. "DMA , DHI y DRD", "SMN/SEA", "IRD - SMN").
function pubAreaMatches(area, filter) {
  if (!area) return false;
  const esc = filter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp('(^|[^A-Za-zÀ-ÿ0-9])' + esc + '([^A-Za-zÀ-ÿ0-9]|$)', 'i');
  return re.test(area);
}

function pubFilteredData() {
  let data = PUBLICACIONES;
  if (activeFilter !== 'TODOS') data = data.filter(r => pubAreaMatches(r.area, activeFilter));
  if (pubFilter !== 'TODOS') data = data.filter(r => r.anio === pubFilter);
  return data;
}

function pubColorForCategoria(cat) {
  const map = {
    'Artículo Científico': '#1A56DB',
    'Estudios e investigaciones': '#0D9488',
    'TSP': '#EA580C',
    'Otros': '#9333EA',
    'Publicación técnica': '#D97706',
    'Libro': '#E11D48',
    'No se encontró': '#94A3B8',
    'Sin categoría': '#94A3B8'
  };
  return map[cat] || '#4C2C2C';
}

// Actualiza el badge del encabezado con el conteo vigente.
function updatePubHeaderBadge() {
  const badge = document.getElementById('pubHdrTotal');
  if (!badge) return;
  const centro = activeFilter === 'TODOS' ? '' : ' · ' + (DATA.orgLabels[activeFilter] || activeFilter);
  badge.textContent = pubFilteredData().length + ' publicaciones registradas' + centro;
}

// Genera los botones de filtro por año (una sola vez tras cargar datos).
function populatePubAnioOptions() {
  const row = document.getElementById('pubAnioFilterRow');
  if (!row) return;
  const anios = [...new Set(PUBLICACIONES.map(r => r.anio).filter(a => a))].sort();
  let html = `<button class="filter-btn${pubFilter === 'TODOS' ? ' active' : ''}" data-anio="TODOS" onclick="setPubFilter('TODOS')">Todos</button>`;
  html += anios.map(a => `<button class="filter-btn${pubFilter === a ? ' active' : ''}" data-anio="${a}" onclick="setPubFilter(${a})">${a}</button>`).join('');
  row.innerHTML = html;
}

function renderPubKPIs() {
  const data = pubFilteredData();
  const total = data.length;
  const publicadas = data.filter(r => r.estado === 'Publicado').length;
  const enProceso = data.filter(r => PUB_ESTADOS_PROCESO.includes(r.estado)).length;
  const conIndicador = data.filter(r => PUB_INDICADORES_CALIDAD.includes(r.indicador)).length;
  const pctPublicadas = total > 0 ? (publicadas / total * 100) : 0;

  const el = document.getElementById('pubKpiGrid');
  if (!el) return;
  el.innerHTML = `
    <div class="kpi-card">
      <div class="kpi-accent" style="background:#1A56DB;"></div>
      <span class="kpi-icon">📚</span>
      <div class="kpi-label">Total de Publicaciones</div>
      <div class="kpi-value" style="color:#1A56DB;">${fmt(total)}</div>
      <div class="kpi-sub">${pubFilter === 'TODOS' ? 'Periodo 2020 – 2026' : 'Año ' + pubFilter}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-accent" style="background:#0D9488;"></div>
      <span class="kpi-icon">✅</span>
      <div class="kpi-label">Publicadas</div>
      <div class="kpi-value" style="color:#0D9488;">${fmt(publicadas)}</div>
      <div class="kpi-sub">${pctPublicadas.toFixed(1)}% del total</div>
      <div class="kpi-progress">
        <div class="kpi-bar-track">
          <div class="kpi-bar-fill" style="width:${pctPublicadas.toFixed(1)}%;background:#0D9488;"></div>
        </div>
      </div>
    </div>
    <div class="kpi-card">
      <div class="kpi-accent" style="background:#D97706;"></div>
      <span class="kpi-icon">⏳</span>
      <div class="kpi-label">En proceso / desarrollo</div>
      <div class="kpi-value" style="color:#D97706;">${fmt(enProceso)}</div>
      <div class="kpi-sub">Aún no publicadas</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-accent" style="background:#7C3AED;"></div>
      <span class="kpi-icon">🏅</span>
      <div class="kpi-label">Con indicador de calidad (Q1–Q4)</div>
      <div class="kpi-value" style="color:#7C3AED;">${fmt(conIndicador)}</div>
      <div class="kpi-sub">Artículos indexados por cuartil</div>
    </div>`;
}

function renderPubAnioChart() {
  const canvas = document.getElementById('chartPubAnio');
  if (!canvas) return;
  const anios = [...new Set(PUBLICACIONES.map(r => r.anio).filter(a => a))].sort();
  const data = pubFilteredData();
  const counts = anios.map(a => data.filter(r => r.anio === a).length);

  const pluginPubAnioLabels = {
    id: 'pubAnioLabels',
    afterDatasetsDraw(chart) {
      const ctx2 = chart.ctx;
      const meta = chart.getDatasetMeta(0);
      ctx2.save();
      ctx2.font = '600 11px IBM Plex Sans, system-ui, sans-serif';
      ctx2.fillStyle = '#1A56DB';
      ctx2.textAlign = 'center';
      ctx2.textBaseline = 'bottom';
      meta.data.forEach((bar, i) => {
        const val = counts[i];
        if (!val) return;
        ctx2.fillText(fmt(val), bar.x, bar.y - 4);
      });
      ctx2.restore();
    }
  };

  const ctx = canvas.getContext('2d');
  if (pubCharts.anio) pubCharts.anio.destroy();
  pubCharts.anio = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: anios,
      datasets: [{
        data: counts, backgroundColor: '#1A56DB', borderRadius: 4, maxBarThickness: 48
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      layout: { padding: { top: 20 } },
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
    },
    plugins: [pluginPubAnioLabels]
  });
}

function renderPubCategoriaChart() {
  const canvas = document.getElementById('chartPubCategoria');
  if (!canvas) return;
  const data = pubFilteredData();
  const counts = {};
  data.forEach(r => { counts[r.categoria] = (counts[r.categoria] || 0) + 1; });
  const labels = Object.keys(counts);
  const values = labels.map(l => counts[l]);
  const colors = labels.map(pubColorForCategoria);
  const total = values.reduce((a, b) => a + b, 0);

  const ctx = canvas.getContext('2d');
  if (pubCharts.categoria) pubCharts.categoria.destroy();
  pubCharts.categoria = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels.map((l, i) => `${l}  ${total > 0 ? (values[i] / total * 100).toFixed(1) : 0}%`),
      datasets: [{ data: values, backgroundColor: colors, borderWidth: 2, borderColor: '#fff', hoverOffset: 6 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '58%',
      plugins: {
        legend: { position: 'right', labels: { font: { size: 11 }, padding: 10, boxWidth: 12, usePointStyle: true } },
        tooltip: { callbacks: { label: c => `${fmt(c.raw)} publicaciones` } }
      }
    }
  });
}

function renderPubAreaHbar() {
  const el = document.getElementById('hbarPubArea');
  if (!el) return;
  const data = pubFilteredData();
  const counts = {};
  data.forEach(r => { counts[r.area] = (counts[r.area] || 0) + 1; });
  const max = Math.max(1, ...Object.values(counts));
  const items = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  el.innerHTML = items.map(([name, v]) => {
    const p = v / max * 100;
    return `
      <div class="hbar-row">
        <div class="hbar-info">
          <span class="hbar-name">${name}</span>
          <div class="hbar-stats">
            <span class="hbar-pct" style="color:#1A56DB;">${fmt(v)}</span>
          </div>
        </div>
        <div class="hbar-track">
          <div class="hbar-fill" style="width:${p.toFixed(1)}%;background:#1A56DB;"></div>
        </div>
      </div>`;
  }).join('');
}

function renderPubIndicadorHbar() {
  const el = document.getElementById('hbarPubIndicador');
  if (!el) return;
  const data = pubFilteredData();
  const orden = ['Q1', 'Q2', 'Q3', 'Q4', 'No tiene', 'N/D'];
  const counts = {};
  data.forEach(r => { counts[r.indicador] = (counts[r.indicador] || 0) + 1; });
  const max = Math.max(1, ...Object.values(counts));
  const colorFor = q => ({ Q1: '#0D9488', Q2: '#1A56DB', Q3: '#D97706', Q4: '#DC2626', 'No tiene': '#94A3B8', 'N/D': '#CBD5E1' }[q] || '#94A3B8');

  const items = orden.filter(k => counts[k]).map(k => [k, counts[k]]);

  el.innerHTML = items.map(([name, v]) => {
    const p = v / max * 100;
    const c = colorFor(name);
    return `
      <div class="hbar-row">
        <div class="hbar-info">
          <span class="hbar-name">${name}</span>
          <div class="hbar-stats">
            <span class="hbar-pct" style="color:${c};">${fmt(v)}</span>
          </div>
        </div>
        <div class="hbar-track">
          <div class="hbar-fill" style="width:${p.toFixed(1)}%;background:${c};"></div>
        </div>
      </div>`;
  }).join('');
}

function renderPubTable() {
  const tbody = document.querySelector('#pubDetalleTable tbody');
  if (!tbody) return;
  const data = pubFilteredData()
    .slice()
    .sort((a, b) => (b.anio || 0) - (a.anio || 0));

  document.getElementById('pubDetalleSub').textContent =
    (pubFilter === 'TODOS' ? 'Todos los años' : 'Año ' + pubFilter) + ' · ' + fmt(data.length) + ' registros';

  tbody.innerHTML = data.map(r => `
    <tr>
      <td style="font-weight:600;color:var(--c-text);">${r.anio || '—'}</td>
      <td>${r.categoria}</td>
      <td>${r.estado}</td>
      <td>${r.area}</td>
      <td style="max-width:320px;">${r.titulo}</td>
      <td>${r.autor}</td>
      <td>${r.enlace && r.enlace.startsWith('http') ? `<a href="${r.enlace}" target="_blank" rel="noopener">🔗 Ver</a>` : '—'}</td>
    </tr>
  `).join('');
}

// Punto de entrada de la sección: recalcula KPIs, gráficos y tabla.
function renderPublicaciones() {
  renderPubKPIs();
  renderPubAnioChart();
  renderPubCategoriaChart();
  renderPubAreaHbar();
  renderPubIndicadorHbar();
  renderPubTable();
}

function updatePublicaciones() {
  updatePubHeaderBadge();
  populatePubAnioOptions();
  renderPublicaciones();
}
