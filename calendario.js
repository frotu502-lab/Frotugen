/* ==========================================
   Frotu · Calendario de Notas de Renta
   ========================================== */

const STORAGE_KEY = 'frotu_notas';

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let notasCache = [];

function $(sel) { return document.querySelector(sel); }

obtenerNotas().then(n => console.log(n))

function formatMoney(n) {
  return '$' + Number(n).toLocaleString('es-MX');
}

function toast(msg, tipo = 'success') {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast'; t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg; t.className = 'toast ' + tipo;
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ---------- Calendario ----------
const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const diasSemana = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

async function renderCalendario() {
  notasCache = await obtenerNotas();
  $('#cal-titulo').textContent = `${meses[currentMonth]} ${currentYear}`;

  const grid = $('#cal-grid');
  grid.innerHTML = '';

  diasSemana.forEach(d => {
    const el = document.createElement('div');
    el.className = 'cal-day-label';
    el.textContent = d;
    grid.appendChild(el);
  });

  const primerDia = new Date(currentYear, currentMonth, 1).getDay();
  const diasEnMes = new Date(currentYear, currentMonth + 1, 0).getDate();
  const hoy = new Date();
  const esHoy = (d) => d === hoy.getDate() && currentMonth === hoy.getMonth() && currentYear === hoy.getFullYear();

  for (let i = 0; i < primerDia; i++) {
    const el = document.createElement('div');
    el.className = 'cal-day empty';
    grid.appendChild(el);
  }

  for (let d = 1; d <= diasEnMes; d++) {
    const celda = document.createElement('div');
    celda.className = 'cal-day' + (esHoy(d) ? ' today' : '');

    const num = document.createElement('div');
    num.className = 'cal-day-number';
    num.textContent = d;
    celda.appendChild(num);

    const fechaStr = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const eventos = notasCache.filter(n => n.fechaEvento === fechaStr);

    eventos.forEach(ev => {
      const badge = document.createElement('div');
      badge.className = 'cal-evento ' + ev.estado;
      badge.textContent = (ev.horaEvento ? ev.horaEvento + ' ' : '') + ev.cliente.split(' ')[0];
      badge.title = `${ev.cliente} — ${ev.producto}`;
      badge.addEventListener('click', (e) => { e.stopPropagation(); abrirModal(ev.id); });
      celda.appendChild(badge);
    });

    grid.appendChild(celda);
  }
}

function cambiarMes(delta) {
  currentMonth += delta;
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  renderCalendario();
}

function irAHoy() {
  const hoy = new Date();
  currentYear = hoy.getFullYear();
  currentMonth = hoy.getMonth();
  renderCalendario();
}

// ---------- Modal ----------
let notaActivaId = null;

async function abrirModal(id) {
  notaActivaId = id;
  const notas = await obtenerNotas();
  const n = notas.find(x => x.id === id);
  if (!n) return;

  const body = $('#modal-body');
  body.innerHTML = `
    <div class="dato-row"><span class="label">Folio</span><span class="value">#${n.folio}</span></div>
    <div class="dato-row"><span class="label">Cliente</span><span class="value">${n.cliente}</span></div>
    <div class="dato-row"><span class="label">Producto</span><span class="value">${n.producto}</span></div>
    <div class="dato-row"><span class="label">Fecha</span><span class="value">${new Date(n.fechaEvento+'T00:00:00').toLocaleDateString('es-MX',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</span></div>
    <div class="dato-row"><span class="label">Hora</span><span class="value">${n.horaEvento || '—'}</span></div>
    <div class="dato-row"><span class="label">Costo total</span><span class="value">${formatMoney(n.costoTotal)}</span></div>
    <div class="dato-row"><span class="label">Apartado</span><span class="value">${formatMoney(n.apartado)}</span></div>
    <div class="dato-row"><span class="label">Saldo pendiente</span><span class="value" style="color:var(--rojo);">${formatMoney(n.saldoPendiente)}</span></div>
    <div class="dato-row"><span class="label">Teléfono</span><span class="value">${n.telefonoContacto || '—'}</span></div>
    <div class="dato-row"><span class="label">Ubicación</span><span class="value">${n.ubicacion || '—'}</span></div>
<div class="dato-row"><span class="label">Notas adicionales</span><span class="value">${n.notasExtra || '—'}</span></div>
<div class="dato-row"><span class="label">Estado</span><span class="value" style="text-transform:capitalize;">${n.estado}</span></div>

    <div class="mt-2" style="border-top:1px solid #EEE; padding-top:16px;">
      <h4 style="font-size:0.85rem; color:var(--morado); margin-bottom:10px;">✏️ Reagendar</h4>
      <div class="form-grid" style="grid-template-columns:1fr 1fr; gap:10px;">
        <div class="form-group" style="margin:0;">
          <label style="font-size:0.75rem;">Nueva fecha</label>
          <input type="date" id="modal-nueva-fecha" value="${n.fechaEvento}">
        </div>
        <div class="form-group" style="margin:0;">
          <label style="font-size:0.75rem;">Nueva hora</label>
          <input type="time" id="modal-nueva-hora" value="${n.horaEvento || ''}">
        </div>
      </div>
      <button class="btn btn-ghost mt-1" id="btn-reagendar" style="width:100%; justify-content:center;">📅 Guardar nueva fecha</button>
    </div>
  `;

  const btnCompletar = $('#btn-completar');
  const btnCancelar = $('#btn-cancelar');
  const btnRestaurar = $('#btn-restaurar');

  if (n.estado === 'completado') {
    btnCompletar.classList.add('hidden');
    btnCancelar.classList.remove('hidden');
    btnRestaurar.classList.remove('hidden');
  } else if (n.estado === 'cancelado') {
    btnCompletar.classList.remove('hidden');
    btnCancelar.classList.add('hidden');
    btnRestaurar.classList.remove('hidden');
  } else {
    btnCompletar.classList.remove('hidden');
    btnCancelar.classList.remove('hidden');
    btnRestaurar.classList.add('hidden');
  }

  $('#modal-overlay').classList.add('active');

  $('#btn-reagendar').onclick = async () => {
  const nf = $('#modal-nueva-fecha').value;
  const nh = $('#modal-nueva-hora').value;
  if (!nf) { toast('Selecciona una fecha válida', 'error'); return; }
  await actualizarNotaDB(notaActivaId, { fechaEvento: nf, horaEvento: nh });
  await renderCalendario();
  cerrarModal();
  toast('Evento reagendado correctamente');
};
}

function cerrarModal() {
  $('#modal-overlay').classList.remove('active');
  notaActivaId = null;
}

async function cambiarEstado(nuevoEstado) {
  if (!notaActivaId) return;
  await actualizarNotaDB(notaActivaId, { estado: nuevoEstado });
  await renderCalendario();
  cerrarModal();
  toast(`Nota marcada como ${nuevoEstado}`);
}

async function eliminarNota() {
  if (!notaActivaId) return;
  if (!confirm('¿Eliminar esta nota permanentemente?')) return;
  await eliminarNotaDB(notaActivaId);
  await renderCalendario();
  cerrarModal();
  toast('Nota eliminada');
}

/* Genera PDF desde HTML en contenedor temporal fijo fuera de pantalla */
async function ejecutarPDF(html, filename) {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  temp.style.cssText = 'position:fixed; top:0; left:-9999px; width:800px; z-index:-1; visibility:visible; overflow:hidden;';
  document.body.appendChild(temp);

  // Forzar reflow para que html2canvas capture correctamente
  void temp.offsetHeight;

  const el = temp.querySelector('.nota-papel');

  try {
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      logging: false,
      windowWidth: 800,
      windowHeight: el.scrollHeight
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    // jsPDF viene incluido dentro de html2pdf.bundle.min.js
    const JsPDFCtor = window.jspdf.jsPDF;
    const pdf = new JsPDFCtor({
      unit: 'px',
      format: [canvas.width / 2, canvas.height / 2], // px reales (scale:2 -> /2)
      hotfixes: ['px_scaling']
    });

    pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width / 2, canvas.height / 2);
    pdf.save(filename);

    document.body.removeChild(temp);
    toast('PDF descargado correctamente');
  } catch (err) {
    console.error(err);
    document.body.removeChild(temp);
    toast('Error al generar PDF', 'error');
  }
}

