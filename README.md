# SwiftDesing BI - Dashboard Analítico

Proyecto de Inteligencia de Negocios para Titania Joyas.
**Stack Tecnológico:** React, FastAPI, PostgreSQL (Supabase), Python, Vite, TailwindCSS.
**Repositorio:** [https://github.com/Jossh478/SwiftDesing-Dashboard](https://github.com/Jossh478/SwiftDesing-Dashboard)

SwiftDesing Dashboard es una plataforma de gestión operativa que centraliza métricas clave de inventario, marketing y logística. Incorpora el motor de Google Gemini para generar *insights* predictivos basados en el estado actual de la base de datos.

## Características Principales
*   **Analítica General:** Ingresos consolidados, volumen de ventas y evolución YTD (Ingresos vs Costos).
*   **Inventario:** Monitoreo de riesgo de stock y matriz de rentabilidad.
*   **Marketing & Ads:** Análisis de CAC, CLV, embudo de conversión y ROAS por campaña.
*   **Centro Logístico:** Tablero Kanban para filtrado y gestión de órdenes.
*   **AI Insights:** Análisis predictivo y estratégico automatizado.

## Arquitectura del Sistema
1.  **Frontend:** Interfaz interactiva desarrollada en React y construida con Vite.
2.  **Backend:** API REST desarrollada en FastAPI (Python) para el enrutamiento y la seguridad (RBAC).
3.  **Base de Datos:** PostgreSQL relacional alojado en la nube de Supabase.

---

## Guía de Despliegue Local

### 1. Configuración del Backend (FastAPI)
1. Abrir una terminal en la carpeta `/backend` y crear un entorno virtual (`python -m venv .venv`).
2. Instalar las dependencias: `pip install -r requirements.txt`
3. Renombrar el archivo `.env.example` a `.env` e ingresar las credenciales de conexión a PostgreSQL y la API Key de Gemini provistas en el informe técnico.
4. Ejecutar el servidor: `uvicorn app.main:app --reload --port 5000`

### 2. Configuración del Frontend (React/Vite)
1. Abrir una nueva terminal en la carpeta `/frontend` y ejecutar `npm install`.
2. Renombrar el archivo `.env.example` a `.env` y verificar que contenga la ruta local del backend: `VITE_API_URL=http://localhost:5000`
3. Desplegar la interfaz: `npm run dev`

---

## Estructura de Base de Datos
El sistema consume las siguientes tablas relacionales:
*   `usuarios` (id, nombre, email, password, rol, activo, fecha_creacion)
*   `ordenes` (id, ciudad, estado, monto, fecha_compra, usuario_id, producto_id)
*   `productos` (id, sku, nombre, categoria, precio, costo, stock, ritmo_venta_diario, fecha_agregado)
*   `campanas` (id, canal, gasto, conversiones, ingresos, activa, producto_id)
