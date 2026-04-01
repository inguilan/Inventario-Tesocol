"use client";
import { Download } from "lucide-react";
import { useStore, getStockStatus } from "@/store/useStore";
import { Btn } from "@/components/ui";
import { useToast } from "@/components/Toast";

export default function ExportarPage() {
  const { inventory, projects, dispatches } = useStore();
  const { toast } = useToast();

  async function exportInventory() {
    const { utils, writeFile } = await import("xlsx");
    const data = inventory.map((i) => ({ Nombre:i.nombre, Referencia:i.ref, Categoría:i.categoria, Stock:i.stock, "Stock Mínimo":i.stockMin, Unidad:i.unidad, Ubicación:i.ubicacion, Proveedor:i.proveedor, Estado:getStockStatus(i).label, Descripción:i.desc }));
    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Inventario");
    writeFile(wb, `TESOCOL_Inventario_${new Date().toLocaleDateString("es-CO").replace(/\//g,"-")}.xlsx`);
    toast("Inventario exportado","success");
  }

  async function exportDispatches() {
    const { utils, writeFile } = await import("xlsx");
    const data = dispatches.map((d) => ({ Proyecto:d.projectNombre, Material:d.itemNombre, Referencia:d.itemRef, Cantidad:d.qty, Unidad:d.unidad, Tipo:d.tipo, Responsable:d.responsable, Observaciones:d.obs, Fecha:d.fecha }));
    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Despachos");
    writeFile(wb, `TESOCOL_Despachos_${new Date().toLocaleDateString("es-CO").replace(/\//g,"-")}.xlsx`);
    toast("Despachos exportados","success");
  }

  async function exportProjects() {
    const { utils, writeFile } = await import("xlsx");
    const data = projects.map((p) => ({ Nombre:p.nombre, Líder:p.lider, Ubicación:p.ubicacion, Fecha:p.fecha, Estado:p.status, Descripción:p.desc }));
    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Proyectos");
    writeFile(wb, `TESOCOL_Proyectos_${new Date().toLocaleDateString("es-CO").replace(/\//g,"-")}.xlsx`);
    toast("Proyectos exportados","success");
  }

  const options = [
    { icon:"📦", title:"Inventario Completo", desc:`${inventory.length} materiales con stock, ubicación y estado.`, action:exportInventory },
    { icon:"🚚", title:"Registro de Despachos", desc:`${dispatches.length} movimientos de entrada y salida.`, action:exportDispatches },
    { icon:"📁", title:"Proyectos / Obras", desc:`${projects.length} proyectos con líder y estado.`, action:exportProjects },
  ];

  return (
    <div className="animate-fadein">
      <p style={{ fontSize:13, color:"var(--text2)", marginBottom:24 }}>
        Exporta los datos del sistema a hojas de cálculo Excel (.xlsx) para análisis externo o respaldo.
      </p>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:16 }}>
        {options.map((opt) => (
          <div key={opt.title} className="card" style={{ padding:24 }}>
            <div style={{ fontSize:32, marginBottom:12 }}>{opt.icon}</div>
            <div className="font-bebas" style={{ fontSize:20, letterSpacing:1.2, marginBottom:6 }}>{opt.title}</div>
            <p style={{ fontSize:13, color:"var(--text2)", marginBottom:18 }}>{opt.desc}</p>
            <Btn variant="success" onClick={opt.action}><Download size={15}/> Exportar Excel</Btn>
          </div>
        ))}
      </div>
    </div>
  );
}
