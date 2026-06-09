"use client";
import { create } from "zustand";

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

export interface Technician {
  id: string;
  nombre: string;
  cargo: string;
  telefono: string;
  notas: string;
  activo: boolean;
  fechaRegistro: string;
}

export interface CompanyTool {
  id: string;
  nombre: string;
  categoria: string;
  marca: string;
  cantidad: string;
  estado: "disponible" | "asignada" | "mantenimiento" | "regular" | "baja";
  ubicacion: string;
  notas: string;
  fechaRegistro: string;
}

export interface TechnicianTool {
  id: string;
  technicianId: string;
  technicianNombre: string;
  nombre: string;
  cantidad: string;
  marca: string;
  notas: string;
  fechaRegistro: string;
}

export interface ToolAssignment {
  id: string;
  technicianId: string;
  technicianNombre: string;
  toolId: string;
  toolNombre: string;
  fechaEntrega: string;
  fechaDevolucion?: string;
  estado: "activa" | "devuelta";
  observaciones: string;
}

export interface AppDataSnapshot {
  inventory: Material[];
  projects: Project[];
  dispatches: Dispatch[];
  movements: Movement[];
  technicians: Technician[];
  companyTools: CompanyTool[];
  toolAssignments: ToolAssignment[];
  technicianTools: TechnicianTool[];
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface AppState {
  inventory: Material[];
  projects: Project[];
  dispatches: Dispatch[];
  movements: Movement[];
  technicians: Technician[];
  companyTools: CompanyTool[];
  toolAssignments: ToolAssignment[];
  technicianTools: TechnicianTool[];
  setAppData: (data: AppDataSnapshot) => void;
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
  addTechnician: (t: Omit<Technician, "id" | "fechaRegistro">) => void;
  updateTechnician: (id: string, t: Partial<Technician>) => void;
  deleteTechnician: (id: string) => void;
  addCompanyTool: (t: Omit<CompanyTool, "id" | "fechaRegistro">) => void;
  updateCompanyTool: (id: string, t: Partial<CompanyTool>) => void;
  deleteCompanyTool: (id: string) => void;
  addTechnicianTool: (t: Omit<TechnicianTool, "id" | "fechaRegistro" | "technicianNombre">) => void;
  updateTechnicianTool: (id: string, t: Partial<Omit<TechnicianTool, "id" | "fechaRegistro" | "technicianId" | "technicianNombre">>) => void;
  deleteTechnicianTool: (id: string) => void;
  assignTool: (a: Omit<ToolAssignment, "id" | "fechaEntrega" | "fechaDevolucion" | "estado">) => void;
  returnAssignedTool: (assignmentId: string, observaciones?: string) => void;
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export const useStore = create<AppState>()((set, get) => ({
      inventory: [],
      projects: [],
      dispatches: [],
      movements: [],
      technicians: [],
      companyTools: [],
      toolAssignments: [],
      technicianTools: [],
      setAppData: (data) =>
        set(() => ({
          inventory: data.inventory,
          projects: data.projects,
          dispatches: data.dispatches,
          movements: data.movements,
          technicians: data.technicians ?? [],
          companyTools: data.companyTools ?? [],
          toolAssignments: data.toolAssignments ?? [],
          technicianTools: data.technicianTools ?? [],
        })),

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

      addTechnician: (t) => {
        const technician: Technician = {
          ...t,
          id: uid(),
          fechaRegistro: new Date().toLocaleDateString("es-CO"),
        };
        set((s) => ({ technicians: [...s.technicians, technician] }));
      },

      updateTechnician: (id, t) =>
        set((s) => ({ technicians: s.technicians.map((tech) => (tech.id === id ? { ...tech, ...t } : tech)) })),

      deleteTechnician: (id) => {
        const activeAssignment = get().toolAssignments.find((assignment) => assignment.technicianId === id && assignment.estado === "activa");
        if (activeAssignment) throw new Error("No puedes eliminar un tecnico con herramientas activas");
        set((s) => ({
          technicians: s.technicians.filter((tech) => tech.id !== id),
          technicianTools: s.technicianTools.filter((tool) => tool.technicianId !== id),
        }));
      },

      addCompanyTool: (t) => {
        const tool: CompanyTool = {
          ...t,
          id: uid(),
          fechaRegistro: new Date().toLocaleDateString("es-CO"),
        };
        set((s) => ({ companyTools: [...s.companyTools, tool] }));
      },

      updateCompanyTool: (id, t) =>
        set((s) => ({ companyTools: s.companyTools.map((tool) => (tool.id === id ? { ...tool, ...t } : tool)) })),

      deleteCompanyTool: (id) => {
        const activeAssignment = get().toolAssignments.find((assignment) => assignment.toolId === id && assignment.estado === "activa");
        if (activeAssignment) throw new Error("No puedes eliminar una herramienta asignada");
        set((s) => ({ companyTools: s.companyTools.filter((tool) => tool.id !== id) }));
      },

      addTechnicianTool: (t) => {
        const technician = get().technicians.find((tech) => tech.id === t.technicianId);
        if (!technician) throw new Error("Tecnico no encontrado");

        const tool: TechnicianTool = {
          ...t,
          technicianNombre: technician.nombre,
          id: uid(),
          fechaRegistro: new Date().toLocaleDateString("es-CO"),
        };

        set((s) => ({ technicianTools: [...s.technicianTools, tool] }));
      },

      updateTechnicianTool: (id, t) =>
        set((s) => ({
          technicianTools: s.technicianTools.map((tool) =>
            tool.id === id ? { ...tool, ...t } : tool
          ),
        })),

      deleteTechnicianTool: (id) =>
        set((s) => ({ technicianTools: s.technicianTools.filter((tool) => tool.id !== id) })),

      assignTool: (a) => {
        const technician = get().technicians.find((tech) => tech.id === a.technicianId);
        const tool = get().companyTools.find((item) => item.id === a.toolId);

        if (!technician || !technician.activo) throw new Error("Tecnico no valido o inactivo");
        if (!tool) throw new Error("Herramienta no encontrada");
        if (tool.estado !== "disponible") throw new Error("La herramienta no esta disponible para entrega");

        const assignment: ToolAssignment = {
          ...a,
          id: uid(),
          fechaEntrega: new Date().toLocaleString("es-CO"),
          estado: "activa",
        };

        set((s) => ({
          toolAssignments: [...s.toolAssignments, assignment],
          companyTools: s.companyTools.map((item) =>
            item.id === a.toolId ? { ...item, estado: "asignada" } : item
          ),
        }));
      },

      returnAssignedTool: (assignmentId, observaciones) => {
        const assignment = get().toolAssignments.find((item) => item.id === assignmentId);
        if (!assignment) throw new Error("Asignacion no encontrada");
        if (assignment.estado === "devuelta") throw new Error("La herramienta ya fue devuelta");

        set((s) => ({
          toolAssignments: s.toolAssignments.map((item) =>
            item.id === assignmentId
              ? {
                  ...item,
                  estado: "devuelta",
                  fechaDevolucion: new Date().toLocaleString("es-CO"),
                  observaciones: observaciones?.trim() ? observaciones : item.observaciones,
                }
              : item
          ),
          companyTools: s.companyTools.map((tool) =>
            tool.id === assignment.toolId ? { ...tool, estado: "disponible" } : tool
          ),
        }));
      },
    })
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
