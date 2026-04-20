import { collection, doc, getDocs, getFirestore, setDoc, writeBatch } from "firebase/firestore";
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

export async function syncAppStateToFirestore(snapshot: AppDataSnapshot): Promise<void> {
  const db = getDb();
  const batch = writeBatch(db);
  const configRef = getTesocolRef();

  // Add metadata update
  batch.set(configRef, { updatedAt: new Date().toISOString() }, { merge: true });

  // Add all materiales
  snapshot.inventory.forEach((item) => {
    const ref = doc(db, TESOCOL_COLLECTION, "config", SUBCOLLECTIONS.MATERIALES, item.id);
    batch.set(ref, item, { merge: true });
  });

  // Add all proyectos
  snapshot.projects.forEach((proj) => {
    const ref = doc(db, TESOCOL_COLLECTION, "config", SUBCOLLECTIONS.PROYECTOS, proj.id);
    batch.set(ref, proj, { merge: true });
  });

  // Add all despachos
  snapshot.dispatches.forEach((disp) => {
    const ref = doc(db, TESOCOL_COLLECTION, "config", SUBCOLLECTIONS.DESPACHOS, disp.id);
    batch.set(ref, disp, { merge: true });
  });

  // Add all movimientos
  snapshot.movements.forEach((mov, idx) => {
    const ref = doc(db, TESOCOL_COLLECTION, "config", SUBCOLLECTIONS.MOVIMIENTOS, `${mov.fecha}-${idx}`);
    batch.set(ref, mov, { merge: true });
  });

  await batch.commit();
}
