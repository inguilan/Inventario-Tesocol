"use client";
import { useState } from "react";
import { Plus, ArrowLeft, FileText, Truck, RotateCcw, Pencil, Trash2 } from "lucide-react";
import { useStore, getStockStatus, Project } from "@/store/useStore";
import { Btn, FormGroup, fieldStyle, Badge, EmptyState } from "@/components/ui";
import Modal from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { generateProjectPDF } from "@/lib/pdf";

type Filter = "all" | "activo" | "pausado" | "finalizado";

const statusBadge: Record<string,string> = { activo:"badge-green", pausado:"badge-yellow", finalizado:"badge-blue" };
const statusEmoji: Record<string,string> = { activo:"🟢", pausado:"🟡", finalizado:"🔵" };

const emptyProj = (): Omit<Project,"id"> => ({ nombre:"", lider:"", desc:"", ubicacion:"", fecha:new Date().toISOString().slice(0,10), status:"activo" });

export default function ProyectosPage() {
  const { projects, dispatches, inventory, addProject, updateProject, deleteProject, addDispatch, addReturn } = useStore();
  const { toast } = useToast();

  const [filter, setFilter]             = useState<Filter>("all");
  const [selected, setSelected]         = useState<string|null>(null);
  const [projModal, setProjModal]       = useState(false);
  const [dispatchModal, setDispatch]    = useState(false);
  const [returnModal, setReturn]        = useState(false);
  const [editProjId, setEditProjId]     = useState<string|null>(null);
  const [projForm, setProjForm]         = useState(emptyProj());
  const [dispRows, setDispRows]         = useState([{ itemId:"", qty:0, resp:"", obs:"" }]);
  const [retForm, setRetForm]           = useState({ itemId:"", qty:0, resp:"", obs:"" });

  const project = selected ? projects.find((p)=>p.id===selected) : null;
  const projDispatches = dispatches.filter((d)=>d.projectId===selected);

  const filtered = projects.filter((p) => filter==="all" || p.status===filter);

  // ── Project CRUD ──
  function openAddProject() { setEditProjId(null); setProjForm(emptyProj()); setProjModal(true); }
  function openEditProject(p: Project) { setEditProjId(p.id); setProjForm({ nombre:p.nombre, lider:p.lider, desc:p.desc, ubicacion:p.ubicacion, fecha:p.fecha, status:p.status }); setProjModal(true); }
  function saveProject() {
    if (!projForm.nombre.trim() || !projForm.lider.trim()) { toast("Nombre y líder son obligatorios","error"); return; }
    if (editProjId) { updateProject(editProjId, projForm); toast("Proyecto actualizado","success"); }
    else { addProject(projForm); toast("Proyecto creado","success"); }
    setProjModal(false);
  }
  function handleDeleteProject(id: string) {
    if (!confirm("¿Eliminar este proyecto?")) return;
    deleteProject(id); if (selected===id) setSelected(null);
    toast("Proyecto eliminado","info");
  }

  // ── Dispatch ──
  function saveDispatch() {
    const valid = dispRows.filter((r)=>r.itemId && r.qty>0);
    if (!valid.length) { toast("Agrega al menos un material con cantidad","error"); return; }
    try {
      valid.forEach((r) => {
        const item = inventory.find((i)=>i.id===r.itemId)!;
        addDispatch({ projectId:selected!, projectNombre:project!.nombre, itemId:r.itemId, itemNombre:item.nombre, itemRef:item.ref, unidad:item.unidad, qty:r.qty, responsable:r.resp, obs:r.obs, tipo:"despacho" });
      });
      toast("Despacho registrado","success");
      setDispatch(false);
      setDispRows([{ itemId:"", qty:0, resp:"", obs:"" }]);
    } catch(e:any) { toast(e.message,"error"); }
  }

  // ── Return ──
  function saveReturn() {
    if (!retForm.itemId || retForm.qty<=0) { toast("Selecciona material y cantidad","error"); return; }
    try {
      const item = inventory.find((i)=>i.id===retForm.itemId)!;
      addReturn({ projectId:selected!, projectNombre:project!.nombre, itemId:retForm.itemId, itemNombre:item.nombre, itemRef:item.ref, unidad:item.unidad, qty:retForm.qty, responsable:retForm.resp, obs:retForm.obs });
      toast("Devolución registrada. Stock actualizado.","success");
      setReturn(false);
    } catch(e:any) { toast(e.message,"error"); }
  }

  // ── Dispatched items for return select ──
  const dispatchedItems = [...new Map(projDispatches.filter((d)=>d.tipo==="despacho").map((d)=>[d.itemId,{ id:d.itemId, nombre:d.itemNombre }])).values()];

  // ── Project detail view ──
  if (selected && project) {
    return (
      <div className="animate-fadein">
        <button onClick={()=>setSelected(null)} style={{ display:"inline-flex", alignItems:"center", gap:8, color:"var(--text2)", background:"none", border:"none", cursor:"pointer", fontSize:13, marginBottom:20 }}>
          <ArrowLeft size={16}/> Volver a Proyectos
        </button>

        <div style={{ display:"flex", alignItems:"flex-start", gap:20, marginBottom:24, flexWrap:"wrap" }}>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:6 }}>
              <h2 className="font-bebas" style={{ fontSize:32, letterSpacing:2 }}>{project.nombre}</h2>
              <Badge label={`${statusEmoji[project.status]} ${project.status}`} variant={statusBadge[project.status]||"badge-blue"} />
            </div>
            <p style={{ color:"var(--text2)", fontSize:13, marginBottom:10 }}>{project.desc||"Sin descripción"}</p>
            <div style={{ display:"flex", gap:18, fontSize:13, color:"var(--text2)", flexWrap:"wrap" }}>
              <span>👷 Líder: <strong style={{ color:"var(--text)" }}>{project.lider}</strong></span>
              <span>📅 <strong style={{ color:"var(--text)" }}>{project.fecha}</strong></span>
              <span>📍 <strong style={{ color:"var(--text)" }}>{project.ubicacion||"Sin ubicación"}</strong></span>
            </div>
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <Btn variant="ghost" size="sm" onClick={()=>generateProjectPDF(project, projDispatches)}><FileText size={14}/> PDF</Btn>
            <Btn variant="orange" size="sm" onClick={()=>{ setDispRows([{itemId:"",qty:0,resp:"",obs:""}]); setDispatch(true); }}><Truck size={14}/> Despachar</Btn>
            <Btn variant="success" size="sm" onClick={()=>{ setRetForm({itemId:dispatchedItems[0]?.id||"",qty:0,resp:"",obs:""}); setReturn(true); }}><RotateCcw size={14}/> Devolver</Btn>
          </div>
        </div>

        <div className="card">
          <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--border)" }}>
            <span className="font-bebas" style={{ fontSize:18, letterSpacing:1.5 }}>📋 Historial de Materiales</span>
          </div>
          {projDispatches.length===0 ? <EmptyState icon="🚚" title="Sin movimientos" sub="Despacha materiales para ver el historial" /> : (
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%" }} className="tbl">
                <thead><tr><th>Material</th><th>Ref.</th><th>Despachado</th><th>Devuelto</th><th>Responsable</th><th>Fecha</th><th>Tipo</th></tr></thead>
                <tbody>
                  {projDispatches.map((d)=>(
                    <tr key={d.id}>
                      <td style={{ fontWeight:500 }}>{d.itemNombre}</td>
                      <td><code style={{ background:"var(--bg3)", padding:"2px 6px", borderRadius:4, fontSize:11 }}>{d.itemRef}</code></td>
                      <td>{d.tipo==="despacho"?<strong>{d.qty} {d.unidad}</strong>:"—"}</td>
                      <td>{d.tipo==="devolucion"?<strong style={{ color:"var(--green)" }}>{d.qty} {d.unidad}</strong>:"—"}</td>
                      <td style={{ color:"var(--text2)", fontSize:12 }}>{d.responsable||"—"}</td>
                      <td style={{ color:"var(--text3)", fontSize:12 }}>{d.fecha}</td>
                      <td><Badge label={d.tipo==="despacho"?"🚚 Salida":"↩️ Retorno"} variant={d.tipo==="despacho"?"badge-orange":"badge-green"} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Dispatch Modal */}
        <Modal open={dispatchModal} onClose={()=>setDispatch(false)} title="Despachar Material" icon="🚚" wide
          footer={<><Btn variant="ghost" onClick={()=>setDispatch(false)}>Cancelar</Btn><Btn variant="orange" onClick={saveDispatch}>🚚 Confirmar Despacho</Btn></>}
        >
          <div style={{ background:"var(--orange-glow)", border:"1px solid rgba(245,98,15,0.25)", borderRadius:8, padding:"10px 14px", marginBottom:18, fontSize:13, color:"var(--orange)", fontWeight:600 }}>
            📁 {project.nombre}
          </div>
          {dispRows.map((row,i)=>(
            <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:16, paddingBottom:16, borderBottom: i<dispRows.length-1?"1px solid var(--border)":"none" }}>
              <FormGroup label={`Material ${i>0?i+1:""}`} full>
                <select value={row.itemId} onChange={(e)=>{ const r=[...dispRows]; r[i].itemId=e.target.value; setDispRows(r); }} style={fieldStyle}>
                  <option value="">Seleccionar material...</option>
                  {inventory.map((inv)=><option key={inv.id} value={inv.id}>{inv.nombre} (Stock: {inv.stock} {inv.unidad})</option>)}
                </select>
              </FormGroup>
              <FormGroup label="Cantidad"><input type="number" min={1} value={row.qty||""} onChange={(e)=>{ const r=[...dispRows]; r[i].qty=+e.target.value; setDispRows(r); }} style={fieldStyle} /></FormGroup>
              <FormGroup label="Responsable"><input value={row.resp} onChange={(e)=>{ const r=[...dispRows]; r[i].resp=e.target.value; setDispRows(r); }} placeholder="Nombre" style={fieldStyle} /></FormGroup>
              <FormGroup label="Observaciones"><input value={row.obs} onChange={(e)=>{ const r=[...dispRows]; r[i].obs=e.target.value; setDispRows(r); }} placeholder="Notas..." style={fieldStyle} /></FormGroup>
            </div>
          ))}
          <Btn variant="ghost" size="sm" onClick={()=>setDispRows([...dispRows,{itemId:"",qty:0,resp:"",obs:""}])}>+ Agregar otro material</Btn>
        </Modal>

        {/* Return Modal */}
        <Modal open={returnModal} onClose={()=>setReturn(false)} title="Registrar Devolución" icon="↩️"
          footer={<><Btn variant="ghost" onClick={()=>setReturn(false)}>Cancelar</Btn><Btn variant="success" onClick={saveReturn}>↩️ Registrar</Btn></>}
        >
          <div style={{ background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:8, padding:"10px 14px", marginBottom:18, fontSize:13, color:"var(--green)", fontWeight:600 }}>
            📁 {project.nombre}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <FormGroup label="Material a Devolver" full>
              <select value={retForm.itemId} onChange={(e)=>setRetForm({...retForm,itemId:e.target.value})} style={fieldStyle}>
                {dispatchedItems.map((d)=><option key={d.id} value={d.id}>{d.nombre}</option>)}
              </select>
            </FormGroup>
            <FormGroup label="Cantidad que Regresa"><input type="number" min={1} value={retForm.qty||""} onChange={(e)=>setRetForm({...retForm,qty:+e.target.value})} style={fieldStyle} /></FormGroup>
            <FormGroup label="Registrado por"><input value={retForm.resp} onChange={(e)=>setRetForm({...retForm,resp:e.target.value})} placeholder="Nombre" style={fieldStyle} /></FormGroup>
            <FormGroup label="Observaciones" full><textarea value={retForm.obs} onChange={(e)=>setRetForm({...retForm,obs:e.target.value})} placeholder="Estado del material..." style={{ ...fieldStyle, minHeight:72, resize:"vertical" }} /></FormGroup>
          </div>
        </Modal>
      </div>
    );
  }

  // ── Projects grid ──
  return (
    <div className="animate-fadein">
      <div style={{ display:"flex", gap:10, marginBottom:22, alignItems:"center", flexWrap:"wrap" }}>
        {(["all","activo","pausado","finalizado"] as Filter[]).map((f)=>(
          <button key={f} onClick={()=>setFilter(f)} style={{ padding:"6px 16px", borderRadius:20, border:"1px solid", fontSize:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all .15s", background: filter===f?"var(--orange-glow)":"var(--bg3)", borderColor: filter===f?"rgba(245,98,15,0.3)":"var(--border)", color: filter===f?"var(--orange)":"var(--text2)", fontWeight: filter===f?600:400 }}>
            {{all:"Todos",activo:"Activos",pausado:"Pausados",finalizado:"Finalizados"}[f]}
          </button>
        ))}
        <div style={{ marginLeft:"auto" }}>
          <Btn variant="orange" size="sm" onClick={openAddProject}><Plus size={14}/> Nueva Obra</Btn>
        </div>
      </div>

      {filtered.length===0 ? (
        <EmptyState icon="📁" title="Sin proyectos" sub="Crea tu primera obra para gestionar materiales" />
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:16 }}>
          {filtered.map((p)=>{
            const pd = dispatches.filter((d)=>d.projectId===p.id);
            const returned = pd.filter((d)=>d.tipo==="devolucion").length;
            const pct = pd.length ? Math.min((returned/pd.length)*100,100) : 0;
            return (
              <div key={p.id} onClick={()=>setSelected(p.id)} style={{ background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:12, overflow:"hidden", cursor:"pointer", transition:"all .2s" }}
                onMouseEnter={(e)=>{ e.currentTarget.style.borderColor="var(--orange)"; e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 8px 40px rgba(245,98,15,0.14)"; }}
                onMouseLeave={(e)=>{ e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="none"; }}
              >
                <div style={{ height:76, background:"linear-gradient(135deg,var(--orange-dark),var(--orange))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:34, position:"relative" }}>
                  ☀️
                  <div style={{ position:"absolute", top:10, right:10 }}>
                    <Badge label={`${statusEmoji[p.status]} ${p.status}`} variant={statusBadge[p.status]||"badge-blue"} />
                  </div>
                </div>
                <div style={{ padding:16 }}>
                  <div className="font-bebas" style={{ fontSize:18, letterSpacing:1, marginBottom:3 }}>{p.nombre}</div>
                  <div style={{ fontSize:12, color:"var(--text2)", marginBottom:10 }}>{p.ubicacion||"Sin ubicación"} · {p.fecha}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:"var(--text2)", marginBottom:12 }}>
                    <div style={{ width:22, height:22, background:"var(--orange)", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:"white" }}>{p.lider[0].toUpperCase()}</div>
                    {p.lider}
                  </div>
                  <div style={{ display:"flex", gap:16, marginBottom:10 }}>
                    <div style={{ textAlign:"center" }}>
                      <div className="font-bebas" style={{ fontSize:22, color:"var(--orange)" }}>{pd.length}</div>
                      <div style={{ fontSize:10, color:"var(--text3)", textTransform:"uppercase", letterSpacing:1 }}>Despachos</div>
                    </div>
                    <div style={{ textAlign:"center" }}>
                      <div className="font-bebas" style={{ fontSize:22, color:"var(--green)" }}>{returned}</div>
                      <div style={{ fontSize:10, color:"var(--text3)", textTransform:"uppercase", letterSpacing:1 }}>Devueltos</div>
                    </div>
                  </div>
                  <div style={{ height:4, background:"var(--bg4)", borderRadius:2, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${pct}%`, background:"var(--orange)", borderRadius:2, transition:"width .6s" }} />
                  </div>
                  {/* Edit/Delete buttons */}
                  <div style={{ display:"flex", gap:6, marginTop:12 }} onClick={(e)=>e.stopPropagation()}>
                    <Btn variant="ghost" size="sm" onClick={()=>openEditProject(p)}><Pencil size={12}/> Editar</Btn>
                    <Btn variant="danger" size="sm" onClick={()=>handleDeleteProject(p.id)}><Trash2 size={12}/> Eliminar</Btn>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Project Modal */}
      <Modal open={projModal} onClose={()=>setProjModal(false)} title={editProjId?"Editar Proyecto":"Nueva Obra"} icon="📁"
        footer={<><Btn variant="ghost" onClick={()=>setProjModal(false)}>Cancelar</Btn><Btn variant="orange" onClick={saveProject}>💾 {editProjId?"Actualizar":"Crear"}</Btn></>}
      >
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <FormGroup label="Nombre del Proyecto *" full>
            <input value={projForm.nombre} onChange={(e)=>setProjForm({...projForm,nombre:e.target.value})} placeholder="Ej: Peñatex Cali — Sistema FV Industrial" style={fieldStyle} />
          </FormGroup>
          <FormGroup label="Descripción" full>
            <textarea value={projForm.desc} onChange={(e)=>setProjForm({...projForm,desc:e.target.value})} placeholder="Descripción del proyecto..." style={{ ...fieldStyle, minHeight:72, resize:"vertical" }} />
          </FormGroup>
          <FormGroup label="Líder del Proyecto *">
            <input value={projForm.lider} onChange={(e)=>setProjForm({...projForm,lider:e.target.value})} placeholder="Nombre completo" style={fieldStyle} />
          </FormGroup>
          <FormGroup label="Ubicación">
            <input value={projForm.ubicacion} onChange={(e)=>setProjForm({...projForm,ubicacion:e.target.value})} placeholder="Ej: Cali, Valle del Cauca" style={fieldStyle} />
          </FormGroup>
          <FormGroup label="Fecha de Inicio">
            <input type="date" value={projForm.fecha} onChange={(e)=>setProjForm({...projForm,fecha:e.target.value})} style={fieldStyle} />
          </FormGroup>
          <FormGroup label="Estado">
            <select value={projForm.status} onChange={(e)=>setProjForm({...projForm,status:e.target.value as Project["status"]})} style={fieldStyle}>
              <option value="activo">Activo</option>
              <option value="pausado">Pausado</option>
              <option value="finalizado">Finalizado</option>
            </select>
          </FormGroup>
        </div>
      </Modal>
    </div>
  );
}
