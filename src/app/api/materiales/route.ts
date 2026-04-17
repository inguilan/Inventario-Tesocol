import { NextResponse } from "next/server";
import { createApiMaterial, listApiMaterials } from "@/lib/materials-api-store";

interface MaterialPayload {
  nombre?: unknown;
  proveedor?: unknown;
  cantidad?: unknown;
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET() {
  const materials = listApiMaterials();

  return NextResponse.json({
    total: materials.length,
    items: materials,
  });
}

export async function POST(request: Request) {
  let body: MaterialPayload;

  try {
    body = await request.json();
  } catch {
    return badRequest("El cuerpo de la solicitud debe ser JSON valido");
  }

  const nombre = typeof body.nombre === "string" ? body.nombre.trim() : "";
  const proveedor = typeof body.proveedor === "string" ? body.proveedor.trim() : "";
  const cantidad = Number(body.cantidad);

  if (!nombre) return badRequest("nombre es obligatorio");
  if (!proveedor) return badRequest("proveedor es obligatorio");
  if (!Number.isFinite(cantidad) || cantidad < 0) {
    return badRequest("cantidad debe ser un numero mayor o igual a 0");
  }

  const material = createApiMaterial({ nombre, proveedor, cantidad });

  return NextResponse.json(material, { status: 201 });
}