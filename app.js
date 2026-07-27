/* ==========================================
   Frotu · App de Notas de Renta — Lógica
   ========================================== */

const STORAGE_KEY = 'frotu_notas';

function $(sel) { return document.querySelector(sel); }

function formatMoney(n) {
  return '$' + Number(n).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function pad4(n) { return String(n).padStart(4, '0'); }

function generarId() { return 'n_' + Date.now().toString(36); }

function obtenerNotas() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}

function guardarNotas(notas) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notas));
}

function siguienteFolio() {
  const notas = obtenerNotas();
  if (notas.length === 0) return '0001';
  const max = Math.max(...notas.map(n => parseInt(n.folio, 10)));
  return pad4(max + 1);
}

function toast(msg, tipo = 'success') {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast'; t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.className = 'toast ' + tipo;
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ---------- Recolección de datos ----------
function recolectarDatos() {
  return {
    cliente: $('#cliente').value.trim(),
    producto: $('#producto').value.trim(),
    fechaEvento: $('#fechaEvento').value,
    horaEvento: $('#horaEvento').value,
    costoTotal: parseFloat($('#costoTotal').value) || 0,
    apartado: parseFloat($('#apartado').value) || 0,
    ubicacion: $('#ubicacion').value.trim(),
    medidas: $('#medidas').value.trim(),
    espacioRequerido: $('#espacioRequerido').value.trim(),
    telefonoContacto: $('#telefonoContacto').value.trim(),
    notasExtra: $('#notasExtra').value.trim(),
  };
}

function calcularSaldo(datos) {
  return Math.max(0, datos.costoTotal - datos.apartado);
}

function escaparHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---------- HTML de la nota (con estilos inline críticos) ----------
function renderNotaHTML(datos, folio) {
  const saldo = calcularSaldo(datos);
  const fechaStr = datos.fechaEvento
    ? new Date(datos.fechaEvento + 'T00:00:00').toLocaleDateString('es-MX', { weekday:'long', year:'numeric', month:'long', day:'numeric' })
    : '';

  return `
<div class="nota-papel" id="nota-pdf-content" style="font-family:'Segoe UI',system-ui,sans-serif; background:#fff; width:800px; border-radius:8px; overflow:hidden; border:1px solid #E0E0E0;">
  <div class="nota-header" style="background:linear-gradient(135deg,#7B2CBF 0%,#5A189A 100%); color:#fff; padding:28px 32px; display:flex; align-items:center; justify-content:space-between;">
    <div style="display:flex; align-items:center; gap:16px;">
      <div style="width:64px; height:64px; background:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:900; color:#7B2CBF; font-size:1.6rem; box-shadow:0 4px 12px rgba(0,0,0,0.2);">F</div>
      <div>
        <h1 style="font-size:1.6rem; font-weight:800; letter-spacing:-0.5px; margin:0;">Frotu alquiladora</h1>
        <p style="font-size:0.85rem; opacity:0.9; margin:0;">Renta de inflables y mobiliario para eventos</p>
      </div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:0.75rem; text-transform:uppercase; opacity:0.8; letter-spacing:1px;">Folio</div>
      <div style="font-size:2rem; font-weight:900; letter-spacing:2px;">${folio}</div>
    </div>
  </div>

  <div class="nota-body" style="padding:32px;">
    <div style="margin-bottom:24px;">
      <h3 style="font-size:0.8rem; text-transform:uppercase; letter-spacing:1px; color:#7B2CBF; margin-bottom:12px; padding-bottom:6px; border-bottom:2px solid #E0AAFF;">📋 Datos del evento</h3>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px 28px;">
        <div><span style="font-size:0.75rem; color:#666; text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:3px;">Cliente</span><span style="font-size:1rem; font-weight:600; color:#333;">${escaparHTML(datos.cliente)}</span></div>
        <div><span style="font-size:0.75rem; color:#666; text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:3px;">Producto</span><span style="font-size:1rem; font-weight:600; color:#333;">${escaparHTML(datos.producto)}</span></div>
        <div><span style="font-size:0.75rem; color:#666; text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:3px;">Fecha del evento</span><span style="font-size:1rem; font-weight:600; color:#333;">${fechaStr}</span></div>
        <div><span style="font-size:0.75rem; color:#666; text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:3px;">Hora del evento</span><span style="font-size:1rem; font-weight:600; color:#333;">${datos.horaEvento || '—'}</span></div>
        <div><span style="font-size:0.75rem; color:#666; text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:3px;">Teléfono de contacto</span><span style="font-size:1rem; font-weight:600; color:#333;">${escaparHTML(datos.telefonoContacto)}</span></div>
        <div><span style="font-size:0.75rem; color:#666; text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:3px;">Estado</span><span style="font-size:1rem; font-weight:600; color:#333;">Agendado</span></div>
      </div>
    </div>

    <div style="margin-bottom:24px;">
      <h3 style="font-size:0.8rem; text-transform:uppercase; letter-spacing:1px; color:#7B2CBF; margin-bottom:12px; padding-bottom:6px; border-bottom:2px solid #E0AAFF;">💰 Desglose de costos</h3>
      <table style="width:100%; border-collapse:collapse; margin-top:8px;">
        <thead>
          <tr style="background:#F5F5F5;">
            <th style="padding:12px 16px; text-align:left; font-size:0.75rem; text-transform:uppercase; color:#666; letter-spacing:0.5px; border-bottom:1px solid #EEE;">Concepto</th>
            <th style="padding:12px 16px; text-align:right; font-size:0.75rem; text-transform:uppercase; color:#666; letter-spacing:0.5px; border-bottom:1px solid #EEE;">Importe</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="padding:12px 16px; border-bottom:1px solid #EEE; font-size:1rem;">Costo total del servicio</td><td style="padding:12px 16px; text-align:right; font-weight:600; border-bottom:1px solid #EEE; font-size:1rem;">${formatMoney(datos.costoTotal)}</td></tr>
          <tr><td style="padding:12px 16px; border-bottom:1px solid #EEE; font-size:1rem;">Apartado / anticipo</td><td style="padding:12px 16px; text-align:right; font-weight:600; border-bottom:1px solid #EEE; font-size:1rem;">${formatMoney(datos.apartado)}</td></tr>
          <tr style="background:#FFE5E5;">
            <td style="padding:12px 16px; color:#9D0208; font-weight:700; font-size:1rem;">Saldo pendiente <span style="font-weight:400; font-size:0.8rem;">(por liquidar antes del evento)</span></td>
            <td style="padding:12px 16px; text-align:right; color:#9D0208; font-weight:700; font-size:1rem;">${formatMoney(saldo)}</td>
          </tr>
          <tr style="background:linear-gradient(90deg,#E0AAFF 0%,transparent 100%);">
            <td style="padding:12px 16px; font-weight:700; color:#5A189A; font-size:1rem;">Total del servicio</td>
            <td style="padding:12px 16px; text-align:right; font-weight:700; color:#5A189A; font-size:1rem;">${formatMoney(datos.costoTotal)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div style="margin-bottom:24px;">
      <h3 style="font-size:0.8rem; text-transform:uppercase; letter-spacing:1px; color:#7B2CBF; margin-bottom:12px; padding-bottom:6px; border-bottom:2px solid #E0AAFF;">📍 Ubicación y medidas</h3>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px 28px;">
        <div><span style="font-size:0.75rem; color:#666; text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:3px;">Dirección del evento</span><span style="font-size:1rem; font-weight:600; color:#333;">${escaparHTML(datos.ubicacion)}</span></div>
        <div><span style="font-size:0.75rem; color:#666; text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:3px;">Medidas del producto</span><span style="font-size:1rem; font-weight:600; color:#333;">${escaparHTML(datos.medidas)}</span></div>
        <div><span style="font-size:0.75rem; color:#666; text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:3px;">Espacio requerido</span><span style="font-size:1rem; font-weight:600; color:#333;">${escaparHTML(datos.espacioRequerido)}</span></div>
      </div>
    </div>

    <div style="margin-bottom:24px;">
      <h3 style="font-size:0.8rem; text-transform:uppercase; letter-spacing:1px; color:#7B2CBF; margin-bottom:12px; padding-bottom:6px; border-bottom:2px solid #E0AAFF;">📋 Reglas y recomendaciones</h3>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px 24px;">
        <div style="display:flex; align-items:center; gap:8px; font-size:0.9rem; color:#666;"><span style="width:20px; height:20px; border-radius:4px; display:flex; align-items:center; justify-content:center; font-size:0.75rem; font-weight:700; flex-shrink:0; background:#D8F3DC; color:#2D6A4F;">✓</span> Supervisión de adultos obligatoria</div>
        <div style="display:flex; align-items:center; gap:8px; font-size:0.9rem; color:#666;"><span style="width:20px; height:20px; border-radius:4px; display:flex; align-items:center; justify-content:center; font-size:0.75rem; font-weight:700; flex-shrink:0; background:#FFCCD5; color:#9D0208;">✗</span> No usar con calzado puntiagudo</div>
        <div style="display:flex; align-items:center; gap:8px; font-size:0.9rem; color:#666;"><span style="width:20px; height:20px; border-radius:4px; display:flex; align-items:center; justify-content:center; font-size:0.75rem; font-weight:700; flex-shrink:0; background:#D8F3DC; color:#2D6A4F;">✓</span> Superficie plana y libre de obstáculos</div>
        <div style="display:flex; align-items:center; gap:8px; font-size:0.9rem; color:#666;"><span style="width:20px; height:20px; border-radius:4px; display:flex; align-items:center; justify-content:center; font-size:0.75rem; font-weight:700; flex-shrink:0; background:#FFCCD5; color:#9D0208;">✗</span> No subir con alimentos ni bebidas</div>
        <div style="display:flex; align-items:center; gap:8px; font-size:0.9rem; color:#666;"><span style="width:20px; height:20px; border-radius:4px; display:flex; align-items:center; justify-content:center; font-size:0.75rem; font-weight:700; flex-shrink:0; background:#D8F3DC; color:#2D6A4F;">✓</span> Desconectar en caso de lluvia o viento</div>
        <div style="display:flex; align-items:center; gap:8px; font-size:0.9rem; color:#666;"><span style="width:20px; height:20px; border-radius:4px; display:flex; align-items:center; justify-content:center; font-size:0.75rem; font-weight:700; flex-shrink:0; background:#FFCCD5; color:#9D0208;">✗</span> No exceder la capacidad máxima</div>
        <div style="display:flex; align-items:center; gap:8px; font-size:0.9rem; color:#666;"><span style="width:20px; height:20px; border-radius:4px; display:flex; align-items:center; justify-content:center; font-size:0.75rem; font-weight:700; flex-shrink:0; background:#D8F3DC; color:#2D6A4F;">✓</span> Revisar anclajes antes del uso</div>
        <div style="display:flex; align-items:center; gap:8px; font-size:0.9rem; color:#666;"><span style="width:20px; height:20px; border-radius:4px; display:flex; align-items:center; justify-content:center; font-size:0.75rem; font-weight:700; flex-shrink:0; background:#FFCCD5; color:#9D0208;">✗</span> No usar objetos filosos cerca del inflable</div>
      </div>
    </div>

    <div style="margin-bottom:24px;">
      <h3 style="font-size:0.8rem; text-transform:uppercase; letter-spacing:1px; color:#7B2CBF; margin-bottom:12px; padding-bottom:6px; border-bottom:2px solid #E0AAFF;">⚠️ Responsabilidad</h3>
      <div style="background:#F5F5F5; padding:20px; border-radius:8px; font-size:0.88rem; color:#666; line-height:1.7;">
        <strong style="color:#333;">Responsabilidad:</strong> El cliente se hace responsable del uso adecuado del equipo rentado. <strong style="color:#333;">Frotu alquiladora</strong> no se hace responsable por daños personales o materiales derivados del mal uso, negligencia o incumplimiento de las reglas de seguridad aquí establecidas. El saldo pendiente debe liquidarse <strong style="color:#333;">antes del inicio del evento</strong>. En caso de cancelación, el apartado no es reembolsable si se cancela con menos de 48 horas de anticipación.
      </div>
    </div>

    ${datos.notasExtra ? `
    <div style="margin-bottom:24px;">
      <h3 style="font-size:0.8rem; text-transform:uppercase; letter-spacing:1px; color:#7B2CBF; margin-bottom:8px; padding-bottom:6px; border-bottom:2px solid #E0AAFF;">📝 Notas adicionales</h3>
      <p style="font-size:0.92rem; color:#666;">${escaparHTML(datos.notasExtra)}</p>
    </div>` : ''}
  </div>

  <div style="background:linear-gradient(90deg,#5A189A 0%,#7B2CBF 100%); color:#fff; padding:16px 32px; font-size:0.8rem; text-align:center; opacity:0.95;">
    Frotu alquiladora · Nezahualcóyotl, Estado de México · Tel: 55 0000 0000 · Instagram: @frotu_alquiladora
  </div>
</div>`;
}

// ---------- Acciones ----------
function validarBasico(d) {
  if (!d.cliente || !d.producto || !d.fechaEvento) {
    toast('Completa al menos cliente, producto y fecha del evento.', 'error');
    return false;
  }
  return true;
}

function mostrarVistaPrevia() {
  const datos = recolectarDatos();
  if (!validarBasico(datos)) return;
  const folio = siguienteFolio();
  const container = document.getElementById('nota-render');
  container.innerHTML = renderNotaHTML(datos, folio);
  container.style.display = 'block';
  container.scrollIntoView({ behavior: 'smooth' });
}

/* Genera PDF desde HTML en un contenedor temporal con ancho fijo,
   fuera de pantalla para evitar deformaciones por viewport responsive. */
function ejecutarPDF(html, filename) {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  temp.style.cssText = 'position:fixed; top:0; left:-9999px; width:800px; z-index:-1; visibility:visible; overflow:hidden;';
  document.body.appendChild(temp);

  // Forzar reflow para que html2canvas capture correctamente
  void temp.offsetHeight;

  const el = temp.querySelector('.nota-papel');
  const opt = {
    margin: 0,
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' },
    pagebreak: { mode: ['css', 'legacy'] }
  };

  return html2pdf().set(opt).from(el).save().then(() => {
    document.body.removeChild(temp);
    toast('PDF descargado correctamente');
  }).catch((err) => {
    console.error(err);
    document.body.removeChild(temp);
    toast('Error al generar PDF', 'error');
  });
}

function descargarPDF() {
  const datos = recolectarDatos();
  if (!validarBasico(datos)) return;
  const folio = siguienteFolio();
  const html = renderNotaHTML(datos, folio);
  const filename = `nota-renta-${folio}-${datos.cliente.replace(/\s+/g,'-')}.pdf`;
  ejecutarPDF(html, filename);
}

function guardarYAgendar() {
  const datos = recolectarDatos();
  if (!validarBasico(datos)) return;

  const notas = obtenerNotas();
  const folio = siguienteFolio();
  const nuevaNota = {
    id: generarId(),
    folio: folio,
    ...datos,
    saldoPendiente: calcularSaldo(datos),
    estado: 'agendado',
    creadaEl: new Date().toISOString()
  };

  notas.push(nuevaNota);
  guardarNotas(notas);

  toast(`Nota #${folio} agendada para el ${new Date(datos.fechaEvento + 'T00:00:00').toLocaleDateString('es-MX')}`);
  document.getElementById('form-nota').reset();
  document.getElementById('nota-render').style.display = 'none';
}

// ---------- Inicialización ----------
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-preview')?.addEventListener('click', mostrarVistaPrevia);
  document.getElementById('btn-pdf')?.addEventListener('click', descargarPDF);
  document.getElementById('btn-guardar')?.addEventListener('click', guardarYAgendar);

  const costo = document.getElementById('costoTotal');
  const apartado = document.getElementById('apartado');
  const saldoDisplay = document.getElementById('saldo-display');

  function actualizarSaldo() {
    const s = Math.max(0, (parseFloat(costo?.value)||0) - (parseFloat(apartado?.value)||0));
    if (saldoDisplay) saldoDisplay.textContent = 'Saldo pendiente: ' + formatMoney(s);
  }
  costo?.addEventListener('input', actualizarSaldo);
  apartado?.addEventListener('input', actualizarSaldo);
});
