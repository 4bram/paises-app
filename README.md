# Buscador de Países

App web hecha con **Vite + React** que muestra un catálogo de países. Los datos se obtienen de la API pública **REST Countries (v5)**, se guardan en **Supabase** y la interfaz consume **únicamente** esa base de datos. El acceso es con **OAuth (GitHub)**.

## Funcionalidades

- Inicio de sesión con GitHub (Supabase Auth).
- Catálogo en tarjetas con bandera, nombre y región.
- Búsqueda por país y filtro por región.
- Vista de detalle en modal (nombre oficial, capital, subregión, población y área).
- Indicador de carga y manejo de errores.
- Diseño responsive.

## Arquitectura

```
REST Countries API  --(scripts/load-countries.js)-->  Supabase (PostgreSQL)  <--  App React
      (pública)            proceso de carga                regions, countries       (solo lee)
```

- **Obtención:** el script pide los países por páginas de 100 (`limit` / `offset`) y valida errores.
- **Persistencia:** dos tablas relacionadas (`regions` y `countries`). Se usa `upsert` por llave única, así que cargar varias veces no duplica datos.
- **Consumo:** la interfaz nunca llama a REST Countries; solo consulta Supabase con la llave publishable y RLS (lectura solo para usuarios autenticados).

## Requisitos

- Node.js 18 o superior
- Un proyecto de Supabase
- Una OAuth App de GitHub
- Una API key de REST Countries (plan gratis)

## Instalación

```bash
git clone https://github.com/TU-USUARIO/paises-app.git
cd paises-app
npm install
cp .env.example .env.local
```

Rellena `.env.local` con tus valores:

| Variable | Descripción |
|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto de Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Llave publishable (pública, va en el navegador) |
| `SUPABASE_SECRET_KEY` | Llave secret (privada, solo para el script de carga) |
| `RESTCOUNTRIES_API_KEY` | API key de REST Countries (solo para el script de carga) |

> `.env.local` está en `.gitignore`. No subas llaves al repositorio.

## Configuración de Supabase

1. Crea las tablas y políticas ejecutando `supabase/schema.sql` en el *SQL Editor*.
2. En **Authentication → Sign In / Providers**, activa **GitHub** con el Client ID y Client Secret de tu OAuth App.
3. En la OAuth App de GitHub, usa como callback `https://TU-PROYECTO.supabase.co/auth/v1/callback`.
4. En **Authentication → URL Configuration**, pon como Site URL `http://localhost:5173` y agrega `http://localhost:5173/**` en Redirect URLs.

## Uso

Primero carga los datos (API pública → Supabase):

```bash
node scripts/load-countries.js
```

Después inicia la app:

```bash
npm run dev
```

Abre `http://localhost:5173` e inicia sesión con GitHub.

## Estructura

```
scripts/
  load-countries.js     # carga API -> Supabase
  test-connection.js    # prueba de conexión
src/
  lib/supabase.js       # cliente de Supabase
  App.jsx               # login y sesión
  Countries.jsx         # catálogo, búsqueda, filtro y modal
supabase/
  schema.sql            # tablas y políticas RLS
.env.example
```

## Tecnologías

Vite, React, Supabase (Auth y PostgreSQL), REST Countries API.