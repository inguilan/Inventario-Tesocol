"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, FileText, X } from "lucide-react";
import { useStore } from "@/store/useStore";
import { Btn } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { generateInventoryPDF, generateProjectPDF, generateDispatchesPDF, generateCriticalPDF } from "@/lib/pdf";

function CategoryPicker({
  categories,
  selected,
  onChange,
}: {
  categories: string[];
  selected: string[];
  onChange: (cats: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function toggle(cat: string) {
    onChange(selected.includes(cat) ? selected.filter((c) => c !== cat) : [...selected, cat]);
  }

  const label = selected.length === 0 ? "Todas las categorías" : `${selected.length} categoría${selected.length > 1 ? "s" : ""} seleccionada${selected.length > 1 ? "s" : ""}`;

  return (
    <div ref={ref} style={{ position:"relative", marginBottom:14 }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width:"100%",
          display:"flex",
          alignItems:"center",
          justifyContent:"space-between",
          gap:8,
          padding:"10px 12px",
          borderRadius:10,
          border:`1px solid ${open ? "var(--orange)" : "var(--border)"}`,
          background:"var(--bg3)",
          color:"var(--text)",
          fontFamily:"'DM Sans',sans-serif",
          fontSize:13,
          cursor:"pointer",
          transition:"border-color .15s",
          textAlign:"left",
        }}
      >
        <span style={{ display:"flex", alignItems:"center", gap:8, minWidth:0 }}>
          {selected.length > 0 && (
            <span style={{
              display:"inline-flex", alignItems:"center", justifyContent:"center",
              minWidth:20, height:20, borderRadius:999,
              background:"var(--orange)", color:"#fff",
              fontSize:11, fontWeight:700, flexShrink:0, padding:"0 5px",
            }}>
              {selected.length}
            </span>
          )}
          <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{label}</span>
        </span>
        <ChevronDown size={15} color="var(--text2)" style={{ flexShrink:0, transform: open ? "rotate(180deg)" : "none", transition:"transform .2s" }} />
      </button>

      {/* Panel desplegable — contenido completo dentro del flujo, no absoluto */}
      {open && (
        <div style={{
          marginTop:6,
          border:"1px solid var(--border)", borderRadius:10,
          background:"var(--bg2)",
          boxShadow:"0 4px 20px rgba(0,0,0,.35)",
          overflow:"hidden",
          animation:"fadeSlideDown .15s ease",
        }}>
          {/* Acciones rápidas */}
          <div style={{ display:"flex", gap:8, padding:"10px 10px 8px", borderBottom:"1px solid var(--border)" }}>
            <button
              type="button"
              onClick={() => onChange([])}
              style={{
                flex:1, border:"1px solid var(--border)", borderRadius:7,
                background:selected.length === 0 ? "rgba(245,98,15,.15)" : "var(--bg3)",
                color:selected.length === 0 ? "var(--orange)" : "var(--text)",
                fontSize:12, fontWeight:600, padding:"6px 0", cursor:"pointer",
              }}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => onChange(categories)}
              style={{
                flex:1, border:"1px solid var(--border)", borderRadius:7,
                background:selected.length === categories.length ? "rgba(245,98,15,.15)" : "var(--bg3)",
                color:selected.length === categories.length ? "var(--orange)" : "var(--text)",
                fontSize:12, fontWeight:600, padding:"6px 0", cursor:"pointer",
              }}
            >
              Seleccionar todo
            </button>
          </div>

          {/* Lista */}
          <div style={{ maxHeight:220, overflowY:"auto", padding:"6px 8px 8px" }}>
            {categories.map((c) => {
              const checked = selected.includes(c);
              return (
                <label
                  key={c}
                  style={{
                    display:"flex", alignItems:"center", gap:10,
                    padding:"7px 8px", borderRadius:8, cursor:"pointer",
                    background: checked ? "rgba(245,98,15,.10)" : "transparent",
                    transition:"background .1s",
                  }}
                  onMouseEnter={(e) => {
                    if (!checked) (e.currentTarget as HTMLLabelElement).style.background = "rgba(255,255,255,.04)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLLabelElement).style.background = checked ? "rgba(245,98,15,.10)" : "transparent";
                  }}
                >
                  <span style={{
                    width:17, height:17, borderRadius:5, flexShrink:0,
                    border:`2px solid ${checked ? "var(--orange)" : "var(--border)"}`,
                    background: checked ? "var(--orange)" : "transparent",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    transition:"all .12s",
                  }}>
                    {checked && <Check size={10} color="#fff" strokeWidth={3} />}
                  </span>
                  <input type="checkbox" checked={checked} onChange={() => toggle(c)} style={{ display:"none" }} />
                  <span style={{ fontSize:13, color:"var(--text)", flex:1 }}>{c}</span>
                </label>
              );
            })}
          </div>

          {/* Pie con seleccionadas y limpiar */}
          {selected.length > 0 && (
            <div style={{ borderTop:"1px solid var(--border)", padding:"8px 10px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
              <span style={{ fontSize:11, color:"var(--text2)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>
                {selected.join(" · ")}
              </span>
              <button
                type="button"
                onClick={() => onChange([])}
                style={{ background:"none", border:"none", cursor:"pointer", color:"var(--orange)", fontSize:11, fontWeight:600, flexShrink:0, display:"flex", alignItems:"center", gap:4 }}
              >
                <X size={11} /> Limpiar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ReportesPage() {
  const { inventory, projects, dispatches } = useStore();
  const { toast } = useToast();
  const [selProject, setSelProject] = useState(projects[0]?.id || "");
  const [selCategories, setSelCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  const DEFAULT_CATS = ["Paneles Solares","Inversores","Baterías","Estructuras","Cableado","Material Eléctrico","EMT","IMC","PVC","Corazas","Abrazaderas","Consumibles"];

  const categories = useMemo(() => {
    const fromInventory = Array.from(new Set(inventory.map((i) => i.categoria)));
    const merged = Array.from(new Set([...DEFAULT_CATS, ...fromInventory]));
    return merged.sort((a, b) => a.localeCompare(b));
  }, [inventory]);

  function toggleCategory(category: string) {
    setSelCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  }

  async function run(key: string, fn: () => Promise<any>) {
    setLoading(key);
    try { await fn(); toast("PDF generado exitosamente", "success"); }
    catch (e) { toast("Error al generar el PDF", "error"); }
    finally { setLoading(null); }
  }

  const cards = [
    {
      key: "inventory",
      icon: "📦",
      title: "Inventario Completo",
      desc: "PDF con todos los materiales, stock actual y estado de cada ítem.",
      extra: (
        <CategoryPicker
          categories={categories}
          selected={selCategories}
          onChange={setSelCategories}
        />
      ),
      action: () => {
        const filteredInventory =
          selCategories.length === 0
            ? inventory
            : inventory.filter((item) => selCategories.includes(item.categoria));

        if (filteredInventory.length === 0) {
          toast("No hay materiales para las categorías seleccionadas", "info");
          return;
        }

        run("inventory", () => generateInventoryPDF(filteredInventory, selCategories));
      },
    },
    {
      key: "project",
      icon: "📁",
      title: "Reporte por Proyecto",
      desc: "Acta con el historial completo de materiales despachados y devueltos por obra.",
      extra: (
        <select
          value={selProject}
          onChange={(e) => setSelProject(e.target.value)}
          style={{ background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:8, color:"var(--text)", fontFamily:"'DM Sans',sans-serif", fontSize:13, padding:"9px 12px", width:"100%", marginBottom:12 }}
        >
          {projects.length === 0 && <option value="">Sin proyectos</option>}
          {projects.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
      ),
      action: () => {
        const proj = projects.find((p) => p.id === selProject);
        if (!proj) { toast("Selecciona un proyecto","error"); return; }
        run("project", () => generateProjectPDF(proj, dispatches.filter((d) => d.projectId === selProject)));
      },
    },
    {
      key: "dispatches",
      icon: "🚚",
      title: "Registro de Despachos",
      desc: "Historial completo de salidas y devoluciones de material en todas las obras.",
      action: () => run("dispatches", () => generateDispatchesPDF(dispatches)),
    },
    {
      key: "critical",
      icon: "⚠️",
      title: "Stock Crítico",
      desc: "Materiales por debajo del stock mínimo que requieren reposición urgente.",
      action: async () => {
        const ok = await generateCriticalPDF(inventory);
        if (!ok) { toast("No hay materiales en estado crítico","info"); return; }
        toast("PDF generado","success");
      },
    },
  ];

  return (
    <div className="animate-fadein" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:20 }}>
      {cards.map((card) => (
        <div key={card.key} className="card" style={{ padding:24 }}>
          <div style={{ fontSize:32, marginBottom:12 }}>{card.icon}</div>
          <div className="font-bebas" style={{ fontSize:20, letterSpacing:1.2, marginBottom:6 }}>{card.title}</div>
          <p style={{ fontSize:13, color:"var(--text2)", marginBottom:18, lineHeight:1.5 }}>{card.desc}</p>
          {card.extra}
          <Btn variant="orange" onClick={card.action} disabled={loading === card.key}>
            <FileText size={15} />
            {loading === card.key ? "Generando..." : "Generar PDF"}
          </Btn>
        </div>
      ))}
    </div>
  );
}
