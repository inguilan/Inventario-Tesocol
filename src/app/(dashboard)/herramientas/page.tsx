"use client";
import Modal from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { Badge, Btn, EmptyState, fieldStyle, FormGroup, StatCard } from "@/components/ui";
import { CompanyTool, Technician, TechnicianTool, ToolAssignment, useStore } from "@/store/useStore";
import { FileText, Hammer, PackagePlus, Pencil, RotateCcw, Trash2, UserPlus } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { generateHerramientasPDF, generateTecnicoHerramientasPDF } from "@/lib/pdf";

type TechnicianForm = Omit<Technician, "id" | "fechaRegistro">;
type ToolForm = Omit<CompanyTool, "id" | "fechaRegistro">;
type AssignmentForm = {
  technicianId: string;
  toolId: string;
  observaciones: string;
};
type TechnicianToolForm = {
  technicianId: string;
  nombre: string;
  cantidad: string;
  marca: string;
  notas: string;
};

const emptyTechnician = (): TechnicianForm => ({
  nombre: "",
  cargo: "",
  telefono: "",
  notas: "",
  activo: true,
});

const emptyTool = (): ToolForm => ({
  nombre: "",
  categoria: "",
  marca: "",
  cantidad: "",
  estado: "disponible",
  ubicacion: "",
  notas: "",
});

const emptyAssignment = (): AssignmentForm => ({
  technicianId: "",
  toolId: "",
  observaciones: "",
});

const emptyTechnicianTool = (): TechnicianToolForm => ({
  technicianId: "",
  nombre: "",
  cantidad: "",
  marca: "",
  notas: "",
});

const toolBadge: Record<CompanyTool["estado"], string> = {
  disponible: "badge-green",
  asignada: "badge-orange",
  mantenimiento: "badge-yellow",
  regular: "badge-blue",
  baja: "badge-red",
};

const toolLabel: Record<CompanyTool["estado"], string> = {
  disponible: "Disponible",
  asignada: "Asignada",
  mantenimiento: "Mantenimiento",
  regular: "Regular",
  baja: "Baja",
};

