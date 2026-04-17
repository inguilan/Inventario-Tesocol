export interface ApiMaterial {
  id: string;
  nombre: string;
  proveedor: string;
  cantidad: number;
  createdAt: string;
}

declare global {
  var __tesocolMaterialesStore: ApiMaterial[] | undefined;
}

const store = globalThis.__tesocolMaterialesStore ?? [];

if (!globalThis.__tesocolMaterialesStore) {
  globalThis.__tesocolMaterialesStore = store;
}

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function listApiMaterials() {
  return store;
}

export function createApiMaterial(input: {
  nombre: string;
  proveedor: string;
  cantidad: number;
}) {
  const material: ApiMaterial = {
    id: uid(),
    nombre: input.nombre,
    proveedor: input.proveedor,
    cantidad: input.cantidad,
    createdAt: new Date().toISOString(),
  };

  store.push(material);
  return material;
}