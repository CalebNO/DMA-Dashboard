
function attemptLogin() {
  const val = document.getElementById('loginPasswordInput').value;
  if (val === ADMIN_PASSWORD) {
    login('admin');
  } else if (val === LECTOR_PASSWORD) {
    login('lector');
  } else {
    document.getElementById('loginError').style.display = 'block';
  }
}

function login(role) {
  currentRole = role;
  try { sessionStorage.setItem('dma_role', role); } catch (e) {}
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('appContainer').style.display = 'block';
  applyRolePermissions();
  showView('inicio');
  setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
}

// Restaura la sesión si el usuario ya había iniciado sesión antes de
// recargar la página (F5), para que solo se cierre sesión al pulsar "Salir".
function restoreSession() {
  let role = null;
  try { role = sessionStorage.getItem('dma_role'); } catch (e) {}
  if (role === 'admin' || role === 'lector') {
    login(role);
  }
}

// Cierra la sesión actual, limpia datos almacenados y regresa al Login inicial.
function logout() {
  currentRole = null;
  try { localStorage.clear(); } catch (e) {}
  try { sessionStorage.clear(); } catch (e) {}
  closeSideMenu();
  document.getElementById('appContainer').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  const pwInput = document.getElementById('loginPasswordInput');
  if (pwInput) pwInput.value = '';
  const err = document.getElementById('loginError');
  if (err) err.style.display = 'none';
  showView('inicio');
}

function applyRolePermissions() {
  document.querySelectorAll('.admin-only').forEach(el => {
    el.style.display = (currentRole === 'admin') ? '' : 'none';
  });
}

// ── Menú lateral (hamburguesa) ──
function toggleSideMenu() {
  const menu = document.getElementById('sideMenu');
  const overlay = document.getElementById('sideMenuOverlay');
  if (!menu || !overlay) return;
  const willOpen = !menu.classList.contains('open');
  menu.classList.toggle('open', willOpen);
  overlay.classList.toggle('open', willOpen);
}

function closeSideMenu() {
  const menu = document.getElementById('sideMenu');
  const overlay = document.getElementById('sideMenuOverlay');
  if (menu) menu.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
}

// ── Mide la altura real del encabezado principal (globalChrome) y la expone
//    como variable CSS (--sticky-top), sin depender de valores fijos en
//    píxeles. Se recalcula automáticamente ante cualquier cambio de tamaño
//    del propio encabezado (ResizeObserver) además de al redimensionar la
//    ventana, para cubrir casos como el ajuste de línea de badges/filtros. ──
function updateStickyTop() {
  const chrome = document.getElementById('globalChrome');
  if (!chrome) return;
  const visible = chrome.style.display !== 'none';
  const h = visible ? chrome.offsetHeight : 0;
  document.documentElement.style.setProperty('--sticky-top', h + 'px');
}

let _stickyTopObserver = null;
function watchStickyTopHeight() {
  const chrome = document.getElementById('globalChrome');
  if (!chrome || typeof ResizeObserver === 'undefined') return;
  if (_stickyTopObserver) _stickyTopObserver.disconnect();
  _stickyTopObserver = new ResizeObserver(() => updateStickyTop());
  _stickyTopObserver.observe(chrome);
}

function showView(view) {
  document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById('view-' + view);
  if (target) target.classList.add('active');

  const chrome = document.getElementById('globalChrome');
  if (chrome) chrome.style.display = (view === 'inicio') ? 'none' : '';

  // Estructura visual: [Título de página] → [Encabezado principal fijo] → [Contenido].
  // El encabezado es un único bloque compartido; se reubica (sin alterar su
  // contenido ni comportamiento) justo debajo del título de la página activa.
  if (chrome && target) {
    const pageTitle = target.querySelector('.section-header');
    if (pageTitle && pageTitle.nextElementSibling !== chrome) {
      pageTitle.insertAdjacentElement('afterend', chrome);
    }
  }

  updateStickyTop();
  watchStickyTopHeight();

  document.querySelectorAll('.app-nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.app-nav-btn').forEach(b => {
    if (b.getAttribute('onclick') === `showView('${view}')`) b.classList.add('active');
  });

  document.querySelectorAll('.side-menu-link').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-view') === view);
  });
  closeSideMenu();

  window.scrollTo(0, 0);
  updateStickyTop();
  setTimeout(() => { updateStickyTop(); window.dispatchEvent(new Event('resize')); }, 50);

  // La sección de Publicaciones no tiene registros para ENANDES / ENANDES+,
  // por lo que esas opciones del filtro global de centro de costo se ocultan
  // mientras esa vista está activa (se restauran al salir de ella).
  const enandesBtns = document.querySelectorAll('.filter-btn[data-org="ENANDES"], .filter-btn[data-org="ENANDES +"]');
  if (view === 'publicaciones') {
    enandesBtns.forEach(b => { b.style.display = 'none'; });
    if (typeof activeFilter !== 'undefined' && (activeFilter === 'ENANDES' || activeFilter === 'ENANDES +')) {
      setGlobalFilter('TODOS');
    }
  } else {
    enandesBtns.forEach(b => { b.style.display = ''; });
  }
}

window.addEventListener('resize', updateStickyTop);

function crearNuevaSeccion() {
  showToast('La creación de nuevas secciones estará disponible próximamente', 'warn');
}

// Anima el anillo de avance (y su % central) desde 0 hasta el valor real,
// en vez de aparecer ya "lleno" instantáneamente cuando se reconstruye el KPI grid.
function animatePoiRing(arcId, pctTextId, targetPct, circumference) {
  const arcEl = document.getElementById(arcId);
  const textEl = document.getElementById(pctTextId);
  if (!arcEl) return;
  const duration = 900;
  const t0 = performance.now();
  function step(now) {
    const t = Math.min((now - t0) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3); // ease-out cúbico
    const current = targetPct * eased;
    const dashLen = current / 100 * circumference;
    arcEl.setAttribute('stroke-dasharray', dashLen.toFixed(1) + ' ' + (circumference - dashLen).toFixed(1));
    if (textEl) textEl.textContent = current.toFixed(1) + '%';
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ═══════════════════════════════════════════════════════════
// ANIMACIÓN DE RECARGA DE LAS BARRAS DENTRO DE LOS KPIs
// ═══════════════════════════════════════════════════════════
// Las barras se generan en 0% (ver plantillas de renderKPIs / renderPresKPIs)
// y esta función las hace crecer hasta su valor real cada vez que se
// vuelve a renderizar el bloque (p. ej. al cambiar cualquier filtro),
// dando la sensación de "recarga" en cada actualización.
function animateKpiBars(container) {
  if (!container) return;
  const bars = container.querySelectorAll('[data-target-width]');
  if (!bars.length) return;
  // Fuerza reflow para que el navegador registre el 0% inicial
  // antes de animar hacia el valor final.
  void container.offsetWidth;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      bars.forEach(b => { b.style.width = b.dataset.targetWidth + '%'; });
    });
  });
}


// ═══════════════════════════════════════════════════════════
// EXCEL UPLOAD — parsea .xlsx/.xls y reconstruye DATA + PRES
// ═══════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════
// TOAST HELPER
// ═══════════════════════════════════════════════════════════
let _toastTimer = null;
function showToast(msg, type = 'ok', duration = 4000) {
  const t = document.getElementById('xlsxToast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'show toast-' + type;
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => { t.className = ''; }, duration);
}
