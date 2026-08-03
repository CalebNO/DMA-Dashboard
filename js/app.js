
// ═══════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
  // Si el usuario ya había iniciado sesión antes de recargar (F5), lo
  // mantiene dentro en vez de mostrarle otra vez la pantalla de Login.
  restoreSession();

  // Intenta reemplazar los datos embebidos con los archivos vigentes en
  // /data/ (presupuesto.xlsx, actividades.xlsx y publicaciones.xlsx). Si
  // no existen o falla la lectura, se conservan los datos ya incluidos
  // en config.js.
  await autoLoadExcelData();

  updateAll();
  updatePres();
  updatePresHeaderBadge();
  populatePresFuenteOptions();
  updatePublicaciones();
  setTimeout(() => {
    document.querySelectorAll('.kpi-bar-fill').forEach(el => {
      el.style.transition = 'width 1s ease';
    });
  }, 100);
});
