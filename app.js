/* ==========================================
   Frotu · App de Notas de Renta — Lógica
   ========================================== */

const STORAGE_KEY = 'frotu_notas';

// ---------- Utilidades ----------
function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }

function formatMoney(n) {
  return '$' + Number(n).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function pad4(n) { return String(n).padStart(4, '0'); }

function generarId() { return 'n_' + Date.now().toString(36); }

function obtenerNotas() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch { return []; }
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

// ---------- Recolección de datos del formulario ----------
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

// ---------- Render de la nota en HTML ----------
function renderNotaHTML(datos, folio) {
  const saldo = calcularSaldo(datos);
  const fechaStr = datos.fechaEvento
    ? new Date(datos.fechaEvento + 'T00:00:00').toLocaleDateString('es-MX', { weekday:'long', year:'numeric', month:'long', day:'numeric' })
    : '';

  return `
<div class="nota-papel" id="nota-pdf-content">
  <div class="nota-header">
    <div class="nota-header-left">
      <div class="nota-logo">F</div>
      <div class="nota-header-text">
        <h1>Frotu alquiladora</h1>
        <p>Renta de inflables y mobiliario para eventos</p>
      </div>
    </div>
    <div class="nota-folio">
      <div class="label">Folio</div>
      <div class="numero">${folio}</div>
    </div>
  </div>

  <div class="nota-body">
    <div class="nota-seccion">
      <h3>📋 Datos del evento</h3>
      <div class="nota-datos-grid">
        <div class="nota-dato">
          <span class="etiqueta">Cliente</span>
          <span class="valor">${escaparHTML(datos.cliente)}</span>
        </div>
        <div class="nota-dato">
          <span class="etiqueta">Producto</span>
          <span class="valor">${escaparHTML(datos.producto)}</span>
        </div>
        <div class="nota-dato">
          <span class="etiqueta">Fecha del evento</span>
          <span class="valor">${fechaStr}</span>
        </div>
        <div class="nota-dato">
          <span class="etiqueta">Hora del evento</span>
          <span class="valor">${datos.horaEvento || '—'}</span>
        </div>
        <div class="nota-dato">
          <span class="etiqueta">Teléfono de contacto</span>
          <span class="valor">${escaparHTML(datos.telefonoContacto)}</span>
        </div>
        <div class="nota-dato">
          <span class="etiqueta">Estado</span>
          <span class="valor">Agendado</span>
        </div>
      </div>
    </div>

    <div class="nota-seccion">
      <h3>💰 Desglose de costos</h3>
      <table class="tabla-costos">
        <thead>
          <tr><th>Concepto</th><th class="numero">Importe</th></tr>
        </thead>
        <tbody>
          <tr><td>Costo total del servicio</td><td class="numero">${formatMoney(datos.costoTotal)}</td></tr>
          <tr><td>Apartado / anticipo</td><td class="numero">${formatMoney(datos.apartado)}</td></tr>
          <tr class="destacado">
            <td>Saldo pendiente <span style="font-weight:400;font-size:0.8rem;">(por liquidar antes del evento)</span></td>
            <td class="numero">${formatMoney(saldo)}</td>
          </tr>
          <tr class="total-row">
            <td>Total del servicio</td>
            <td class="numero">${formatMoney(datos.costoTotal)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="nota-seccion">
      <h3>📍 Ubicación y medidas</h3>
      <div class="nota-datos-grid">
        <div class="nota-dato">
          <span class="etiqueta">Dirección del evento</span>
          <span class="valor">${escaparHTML(datos.ubicacion)}</span>
        </div>
        <div class="nota-dato">
          <span class="etiqueta">Medidas del producto</span>
          <span class="valor">${escaparHTML(datos.medidas)}</span>
        </div>
        <div class="nota-dato">
          <span class="etiqueta">Espacio requerido</span>
          <span class="valor">${escaparHTML(datos.espacioRequerido)}</span>
        </div>
      </div>
    </div>

    <div class="nota-seccion">
      <h3>📋 Reglas y recomendaciones</h3>
      <div class="reglas-grid">
        <div class="regla-item"><span class="check ok">✓</span> Supervisión de adultos obligatoria</div>
        <div class="regla-item"><span class="check no">✗</span> No usar con calzado puntiagudo</div>
        <div class="regla-item"><span class="check ok">✓</span> Superficie plana y libre de obstáculos</div>
        <div class="regla-item"><span class="check no">✗</span> No subir con alimentos ni bebidas</div>
        <div class="regla-item"><span class="check ok">✓</span> Desconectar en caso de lluvia o viento</div>
        <div class="regla-item"><span class="check no">✗</span> No exceder la capacidad máxima</div>
        <div class="regla-item"><span class="check ok">✓</span> Revisar anclajes antes del uso</div>
        <div class="regla-item"><span class="check no">✗</span> No usar objetos filosos cerca del inflable</div>
      </div>
    </div>

    <div class="nota-seccion">
      <h3>⚠️ Responsabilidad</h3>
      <div class="responsabilidad">
        <p>El cliente se hace responsable del uso adecuado del equipo rentado. <strong>Frotu alquiladora</strong> no se hace responsable por daños personales o materiales derivados del mal uso, negligencia o incumplimiento de las reglas de seguridad aquí establecidas. El saldo pendiente debe liquidarse <strong>antes del inicio del evento</strong>. En caso de cancelación, el apartado no es reembolsable si se cancela con menos de 48 horas de anticipación.</p>
      </div>
    </div>

    ${datos.notasExtra ? `
    <div class="nota-seccion">
      <h3>📝 Notas adicionales</h3>
      <p style="font-size:0.92rem;color:var(--gris-medio);">${escaparHTML(datos.notasExtra)}</p>
    </div>` : ''}
  </div>

  <div class="nota-footer">
    Frotu alquiladora · Nezahualcóyotl, Estado de México · Tel: 55 0000 0000 · Instagram: @frotu_alquiladora
  </div>
</div>`;
}

function escaparHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Acciones ----------
function mostrarVistaPrevia() {
  const datos = recolectarDatos();
  if (!validarBasico(datos)) return;
  const folio = siguienteFolio();
  const container = document.getElementById('nota-render');
  container.innerHTML = renderNotaHTML(datos, folio);
  container.style.display = 'block';
  container.scrollIntoView({ behavior: 'smooth' });
}

function validarBasico(d) {
  if (!d.cliente || !d.producto || !d.fechaEvento) {
    toast('Completa al menos cliente, producto y fecha del evento.', 'error');
    return false;
  }
  return true;
}

function descargarPDF() {
  const datos = recolectarDatos();
  if (!validarBasico(datos)) return;
  const folio = siguienteFolio();
  const container = document.getElementById('nota-render');
  container.innerHTML = renderNotaHTML(datos, folio);
  container.style.display = 'block';

  const el = container.querySelector('.nota-papel');
  const opt = {
    margin: 0,
    filename: `nota-renta-${folio}-${datos.cliente.replace(/\s+/g,'-')}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(el).save().then(() => {
    toast('PDF descargado correctamente');
  }).catch(() => {
    toast('Error al generar PDF', 'error');
  });
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

  // Limpiar formulario
  document.getElementById('form-nota').reset();
  document.getElementById('nota-render').style.display = 'none';
}

// ---------- Inicialización ----------
document.addEventListener('DOMContentLoaded', () => {
  const btnPreview = document.getElementById('btn-preview');
  const btnPdf = document.getElementById('btn-pdf');
  const btnGuardar = document.getElementById('btn-guardar');

  if (btnPreview) btnPreview.addEventListener('click', mostrarVistaPrevia);
  if (btnPdf) btnPdf.addEventListener('click', descargarPDF);
  if (btnGuardar) btnGuardar.addEventListener('click', guardarYAgendar);

  // Calcular saldo en tiempo real
  const costo = document.getElementById('costoTotal');
  const apartado = document.getElementById('apartado');
  const saldoDisplay = document.getElementById('saldo-display');

  function actualizarSaldo() {
    const s = Math.max(0, (parseFloat(costo?.value)||0) - (parseFloat(apartado?.value)||0));
    if (saldoDisplay) saldoDisplay.textContent = 'Saldo pendiente: ' + formatMoney(s);
  }
  if (costo) costo.addEventListener('input', actualizarSaldo);
  if (apartado) apartado.addEventListener('input', actualizarSaldo);
});
