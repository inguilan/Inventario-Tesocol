import { collection, deleteDoc, doc, getDocs, getFirestore, setDoc, writeBatch } from "firebase/firestore";
import { firebaseApp } from "@/lib/firebase";
import type { Material } from "@/store/useStore";

const COLLECTION_NAME = "materiales";

function getMaterialsCollection() {
  if (!firebaseApp) {
    throw new Error("Firebase no esta inicializado");
  }
  const db = getFirestore(firebaseApp);
  return collection(db, COLLECTION_NAME);
}

export async function loadMaterialsFromFirestore(): Promise<Material[]> {
  const col = getMaterialsCollection();
  const snapshot = await getDocs(col);
  return snapshot.docs.map((d) => d.data() as Material);
}

export async function syncMaterialsToFirestore(materials: Material[]): Promise<void> {
  const col = getMaterialsCollection();
  const db = col.firestore;
  const snapshot = await getDocs(col);
  const existingIds = new Set(snapshot.docs.map((d) => d.id));
  const nextIds = new Set(materials.map((m) => m.id));
  const batch = writeBatch(db);

  for (const material of materials) {
    const ref = doc(db, COLLECTION_NAME, material.id);
    batch.set(ref, material);
  }

  for (const id of existingIds) {
    if (!nextIds.has(id)) {
      batch.delete(doc(db, COLLECTION_NAME, id));
    }
  }

  await batch.commit();
}

export async function clearMaterialsFirestore(): Promise<void> {
  const col = getMaterialsCollection();
  const snapshot = await getDocs(col);
  await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));
}
