"use client";
import Modal from "@/components/Modal";
import { Download, Pencil, Plus } from "lucide-react";
import { useStore } from "@/store/useStore";
import { Btn, Badge, EmptyState, fieldStyle, FormGroup } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { useState } from "react";

type DispatchForm = {
  projectId: string;
  itemId: string;
  qty: number;
  responsable: string;
  obs: string;
  tipo: "despacho" | "devolucion";
};

export default function DespachosPage() {
  const { dispatches, projects, inventory, addDispatch, addReturn, updateDispatch } = useStore();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<DispatchForm>({
    projectId: "",
    itemId: "",
    qty: 0,
    responsable: "",
    obs: "",
    tipo: "despacho",
  });

  const canCreateDispatch = projects.length > 0 && inventory.length > 0;

  function exportExcel() {
    import("xlsx").then(({ utils, writeFile }) => {
      const data = [...dispatches].reverse().map((d) => ({
        Proyecto: d.projectNombre, Material: d.itemNombre, Referencia: d.itemRef,
        Cantidad: d.qty, Unidad: d.unidad, Tipo: d.tipo,
        Responsable: d.responsable, Observaciones: d.obs, Fecha: d.fecha,
      }));
      const ws = utils.json_to_sheet(data);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "Despachos");
      writeFile(wb, `TESOCOL_Despachos_${new Date().toLocaleDateString("es-CO").replace(/\//g,"-")}.xlsx`);
      toast("Excel exportado", "success");
    });
  }

  function openCreate() {
    if (!canCreateDispatch) {
      toast("Debes crear al menos un proyecto y un material antes de registrar despachos", "error");
      return;
    }
    setEditId(null);
    setForm({
      projectId: projects[0]?.id || "",
      itemId: inventory[0]?.id || "",
      qty: 0,
      responsable: "",
      obs: "",
      tipo: "despacho",
    });
    setModalOpen(true);
  }

  function openEdit(d: typeof dispatches[number]) {
    setEditId(d.id);
    setForm({
      projectId: d.projectId,
      itemId: d.itemId,
      qty: d.qty,
      responsable: d.responsable,
      obs: d.obs,
      tipo: d.tipo,
    });
    setModalOpen(true);
  }

  function saveDispatch() {
    if (!form.projectId || !form.itemId || form.qty <= 0) {
      toast("Proyecto, material y cantidad son obligatorios", "error");
      return;
    }

    const project = projects.find((p) => p.id === form.projectId);
    const item = inventory.find((i) => i.id === form.itemId);
    if (!project || !item) {
      toast("Proyecto o material no válido", "error");
      return;
    }

    try {
      if (editId) {
        updateDispatch(editId, {
          projectId: project.id,
          projectNombre: project.nombre,
          itemId: item.id,
          itemNombre: item.nombre,
          itemRef: item.ref,
          unidad: item.unidad,
          qty: form.qty,
          responsable: form.responsable,
          obs: form.obs,
          tipo: form.tipo,
        });
        toast("Despacho actualizado", "success");
      } else if (form.tipo === "devolucion") {
        addReturn({
          projectId: project.id,
          projectNombre: project.nombre,
          itemId: item.id,
          itemNombre: item.nombre,
          itemRef: item.ref,
          unidad: item.unidad,
          qty: form.qty,
          responsable: form.responsable,
          obs: form.obs,
        });
        toast("Retorno registrado", "success");
      } else {
        addDispatch({
          projectId: project.id,
          projectNombre: project.nombre,
          itemId: item.id,
          itemNombre: item.nombre,
          itemRef: item.ref,
          unidad: item.unidad,
          qty: form.qty,
          responsable: form.responsable,
          obs: form.obs,
          tipo: "despacho",
        });
        toast("Despacho registrado", "success");
      }
      setModalOpen(false);
    } catch (e: any) {
      toast(e.message || "No se pudo guardar el despacho", "error");
    }
  }

  return (
    <div className="animate-fadein">
      <div className="card">
        <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:8 }}>
          <span>🚚</span>
          <span className="font-bebas" style={{ fontSize:18, letterSpacing:1.5 }}>Registro de Despachos</span>
          <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
            <Btn variant="orange" size="sm" onClick={openCreate}><Plus size={14}/> Nuevo</Btn>
            <Btn variant="ghost" size="sm" onClick={exportExcel}><Download size={14}/> Excel</Btn>
          </div>
        </div>
        {dispatches.length === 0 ? (
          <EmptyState icon="🚚" title="Sin despachos registrados" sub="Puedes crear uno nuevo desde el boton Nuevo" />
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%" }} className="tbl">
              <thead>
                <tr><th>Proyecto</th><th>Material</th><th>Ref.</th><th>Cantidad</th><th>Responsable</th><th>Fecha</th><th>Tipo</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {[...dispatches].reverse().map((d) => (
                  <tr key={d.id}>
                    <td style={{ fontSize:13, fontWeight:500 }}>{d.projectNombre}</td>
                    <td style={{ fontSize:13 }}>{d.itemNombre}</td>
                    <td><code style={{ background:"var(--bg3)", padding:"2px 6px", borderRadius:4, fontSize:11 }}>{d.itemRef||"—"}</code></td>
                    <td><strong>{d.qty}</strong> <span style={{ fontSize:11, color:"var(--text2)" }}>{d.unidad}</span></td>
                    <td style={{ color:"var(--text2)", fontSize:12 }}>{d.responsable||"—"}</td>
                    <td style={{ color:"var(--text3)", fontSize:12 }}>{d.fecha}</td>
                    <td><Badge label={d.tipo==="despacho"?"🚚 Salida":"↩️ Retorno"} variant={d.tipo==="despacho"?"badge-orange":"badge-green"} /></td>
                    <td>
                      <Btn variant="ghost" size="sm" onClick={() => openEdit(d)} title="Editar despacho"><Pencil size={13}/> Editar</Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? "Editar Despacho" : "Nuevo Despacho"}
        icon="🚚"
        footer={<><Btn variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Btn><Btn variant="orange" onClick={saveDispatch}>💾 Guardar</Btn></>}
      >
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <FormGroup label="Proyecto" full>
            <select value={form.projectId} onChange={(e)=>setForm({ ...form, projectId: e.target.value })} style={fieldStyle}>
              <option value="">Seleccionar proyecto...</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </FormGroup>
          <FormGroup label="Material" full>
            <select value={form.itemId} onChange={(e)=>setForm({ ...form, itemId: e.target.value })} style={fieldStyle}>
              <option value="">Seleccionar material...</option>
              {inventory.map((i) => <option key={i.id} value={i.id}>{i.nombre} (Stock: {i.stock} {i.unidad})</option>)}
            </select>
          </FormGroup>
          <FormGroup label="Tipo">
            <select value={form.tipo} onChange={(e)=>setForm({ ...form, tipo: e.target.value as DispatchForm["tipo"] })} style={fieldStyle}>
              <option value="despacho">Salida</option>
              <option value="devolucion">Retorno</option>
            </select>
          </FormGroup>
          <FormGroup label="Cantidad">
            <input type="number" min={1} value={form.qty || ""} onChange={(e)=>setForm({ ...form, qty: +e.target.value })} style={fieldStyle} />
          </FormGroup>
          <FormGroup label="Responsable">
            <input value={form.responsable} onChange={(e)=>setForm({ ...form, responsable: e.target.value })} placeholder="Nombre" style={fieldStyle} />
          </FormGroup>
          <FormGroup label="Observaciones">
            <input value={form.obs} onChange={(e)=>setForm({ ...form, obs: e.target.value })} placeholder="Notas..." style={fieldStyle} />
          </FormGroup>
        </div>
      </Modal>
    </div>
  );
}