const REGLAS_INFLABLES = [
  { ok: true,  texto: 'Supervisión de adultos obligatoria' },
  { ok: false, texto: 'No usar con calzado puntiagudo' },
  { ok: true,  texto: 'Superficie plana y libre de obstáculos' },
  { ok: false, texto: 'No subir con alimentos ni bebidas' },
  { ok: true,  texto: 'Desconectar en caso de lluvia o viento' },
  { ok: false, texto: 'No exceder la capacidad máxima' },
  { ok: true,  texto: 'Revisar anclajes antes del uso' },
  { ok: false, texto: 'No usar objetos filosos cerca del inflable' },
];

const REGLAS_MOBILIARIO = [
  { ok: true,  texto: 'Revisar el mobiliario al recibirlo y reportar daños' },
  { ok: false, texto: 'No exceder el peso máximo por silla o mesa' },
  { ok: true,  texto: 'Colocar en superficie plana y nivelada' },
  { ok: false, texto: 'No arrastrar el mobiliario, levantarlo al moverlo' },
  { ok: true,  texto: 'Proteger de la lluvia y la humedad' },
  { ok: false, texto: 'No usar cerca de fuego o fuentes de calor' },
  { ok: true,  texto: 'Devolver limpio y en las mismas condiciones' },
  { ok: false, texto: 'No pintar, perforar ni modificar las piezas' },
];

