"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─── Types ────────────────────────────────────────────────────────────────────

export type StockStatus = "normal" | "bajo" | "agotado";

export interface Material {
  id: string;
  nombre: string;
  ref: string;
  categoria: string;
  unidad: string;
  stock: number;
  stockMin: number;
  ubicacion: string;
  proveedor: string;
  desc: string;
  fotos: string[];
  fechaCreacion: string;
}

export interface Project {
  id: string;
  nombre: string;
  lider: string;
  desc: string;
  ubicacion: string;
  fecha: string;
  status: "activo" | "pausado" | "finalizado";
}

export interface Dispatch {
  id: string;
  projectId: string;
  projectNombre: string;
  itemId: string;
  itemNombre: string;
  itemRef: string;
  unidad: string;
  qty: number;
  responsable: string;
  obs: string;
  tipo: "despacho" | "devolucion";
  fecha: string;
}

export interface Movement {
  item: string;
  tipo: "Entrada" | "Despacho" | "Devolución";
  qty: number;
  fecha: string;
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface AppState {
  inventory: Material[];
  projects: Project[];
  dispatches: Dispatch[];
  movements: Movement[];
  setInventory: (items: Material[]) => void;
  // Inventory actions
  addMaterial: (m: Omit<Material, "id" | "fechaCreacion">) => void;
  updateMaterial: (id: string, m: Partial<Material>) => void;
  deleteMaterial: (id: string) => void;
  // Project actions
  addProject: (p: Omit<Project, "id">) => void;
  updateProject: (id: string, p: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  // Dispatch actions
  addDispatch: (d: Omit<Dispatch, "id" | "fecha">) => void;
  addReturn: (d: Omit<Dispatch, "id" | "fecha" | "tipo">) => void;
  updateDispatch: (id: string, d: Partial<Dispatch>) => void;
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

const STORE_VERSION = 3;

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      inventory: [],
      projects: [],
      dispatches: [],
      movements: [],
      setInventory: (items) => set(() => ({ inventory: items })),

      addMaterial: (m) => {
        const mat: Material = { ...m, id: uid(), fechaCreacion: new Date().toLocaleDateString("es-CO") };
        set((s) => ({
          inventory: [...s.inventory, mat],
          movements: [...s.movements, { item: m.nombre, tipo: "Entrada", qty: m.stock, fecha: new Date().toLocaleDateString("es-CO") }],
        }));
      },

      updateMaterial: (id, m) =>
        set((s) => ({ inventory: s.inventory.map((i) => (i.id === id ? { ...i, ...m } : i)) })),

      deleteMaterial: (id) =>
        set((s) => ({ inventory: s.inventory.filter((i) => i.id !== id) })),

      addProject: (p) =>
        set((s) => ({ projects: [...s.projects, { ...p, id: uid() }] })),

      updateProject: (id, p) =>
        set((s) => ({ projects: s.projects.map((x) => (x.id === id ? { ...x, ...p } : x)) })),

      deleteProject: (id) =>
        set((s) => ({ projects: s.projects.filter((x) => x.id !== id) })),

      addDispatch: (d) => {
        const item = get().inventory.find((i) => i.id === d.itemId);
        if (!item || item.stock < d.qty) throw new Error("Stock insuficiente");
        set((s) => ({
          inventory: s.inventory.map((i) =>
            i.id === d.itemId ? { ...i, stock: i.stock - d.qty } : i
          ),
          dispatches: [...s.dispatches, { ...d, id: uid(), tipo: "despacho", fecha: new Date().toLocaleString("es-CO") }],
          movements: [...s.movements, { item: item.nombre, tipo: "Despacho", qty: d.qty, fecha: new Date().toLocaleDateString("es-CO") }],
        }));
      },

      addReturn: (d) => {
        const item = get().inventory.find((i) => i.id === d.itemId);
        if (!item) throw new Error("Material no encontrado");
        set((s) => ({
          inventory: s.inventory.map((i) =>
            i.id === d.itemId ? { ...i, stock: i.stock + d.qty } : i
          ),
          dispatches: [...s.dispatches, { ...d, id: uid(), tipo: "devolucion", fecha: new Date().toLocaleString("es-CO") }],
          movements: [...s.movements, { item: item.nombre, tipo: "Devolución", qty: d.qty, fecha: new Date().toLocaleDateString("es-CO") }],
        }));
      },

      updateDispatch: (id, d) => {
        const prev = get().dispatches.find((x) => x.id === id);
        if (!prev) throw new Error("Despacho no encontrado");

        const next = { ...prev, ...d };
        const item = get().inventory.find((i) => i.id === prev.itemId);
        if (!item) throw new Error("Material no encontrado");

        const prevEffect = prev.tipo === "devolucion" ? prev.qty : -prev.qty;
        const nextEffect = next.tipo === "devolucion" ? next.qty : -next.qty;
        const stockAdjusted = item.stock + (nextEffect - prevEffect);
        if (stockAdjusted < 0) throw new Error("Stock insuficiente para actualizar el despacho");

        set((s) => ({
          dispatches: s.dispatches.map((x) => (x.id === id ? next : x)),
          inventory: s.inventory.map((i) => (i.id === prev.itemId ? { ...i, stock: stockAdjusted } : i)),
        }));
      },
    }),
    {
      name: "tesocol-store",
      version: STORE_VERSION,
      migrate: (persistedState: any, version) => {
        if (version < STORE_VERSION) {
          return {
            ...persistedState,
            inventory: [],
            projects: [],
            dispatches: [],
            movements: [],
          };
        }
        return persistedState;
      },
    }
  )
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getStockStatus(item: Material): { key: StockStatus; label: string; badge: string } {
  if (item.stock === 0) return { key: "agotado", label: "Agotado", badge: "badge-red" };
  if (item.stock <= item.stockMin) return { key: "bajo", label: "Stock Bajo", badge: "badge-yellow" };
  return { key: "normal", label: "Normal", badge: "badge-green" };
}

export function getCatEmoji(cat: string) {
  const map: Record<string, string> = {
    "Paneles Solares": "☀️", Inversores: "⚡", Baterías: "🔋",
    Estructuras: "🏗️", Cableado: "🔌", Protecciones: "🛡️",
    Monitoreo: "📡", Otros: "📦",
  };
  return map[cat] ?? "📦";
}
