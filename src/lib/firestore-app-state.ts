import { collection, doc, getDoc, getDocs, getFirestore, setDoc } from "firebase/firestore";
import { firebaseApp } from "@/lib/firebase";
import type { AppDataSnapshot } from "@/store/useStore";

const COLLECTION_NAME = "tesocol";
const DOCUMENT_ID = "app_state";

const EMPTY_SNAPSHOT: AppDataSnapshot = {
  inventory: [],
  projects: [],
  dispatches: [],
  movements: [],
};

function getStateRef() {
  if (!firebaseApp) {
    throw new Error("Firebase no esta inicializado");
  }
  const db = getFirestore(firebaseApp);
  return doc(db, COLLECTION_NAME, DOCUMENT_ID);
}

function getLegacyMaterialsCollection() {
  if (!firebaseApp) {
    throw new Error("Firebase no esta inicializado");
  }
  const db = getFirestore(firebaseApp);
  return collection(db, "materiales");
}

function normalizeSnapshot(raw: unknown): AppDataSnapshot {
  if (!raw || typeof raw !== "object") {
    return EMPTY_SNAPSHOT;
  }

  const data = raw as Partial<AppDataSnapshot>;

  return {
    inventory: Array.isArray(data.inventory) ? data.inventory : [],
    projects: Array.isArray(data.projects) ? data.projects : [],
    dispatches: Array.isArray(data.dispatches) ? data.dispatches : [],
    movements: Array.isArray(data.movements) ? data.movements : [],
  };
}

export async function loadAppStateFromFirestore(): Promise<AppDataSnapshot> {
  const ref = getStateRef();
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    // Fallback de migracion: si no existe app_state, usar inventario legacy.
    const legacySnap = await getDocs(getLegacyMaterialsCollection());
    if (legacySnap.empty) {
      return EMPTY_SNAPSHOT;
    }

    return {
      ...EMPTY_SNAPSHOT,
      inventory: legacySnap.docs.map((d) => d.data() as AppDataSnapshot["inventory"][number]),
    };
  }

  return normalizeSnapshot(snap.data());
}

export async function syncAppStateToFirestore(snapshot: AppDataSnapshot): Promise<void> {
  const ref = getStateRef();
  await setDoc(
    ref,
    {
      ...snapshot,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}
