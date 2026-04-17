"use client";
import { useMemo, useState } from "react";
import { FileText } from "lucide-react";
import { useStore } from "@/store/useStore";
import { Btn } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { generateInventoryPDF, generateProjectPDF, generateDispatchesPDF, generateCriticalPDF } from "@/lib/pdf";

export default function ReportesPage() {
  const { inventory, projects, dispatches } = useStore();
  const { toast } = useToast();
  const [selProject, setSelProject] = useState(projects[0]?.id || "");
  const [selCategory, setSelCategory] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(inventory.map((i) => i.categoria))).sort((a, b) => a.localeCompare(b)),
    [inventory]
  );

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
        <select
          value={selCategory}
          onChange={(e) => setSelCategory(e.target.value)}
          style={{ background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:8, color:"var(--text)", fontFamily:"'DM Sans',sans-serif", fontSize:13, padding:"9px 12px", width:"100%", marginBottom:12 }}
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      ),
      action: () => {
        const filteredInventory =
          !selCategory
            ? inventory
            : inventory.filter((item) => item.categoria === selCategory);

        if (filteredInventory.length === 0) {
          toast("No hay materiales para la categoría seleccionada", "info");
          return;
        }

        run("inventory", () => generateInventoryPDF(filteredInventory, selCategory ? [selCategory] : []));
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
