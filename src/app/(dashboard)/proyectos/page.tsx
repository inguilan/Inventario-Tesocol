"use client";
import Modal from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { Badge, Btn, EmptyState, fieldStyle, FormGroup } from "@/components/ui";
import { generateProjectPDF } from "@/lib/pdf";
import { Project, useStore } from "@/store/useStore";
import { ArrowLeft, ChevronDown, ChevronUp, FileText, Pencil, Plus, RotateCcw, Search, Trash2, Truck } from "lucide-react";
import { useState } from "react";

type Filter = "all" | "activo" | "pausado" | "finalizado";

type DispatchRow = {
  itemId: string;
  qty: number;
  resp: string;
  obs: string;
  materialQuery: string;
  materialCategory: string;
};

const statusBadge: Record<string,string> = { activo:"badge-green", pausado:"badge-yellow", finalizado:"badge-blue" };
const statusEmoji: Record<string,string> = { activo:"🟢", pausado:"🟡", finalizado:"🔵" };

const emptyProj = (): Omit<Project,"id"> => ({ nombre:"", lider:"", desc:"", ubicacion:"", fecha:new Date().toISOString().slice(0,10), status:"activo" });
const emptyDispatchRow = (): DispatchRow => ({ itemId:"", qty:0, resp:"", obs:"", materialQuery:"", materialCategory:"all" });

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
  const [dispRows, setDispRows]         = useState<DispatchRow[]>([emptyDispatchRow()]);
  const [activeDispatchRow, setActiveDispatchRow] = useState(0);
  const [retForm, setRetForm]           = useState({ itemId:"", qty:0, resp:"", obs:"" });

  const materialCategories = Array.from(new Set(inventory.map((i) => i.categoria))).sort((a, b) => a.localeCompare(b, "es"));

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
      setDispRows([emptyDispatchRow()]);
      setActiveDispatchRow(0);
    } catch(e:any) { toast(e.message,"error"); }
  }

  function updateDispatchRow(index: number, patch: Partial<DispatchRow>) {
    setDispRows((rows) => rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  }

  function removeDispatchRow(index: number) {
    setDispRows((rows) => {
      if (rows.length === 1) return [emptyDispatchRow()];
      return rows.filter((_, rowIndex) => rowIndex !== index);
    });
    setActiveDispatchRow((current) => {
      if (dispRows.length <= 1) return 0;
      if (index < current) return current - 1;
      if (index === current) return Math.max(0, current - 1);
      return current;
    });
  }

  function getFilteredInventory(row: DispatchRow) {
    const term = row.materialQuery.trim().toLowerCase();

    return inventory.filter((inv) => {
      const byCategory = row.materialCategory === "all" || inv.categoria === row.materialCategory;
      if (!byCategory) return false;
      if (!term) return true;
      const haystack = `${inv.nombre} ${inv.ref} ${inv.categoria} ${inv.desc} ${inv.proveedor}`.toLowerCase();
      return haystack.includes(term);
    }).sort((a, b) => {
      if (!term) return a.nombre.localeCompare(b.nombre, "es");

      const getScore = (item: typeof inventory[number]) => {
        const nombre = item.nombre.toLowerCase();
        const referencia = item.ref.toLowerCase();
        const categoria = item.categoria.toLowerCase();
        if (nombre.startsWith(term)) return 0;
        if (referencia.startsWith(term)) return 1;
        if (nombre.includes(term)) return 2;
        if (referencia.includes(term)) return 3;
        if (categoria.includes(term)) return 4;
        return 5;
      };

      return getScore(a) - getScore(b) || a.nombre.localeCompare(b.nombre, "es");
    });
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
            <Btn variant="orange" size="sm" onClick={()=>{ setDispRows([emptyDispatchRow()]); setActiveDispatchRow(0); setDispatch(true); }}><Truck size={14}/> Despachar</Btn>
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
          <div style={{ display:"grid", gap:12 }}>
            {dispRows.map((row,i)=>{
              const selectedItem = inventory.find((inv) => inv.id === row.itemId);
              const filteredInventory = getFilteredInventory(row);
              const isActive = activeDispatchRow === i;
              const visibleResults = filteredInventory.slice(0, 6);
              const showResults = isActive && (row.materialQuery.trim().length > 0 || row.materialCategory !== "all" || !selectedItem);

              return (
                <div key={i} style={{ border:"1px solid var(--border)", borderRadius:14, background:isActive ? "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(245,98,15,0.03))" : "var(--bg2)", overflow:"hidden" }}>
                  <button
                    type="button"
                    onClick={() => setActiveDispatchRow(i)}
                    style={{ width:"100%", background:"transparent", border:"none", color:"inherit", cursor:"pointer", padding:"14px 16px", display:"flex", alignItems:"center", gap:12, textAlign:"left" }}
                  >
                    <div style={{ width:30, height:30, borderRadius:999, background:isActive ? "var(--orange)" : "var(--bg3)", color:isActive ? "white" : "var(--text2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, flexShrink:0 }}>
                      {i + 1}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                        <span style={{ fontSize:13, fontWeight:700, color:"var(--text)" }}>
                          {selectedItem ? selectedItem.nombre : `Material ${i + 1}`}
                        </span>
                        {selectedItem && <span style={{ fontSize:11, color:"var(--orange)" }}>{selectedItem.categoria || "Sin categoría"}</span>}
                      </div>
                      <div style={{ fontSize:12, color:"var(--text2)", marginTop:3 }}>
                        {selectedItem ? `${selectedItem.ref || "Sin referencia"} · ${row.qty || 0} ${selectedItem.unidad}` : "Selecciona el material y completa los datos"}
                      </div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      {dispRows.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeDispatchRow(i); }}
                          style={{ background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:8, color:"var(--text2)", width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}
                          title="Eliminar material"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      {isActive ? <ChevronUp size={16} color="currentColor" /> : <ChevronDown size={16} color="currentColor" />}
                    </div>
                  </button>

                  {isActive && (
                    <div style={{ padding:"0 16px 16px", display:"grid", gap:14 }}>
                      <div style={{ border:"1px solid rgba(245,98,15,0.22)", background:"rgba(245,98,15,0.06)", borderRadius:12, padding:12, display:"grid", gap:10 }}>
                        <div style={{ display:"grid", gridTemplateColumns:"170px 1fr", gap:10 }}>
                          <select
                            value={row.materialCategory}
                            onChange={(e)=>updateDispatchRow(i, { materialCategory:e.target.value })}
                            style={{ ...fieldStyle, background:"var(--bg2)", borderRadius:12 }}
                          >
                            <option value="all">Categorías</option>
                            {materialCategories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                          </select>
                          <div style={{ position:"relative" }}>
                            <Search size={15} style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"var(--text2)" }} />
                            <input
                              value={row.materialQuery}
                              onChange={(e)=>updateDispatchRow(i, { materialQuery:e.target.value, itemId: row.itemId && selectedItem?.nombre === row.materialQuery ? "" : row.itemId })}
                              placeholder="Escribe el nombre del producto o la referencia"
                              style={{ ...fieldStyle, paddingLeft:40, background:"var(--bg2)", borderRadius:12, fontSize:14, paddingTop:12, paddingBottom:12 }}
                            />
                          </div>
                        </div>

                        {showResults ? (
                          <div style={{ border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, background:"rgba(8,8,8,0.24)", padding:8, display:"grid", gap:8 }}>
                            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, flexWrap:"wrap", fontSize:12, color:"var(--text2)", padding:"2px 4px" }}>
                              <span>{filteredInventory.length} resultado{filteredInventory.length === 1 ? "" : "s"}</span>
                              <span>Haz clic para agregarlo al despacho</span>
                            </div>

                            <div style={{ display:"grid", gap:8, maxHeight:260, overflowY:"auto", paddingRight:4 }}>
                              {visibleResults.length === 0 ? (
                                <div style={{ border:"1px dashed var(--border)", borderRadius:10, padding:"16px 14px", color:"var(--text2)", fontSize:12, textAlign:"center" }}>
                                  No hay materiales que coincidan con esa búsqueda.
                                </div>
                              ) : (
                                visibleResults.map((inv) => {
                                  const active = row.itemId === inv.id;
                                  return (
                                    <button
                                      key={inv.id}
                                      type="button"
                                      onClick={() => updateDispatchRow(i, { itemId:inv.id, materialQuery:inv.nombre })}
                                      style={{
                                        background: active ? "linear-gradient(135deg, rgba(245,98,15,0.22), rgba(245,98,15,0.10))" : "var(--bg2)",
                                        border: active ? "1px solid rgba(245,98,15,0.45)" : "1px solid var(--border)",
                                        borderRadius:14,
                                        padding:"12px 13px",
                                        color:"var(--text)",
                                        textAlign:"left",
                                        cursor:"pointer",
                                        display:"grid",
                                        gap:6,
                                        boxShadow: active ? "0 8px 24px rgba(245,98,15,0.10)" : "none",
                                      }}
                                    >
                                      <div style={{ display:"flex", alignItems:"center", gap:8, justifyContent:"space-between" }}>
                                        <strong style={{ fontSize:13 }}>{inv.nombre}</strong>
                                        <span style={{ fontSize:11, color: active ? "var(--orange)" : "var(--text2)" }}>{inv.stock} {inv.unidad}</span>
                                      </div>
                                      <div style={{ display:"flex", gap:8, flexWrap:"wrap", fontSize:11, color:"var(--text2)" }}>
                                        <span>{inv.categoria || "Sin categoría"}</span>
                                        <span>{inv.ref || "Sin referencia"}</span>
                                        <span>{inv.ubicacion || "Sin ubicación"}</span>
                                      </div>
                                      <div style={{ fontSize:11, color:"var(--text2)", lineHeight:1.4 }}>
                                        {inv.desc || "Sin especificaciones registradas"}
                                      </div>
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontSize:12, color:"var(--text2)", padding:"4px 2px 0" }}>
                            Escribe el nombre del material para verlo y agregarlo rápidamente.
                          </div>
                        )}
                      </div>

                      {selectedItem && (
                        <div style={{ border:"1px solid var(--border)", borderRadius:12, background:"var(--bg2)", padding:"12px 14px", display:"grid", gap:8 }}>
                          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, flexWrap:"wrap" }}>
                            <strong style={{ fontSize:13, color:"var(--text)" }}>{selectedItem.nombre}</strong>
                            <span style={{ fontSize:11, color:"var(--orange)" }}>Disponible: {selectedItem.stock} {selectedItem.unidad}</span>
                          </div>
                          <div style={{ fontSize:12, color:"var(--text2)", display:"flex", gap:10, flexWrap:"wrap" }}>
                            <span>Ref: {selectedItem.ref || "—"}</span>
                            <span>Categoría: {selectedItem.categoria || "—"}</span>
                            <span>Ubicación: {selectedItem.ubicacion || "—"}</span>
                          </div>
                          <div style={{ fontSize:12, color:"var(--text2)", lineHeight:1.45 }}>
                            <strong style={{ color:"var(--text)" }}>Especificaciones:</strong> {selectedItem.desc || " Sin especificaciones"}
                          </div>
                        </div>
                      )}

                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                        <FormGroup label="Cantidad">
                          <input type="number" min={1} value={row.qty||""} onChange={(e)=>updateDispatchRow(i, { qty:+e.target.value })} style={fieldStyle} />
                        </FormGroup>
                        <FormGroup label="Responsable">
                          <input value={row.resp} onChange={(e)=>updateDispatchRow(i, { resp:e.target.value })} placeholder="Nombre" style={fieldStyle} />
                        </FormGroup>
                        <FormGroup label="Observaciones" full>
                          <textarea value={row.obs} onChange={(e)=>updateDispatchRow(i, { obs:e.target.value })} placeholder="Notas del despacho..." style={{ ...fieldStyle, minHeight:74, resize:"vertical" }} />
                        </FormGroup>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ display:"flex", justifyContent:"space-between", gap:10, marginTop:14, flexWrap:"wrap" }}>
            <div style={{ fontSize:12, color:"var(--text2)" }}>
              Al agregar otro material, el anterior queda resumido para que el formulario no se haga largo.
            </div>
            <Btn variant="ghost" size="sm" onClick={()=>{ const nextIndex = dispRows.length; setDispRows([...dispRows, emptyDispatchRow()]); setActiveDispatchRow(nextIndex); }}>+ Agregar otro material</Btn>
          </div>
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
