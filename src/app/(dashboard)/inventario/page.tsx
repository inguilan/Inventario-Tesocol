"use client";
import Modal from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { Badge, Btn, EmptyState, fieldStyle, FormGroup } from "@/components/ui";
import { getCatEmoji, getStockStatus, Material, useStore } from "@/store/useStore";
import { Camera, Download, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

const CATS = ["Paneles Solares","Inversores","Baterías","Estructuras","Cableado","Material Eléctrico","EMT","IMC","PVC","Corazas","Abrazaderas","Consumibles"];
const UNITS = ["Unidades","Metros","Juegos"];

const empty = (): Omit<Material,"id"|"fechaCreacion"> => ({
  nombre:"", ref:"", categoria:CATS[0], unidad:UNITS[0],
  stock:0, stockMin:5, ubicacion:"", proveedor:"", desc:"", fotos:[],
});

function InventarioContent() {
  const { inventory, addMaterial, updateMaterial, deleteMaterial } = useStore();
  const { toast } = useToast();
  const params = useSearchParams();

  const [search, setSearch]   = useState(params.get("q") || "");
  const [cat, setCat]         = useState("");
  const [status, setStatus]   = useState("");
  const [modalOpen, setModal] = useState(false);
  const [galleryOpen, setGallery] = useState(false);
  const [editId, setEditId]   = useState<string|null>(null);
  const [form, setForm]       = useState(empty());
  const [photoNames, setPhotoNames] = useState<string[]>([]);
  const [galleryImgs, setGalleryImgs] = useState<string[]>([]);
  const [galleryTitle, setGalleryTitle] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setSearch(params.get("q") || ""); }, [params]);

  const filtered = inventory.filter((i) => {
    const q = search.toLowerCase();
    const matchQ = !q || i.nombre.toLowerCase().includes(q) || i.ref.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q);
    const matchCat = !cat || i.categoria === cat;
    const st = getStockStatus(i).key;
    const matchSt = !status || st === status;
    return matchQ && matchCat && matchSt;
  });

  function openAdd() {
    setEditId(null);
    setForm(empty());
    setPhotoNames([]);
    setModal(true);
  }
  function openEdit(item: Material) {
    setEditId(item.id);
    setForm({ nombre:item.nombre, ref:item.ref, categoria:item.categoria, unidad:item.unidad,
      stock:item.stock, stockMin:item.stockMin, ubicacion:item.ubicacion, proveedor:item.proveedor,
      desc:item.desc, fotos:[...item.fotos] });
    setPhotoNames(item.fotos.map((_, idx) => `Foto ${idx + 1}`));
    setModal(true);
  }
  function handleDelete(id: string) {
    if (!confirm("¿Eliminar este material?")) return;
    deleteMaterial(id);
    toast("Material eliminado", "info");
  }
  function handleImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setForm((f) => ({ ...f, fotos: [...f.fotos, ev.target!.result as string] }));
        setPhotoNames((prev) => [...prev, file.name]);
      };
      reader.readAsDataURL(file);
    });
    if (e.target) e.target.value = "";
  }
  function removePhoto(idx: number) {
    setForm((f) => ({ ...f, fotos: f.fotos.filter((_,i) => i !== idx) }));
    setPhotoNames((prev) => prev.filter((_, i) => i !== idx));
  }
  function save() {
    if (!form.nombre.trim() || !form.ref.trim()) { toast("Nombre y referencia son obligatorios","error"); return; }
    if (editId) { updateMaterial(editId, form); toast("Material actualizado","success"); }
    else { addMaterial(form); toast("Material agregado al inventario","success"); }
    setModal(false);
  }
  function viewPhotos(item: Material) {
    if (!item.fotos.length) { toast("Este material no tiene fotos","info"); return; }
    setGalleryImgs(item.fotos); setGalleryTitle(item.nombre); setGallery(true);
  }

  // Excel export
  function exportExcel() {
    import("xlsx").then(({ utils, writeFile }) => {
      const data = filtered.map((i) => ({ Nombre:i.nombre, Referencia:i.ref, Categoría:i.categoria, Stock:i.stock, "Stock Mínimo":i.stockMin, Unidad:i.unidad, Ubicación:i.ubicacion, Proveedor:i.proveedor, Estado:getStockStatus(i).label }));
      const ws = utils.json_to_sheet(data);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "Inventario");
      writeFile(wb, `TESOCOL_Inventario_${new Date().toLocaleDateString("es-CO").replace(/\//g,"-")}.xlsx`);
      toast("Excel exportado","success");
    });
  }

  return (
    <div className="animate-fadein">
      {/* Filters */}
      <div style={{ display:"flex", gap:10, marginBottom:18, flexWrap:"wrap", alignItems:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:8, padding:"8px 14px" }}>
          <Search size={14} color="var(--text3)" />
          <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Buscar..." style={{ background:"none", border:"none", outline:"none", color:"var(--text)", fontSize:13, fontFamily:"'DM Sans',sans-serif", width:180 }} />
        </div>
        <select value={cat} onChange={(e)=>setCat(e.target.value)} style={{ ...fieldStyle, width:"auto" }}>
          <option value="">Todas las categorías</option>
          {CATS.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={status} onChange={(e)=>setStatus(e.target.value)} style={{ ...fieldStyle, width:"auto" }}>
          <option value="">Todos los estados</option>
          <option value="normal">Stock Normal</option>
          <option value="bajo">Stock Bajo</option>
          <option value="agotado">Agotado</option>
        </select>
        {(search||cat||status) && (
          <Btn variant="ghost" size="sm" onClick={()=>{setSearch("");setCat("");setStatus("");}}>
            <X size={13}/> Limpiar
          </Btn>
        )}
        <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
          <Btn variant="ghost" size="sm" onClick={exportExcel}><Download size={14}/> Excel</Btn>
          <Btn variant="orange" size="sm" onClick={openAdd}><Plus size={14}/> Nuevo Material</Btn>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:8 }}>
          <span>📦</span>
          <span className="font-bebas" style={{ fontSize:18, letterSpacing:1.5 }}>Materiales en Bodega</span>
          <span style={{ marginLeft:"auto", fontSize:12, color:"var(--text2)" }}>{filtered.length} resultado{filtered.length!==1?"s":""}</span>
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon="📦" title="No se encontraron materiales" sub="Intenta con otros filtros o agrega nuevos materiales" />
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%" }} className="tbl">
              <thead>
                <tr>
                  <th>Material</th><th>Referencia</th><th>Categoría</th>
                  <th>Stock</th><th>Mínimo</th><th>Ubicación</th><th>Estado</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const s = getStockStatus(item);
                  return (
                    <tr key={item.id}>
                      <td>
                        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                          <div onClick={()=>viewPhotos(item)} style={{ width:40, height:40, borderRadius:8, background:"var(--bg4)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, cursor:"pointer", overflow:"hidden", fontSize:18 }}>
                            {item.fotos[0] ? <img src={item.fotos[0]} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt="" /> : getCatEmoji(item.categoria)}
                          </div>
                          <div>
                            <div style={{ fontWeight:600, fontSize:13 }}>{item.nombre}</div>
                            <div style={{ fontSize:11, color:"var(--text2)", marginTop:2 }}>{item.desc.slice(0,40)||"—"}</div>
                          </div>
                        </div>
                      </td>
                      <td><code style={{ background:"var(--bg3)", padding:"2px 8px", borderRadius:5, fontSize:12 }}>{item.ref}</code></td>
                      <td><Badge label={item.categoria} variant="badge-blue" /></td>
                      <td><strong style={{ fontSize:15 }}>{item.stock}</strong> <span style={{ fontSize:11, color:"var(--text2)" }}>{item.unidad}</span></td>
                      <td style={{ color:"var(--text2)" }}>{item.stockMin}</td>
                      <td style={{ color:"var(--text2)", fontSize:12 }}>{item.ubicacion||"—"}</td>
                      <td><Badge label={s.label} variant={s.badge} /></td>
                      <td>
                        <div style={{ display:"flex", gap:6 }}>
                          <Btn variant="ghost" size="sm" onClick={()=>viewPhotos(item)} title="Ver fotos"><Camera size={13}/></Btn>
                          <Btn variant="ghost" size="sm" onClick={()=>openEdit(item)} title="Editar"><Pencil size={13}/></Btn>
                          <Btn variant="danger" size="sm" onClick={()=>handleDelete(item.id)} title="Eliminar"><Trash2 size={13}/></Btn>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={()=>setModal(false)} title={editId?"Editar Material":"Nuevo Material"} icon="📦" wide
        footer={<>
          <Btn variant="ghost" onClick={()=>setModal(false)}>Cancelar</Btn>
          <Btn variant="orange" onClick={save}>💾 {editId?"Actualizar":"Guardar"}</Btn>
        </>}
      >
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <FormGroup label="Nombre *">
            <input value={form.nombre} onChange={(e)=>setForm({...form,nombre:e.target.value})} placeholder="Ej: Panel Solar 550W" style={fieldStyle} />
          </FormGroup>
          <FormGroup label="Referencia *">
            <input value={form.ref} onChange={(e)=>setForm({...form,ref:e.target.value})} placeholder="Ej: PS-550W-MONO" style={fieldStyle} />
          </FormGroup>
          <FormGroup label="Categoría">
            <select value={form.categoria} onChange={(e)=>setForm({...form,categoria:e.target.value})} style={fieldStyle}>
              {CATS.map((c)=><option key={c}>{c}</option>)}
            </select>
          </FormGroup>
          <FormGroup label="Unidad de Medida">
            <select value={form.unidad} onChange={(e)=>setForm({...form,unidad:e.target.value})} style={fieldStyle}>
              {UNITS.map((u)=><option key={u}>{u}</option>)}
            </select>
          </FormGroup>
          <FormGroup label="Stock Actual *">
            <input type="number" value={form.stock} onChange={(e)=>setForm({...form,stock:+e.target.value})} min={0} style={fieldStyle} />
          </FormGroup>
          <FormGroup label="Stock Mínimo">
            <input type="number" value={form.stockMin} onChange={(e)=>setForm({...form,stockMin:+e.target.value})} min={0} style={fieldStyle} />
          </FormGroup>
          <FormGroup label="Ubicación en Bodega">
            <input value={form.ubicacion} onChange={(e)=>setForm({...form,ubicacion:e.target.value})} placeholder="Ej: Estante A-3" style={fieldStyle} />
          </FormGroup>
          <FormGroup label="Proveedor">
            <input value={form.proveedor} onChange={(e)=>setForm({...form,proveedor:e.target.value})} placeholder="Nombre del proveedor" style={fieldStyle} />
          </FormGroup>
          <FormGroup label="Descripción / Especificaciones" full>
            <textarea value={form.desc} onChange={(e)=>setForm({...form,desc:e.target.value})} placeholder="Especificaciones técnicas..." style={{ ...fieldStyle, minHeight:72, resize:"vertical" }} />
          </FormGroup>
          <FormGroup label="Fotos del Material" full>
            <div onClick={()=>fileRef.current?.click()} style={{ border:"2px dashed var(--border)", borderRadius:10, padding:22, textAlign:"center", cursor:"pointer", background:"var(--bg3)", transition:"all .2s" }}
              onMouseEnter={(e)=>e.currentTarget.style.borderColor="var(--orange)"}
              onMouseLeave={(e)=>e.currentTarget.style.borderColor="var(--border)"}
            >
              <div style={{ fontSize:28 }}>📷</div>
              <p style={{ fontSize:13, color:"var(--text)", marginTop:6, fontWeight:600 }}>Haz clic para subir fotos</p>
              <p style={{ fontSize:11, color:"var(--text2)", marginTop:3 }}>JPG, PNG - multiples permitidas</p>
            </div>
            <input ref={fileRef} type="file" multiple accept="image/*" style={{ display:"none" }} onChange={handleImages} />
            {form.fotos.length > 0 && (
              <>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginTop:10 }}>
                {form.fotos.map((src,i)=>(
                  <div key={i} style={{ position:"relative" }}>
                    <img src={src} style={{ width:72, height:72, borderRadius:8, objectFit:"cover", border:"1px solid var(--border)" }} alt="" />
                    <button onClick={()=>removePhoto(i)} style={{ position:"absolute", top:-6, right:-6, width:18, height:18, borderRadius:"50%", background:"var(--red)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:10 }}>✕</button>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:10, border:"1px solid var(--border)", borderRadius:8, background:"var(--bg3)", padding:"8px 10px" }}>
                {photoNames.map((name, i) => (
                  <div key={`${name}-${i}`} style={{ fontSize:12, color:"var(--text)", lineHeight:1.6, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                    {`${i + 1}. ${name}`}
                  </div>
                ))}
              </div>
              </>
            )}
          </FormGroup>
        </div>
      </Modal>

      {/* Gallery Modal */}
      <Modal open={galleryOpen} onClose={()=>setGallery(false)} title={galleryTitle} icon="📷" wide>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
          {galleryImgs.map((src,i)=>(
            <img key={i} src={src} style={{ width:"100%", aspectRatio:"1", objectFit:"cover", borderRadius:8, border:"1px solid var(--border)", cursor:"pointer", transition:"transform .2s" }}
              onMouseEnter={(e)=>e.currentTarget.style.transform="scale(1.03)"}
              onMouseLeave={(e)=>e.currentTarget.style.transform="none"}
              alt={`foto ${i+1}`}
            />
          ))}
        </div>
      </Modal>
    </div>
  );
}

export default function InventarioPage() {
  return (
    <Suspense fallback={null}>
      <InventarioContent />
    </Suspense>
  );
}
