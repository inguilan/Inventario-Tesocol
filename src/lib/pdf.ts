import type { Project, Dispatch, Material } from "@/store/useStore";
import { getStockStatus } from "@/store/useStore";

// Dynamic import of jsPDF so it only runs client-side
async function getJsPDF() {
  const { jsPDF } = await import("jspdf");
  return jsPDF;
}

function addHeader(doc: any, title: string) {
  doc.setFillColor(13, 13, 13);
  doc.rect(0, 0, 210, 28, "F");
  doc.setFillColor(245, 98, 15);
  doc.rect(0, 28, 210, 3, "F");

  doc.setTextColor(245, 98, 15);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("TESOCOL", 14, 18);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Tecnología Solar de Colombia", 14, 24);

  doc.setTextColor(40, 40, 40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, 14, 40);
}

function addFooter(doc: any) {
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFillColor(245, 98, 15);
    doc.rect(0, 285, 210, 12, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("TESOCOL — Sistema de Inventarios | www.tesocol.com | info@tesocol.com", 14, 292);
    doc.text(`Página ${i} de ${pages}`, 185, 292, { align: "right" });
  }
}

// ─── Full inventory PDF ───────────────────────────────────────────────────────
export async function generateInventoryPDF(inventory: Material[], selectedCategories: string[] = []) {
  const JsPDF = await getJsPDF();
  const doc = new JsPDF();
  addHeader(doc, "REPORTE DE INVENTARIO");

  const hasCategoryFilter = selectedCategories.length > 0;
  const categorySummary = hasCategoryFilter
    ? `Categorías: ${selectedCategories.join(", ")}`
    : "Categorías: Todas";

  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.setFont("helvetica", "normal");
  doc.text(`Generado: ${new Date().toLocaleString("es-CO")}`, 14, 48);
  doc.text(`Total materiales: ${inventory.length}`, 14, 54);
  doc.text(categorySummary.slice(0, 120), 14, 60);

  let y = 70;
  // Table header
  doc.setFillColor(245, 98, 15);
  doc.rect(14, y, 182, 8, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  const cols = [14, 62, 100, 133, 152, 170];
  ["Material", "Referencia", "Categoría", "Stock", "Unidad", "Estado"].forEach((h, i) => doc.text(h, cols[i], y + 5.5));
  y += 10;

  inventory.forEach((item, idx) => {
    if (y > 268) { doc.addPage(); y = 20; }
    doc.setFillColor(idx % 2 === 0 ? 248 : 255, 248, 248);
    doc.rect(14, y, 182, 8, "F");
    doc.setTextColor(40);
    doc.setFont("helvetica", "normal");
    doc.text(item.nombre.slice(0, 26), cols[0], y + 5.5);
    doc.text(item.ref.slice(0, 18), cols[1], y + 5.5);
    doc.text(item.categoria.slice(0, 16), cols[2], y + 5.5);
    doc.text(String(item.stock), cols[3], y + 5.5);
    doc.text(item.unidad.slice(0, 10), cols[4], y + 5.5);
    const s = getStockStatus(item);
    const color = s.key === "normal" ? [34, 197, 94] : s.key === "bajo" ? [245, 158, 11] : [239, 68, 68];
    doc.setTextColor(...(color as [number, number, number]));
    doc.setFont("helvetica", "bold");
    doc.text(s.label, cols[5], y + 5.5);
    doc.setTextColor(40);
    doc.setFont("helvetica", "normal");
    y += 9;
  });

  addFooter(doc);
  const dateSuffix = new Date().toLocaleDateString("es-CO").replace(/\//g, "-");
  const fileName = hasCategoryFilter
    ? `TESOCOL_Inventario_Filtrado_${dateSuffix}.pdf`
    : `TESOCOL_Inventario_${dateSuffix}.pdf`;
  doc.save(fileName);
}

// ─── Project PDF ──────────────────────────────────────────────────────────────
export async function generateProjectPDF(project: Project, dispatches: Dispatch[]) {
  const JsPDF = await getJsPDF();
  const doc = new JsPDF();
  addHeader(doc, "ACTA DE MATERIALES POR OBRA");

  doc.setFontSize(10);
  doc.setTextColor(40);
  const fields: [string, string][] = [
    ["Proyecto:", project.nombre],
    ["Líder:", project.lider],
    ["Ubicación:", project.ubicacion || "—"],
    ["Fecha:", project.fecha],
    ["Estado:", project.status],
  ];
  fields.forEach(([label, value], i) => {
    const y = 46 + i * 7;
    doc.setFont("helvetica", "bold"); doc.text(label, 14, y);
    doc.setFont("helvetica", "normal"); doc.text(value, 48, y);
  });
  doc.setFont("helvetica", "bold"); doc.text("Impreso:", 130, 46);
  doc.setFont("helvetica", "normal"); doc.text(new Date().toLocaleString("es-CO"), 153, 46);

  doc.setDrawColor(245, 98, 15); doc.setLineWidth(0.5); doc.line(14, 82, 196, 82);

  let y = 90;
  doc.setFillColor(245, 98, 15); doc.rect(14, y, 182, 8, "F");
  doc.setTextColor(255); doc.setFont("helvetica", "bold"); doc.setFontSize(8.5);
  const dcols = [14, 52, 80, 104, 122, 150, 175];
  ["Material", "Ref.", "Desp.", "Dev.", "Neto", "Responsable", "Tipo"].forEach((h, i) => doc.text(h, dcols[i], y + 5.5));
  y += 10;

  dispatches.forEach((d, idx) => {
    if (y > 268) { doc.addPage(); y = 20; }
    doc.setFillColor(idx % 2 === 0 ? 248 : 255, 248, 248); doc.rect(14, y, 182, 8, "F");
    doc.setTextColor(40); doc.setFont("helvetica", "normal");
    doc.text(d.itemNombre.slice(0, 20), dcols[0], y + 5.5);
    doc.text((d.itemRef || "").slice(0, 10), dcols[1], y + 5.5);
    doc.text(d.tipo === "despacho" ? String(d.qty) : "—", dcols[2], y + 5.5);
    doc.text(d.tipo === "devolucion" ? String(d.qty) : "—", dcols[3], y + 5.5);
    const color: [number,number,number] = d.tipo === "despacho" ? [245, 98, 15] : [34, 197, 94];
    doc.setTextColor(...color); doc.setFont("helvetica", "bold");
    doc.text(`${d.tipo === "despacho" ? d.qty : "-" + d.qty} ${d.unidad || ""}`, dcols[4], y + 5.5);
    doc.setTextColor(40); doc.setFont("helvetica", "normal");
    doc.text((d.responsable || "—").slice(0, 14), dcols[5], y + 5.5);
    doc.setTextColor(...color); doc.setFont("helvetica", "bold");
    doc.text(d.tipo === "despacho" ? "Salida" : "Retorno", dcols[6], y + 5.5);
    doc.setTextColor(40); doc.setFont("helvetica", "normal");
    y += 9;
  });

  if (!dispatches.length) { doc.setTextColor(150); doc.text("Sin movimientos registrados.", 14, y + 10); y += 20; }

  y += 14;
  if (y > 250) { doc.addPage(); y = 20; }
  doc.setDrawColor(245, 98, 15); doc.line(14, y, 196, y); y += 12;
  doc.setTextColor(40); doc.setFont("helvetica", "bold"); doc.setFontSize(9);
  doc.text("FIRMA LÍDER DE PROYECTO:", 14, y);
  doc.setFont("helvetica", "normal"); doc.text("_______________________________", 14, y + 14); doc.text(project.lider, 14, y + 21);
  doc.setFont("helvetica", "bold"); doc.text("FIRMA ALMACENISTA:", 115, y);
  doc.setFont("helvetica", "normal"); doc.text("_______________________________", 115, y + 14);

  addFooter(doc);
  doc.save(`TESOCOL_Obra_${project.nombre.replace(/[^a-z0-9]/gi, "_")}.pdf`);
}

// ─── Dispatches PDF ───────────────────────────────────────────────────────────
export async function generateDispatchesPDF(dispatches: Dispatch[]) {
  const JsPDF = await getJsPDF();
  const doc = new JsPDF();
  addHeader(doc, "REGISTRO DE DESPACHOS");

  let y = 50;
  doc.setFillColor(245, 98, 15); doc.rect(14, y, 182, 8, "F");
  doc.setTextColor(255); doc.setFont("helvetica", "bold"); doc.setFontSize(8.5);
  [14, 58, 96, 120, 148, 172].forEach((x, i) =>
    doc.text(["Proyecto","Material","Cantidad","Responsable","Fecha","Tipo"][i], x, y + 5.5)
  );
  y += 10;

  dispatches.forEach((d, idx) => {
    if (y > 268) { doc.addPage(); y = 20; }
    doc.setFillColor(idx % 2 === 0 ? 248 : 255, 248, 248); doc.rect(14, y, 182, 8, "F");
    doc.setTextColor(40); doc.setFont("helvetica", "normal");
    doc.text((d.projectNombre || "—").slice(0, 22), 14, y + 5.5);
    doc.text(d.itemNombre.slice(0, 18), 58, y + 5.5);
    doc.text(`${d.qty} ${d.unidad || ""}`, 96, y + 5.5);
    doc.text((d.responsable || "—").slice(0, 14), 120, y + 5.5);
    doc.text((d.fecha || "").slice(0, 16), 148, y + 5.5);
    const c: [number,number,number] = d.tipo === "despacho" ? [245, 98, 15] : [34, 197, 94];
    doc.setTextColor(...c); doc.setFont("helvetica", "bold");
    doc.text(d.tipo === "despacho" ? "Salida" : "Retorno", 172, y + 5.5);
    doc.setTextColor(40); doc.setFont("helvetica", "normal");
    y += 9;
  });

  addFooter(doc);
  doc.save("TESOCOL_Despachos.pdf");
}

// ─── Critical stock PDF ───────────────────────────────────────────────────────
export async function generateCriticalPDF(inventory: Material[]) {
  const critical = inventory.filter((i) => getStockStatus(i).key !== "normal");
  if (!critical.length) return false;

  const JsPDF = await getJsPDF();
  const doc = new JsPDF();
  addHeader(doc, "REPORTE STOCK CRÍTICO");

  let y = 50;
  doc.setFillColor(239, 68, 68); doc.rect(14, y, 182, 8, "F");
  doc.setTextColor(255); doc.setFont("helvetica", "bold"); doc.setFontSize(8.5);
  [14, 62, 102, 126, 150, 168].forEach((x, i) =>
    doc.text(["Material","Referencia","Stock Actual","Stock Mínimo","Unidad","Estado"][i], x, y + 5.5)
  );
  y += 10;

  critical.forEach((item, idx) => {
    if (y > 268) { doc.addPage(); y = 20; }
    doc.setFillColor(idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 245 : 250, 245); doc.rect(14, y, 182, 8, "F");
    doc.setTextColor(40); doc.setFont("helvetica", "normal");
    doc.text(item.nombre.slice(0, 26), 14, y + 5.5);
    doc.text(item.ref.slice(0, 14), 62, y + 5.5);
    const sc: [number,number,number] = item.stock === 0 ? [239, 68, 68] : [245, 158, 11];
    doc.setTextColor(...sc); doc.setFont("helvetica", "bold");
    doc.text(String(item.stock), 110, y + 5.5);
    doc.setTextColor(40); doc.setFont("helvetica", "normal");
    doc.text(String(item.stockMin), 130, y + 5.5);
    doc.text(item.unidad, 150, y + 5.5);
    const s = getStockStatus(item);
    const lc: [number,number,number] = s.key === "agotado" ? [239, 68, 68] : [245, 158, 11];
    doc.setTextColor(...lc); doc.setFont("helvetica", "bold");
    doc.text(s.label, 168, y + 5.5);
    doc.setTextColor(40); doc.setFont("helvetica", "normal");
    y += 9;
  });

  addFooter(doc);
  doc.save("TESOCOL_StockCritico.pdf");
  return true;
}