export default function HerramientasPage() {
  const searchParams = useSearchParams();
  const {
    technicians,
    companyTools,
    toolAssignments,
    technicianTools,
    addTechnician,
    updateTechnician,
    deleteTechnician,
    addCompanyTool,
    updateCompanyTool,
    deleteCompanyTool,
    addTechnicianTool,
    updateTechnicianTool,
    deleteTechnicianTool,
    assignTool,
    returnAssignedTool,
  } = useStore();
  const { toast } = useToast();

  const [technicianModal, setTechnicianModal] = useState(false);
  const [toolModal, setToolModal] = useState(false);
  const [assignmentModal, setAssignmentModal] = useState(false);
  const [technicianToolModal, setTechnicianToolModal] = useState(false);
  const [editTechnicianId, setEditTechnicianId] = useState<string | null>(null);
  const [editToolId, setEditToolId] = useState<string | null>(null);
  const [editTechnicianToolId, setEditTechnicianToolId] = useState<string | null>(null);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>("");
  const [moduleView, setModuleView] = useState<"empresa" | "tecnicos">("empresa");
  const [technicianForm, setTechnicianForm] = useState<TechnicianForm>(emptyTechnician());
  const [toolForm, setToolForm] = useState<ToolForm>(emptyTool());
  const [assignmentForm, setAssignmentForm] = useState<AssignmentForm>(emptyAssignment());
  const [technicianToolForm, setTechnicianToolForm] = useState<TechnicianToolForm>(emptyTechnicianTool());

  useEffect(() => {
    const mod = searchParams.get("mod");
    if (mod === "empresa" || mod === "tecnicos") {
      setModuleView(mod);
    }
  }, [searchParams]);

  const activeAssignments = useMemo(
    () => toolAssignments.filter((assignment) => assignment.estado === "activa"),
    [toolAssignments]
  );

  const availableTools = useMemo(
    () => companyTools.filter((tool) => tool.estado === "disponible"),
    [companyTools]
  );

  const activeTechnicians = useMemo(
    () => technicians.filter((tech) => tech.activo),
    [technicians]
  );

  const activeAssignmentByTechnician = useMemo(() => {
    const counts = new Map<string, number>();
    activeAssignments.forEach((assignment) => {
      counts.set(assignment.technicianId, (counts.get(assignment.technicianId) || 0) + 1);
    });
    return counts;
  }, [activeAssignments]);

  const activeAssignmentByTool = useMemo(() => {
    const ids = new Set<string>();
    activeAssignments.forEach((assignment) => ids.add(assignment.toolId));
    return ids;
  }, [activeAssignments]);

  const technicianToolsCount = useMemo(() => {
    const counts = new Map<string, number>();
    technicianTools.forEach((tool) => {
      counts.set(tool.technicianId, (counts.get(tool.technicianId) || 0) + 1);
    });
    return counts;
  }, [technicianTools]);

  const assignmentByToolId = useMemo(() => {
    const map = new Map<string, ToolAssignment>();
    activeAssignments.forEach((assignment) => {
      map.set(assignment.toolId, assignment);
    });
    return map;
  }, [activeAssignments]);

  const selectedTechnician = useMemo(
    () => technicians.find((tech) => tech.id === selectedTechnicianId),
    [technicians, selectedTechnicianId]
  );

  const selectedTechnicianTools = useMemo(
    () => technicianTools.filter((tool) => tool.technicianId === selectedTechnicianId),
    [technicianTools, selectedTechnicianId]
  );

  useEffect(() => {
    if (technicians.length === 0) {
      if (selectedTechnicianId) setSelectedTechnicianId("");
      return;
    }
    if (!selectedTechnicianId || !technicians.some((t) => t.id === selectedTechnicianId)) {
      setSelectedTechnicianId(technicians[0].id);
    }
  }, [technicians, selectedTechnicianId]);

  function openAddTechnician() {
    setEditTechnicianId(null);
    setTechnicianForm(emptyTechnician());
    setTechnicianModal(true);
  }

  function openEditTechnician(tech: Technician) {
    setEditTechnicianId(tech.id);
    setTechnicianForm({
      nombre: tech.nombre,
      cargo: tech.cargo,
      telefono: tech.telefono,
      notas: tech.notas,
      activo: tech.activo,
    });
    setTechnicianModal(true);
  }

  function saveTechnician() {
    if (!technicianForm.nombre.trim()) {
      toast("El nombre del tecnico es obligatorio", "error");
      return;
    }

    try {
      if (editTechnicianId) {
        updateTechnician(editTechnicianId, technicianForm);
        toast("Tecnico actualizado", "success");
      } else {
        addTechnician(technicianForm);
        toast("Tecnico registrado", "success");
      }
      setTechnicianModal(false);
    } catch (error: any) {
      toast(error.message || "No se pudo guardar el tecnico", "error");
    }
  }

  function handleDeleteTechnician(id: string) {
    if (!confirm("¿Eliminar este tecnico?")) return;
    try {
      deleteTechnician(id);
      toast("Tecnico eliminado", "info");
    } catch (error: any) {
      toast(error.message || "No se pudo eliminar el tecnico", "error");
    }
  }

  function openAddTool() {
    setEditToolId(null);
    setToolForm(emptyTool());
    setToolModal(true);
  }

  function openAddTechnicianTool(technicianId?: string) {
    setEditTechnicianToolId(null);
    const defaultTechnicianId = technicianId || activeTechnicians[0]?.id || technicians[0]?.id || "";
    setTechnicianToolForm({
      ...emptyTechnicianTool(),
      technicianId: defaultTechnicianId,
    });
    setTechnicianToolModal(true);
  }

  function openEditTechnicianTool(tool: TechnicianTool) {
    setEditTechnicianToolId(tool.id);
    setTechnicianToolForm({
      technicianId: tool.technicianId,
      nombre: tool.nombre,
      cantidad: tool.cantidad,
      marca: tool.marca,
      notas: tool.notas,
    });
    setTechnicianToolModal(true);
  }

  function openEditTool(tool: CompanyTool) {
    setEditToolId(tool.id);
    setToolForm({
      nombre: tool.nombre,
      categoria: tool.categoria,
      marca: tool.marca,
      cantidad: tool.cantidad,
      estado: tool.estado,
      ubicacion: tool.ubicacion,
      notas: tool.notas,
    });
    setToolModal(true);
  }

  function saveTool() {
    if (!toolForm.nombre.trim()) {
      toast("El nombre de la herramienta es obligatorio", "error");
      return;
    }

    try {
      if (editToolId) {
        updateCompanyTool(editToolId, toolForm);
        toast("Herramienta actualizada", "success");
      } else {
        addCompanyTool(toolForm);
        toast("Herramienta registrada", "success");
      }
      setToolModal(false);
    } catch (error: any) {
      toast(error.message || "No se pudo guardar la herramienta", "error");
    }
  }

  function handleDeleteTool(id: string) {
    if (!confirm("¿Eliminar esta herramienta?")) return;
    try {
      deleteCompanyTool(id);
      toast("Herramienta eliminada", "info");
    } catch (error: any) {
      toast(error.message || "No se pudo eliminar la herramienta", "error");
    }
  }

  function saveTechnicianTool() {
    if (!technicianToolForm.technicianId || !technicianToolForm.nombre.trim()) {
      toast("Selecciona tecnico y nombre de herramienta", "error");
      return;
    }

    try {
      if (editTechnicianToolId) {
        updateTechnicianTool(editTechnicianToolId, {
          nombre: technicianToolForm.nombre,
          cantidad: technicianToolForm.cantidad,
          marca: technicianToolForm.marca,
          notas: technicianToolForm.notas,
        });
        toast("Herramienta del tecnico actualizada", "success");
      } else {
        addTechnicianTool({
          technicianId: technicianToolForm.technicianId,
          nombre: technicianToolForm.nombre,
          cantidad: technicianToolForm.cantidad,
          marca: technicianToolForm.marca,
          notas: technicianToolForm.notas,
        });
        toast("Herramienta del tecnico registrada", "success");
      }
      setTechnicianToolModal(false);
    } catch (error: any) {
      toast(error.message || "No se pudo guardar la herramienta del tecnico", "error");
    }
  }

  function handleDeleteTechnicianTool(id: string) {
    if (!confirm("¿Eliminar esta herramienta del tecnico?")) return;
    try {
      deleteTechnicianTool(id);
      toast("Herramienta del tecnico eliminada", "info");
    } catch (error: any) {
      toast(error.message || "No se pudo eliminar", "error");
    }
  }

  function exportTechnicianPDF(tech: Technician) {
    const techTools = technicianTools.filter((t) => t.technicianId === tech.id);
    const activeCompanyAssigned = activeAssignments.filter((a) => a.technicianId === tech.id);

    generateTecnicoHerramientasPDF({
      tecnicoNombre: tech.nombre,
      tecnicoCargo: tech.cargo,
      tecnicoTelefono: tech.telefono,
      herramientasTecnico: techTools.map((t) => ({
        nombre: t.nombre,
        cantidad: t.cantidad,
        marca: t.marca,
        notas: t.notas,
      })),
      herramientasEmpresaAsignadas: activeCompanyAssigned.map((a) => ({
        toolNombre: a.toolNombre,
        fechaEntrega: a.fechaEntrega,
        observaciones: a.observaciones,
      })),
    });
  }

  function openAssignTool(toolId?: string) {
    if (activeTechnicians.length === 0) {
      toast("Primero registra al menos un tecnico activo", "error");
      return;
    }
    if (availableTools.length === 0) {
      toast("No hay herramientas disponibles para entregar", "error");
      return;
    }

    setAssignmentForm({
      technicianId: activeTechnicians[0]?.id || "",
      toolId: toolId || availableTools[0]?.id || "",
      observaciones: "",
    });
    setAssignmentModal(true);
  }

  function saveAssignment() {
    if (!assignmentForm.technicianId || !assignmentForm.toolId) {
      toast("Selecciona tecnico y herramienta", "error");
      return;
    }

    const technician = technicians.find((item) => item.id === assignmentForm.technicianId);
    const tool = companyTools.find((item) => item.id === assignmentForm.toolId);
    if (!technician || !tool) {
      toast("Tecnico o herramienta no validos", "error");
      return;
    }

    try {
      assignTool({
        technicianId: technician.id,
        technicianNombre: technician.nombre,
        toolId: tool.id,
        toolNombre: tool.nombre,
        observaciones: assignmentForm.observaciones,
      });
      toast("Herramienta entregada al tecnico", "success");
      setAssignmentModal(false);
    } catch (error: any) {
      toast(error.message || "No se pudo registrar la entrega", "error");
    }
  }

  function handleReturnTool(assignment: ToolAssignment) {
    if (!confirm(`¿Registrar devolución de ${assignment.toolNombre}?`)) return;
    try {
      returnAssignedTool(assignment.id);
      toast("Devolución registrada", "success");
    } catch (error: any) {
      toast(error.message || "No se pudo registrar la devolución", "error");
    }
  }

  return (
    <div className="animate-fadein">
      {moduleView === "empresa" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 26 }}>
            <StatCard label="Herramientas Empresa" value={companyTools.length} sub="Registro general" icon="🧰" accent="var(--orange)" />
            <StatCard label="Disponibles" value={availableTools.length} sub="Listas para prestar" icon="✅" accent="var(--green)" />
            <StatCard label="Prestamos Activos" value={activeAssignments.length} sub="En manos del personal" icon="📋" accent="var(--yellow)" />
            <StatCard label="Tecnicos Activos" value={activeTechnicians.length} sub="Personal habilitado" icon="👷" accent="var(--blue)" />
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            <Btn variant="ghost" size="sm" onClick={openAddTool}><PackagePlus size={14} /> Nueva herramienta empresa</Btn>
            <Btn variant="success" size="sm" onClick={() => openAssignTool()}><Hammer size={14} /> Prestar herramienta</Btn>
            <Btn variant="ghost" size="sm" onClick={() => generateHerramientasPDF(companyTools, technicians, toolAssignments)}><FileText size={14} /> Exportar PDF empresa</Btn>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 20, marginBottom: 20 }}>
            <div className="card">
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
                <span>🧰</span>
                <span className="font-bebas" style={{ fontSize: 18, letterSpacing: 1.5 }}>Herramientas de Empresa</span>
              </div>
              {companyTools.length === 0 ? (
                <EmptyState icon="🧰" title="Sin herramientas registradas" sub="Agrega herramientas de empresa para prestar al personal" />
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%" }} className="tbl">
                    <thead>
                      <tr><th>Herramienta</th><th>Categoria</th><th>Marca</th><th>Cantidad</th><th>Ubicacion</th><th>Estado</th><th>Tecnico</th><th>Acciones</th></tr>
                    </thead>
                    <tbody>
                      {companyTools.map((tool) => (
                        <tr key={tool.id}>
                          <td style={{ fontWeight: 600 }}>{tool.nombre}</td>
                          <td style={{ color: "var(--text2)", fontSize: 12 }}>{tool.categoria || "-"}</td>
                          <td style={{ color: "var(--text2)", fontSize: 12 }}>{tool.marca || "-"}</td>
                          <td><code style={{ background: "var(--bg3)", padding: "2px 6px", borderRadius: 4, fontSize: 11 }}>{tool.cantidad || "-"}</code></td>
                          <td style={{ color: "var(--text2)", fontSize: 12 }}>{tool.ubicacion || "-"}</td>
                          <td><Badge label={toolLabel[tool.estado]} variant={toolBadge[tool.estado]} /></td>
                          <td style={{ color: "var(--text2)", fontSize: 12 }}>{assignmentByToolId.get(tool.id)?.technicianNombre || "-"}</td>
                          <td>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              {tool.estado === "disponible" && <Btn variant="success" size="sm" onClick={() => openAssignTool(tool.id)}><Hammer size={13} /> Prestar</Btn>}
                              <Btn variant="ghost" size="sm" onClick={() => openEditTool(tool)} title="Editar herramienta"><Pencil size={13} /></Btn>
                              <Btn variant="danger" size="sm" onClick={() => handleDeleteTool(tool.id)} title="Eliminar herramienta"><Trash2 size={13} /></Btn>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="card">
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
                <span>📋</span>
                <span className="font-bebas" style={{ fontSize: 18, letterSpacing: 1.5 }}>Prestamos Activos</span>
              </div>
              {activeAssignments.length === 0 ? (
                <EmptyState icon="🧰" title="Sin herramientas prestadas" sub="Presta herramientas de empresa para ver control activo" />
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%" }} className="tbl">
                    <thead>
                      <tr><th>Tecnico</th><th>Herramienta</th><th>Fecha entrega</th><th>Obs.</th><th>Accion</th></tr>
                    </thead>
                    <tbody>
                      {activeAssignments.map((assignment) => (
                        <tr key={assignment.id}>
                          <td style={{ fontWeight: 600 }}>{assignment.technicianNombre}</td>
                          <td>{assignment.toolNombre}</td>
                          <td style={{ color: "var(--text3)", fontSize: 12 }}>{assignment.fechaEntrega}</td>
                          <td style={{ color: "var(--text2)", fontSize: 12 }}>{assignment.observaciones || "-"}</td>
                          <td>
                            <Btn variant="success" size="sm" onClick={() => handleReturnTool(assignment)}><RotateCcw size={13} /> Devolver</Btn>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
              <span>🕘</span>
              <span className="font-bebas" style={{ fontSize: 18, letterSpacing: 1.5 }}>Historial de Prestamos Empresa</span>
            </div>
            {toolAssignments.length === 0 ? (
              <EmptyState icon="📋" title="Sin historial" sub="Los prestamos y devoluciones de empresa quedan registrados aqui" />
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%" }} className="tbl">
                  <thead>
                    <tr><th>Tecnico</th><th>Herramienta</th><th>Entrega</th><th>Devolucion</th><th>Estado</th></tr>
                  </thead>
                  <tbody>
                    {[...toolAssignments].reverse().map((assignment) => (
                      <tr key={assignment.id}>
                        <td style={{ fontWeight: 600 }}>{assignment.technicianNombre}</td>
                        <td>{assignment.toolNombre}</td>
                        <td style={{ color: "var(--text3)", fontSize: 12 }}>{assignment.fechaEntrega}</td>
                        <td style={{ color: "var(--text3)", fontSize: 12 }}>{assignment.fechaDevolucion || "-"}</td>
                        <td><Badge label={assignment.estado === "activa" ? "Activa" : "Devuelta"} variant={assignment.estado === "activa" ? "badge-orange" : "badge-green"} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {moduleView === "tecnicos" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 26 }}>
            <StatCard label="Tecnicos" value={technicians.length} sub="Personal registrado" icon="👷" accent="var(--blue)" />
            <StatCard label="Activos" value={activeTechnicians.length} sub="Disponibles en sistema" icon="✅" accent="var(--green)" />
            <StatCard label="Herram. Tecnicos" value={technicianTools.length} sub="Herramientas propias" icon="🛠️" accent="var(--orange)" />
            <StatCard label="Prestamos Empresa" value={activeAssignments.length} sub="Asignadas desde empresa" icon="📋" accent="var(--yellow)" />
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            <Btn variant="orange" size="sm" onClick={openAddTechnician}><UserPlus size={14} /> Nuevo tecnico</Btn>
            <Btn variant="ghost" size="sm" onClick={() => openAddTechnicianTool(selectedTechnicianId || undefined)}><PackagePlus size={14} /> Nueva herramienta tecnico</Btn>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 20, marginBottom: 20 }}>
            <div className="card">
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
                <span>👷</span>
                <span className="font-bebas" style={{ fontSize: 18, letterSpacing: 1.5 }}>Tecnicos Herramienta</span>
              </div>
              {technicians.length === 0 ? (
                <EmptyState icon="👷" title="Sin tecnicos registrados" sub="Crea tecnicos para su propio control de herramientas" />
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%" }} className="tbl">
                    <thead>
                      <tr><th>Nombre</th><th>Cargo</th><th>Telefono</th><th>Herram. propio</th><th>Prest. empresa</th><th>Estado</th><th>Acciones</th></tr>
                    </thead>
                    <tbody>
                      {technicians.map((tech) => (
                        <tr key={tech.id}>
                          <td style={{ fontWeight: 600 }}>{tech.nombre}</td>
                          <td style={{ color: "var(--text2)", fontSize: 12 }}>{tech.cargo || "-"}</td>
                          <td style={{ color: "var(--text2)", fontSize: 12 }}>{tech.telefono || "-"}</td>
                          <td style={{ fontWeight: 600 }}>{technicianToolsCount.get(tech.id) || 0}</td>
                          <td style={{ fontWeight: 600 }}>{activeAssignmentByTechnician.get(tech.id) || 0}</td>
                          <td><Badge label={tech.activo ? "Activo" : "Inactivo"} variant={tech.activo ? "badge-green" : "badge-red"} /></td>
                          <td>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              <Btn variant="ghost" size="sm" onClick={() => openAddTechnicianTool(tech.id)} title="Agregar herramienta al tecnico"><PackagePlus size={13} /></Btn>
                              <Btn variant="success" size="sm" onClick={() => exportTechnicianPDF(tech)} title="Exportar PDF tecnico"><FileText size={13} /></Btn>
                              <Btn variant="ghost" size="sm" onClick={() => openEditTechnician(tech)} title="Editar tecnico"><Pencil size={13} /></Btn>
                              <Btn variant="danger" size="sm" onClick={() => handleDeleteTechnician(tech.id)} title="Eliminar tecnico"><Trash2 size={13} /></Btn>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="card">
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span>🛠️</span>
                  <span className="font-bebas" style={{ fontSize: 18, letterSpacing: 1.5 }}>Mini Inventario Tecnico</span>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <select
                    value={selectedTechnicianId}
                    onChange={(e) => setSelectedTechnicianId(e.target.value)}
                    style={{ ...fieldStyle, minWidth: 220, padding: "8px 10px" }}
                  >
                    {technicians.map((tech) => <option key={tech.id} value={tech.id}>{tech.nombre}</option>)}
                  </select>
                  <Btn variant="ghost" size="sm" onClick={() => openAddTechnicianTool(selectedTechnicianId || undefined)}><PackagePlus size={13} /> Agregar</Btn>
                </div>
              </div>

              <div style={{ padding: "10px 20px", borderBottom: "1px solid var(--border)", color: "var(--text2)", fontSize: 12 }}>
                Tecnico: <b>{selectedTechnician?.nombre || "-"}</b> | Herramientas: <b>{selectedTechnicianTools.length}</b>
              </div>

              {technicians.length === 0 ? (
                <EmptyState icon="👷" title="Sin tecnicos" sub="Crea un tecnico para iniciar su mini inventario" />
              ) : selectedTechnicianTools.length === 0 ? (
                <EmptyState icon="🛠️" title="Sin herramientas por tecnico" sub="Registra aqui herramientas propias de este tecnico" />
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%" }} className="tbl">
                    <thead>
                      <tr><th>Herramienta</th><th>Cantidad</th><th>Marca</th><th>Notas</th><th>Acciones</th></tr>
                    </thead>
                    <tbody>
                      {[...selectedTechnicianTools].reverse().map((tool) => (
                        <tr key={tool.id}>
                          <td>{tool.nombre}</td>
                          <td>{tool.cantidad || "-"}</td>
                          <td style={{ color: "var(--text2)", fontSize: 12 }}>{tool.marca || "-"}</td>
                          <td style={{ color: "var(--text2)", fontSize: 12 }}>{tool.notas || "-"}</td>
                          <td>
                            <div style={{ display: "flex", gap: 6 }}>
                              <Btn variant="ghost" size="sm" onClick={() => openEditTechnicianTool(tool)} title="Editar herramienta tecnico"><Pencil size={13} /></Btn>
                              <Btn variant="danger" size="sm" onClick={() => handleDeleteTechnicianTool(tool.id)} title="Eliminar herramienta tecnico"><Trash2 size={13} /></Btn>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <Modal
        open={technicianModal}
        onClose={() => setTechnicianModal(false)}
        title={editTechnicianId ? "Editar Tecnico" : "Nuevo Tecnico"}
        icon="👷"
        footer={<><Btn variant="ghost" onClick={() => setTechnicianModal(false)}>Cancelar</Btn><Btn variant="orange" onClick={saveTechnician}>💾 Guardar</Btn></>}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <FormGroup label="Nombre *" full>
            <input value={technicianForm.nombre} onChange={(e) => setTechnicianForm({ ...technicianForm, nombre: e.target.value })} placeholder="Nombre del tecnico" style={fieldStyle} />
          </FormGroup>
          <FormGroup label="Cargo">
            <input value={technicianForm.cargo} onChange={(e) => setTechnicianForm({ ...technicianForm, cargo: e.target.value })} placeholder="Ej: Tecnico instalador" style={fieldStyle} />
          </FormGroup>
          <FormGroup label="Telefono">
            <input value={technicianForm.telefono} onChange={(e) => setTechnicianForm({ ...technicianForm, telefono: e.target.value })} placeholder="Numero de contacto" style={fieldStyle} />
          </FormGroup>
          <FormGroup label="Notas" full>
            <textarea value={technicianForm.notas} onChange={(e) => setTechnicianForm({ ...technicianForm, notas: e.target.value })} placeholder="Observaciones del tecnico..." style={{ ...fieldStyle, minHeight: 80, resize: "vertical" }} />
          </FormGroup>
          <FormGroup label="Estado" full>
            <select value={technicianForm.activo ? "activo" : "inactivo"} onChange={(e) => setTechnicianForm({ ...technicianForm, activo: e.target.value === "activo" })} style={fieldStyle}>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </FormGroup>
        </div>
      </Modal>

      <Modal
        open={toolModal}
        onClose={() => setToolModal(false)}
        title={editToolId ? "Editar Herramienta" : "Nueva Herramienta de Prestamo"}
        icon="🧰"
        wide
        footer={<><Btn variant="ghost" onClick={() => setToolModal(false)}>Cancelar</Btn><Btn variant="orange" onClick={saveTool}>💾 Guardar</Btn></>}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <FormGroup label="Nombre *">
            <input value={toolForm.nombre} onChange={(e) => setToolForm({ ...toolForm, nombre: e.target.value })} placeholder="Ej: Taladro percutor" style={fieldStyle} />
          </FormGroup>
          <FormGroup label="Categoria">
            <input value={toolForm.categoria} onChange={(e) => setToolForm({ ...toolForm, categoria: e.target.value })} placeholder="Ej: Electrica" style={fieldStyle} />
          </FormGroup>
          <FormGroup label="Marca">
            <input value={toolForm.marca} onChange={(e) => setToolForm({ ...toolForm, marca: e.target.value })} placeholder="Marca" style={fieldStyle} />
          </FormGroup>
          <FormGroup label="Cantidad">
            <input value={toolForm.cantidad} onChange={(e) => setToolForm({ ...toolForm, cantidad: e.target.value })} placeholder="Cantidad" style={fieldStyle} />
          </FormGroup>
          <FormGroup label="Ubicacion">
            <input value={toolForm.ubicacion} onChange={(e) => setToolForm({ ...toolForm, ubicacion: e.target.value })} placeholder="Ej: Estante H-2" style={fieldStyle} />
          </FormGroup>
          <FormGroup label="Estado">
            <select
              value={toolForm.estado}
              onChange={(e) => setToolForm({ ...toolForm, estado: e.target.value as CompanyTool["estado"] })}
              style={fieldStyle}
              disabled={!!editToolId && activeAssignmentByTool.has(editToolId)}
            >
              <option value="disponible">Disponible</option>
              <option value="mantenimiento">Mantenimiento</option>
              <option value="regular">Regular</option>
              <option value="baja">Baja</option>
              {!!editToolId && activeAssignmentByTool.has(editToolId) && <option value="asignada">Asignada</option>}
            </select>
          </FormGroup>
          <FormGroup label="Notas" full>
            <textarea value={toolForm.notas} onChange={(e) => setToolForm({ ...toolForm, notas: e.target.value })} placeholder="Detalles de la herramienta..." style={{ ...fieldStyle, minHeight: 80, resize: "vertical" }} />
          </FormGroup>
        </div>
      </Modal>

      <Modal
        open={assignmentModal}
        onClose={() => setAssignmentModal(false)}
        title="Prestar Herramienta"
        icon="📋"
        footer={<><Btn variant="ghost" onClick={() => setAssignmentModal(false)}>Cancelar</Btn><Btn variant="orange" onClick={saveAssignment}>💾 Registrar prestamo</Btn></>}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
          <FormGroup label="Tecnico">
            <select value={assignmentForm.technicianId} onChange={(e) => setAssignmentForm({ ...assignmentForm, technicianId: e.target.value })} style={fieldStyle}>
              {activeTechnicians.map((tech) => <option key={tech.id} value={tech.id}>{tech.nombre}</option>)}
            </select>
          </FormGroup>
          <FormGroup label="Herramienta">
            <select value={assignmentForm.toolId} onChange={(e) => setAssignmentForm({ ...assignmentForm, toolId: e.target.value })} style={fieldStyle}>
              {availableTools.map((tool) => <option key={tool.id} value={tool.id}>{tool.nombre} {tool.cantidad ? `(${tool.cantidad})` : ""}</option>)}
            </select>
          </FormGroup>
          <FormGroup label="Observaciones">
            <textarea value={assignmentForm.observaciones} onChange={(e) => setAssignmentForm({ ...assignmentForm, observaciones: e.target.value })} placeholder="Estado, accesorios entregados, notas..." style={{ ...fieldStyle, minHeight: 86, resize: "vertical" }} />
          </FormGroup>
        </div>
      </Modal>

      <Modal
        open={technicianToolModal}
        onClose={() => setTechnicianToolModal(false)}
        title={editTechnicianToolId ? "Editar Herramienta de Tecnico" : "Nueva Herramienta de Tecnico"}
        icon="🛠️"
        wide
        footer={<><Btn variant="ghost" onClick={() => setTechnicianToolModal(false)}>Cancelar</Btn><Btn variant="orange" onClick={saveTechnicianTool}>💾 Guardar</Btn></>}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <FormGroup label="Tecnico" full>
            <select
              value={technicianToolForm.technicianId}
              onChange={(e) => setTechnicianToolForm({ ...technicianToolForm, technicianId: e.target.value })}
              style={fieldStyle}
              disabled={!!editTechnicianToolId}
            >
              <option value="">Selecciona un tecnico</option>
              {technicians.map((tech) => <option key={tech.id} value={tech.id}>{tech.nombre}</option>)}
            </select>
          </FormGroup>
          <FormGroup label="Herramienta *">
            <input value={technicianToolForm.nombre} onChange={(e) => setTechnicianToolForm({ ...technicianToolForm, nombre: e.target.value })} placeholder="Ej: Destornillador pala grande" style={fieldStyle} />
          </FormGroup>
          <FormGroup label="Cantidad">
            <input value={technicianToolForm.cantidad} onChange={(e) => setTechnicianToolForm({ ...technicianToolForm, cantidad: e.target.value })} placeholder="Cantidad" style={fieldStyle} />
          </FormGroup>
          <FormGroup label="Marca">
            <input value={technicianToolForm.marca} onChange={(e) => setTechnicianToolForm({ ...technicianToolForm, marca: e.target.value })} placeholder="Marca" style={fieldStyle} />
          </FormGroup>
          <FormGroup label="Notas" full>
            <textarea value={technicianToolForm.notas} onChange={(e) => setTechnicianToolForm({ ...technicianToolForm, notas: e.target.value })} placeholder="Nota adicional..." style={{ ...fieldStyle, minHeight: 80, resize: "vertical" }} />
          </FormGroup>
        </div>
      </Modal>
    </div>
  );
}
