import { collection, deleteDoc, doc, getDocs, getFirestore, setDoc, writeBatch } from "firebase/firestore";
import { firebaseApp } from "@/lib/firebase";
import type { AppDataSnapshot } from "@/store/useStore";

const TESOCOL_COLLECTION = "tesocol";

// Subcollections for organized data
const SUBCOLLECTIONS = {
  MATERIALES: "materiales",
  PROYECTOS: "proyectos",
  DESPACHOS: "despachos",
  MOVIMIENTOS: "movimientos",
};

const EMPTY_SNAPSHOT: AppDataSnapshot = {
  inventory: [],
  projects: [],
  dispatches: [],
  movements: [],
};

function getDb() {
  if (!firebaseApp) {
    throw new Error("Firebase no esta inicializado");
  }
  return getFirestore(firebaseApp);
}

function getTesocolRef() {
  return doc(getDb(), TESOCOL_COLLECTION, "config");
}

export async function loadAppStateFromFirestore(): Promise<AppDataSnapshot> {
  const db = getDb();
  
  try {
    // Load all subcollections in parallel with Promise.all
    const [materialesSnap, proyectosSnap, despachosDocs, movimientosSnap] = await Promise.all([
      getDocs(collection(db, TESOCOL_COLLECTION, "config", SUBCOLLECTIONS.MATERIALES)),
      getDocs(collection(db, TESOCOL_COLLECTION, "config", SUBCOLLECTIONS.PROYECTOS)),
      getDocs(collection(db, TESOCOL_COLLECTION, "config", SUBCOLLECTIONS.DESPACHOS)),
      getDocs(collection(db, TESOCOL_COLLECTION, "config", SUBCOLLECTIONS.MOVIMIENTOS)),
    ]);

    return {
      inventory: materialesSnap.docs.map((d) => d.data() as any),
      projects: proyectosSnap.docs.map((d) => d.data() as any),
      dispatches: despachosDocs.docs.map((d) => d.data() as any),
      movements: movimientosSnap.docs.map((d) => d.data() as any),
    };
  } catch (error) {
    console.warn("No se pudieron cargar colecciones, retornando snapshot vacío", error);
    return EMPTY_SNAPSHOT;
  }
}

/**
 * Sincroniza el estado de la app a Firestore.
 * - Escribe/actualiza documentos que existen en el estado
 * - Borra documentos que NO existen en el estado (garbage collection)
 */
export async function syncAppStateToFirestore(snapshot: AppDataSnapshot): Promise<void> {
  const db = getDb();
  const batch = writeBatch(db);
  const configRef = getTesocolRef();

  // Metadata update
  batch.set(configRef, { updatedAt: new Date().toISOString() }, { merge: true });

  // ─── MATERIALES ────────────────────────────────────────────────
  const currentMaterialIds = new Set(snapshot.inventory.map((m) => m.id));
  const materialesCol = collection(db, TESOCOL_COLLECTION, "config", SUBCOLLECTIONS.MATERIALES);
  const existingMateriales = await getDocs(materialesCol);
  
  snapshot.inventory.forEach((item) => {
    const ref = doc(db, TESOCOL_COLLECTION, "config", SUBCOLLECTIONS.MATERIALES, item.id);
    batch.set(ref, item, { merge: true });
  });
  
  // Delete materiales que fueron removidos
  existingMateriales.docs.forEach((doc) => {
    if (!currentMaterialIds.has(doc.id)) {
      batch.delete(doc.ref);
    }
  });

  // ─── PROYECTOS ────────────────────────────────────────────────
  const currentProjectIds = new Set(snapshot.projects.map((p) => p.id));
  const proyectosCol = collection(db, TESOCOL_COLLECTION, "config", SUBCOLLECTIONS.PROYECTOS);
  const existingProyectos = await getDocs(proyectosCol);
  
  snapshot.projects.forEach((proj) => {
    const ref = doc(db, TESOCOL_COLLECTION, "config", SUBCOLLECTIONS.PROYECTOS, proj.id);
    batch.set(ref, proj, { merge: true });
  });
  
  // Delete proyectos que fueron removidos
  existingProyectos.docs.forEach((doc) => {
    if (!currentProjectIds.has(doc.id)) {
      batch.delete(doc.ref);
    }
  });

  // ─── DESPACHOS ────────────────────────────────────────────────
  const currentDispatchIds = new Set(snapshot.dispatches.map((d) => d.id));
  const despachosColl = collection(db, TESOCOL_COLLECTION, "config", SUBCOLLECTIONS.DESPACHOS);
  const existingDespachos = await getDocs(despachosColl);
  
  snapshot.dispatches.forEach((disp) => {
    const ref = doc(db, TESOCOL_COLLECTION, "config", SUBCOLLECTIONS.DESPACHOS, disp.id);
    batch.set(ref, disp, { merge: true });
  });
  
  // Delete despachos que fueron removidos
  existingDespachos.docs.forEach((doc) => {
    if (!currentDispatchIds.has(doc.id)) {
      batch.delete(doc.ref);
    }
  });

  // ─── MOVIMIENTOS ────────────────────────────────────────────────
  // Para movimientos, borrar todos y reescribir (son transaccionales)
  const movimientosCol = collection(db, TESOCOL_COLLECTION, "config", SUBCOLLECTIONS.MOVIMIENTOS);
  const existingMovimientos = await getDocs(movimientosCol);
  
  existingMovimientos.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  
  snapshot.movements.forEach((mov, idx) => {
    const ref = doc(db, TESOCOL_COLLECTION, "config", SUBCOLLECTIONS.MOVIMIENTOS, `${mov.fecha}-${idx}`);
    batch.set(ref, mov, { merge: true });
  });

  await batch.commit();
}
