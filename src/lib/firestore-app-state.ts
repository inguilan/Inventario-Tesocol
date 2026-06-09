import { collection, deleteDoc, doc, getDocs, getFirestore, setDoc, writeBatch } from "firebase/firestore";
import { firebaseApp } from "@/lib/firebase";
import type { AppDataSnapshot, CompanyTool } from "@/store/useStore";

const TESOCOL_COLLECTION = "tesocol";

// Subcollections for organized data
const SUBCOLLECTIONS = {
  MATERIALES: "materiales",
  PROYECTOS: "proyectos",
  DESPACHOS: "despachos",
  MOVIMIENTOS: "movimientos",
  TECNICOS: "tecnicos",
  HERRAMIENTAS_EMPRESA: "herramientasEmpresa",
  ENTREGAS_HERRAMIENTAS: "entregasHerramientas",
  HERRAMIENTAS_TECNICOS: "herramientasTecnicos",
};

const EMPTY_SNAPSHOT: AppDataSnapshot = {
  inventory: [],
  projects: [],
  dispatches: [],
  movements: [],
  technicians: [],
  companyTools: [],
  toolAssignments: [],
  technicianTools: [],
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

function normalizeCompanyTool(raw: any): CompanyTool {
  return {
    ...raw,
    cantidad: raw?.cantidad ?? raw?.serial ?? "",
  } as CompanyTool;
}

export async function loadAppStateFromFirestore(): Promise<AppDataSnapshot> {
  const db = getDb();
  
  try {
    // Load all subcollections in parallel with Promise.all
    const [materialesSnap, proyectosSnap, despachosDocs, movimientosSnap, tecnicosSnap, herramientasSnap, entregasSnap, herramientasTecnicosSnap] = await Promise.all([
      getDocs(collection(db, TESOCOL_COLLECTION, "config", SUBCOLLECTIONS.MATERIALES)),
      getDocs(collection(db, TESOCOL_COLLECTION, "config", SUBCOLLECTIONS.PROYECTOS)),
      getDocs(collection(db, TESOCOL_COLLECTION, "config", SUBCOLLECTIONS.DESPACHOS)),
      getDocs(collection(db, TESOCOL_COLLECTION, "config", SUBCOLLECTIONS.MOVIMIENTOS)),
      getDocs(collection(db, TESOCOL_COLLECTION, "config", SUBCOLLECTIONS.TECNICOS)),
      getDocs(collection(db, TESOCOL_COLLECTION, "config", SUBCOLLECTIONS.HERRAMIENTAS_EMPRESA)),
      getDocs(collection(db, TESOCOL_COLLECTION, "config", SUBCOLLECTIONS.ENTREGAS_HERRAMIENTAS)),
      getDocs(collection(db, TESOCOL_COLLECTION, "config", SUBCOLLECTIONS.HERRAMIENTAS_TECNICOS)),
    ]);

    return {
      inventory: materialesSnap.docs.map((d) => d.data() as any),
      projects: proyectosSnap.docs.map((d) => d.data() as any),
      dispatches: despachosDocs.docs.map((d) => d.data() as any),
      movements: movimientosSnap.docs.map((d) => d.data() as any),
      technicians: tecnicosSnap.docs.map((d) => d.data() as any),
      companyTools: herramientasSnap.docs.map((d) => normalizeCompanyTool(d.data())),
      toolAssignments: entregasSnap.docs.map((d) => d.data() as any),
      technicianTools: herramientasTecnicosSnap.docs.map((d) => d.data() as any),
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

  // ─── TECNICOS ────────────────────────────────────────────────
  const currentTechnicianIds = new Set(snapshot.technicians.map((tech) => tech.id));
  const tecnicosCol = collection(db, TESOCOL_COLLECTION, "config", SUBCOLLECTIONS.TECNICOS);
  const existingTecnicos = await getDocs(tecnicosCol);

  snapshot.technicians.forEach((tech) => {
    const ref = doc(db, TESOCOL_COLLECTION, "config", SUBCOLLECTIONS.TECNICOS, tech.id);
    batch.set(ref, tech, { merge: true });
  });

  existingTecnicos.docs.forEach((doc) => {
    if (!currentTechnicianIds.has(doc.id)) {
      batch.delete(doc.ref);
    }
  });

  // ─── HERRAMIENTAS EMPRESA ────────────────────────────────────
  const currentToolIds = new Set(snapshot.companyTools.map((tool) => tool.id));
  const herramientasCol = collection(db, TESOCOL_COLLECTION, "config", SUBCOLLECTIONS.HERRAMIENTAS_EMPRESA);
  const existingHerramientas = await getDocs(herramientasCol);

  snapshot.companyTools.forEach((tool) => {
    const ref = doc(db, TESOCOL_COLLECTION, "config", SUBCOLLECTIONS.HERRAMIENTAS_EMPRESA, tool.id);
    batch.set(ref, tool, { merge: true });
  });

  existingHerramientas.docs.forEach((doc) => {
    if (!currentToolIds.has(doc.id)) {
      batch.delete(doc.ref);
    }
  });

  // ─── ENTREGAS DE HERRAMIENTAS ────────────────────────────────
  const currentAssignmentIds = new Set(snapshot.toolAssignments.map((assignment) => assignment.id));
  const entregasCol = collection(db, TESOCOL_COLLECTION, "config", SUBCOLLECTIONS.ENTREGAS_HERRAMIENTAS);
  const existingEntregas = await getDocs(entregasCol);

  snapshot.toolAssignments.forEach((assignment) => {
    const ref = doc(db, TESOCOL_COLLECTION, "config", SUBCOLLECTIONS.ENTREGAS_HERRAMIENTAS, assignment.id);
    batch.set(ref, assignment, { merge: true });
  });

  existingEntregas.docs.forEach((doc) => {
    if (!currentAssignmentIds.has(doc.id)) {
      batch.delete(doc.ref);
    }
  });

  // ─── HERRAMIENTAS DE TECNICOS ────────────────────────────────
  const currentTechToolIds = new Set(snapshot.technicianTools.map((tool) => tool.id));
  const herramientasTecnicosCol = collection(db, TESOCOL_COLLECTION, "config", SUBCOLLECTIONS.HERRAMIENTAS_TECNICOS);
  const existingHerramientasTecnicos = await getDocs(herramientasTecnicosCol);

  snapshot.technicianTools.forEach((tool) => {
    const ref = doc(db, TESOCOL_COLLECTION, "config", SUBCOLLECTIONS.HERRAMIENTAS_TECNICOS, tool.id);
    batch.set(ref, tool, { merge: true });
  });

  existingHerramientasTecnicos.docs.forEach((doc) => {
    if (!currentTechToolIds.has(doc.id)) {
      batch.delete(doc.ref);
    }
  });

  await batch.commit();
}