function renderReglasHTML(tipoProducto) {
  const reglas = tipoProducto === 'mobiliario' ? REGLAS_MOBILIARIO : REGLAS_INFLABLES;
  return reglas.map(r => `<div>${r.ok ? '✓' : '✗'} ${r.texto}</div>`).join('');
}

async function descargarPDFDesdeModal() {
  if (!notaActivaId) return;
  const notas = await obtenerNotas();
  const n = notas.find(x => x.id === notaActivaId);
  if (!n) return;

  const saldo = n.saldoPendiente;
  const fechaStr = n.fechaEvento
    ? new Date(n.fechaEvento + 'T00:00:00').toLocaleDateString('es-MX', { weekday:'long', year:'numeric', month:'long', day:'numeric' })
    : '';

  const html = `
<div class="nota-papel" style="font-family:'Segoe UI',system-ui,sans-serif; background:#fff; border-radius:0px; overflow:hidden; border:1px solid #E0E0E0;">
  <div style="background:linear-gradient(135deg,#7B2CBF 0%,#5A189A 100%); color:#fff; padding:28px 32px; display:flex; align-items:center; justify-content:space-between;">
    <div style="display:flex; align-items:center; gap:16px;">
      <div style="width:64px; height:64px; background:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.2);"><img src="logo.png" alt="Frotu" style="width:100%; height:100%; object-fit:cover;"></div>
      <div><h1 style="font-size:1.6rem; font-weight:800; margin:0;">Frotu alquiladora</h1><p style="margin:0; opacity:0.9; font-size:0.85rem;">Renta de inflables y mobiliario para eventos</p></div>
    </div>
    <div style="text-align:right;"><div style="font-size:0.75rem; text-transform:uppercase; opacity:0.8;">Folio</div><div style="font-size:1.3rem; font-weight:900;">${n.folio}</div></div>
  </div>
  <div style="padding:32px;">
    <div style="margin-bottom:24px;">
      <h3 style="font-size:0.8rem; text-transform:uppercase; letter-spacing:1px; color:#7B2CBF; margin-bottom:12px; padding-bottom:6px; border-bottom:2px solid #E0AAFF;">📋 Datos del evento</h3>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px 28px;">
        <div><span style="font-size:0.75rem; color:#666; text-transform:uppercase; display:block; margin-bottom:3px;">Cliente</span><div style="font-weight:600;">${n.cliente}</div></div>
        <div><span style="font-size:0.75rem; color:#666; text-transform:uppercase; display:block; margin-bottom:3px;">Producto</span><div style="font-weight:600;">${n.producto}</div></div>
        <div><span style="font-size:0.75rem; color:#666; text-transform:uppercase; display:block; margin-bottom:3px;">Fecha</span><div style="font-weight:600;">${fechaStr}</div></div>
        <div><span style="font-size:0.75rem; color:#666; text-transform:uppercase; display:block; margin-bottom:3px;">Hora</span><div style="font-weight:600;">${n.horaEvento||'—'}</div></div>
        <div><span style="font-size:0.75rem; color:#666; text-transform:uppercase; display:block; margin-bottom:3px;">Teléfono</span><div style="font-weight:600;">${n.telefonoContacto||'—'}</div></div>
        <div><span style="font-size:0.75rem; color:#666; text-transform:uppercase; display:block; margin-bottom:3px;">Estado</span><div style="font-weight:600; text-transform:capitalize;">${n.estado}</div></div>
      </div>
    </div>
    <div style="margin-bottom:24px;">
      <h3 style="font-size:0.8rem; text-transform:uppercase; letter-spacing:1px; color:#7B2CBF; margin-bottom:12px; padding-bottom:6px; border-bottom:2px solid #E0AAFF;">💰 Desglose de costos</h3>
      <table style="width:100%; border-collapse:collapse;">
        <tr style="background:#F5F5F5;"><th style="padding:12px 16px; text-align:left; font-size:0.75rem; text-transform:uppercase; color:#666;">Concepto</th><th style="padding:12px 16px; text-align:right; font-size:0.75rem; text-transform:uppercase; color:#666;">Importe</th></tr>
        <tr><td style="padding:12px 16px; border-bottom:1px solid #eee;">Costo total</td><td style="padding:12px 16px; text-align:right; font-weight:600; border-bottom:1px solid #eee;">${formatMoney(n.costoTotal)}</td></tr>
        <tr><td style="padding:12px 16px; border-bottom:1px solid #eee;">Apartado</td><td style="padding:12px 16px; text-align:right; font-weight:600; border-bottom:1px solid #eee;">${formatMoney(n.apartado)}</td></tr>
        <tr style="background:#FFE5E5;"><td style="padding:12px 16px; color:#9D0208; font-weight:700;">Saldo pendiente</td><td style="padding:12px 16px; text-align:right; color:#9D0208; font-weight:700;">${formatMoney(saldo)}</td></tr>
        <tr style="background:linear-gradient(90deg,#E0AAFF 0%,transparent 100%);"><td style="padding:12px 16px; font-weight:700; color:#5A189A;">Total</td><td style="padding:12px 16px; text-align:right; font-weight:700; color:#5A189A;">${formatMoney(n.costoTotal)}</td></tr>
      </table>
    </div>
    <div style="margin-bottom:24px;">
      <h3 style="font-size:0.8rem; text-transform:uppercase; letter-spacing:1px; color:#7B2CBF; margin-bottom:12px; padding-bottom:6px; border-bottom:2px solid #E0AAFF;">📍 Ubicación y medidas</h3>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px 28px;">
        <div><span style="font-size:0.75rem; color:#666; text-transform:uppercase; display:block; margin-bottom:3px;">Dirección</span><div style="font-weight:600;">${n.ubicacion||'—'}</div></div>
        <div><span style="font-size:0.75rem; color:#666; text-transform:uppercase; display:block; margin-bottom:3px;">Medidas</span><div style="font-weight:600;">${n.medidas||'—'}</div></div>
        <div><span style="font-size:0.75rem; color:#666; text-transform:uppercase; display:block; margin-bottom:3px;">Espacio requerido</span><div style="font-weight:600;">${n.espacioRequerido||'—'}</div></div>
      </div>
    </div>
    <div style="margin-bottom:24px;">
      <h3 style="font-size:0.8rem; text-transform:uppercase; letter-spacing:1px; color:#7B2CBF; margin-bottom:12px; padding-bottom:6px; border-bottom:2px solid #E0AAFF;">📋 Reglas y recomendaciones</h3>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px 24px; font-size:0.9rem; color:#666;">
  ${renderReglasHTML(n.tipoProducto)}
</div>
    </div>
    <div style="background:#F5F5F5; padding:20px; border-radius:8px; font-size:0.88rem; color:#666; line-height:1.7;">
      <strong>Responsabilidad:</strong> El cliente se hace responsable del uso adecuado del equipo rentado. <strong>Frotu alquiladora</strong> no se hace responsable por daños personales o materiales derivados del mal uso, negligencia o incumplimiento de las reglas de seguridad. El saldo pendiente debe liquidarse <strong>antes del inicio del evento</strong>. En caso de cancelación, el apartado no es reembolsable si se cancela con menos de 48 horas de anticipación.
    </div>
    ${n.notasExtra ? `<div style="margin-top:20px;"><h3 style="font-size:0.8rem; text-transform:uppercase; letter-spacing:1px; color:#7B2CBF; margin-bottom:8px;">📝 Notas adicionales</h3><p style="font-size:0.92rem; color:#666;">${n.notasExtra}</p></div>` : ''}
  </div>
  <div style="background:linear-gradient(90deg,#5A189A 0%,#7B2CBF 100%); color:#fff; padding:16px 32px; font-size:0.8rem; text-align:center; opacity:0.95;">
    Frotu alquiladora · Nezahualcóyotl, Estado de México · Tel: 55 6035 3741 · Facebook: @frotualquiladora
  </div>
</div>`;

  const filename = `nota-renta-${n.folio}-${n.cliente.replace(/\s+/g,'-')}.pdf`;
  ejecutarPDF(html, filename);
}

