# TESOCOL Inventarios

Sistema web de inventario para TESOCOL construido con Next.js 14 (App Router), autenticacion con NextAuth, estado global con Zustand y sincronizacion de inventario hacia Firebase Firestore.

## Objetivo del Proyecto

- Gestionar materiales de bodega (crear, editar, eliminar, filtrar, exportar).
- Registrar movimientos y despachos por proyecto.
- Generar reportes (PDF y Excel).
- Mantener una experiencia web multiplataforma (desktop y movil) desplegada en Vercel.

## Arquitectura (resumen)

- Frontend: Next.js + React + TypeScript.
- Estado de interfaz: Zustand con persistencia local.
- Nube de datos: Firebase Firestore para inventario.
- Autenticacion: NextAuth por credenciales (admin local).

## Archivos .env (limpieza y uso correcto)

En este proyecto deben quedar solo estos dos:

- `.env.local`: entorno real de desarrollo local (privado, no se sube a Git).
- `.env.local.example`: plantilla base para nuevos equipos/entornos.

No borres `.env.local.example` porque documenta la configuracion minima del proyecto.

## Variables de Entorno y Funcion

### NextAuth

- `NEXTAUTH_SECRET`: firma de sesiones JWT.
- `NEXTAUTH_URL`: URL base del entorno (local o produccion).

### Login por Credenciales

- `ADMIN_USERNAME`: usuario administrador.
- `ADMIN_PASSWORD`: contrasena del administrador.
- `ADMIN_NAME`: nombre visible del usuario.

### Firebase Web (cliente)

- `NEXT_PUBLIC_FIREBASE_API_KEY`: llave publica del SDK web.
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: dominio del proyecto Firebase.
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: id del proyecto.
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: bucket de storage.
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: sender id.
- `NEXT_PUBLIC_FIREBASE_APP_ID`: identificador de la app web.

## Credenciales de Login Actuales (desarrollo)

- Usuario: `admin`
- Contrasena: `Tesocol_Inv_2026!`

Recomendacion: cambia esta contrasena en produccion y rota `NEXTAUTH_SECRET`.

## Puesta en Marcha Local

1. Instala dependencias.

```bash
npm install
```

2. Crea el entorno local a partir de la plantilla.

```bash
cp .env.local.example .env.local
```

3. Inicia el entorno de desarrollo.

```bash
npm run dev
```

4. Abre `http://localhost:3000` y entra con el usuario admin.

## Despliegue en Vercel

1. Configura las mismas variables de `.env.local` en Vercel (Production/Preview).
2. Asegura que `NEXTAUTH_URL` apunte a tu dominio de Vercel.
3. Haz redeploy despues de cambiar variables.

## Firestore: estado actual y reglas

- El inventario se sincroniza con la coleccion `materiales`.
- Si no aparecen datos, revisa reglas de Firestore y errores de permisos.
- Para pruebas rapidas se puede usar regla abierta temporal.
- Para produccion, usa reglas restringidas a usuarios autenticados.

## Estructura del Codigo (claves)

```txt
src/
    app/
        (auth)/login/                 Login
        (dashboard)/inventario/       UI principal de inventario y sync Firestore
        api/auth/[...nextauth]/       Handler de autenticacion
        api/materiales/               Endpoint interno para pruebas
    components/                     UI reusable (Modal, Toast, Sidebar, etc.)
    lib/
        firebase.ts                   Inicializa SDK Firebase
        firestore-materials.ts        Lectura/escritura de materiales en Firestore
        pdf.ts                        Generacion de reportes PDF
    store/useStore.ts               Estado global (inventario, proyectos, despachos)
```

## Flujo de Datos (inventario)

1. El usuario crea/edita un material en la UI.
2. Zustand actualiza el estado local.
3. Se ejecuta sincronizacion hacia Firestore (`materiales`).
4. Otros dispositivos leen el mismo inventario desde Firestore.

## Buenas Practicas Operativas

- Nunca subir `.env.local` al repositorio.
- Mantener `.env.local.example` actualizado.
- Documentar cualquier nueva variable en este README.
- Validar entorno local y Vercel con el mismo set de variables.

## Stack

- Next.js 14
- React 18
- TypeScript
- NextAuth
- Zustand
- Firebase Firestore
- jsPDF
- SheetJS (xlsx)
- Tailwind CSS

Desarrollado para TESOCOL.
