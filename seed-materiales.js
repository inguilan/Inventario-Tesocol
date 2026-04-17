const TOTAL = 10000;

async function crearMaterial(i) {

  const material = {
    nombre: `Material-${i}`,
    proveedor: "Proveedor Test",
    cantidad: Math.floor(Math.random() * 100)
  };

  try {
    const res = await fetch("http://localhost:3000/api/materiales", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(material),
    });

    console.log("Material creado:", i);

  } catch (error) {
    console.log("Error:", error);
  }
}

async function main() {

  for (let i = 1; i <= TOTAL; i++) {
    await crearMaterial(i);
  }

  console.log("✅ Materiales creados:", TOTAL);
}

main();