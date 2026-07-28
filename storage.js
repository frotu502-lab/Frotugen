const NOTAS_COLLECTION = 'notas';

async function obtenerNotas() {
  const snapshot = await db.collection(NOTAS_COLLECTION).get();
  return snapshot.docs.map(doc => doc.data());
}

async function guardarNotaDB(nota) {
  await db.collection(NOTAS_COLLECTION).doc(nota.id).set(nota);
}

async function actualizarNotaDB(id, cambios) {
  await db.collection(NOTAS_COLLECTION).doc(id).update(cambios);
}

async function eliminarNotaDB(id) {
  await db.collection(NOTAS_COLLECTION).doc(id).delete();
}