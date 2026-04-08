# ☀️ TESOCOL — Sistema de Inventarios

Sistema de gestión de inventario para **Tecnología Solar de Colombia**, construido con **Next.js 14**, listo para desplegar en **Vercel**.

---

## 🚀 Inicio Rápido (Local)

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
Copia el archivo de ejemplo y edítalo:
```bash
cp .env.local.example .env.local
```

Edita `.env.local`:
```env
NEXTAUTH_SECRET=tu_secreto_muy_seguro_aqui   # genera con: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000

ADMIN_USERNAME=admin
ADMIN_PASSWORD=tesocol2025
ADMIN_NAME=Administrador Tesocol
```

### 3. Ejecutar en desarrollo
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) — serás redirigido al login.

---

## ☁️ Desplegar en Vercel

### Opción A — Desde la CLI
```bash
npm i -g vercel
vercel
```

### Opción B — Desde GitHub
1. Sube este proyecto a un repositorio GitHub
2. Ve a [vercel.com](https://vercel.com) → **New Project** → importa el repo
3. En **Environment Variables** agrega:

| Variable | Valor |
|---|---|
| `NEXTAUTH_SECRET` | (genera con `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | `https://tu-dominio.vercel.app` |
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_PASSWORD` | `tu_contraseña_segura` |
| `ADMIN_NAME` | `Administrador Tesocol` |

4. Haz clic en **Deploy** ✅

---

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── (auth)/login/          # Página de login
│   ├── (dashboard)/
│   │   ├── dashboard/         # Dashboard principal
│   │   ├── inventario/        # Gestión de materiales
│   │   ├── proyectos/         # Proyectos y obras
│   │   ├── despachos/         # Registro de despachos
│   │   ├── reportes/          # Generación de PDFs
│   │   └── exportar/          # Exportar a Excel
│   └── api/auth/              # NextAuth endpoints
├── components/
│   ├── Sidebar.tsx            # Barra lateral
│   ├── Topbar.tsx             # Barra superior
│   ├── Modal.tsx              # Componente modal
│   ├── Toast.tsx              # Notificaciones
│   ├── Providers.tsx          # Context providers
│   └── ui.tsx                 # Componentes UI reutilizables
├── store/
│   └── useStore.ts            # Estado global (Zustand + localStorage)
└── lib/
    └── pdf.ts                 # Generación de PDFs con jsPDF
```

---

## 🔧 Funcionalidades

| Feature | Descripción |
|---|---|
| 🔐 **Login seguro** | Autenticación con NextAuth + JWT (8h sesión) |
| 📦 **Inventario** | CRUD completo con fotos, búsqueda y filtros |
| 📁 **Proyectos** | Carpetas por obra con historial de materiales |
| 🚚 **Despachos** | Registro de salida de material por proyecto |
| ↩️ **Devoluciones** | Retorno de material sobrante al inventario |
| 📄 **PDFs** | Reportes de inventario, proyectos y stock crítico |
| 📥 **Excel** | Exportación de inventario, despachos y proyectos |
| 🔔 **Alertas** | Notificación visual de materiales con stock bajo |

---

## 🔮 Próximos Pasos (Backend)

Cuando quieras integrar una base de datos real:

1. **Supabase** (PostgreSQL) — reemplaza el store de Zustand con llamadas a API
2. **Prisma ORM** — para tipado y migraciones seguras
3. **NextAuth con BD** — para múltiples usuarios y roles
4. **Almacenamiento de fotos** — Supabase Storage o Cloudinary

---

## 🛠️ Stack Tecnológico

- **Next.js 14** (App Router)
- **TypeScript**
- **NextAuth.js** — Autenticación
- **Zustand** — Estado global con persistencia
- **jsPDF** — Generación de PDFs
- **SheetJS (xlsx)** — Exportación a Excel
- **Lucide React** — Iconos
- **Tailwind CSS** — Utilidades de estilo

---
## para ingresar credenciales ##

## admin para usuario ##
## tesocol2026 05 para contraseña ##
*Desarrollado para TESOCOL — Tecnología Solar de Colombia*
