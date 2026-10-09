import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import psycopg2
from psycopg2.extras import RealDictCursor
from google import genai


load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = os.getenv("DATABASE_URL")

def get_db_connection():
    if not DATABASE_URL:
        print("ERROR CRÍTICO: No se encontró DATABASE_URL en el archivo .env")
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

class LoginRequest(BaseModel):
    email: str
    password: str

@app.get("/api/ventas")
def get_ventas():
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT o.id, u.nombre as cliente, o.ciudad, o.estado, o.monto 
            FROM ordenes o
            LEFT JOIN usuarios u ON o.usuario_id = u.id
        """)
        ordenes = cur.fetchall()
        
        ventas_formateadas = []
        for o in ordenes:
            ventas_formateadas.append({
                "id": o["id"],
                "cliente": o["cliente"],
                "ubicacion": {"ciudad": o["ciudad"]},
                "estado": o["estado"],
                "monto": float(o["monto"])
            })
        return ventas_formateadas
    except Exception as e:
        print(f"Error conectando a Supabase (Ventas): {e}")
        return []
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

@app.get("/api/usuarios")
def get_usuarios():
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, nombre, email, rol, activo, fecha_creacion FROM usuarios")
        usuarios_db = cur.fetchall()
        
        usuarios_formateados = []
        for u in usuarios_db:
            usuarios_formateados.append({
                "id": u["id"],
                "nombre": u["nombre"],
                "email": u["email"],
                "rol": u["rol"],
                "activo": u["activo"],
                "fecha": u["fecha_creacion"].strftime("%Y-%m-%d")
            })
        return usuarios_formateados
    except Exception as e:
        print(f"Error conectando a Supabase (Usuarios): {e}")
        return []
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

@app.get("/api/productos")
def get_productos():
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, sku, nombre, precio, costo, stock, ritmo_venta_diario FROM productos")
        productos_db = cur.fetchall()
        
        productos_formateados = []
        for p in productos_db:
            precio = float(p["precio"])
            costo = float(p["costo"])
            stock = int(p["stock"])
            ritmo = float(p["ritmo_venta_diario"])
            
            margen_bruto = precio - costo
            margen_porcentaje = round((margen_bruto / precio) * 100, 1) if precio > 0 else 0
            cobertura_dias = int(stock / ritmo) if ritmo > 0 else 999
            
            ventas_simuladas = stock * 2 if stock > 0 else 150

            productos_formateados.append({
                "id": p["id"],
                "sku": p["sku"],
                "nombre": p["nombre"],
                "precio": precio,
                "costo": costo,
                "stock": stock,
                "ventas": ventas_simuladas,
                "ritmo_venta_diario": ritmo,
                "margenPorcentaje": margen_porcentaje,
                "coberturaDias": cobertura_dias
            })
        return productos_formateados
    except Exception as e:
        print(f"Error conectando a Supabase (Productos): {e}")
        return []
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

@app.get("/api/campanas")
def get_campanas():
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
        SELECT c.id, c.canal, c.gasto, c.conversiones, c.ingresos, c.activa, p.nombre as producto_promocionado
        FROM campanas c
        LEFT JOIN productos p ON c.producto_id = p.id
        """)
        campanas_db = cur.fetchall()
        
        campanas_formateadas = []
        for c in campanas_db:
            gasto = float(c["gasto"])
            conversiones = int(c["conversiones"])
            ingresos = float(c["ingresos"])
            
            cac = round(gasto / conversiones, 2) if conversiones > 0 else gasto
            roas = round(ingresos / gasto, 2) if gasto > 0 else 0
            
            campanas_formateadas.append({
                "id": c["id"],
                "canal": c["canal"],
                "gasto": gasto,
                "conversiones": conversiones,
                "ingresos": ingresos,
                "activa": c["activa"],
                "cac": cac,
                "roas": roas,
                "producto_promocionado": c["producto_promocionado"]
            })
        return campanas_formateadas
    except Exception as e:
        print(f"Error conectando a Supabase (Campañas): {e}")
        return []
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

@app.post("/api/login")
def login(req: LoginRequest):
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("SELECT nombre, rol, activo FROM usuarios WHERE email = %s AND password = %s", (req.email, req.password))
        user = cur.fetchone()

        if user:
            if not user['activo']:
                return {"success": False, "message": "Acceso denegado: Usuario revocado o inactivo."}
            
            return {
                "success": True, 
                "message": "Login exitoso",
                "usuario": {"nombre": user['nombre'], "rol": user['rol']}
            }
        else:
            return {"success": False, "message": "Credenciales incorrectas."}
            
    except Exception as e:
        print(f"Error en Login: {e}")
        return {"success": False, "message": "Error interno del servidor."}
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

@app.get("/api/insights")
def get_insights():
    conn = None
    cur = None
    try:
        if not client:
            return {"success": False, "insight": "Error: No se encontró la API Key en el archivo .env"}

        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("SELECT SUM(monto) as total_ventas, COUNT(id) as total_ordenes FROM ordenes")
        ventas = cur.fetchone()
        
        cur.execute("SELECT COUNT(id) as ordenes_pendientes FROM ordenes WHERE estado = 'Pendiente'")
        pendientes = cur.fetchone()
        
        cur.execute("SELECT SUM(gasto) as total_gasto, SUM(ingresos) as total_retorno FROM campanas WHERE activa = true")
        ads = cur.fetchone()

        prompt = f"""
        Actúa como un Consultor Senior de Inteligencia de Negocios para el e-commerce 'Titania Joyas'.
        Aquí tienes los datos actuales de la base de datos en tiempo real:
        - Ingresos totales: ${ventas['total_ventas']}
        - Órdenes totales: {ventas['total_ordenes']}
        - Órdenes en cola (pendientes de envío): {pendientes['ordenes_pendientes']}
        - Inversión en Marketing: ${ads['total_gasto']}
        - Retorno de Marketing (Ingresos atribuidos): ${ads['total_retorno']}

        Genera un 'Insight' accionable y predictivo de máximo 3 líneas (muy conciso y directo al grano). 
        Dime qué significa este panorama y qué acción logística o de marketing recomiendas tomar inmediatamente.
        No uses saludos, ve directo al análisis.
        """

        response = client.models.generate_content(
            model='gemini-3.8-flash', 
            contents=prompt
        )
        
        return {
            "success": True, 
            "insight": response.text
        }
        
    except Exception as e:
        print(f"Error en Gemini: {e}")
        return {
            "success": False,
            "insight": "El motor predictivo está sincronizando datos. Por favor, recargue el panel en unos instantes."
        }
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()