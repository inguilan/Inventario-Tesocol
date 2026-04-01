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
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

const DEMO_INVENTORY: Material[] = [
  { id: "1", nombre: "Panel Solar Monocristalino 550W", ref: "PS-550W-MONO", categoria: "Paneles Solares", unidad: "Unidades", stock: 24, stockMin: 10, ubicacion: "Estante A-1", proveedor: "Risen Energy", desc: "Panel monocristalino 550Wp, 144 celdas, eficiencia 21.3%", fotos: [], fechaCreacion: "15/01/2025" },
  { id: "2", nombre: "Inversor Trifásico 10kW", ref: "INV-10K-TRI", categoria: "Inversores", unidad: "Unidades", stock: 3, stockMin: 5, ubicacion: "Estante B-2", proveedor: "Huawei Solar", desc: "Inversor string trifásico 10kW, MPPT dual", fotos: [], fechaCreacion: "15/01/2025" },
  { id: "3", nombre: "Cable Solar 4mm² Negro", ref: "CAB-4MM-NEG", categoria: "Cableado", unidad: "Metros", stock: 450, stockMin: 100, ubicacion: "Rollo C-1", proveedor: "Prysmian", desc: "Cable fotovoltaico certificado TÜV, doble aislamiento", fotos: [], fechaCreacion: "15/01/2025" },
  { id: "4", nombre: "Estructura Techo Inclinado 6P", ref: "EST-TI-6P", categoria: "Estructuras", unidad: "Juegos", stock: 2, stockMin: 3, ubicacion: "Zona D", proveedor: "Schletter", desc: "Kit aluminio para techo inclinado, 6 paneles", fotos: [], fechaCreacion: "18/01/2025" },
  { id: "5", nombre: "Fusible String 15A 1000VDC", ref: "FUS-STR-15A", categoria: "Protecciones", unidad: "Unidades", stock: 0, stockMin: 20, ubicacion: "Cajón E-3", proveedor: "OBO Bettermann", desc: "Fusible para protección de strings FV 15A/1000VDC", fotos: [], fechaCreacion: "20/01/2025" },
  { id: "6", nombre: "Batería LiFePO4 100Ah 48V", ref: "BAT-LFP-100", categoria: "Baterías", unidad: "Unidades", stock: 8, stockMin: 4, ubicacion: "Estante F-1", proveedor: "PYLONTECH", desc: "Batería litio fosfato 100Ah 48V con BMS integrado", fotos: [], fechaCreacion: "22/01/2025" },
  { id: "7", nombre: "Medidor Energía Bidireccional", ref: "MED-BID-3F", categoria: "Monitoreo", unidad: "Unidades", stock: 6, stockMin: 3, ubicacion: "Cajón G-2", proveedor: "Schneider", desc: "Contador de energía bidireccional trifásico RS485", fotos: [], fechaCreacion: "25/01/2025" },
  { id: "8", nombre: "Conector MC4 Par Hembra/Macho", ref: "MC4-PAR", categoria: "Cableado", unidad: "Cajas", stock: 12, stockMin: 10, ubicacion: "Cajón H-1", proveedor: "Amphenol", desc: "Caja x100 pares MC4, IP68 certificados", fotos: [], fechaCreacion: "01/02/2025" },
];

const DEMO_PROJECTS: Project[] = [
  { id: "p1", nombre: "Peñatex Cali — Sistema FV Industrial", lider: "Carlos Rodríguez", desc: "Sistema fotovoltaico industrial 50kWp para empresa textil", ubicacion: "Cali, Valle del Cauca", fecha: "2025-01-15", status: "activo" },
  { id: "p2", nombre: "Residencial Las Mercedes Palmira", lider: "Ana Martínez", desc: "Sistema fotovoltaico residencial 8kWp", ubicacion: "Palmira, Valle del Cauca", fecha: "2025-02-01", status: "activo" },
  { id: "p3", nombre: "Servicanes Tuluá — Celsia", lider: "Juan Pérez", desc: "Proyecto FV comercial con monitoreo Celsia", ubicacion: "Tuluá, Valle del Cauca", fecha: "2024-12-10", status: "finalizado" },
];

const DEMO_DISPATCHES: Dispatch[] = [
  { id: "d1", projectId: "p1", projectNombre: "Peñatex Cali", itemId: "1", itemNombre: "Panel Solar 550W", itemRef: "PS-550W-MONO", unidad: "Unidades", qty: 10, responsable: "Carlos Rodríguez", obs: "Primera entrega", tipo: "despacho", fecha: "15/01/2025 09:00" },
  { id: "d2", projectId: "p1", projectNombre: "Peñatex Cali", itemId: "3", itemNombre: "Cable Solar 4mm²", itemRef: "CAB-4MM-NEG", unidad: "Metros", qty: 100, responsable: "Carlos Rodríguez", obs: "", tipo: "despacho", fecha: "15/01/2025 09:00" },
  { id: "d3", projectId: "p1", projectNombre: "Peñatex Cali", itemId: "1", itemNombre: "Panel Solar 550W", itemRef: "PS-550W-MONO", unidad: "Unidades", qty: 2, responsable: "Carlos Rodríguez", obs: "Material sobrante", tipo: "devolucion", fecha: "28/01/2025 16:00" },
  { id: "d4", projectId: "p2", projectNombre: "Las Mercedes Palmira", itemId: "6", itemNombre: "Batería LiFePO4", itemRef: "BAT-LFP-100", unidad: "Unidades", qty: 2, responsable: "Ana Martínez", obs: "", tipo: "despacho", fecha: "02/02/2025 10:00" },
];

const DEMO_MOVEMENTS: Movement[] = [
  { item: "Panel Solar 550W", tipo: "Entrada", qty: 24, fecha: "15/01/2025" },
  { item: "Panel Solar 550W", tipo: "Despacho", qty: 10, fecha: "15/01/2025" },
  { item: "Cable Solar 4mm²", tipo: "Despacho", qty: 100, fecha: "15/01/2025" },
  { item: "Panel Solar 550W", tipo: "Devolución", qty: 2, fecha: "28/01/2025" },
  { item: "Batería LiFePO4", tipo: "Despacho", qty: 2, fecha: "02/02/2025" },
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      inventory: DEMO_INVENTORY,
      projects: DEMO_PROJECTS,
      dispatches: DEMO_DISPATCHES,
      movements: DEMO_MOVEMENTS,

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
    }),
    { name: "tesocol-store" }
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
