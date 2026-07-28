#Frotu · App de Notas de Renta

Aplicación web para generar notas de renta (inflables y mobiliario), agendarlas en un calendario y descargarlas como PDF. Los datos se almacenan en Firebase Firestore, por lo que se sincronizan entre dispositivos.

Estructura del proyecto
├── index.html            # Página principal: formulario para crear notas
├── calendario.html        # Página del calendario y gestión de eventos
├── style.css               # Estilos de toda la app
├── app.js                  # Lógica de la página principal (formulario, vista previa, PDF)
├── calendario.js           # Lógica del calendario (render, modal, reagendar, estados, PDF)
├── firebase-config.js       # Configuración e inicialización de Firebase
├── storage.js               # Funciones de acceso a Firestore (CRUD de notas)
└── logo.png                 # Logo de la marca (usado en header y notas/PDF)
Requisitos
Un proyecto de Firebase con Firestore Database creado (modo producción).
Reglas de Firestore que permitan lectura/escritura en la colección notas:
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /notas/{notaId} {
      allow read, write: if true;
    }
  }
}

⚠️ Estas reglas dejan la base de datos abierta a cualquiera que tenga el projectId. Si más adelante quieres restringir el acceso, se puede agregar autenticación (Firebase Auth) y ajustar las reglas.

Los siguientes scripts deben cargarse en este orden en index.html y calendario.html, antes de app.js / calendario.js:
html
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js"></script>
<script src="firebase-config.js"></script>
<script src="storage.js"></script>
Funcionalidades
Página principal (index.html)
Formulario para capturar los datos de una nota: cliente, producto, tipo de producto (inflable/mobiliario), fecha y hora del evento, costos, ubicación, medidas, teléfono y notas adicionales.
Cálculo automático del saldo pendiente (costo total − apartado).
Folio automático con formato AAMMDDNN:
AA: últimos dos dígitos del año en que se genera la nota.
MM: mes (2 dígitos).
DD: día (2 dígitos).
NN: número consecutivo de la cotización de ese día (01–99).
Vista previa de la nota antes de guardarla.
Descarga en PDF (una sola página, ajustada al alto real del contenido, sin cortes).
Guardar y agendar: guarda la nota en Firestore con estado agendado.
Reglas y recomendaciones de uso, distintas según el tipo de producto (inflable o mobiliario).
Calendario (calendario.html)
Vista mensual con los eventos agendados.
Buscador de notas por nombre de cliente.
Modal de detalle por nota, con opciones para:
Reagendar (nueva fecha/hora).
Marcar como completado o cancelado.
Restaurar a "agendado".
Eliminar permanentemente.
Descargar el PDF de la nota.
Datos almacenados por nota (Firestore, colección notas)
Campo	Descripción
id	Identificador único generado en el cliente
folio	Folio con formato AAMMDDNN
cliente	Nombre del cliente
producto	Producto rentado
tipoProducto	inflable o mobiliario (determina qué reglas se muestran)
fechaEvento, horaEvento	Fecha y hora del evento
costoTotal, apartado, saldoPendiente	Desglose de costos
ubicacion, medidas, espacioRequerido	Datos logísticos del evento
telefonoContacto	Teléfono de contacto
notasExtra	Notas adicionales opcionales
estado	agendado, completado o cancelado
creadaEl	Fecha ISO de creación de la nota
Notas técnicas
El PDF se genera capturando el HTML de la nota con html2canvas y armando un PDF de una sola página con jsPDF, con el tamaño de página ajustado al contenido (evita el corte que ocurre al forzar tamaño carta fijo).
Todas las funciones que leen o escriben notas (obtenerNotas, guardarNotaDB, actualizarNotaDB, eliminarNotaDB) son asíncronas porque consultan Firestore; cualquier código que las use debe usar await o .then().