// ---------- Inicialización ----------
document.addEventListener('DOMContentLoaded', () => {
  renderCalendario();

  $('#btn-prev').addEventListener('click', () => cambiarMes(-1));
  $('#btn-next').addEventListener('click', () => cambiarMes(1));
  $('#btn-hoy').addEventListener('click', irAHoy);

  $('#modal-close').addEventListener('click', cerrarModal);
  $('#modal-overlay').addEventListener('click', (e) => { if (e.target === $('#modal-overlay')) cerrarModal(); });

  $('#btn-completar').addEventListener('click', () => cambiarEstado('completado'));
  $('#btn-cancelar').addEventListener('click', () => cambiarEstado('cancelado'));
  $('#btn-restaurar').addEventListener('click', () => cambiarEstado('agendado'));
  $('#btn-eliminar').addEventListener('click', eliminarNota);
  $('#btn-pdf-modal').addEventListener('click', descargarPDFDesdeModal);

  $('#buscador').addEventListener('input', async (e) => {
  const q = e.target.value.trim().toLowerCase();
  if (!q) { renderCalendario(); return; }
  const todas = await obtenerNotas();
  notasCache = todas.filter(n => n.cliente.toLowerCase().includes(q));
    $('#cal-titulo').textContent = `Resultados de "${q}"`;
    const grid = $('#cal-grid');
    grid.innerHTML = '';
    diasSemana.forEach(d => {
      const el = document.createElement('div');
      el.className = 'cal-day-label'; el.textContent = d;
      grid.appendChild(el);
    });
    const primerDia = new Date(currentYear, currentMonth, 1).getDay();
    const diasEnMes = new Date(currentYear, currentMonth + 1, 0).getDate();
    for (let i = 0; i < primerDia; i++) {
      const el = document.createElement('div'); el.className = 'cal-day empty'; grid.appendChild(el);
    }
    const hoy = new Date();
    for (let d = 1; d <= diasEnMes; d++) {
      const celda = document.createElement('div');
      celda.className = 'cal-day' + (d===hoy.getDate()&&currentMonth===hoy.getMonth()&&currentYear===hoy.getFullYear()?' today':'');
      const num = document.createElement('div'); num.className='cal-day-number'; num.textContent=d; celda.appendChild(num);
      const fechaStr = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const eventos = notasCache.filter(n => n.fechaEvento === fechaStr);
      eventos.forEach(ev => {
        const badge = document.createElement('div');
        badge.className = 'cal-evento ' + ev.estado;
        badge.textContent = (ev.horaEvento ? ev.horaEvento + ' ' : '') + ev.cliente.split(' ')[0];
        badge.title = `${ev.cliente} — ${ev.producto}`;
        badge.addEventListener('click', (e) => { e.stopPropagation(); abrirModal(ev.id); });
        celda.appendChild(badge);
      });
      grid.appendChild(celda);
    }
  });
});
