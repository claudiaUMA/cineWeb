from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from bson import ObjectId
import requests
import cloudinary.uploader
import math
from datetime import datetime
from models import Pelicula, Sala, Valoracion, Proyeccion, ProyeccionInput

# Importamos nuestras cosas
from database import peliculas_collection, salas_collection
from models import Pelicula, Sala, Valoracion, Proyeccion
from schemas import pelicula_schema, peliculas_schema, sala_schema, salas_schema

app = FastAPI()

# --- CONFIGURACIÓN CORS (Para que el Frontend pueda hablar con esto) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # El asterisco "*" significa: "Deja pasar a todo el mundo"
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- FUNCIÓN AUXILIAR: GEOCODING (Dirección -> Coordenadas) ---
def obtener_coordenadas(direccion: str):
    try:
        url = "https://nominatim.openstreetmap.org/search"
        params = {"q": direccion, "format": "json", "limit": 1}
        headers = {"User-Agent": "CineWebExamen/1.0"} # Importante para que no nos bloqueen
        respuesta = requests.get(url, params=params, headers=headers).json()
        
        if respuesta:
            return float(respuesta[0]["lat"]), float(respuesta[0]["lon"])
        return 0.0, 0.0
    except:
        return 0.0, 0.0

# --- ENDPOINTS DE PELÍCULAS ---

@app.get("/peliculas")
def obtener_peliculas():
    datos = peliculas_collection.find()
    return peliculas_schema(datos)

@app.get("/peliculas/buscar/{titulo}")
def buscar_pelicula(titulo: str):
    # 1. Buscar la película (Igual que tenías)
    pelicula = peliculas_collection.find_one({"titulo": {"$regex": titulo, "$options": "i"}})
    
    # CAMBIO 1: En vez de dar error 404, devolvemos un aviso suave 
    # para que el Frontend pueda decir "No encontrada" sin colgarse.
    if not pelicula:
        return {"encontrado": False}
    
    peli_data = pelicula_schema(pelicula)

    # 2. Buscar salas (Igual que tenías)
    salas_db = salas_collection.find({"proyecciones.pelicula_titulo": peli_data["titulo"]})
    salas_list = salas_schema(salas_db)

    # CAMBIO 2: EL MÁS IMPORTANTE (Procesar Horarios)
    # Recorremos las salas para sacar las fechas limpias solo de ESTA película
    for sala in salas_list:
        sala["horarios"] = [] # Creamos una lista nueva para guardar las horas legibles
        
        # Miramos dentro de las proyecciones de la sala
        for p in sala.get("proyecciones", []):
            if p["pelicula_titulo"] == peli_data["titulo"]:
                # Convertimos el timestamp (número) a fecha legible (texto)
                fecha_legible = datetime.fromtimestamp(p["timestamp"]).strftime("%Y-%m-%d %H:%M")
                sala["horarios"].append(fecha_legible)

    # CAMBIO 3: Devolver la estructura exacta que espera tu Dashboard.js
    return {
        "encontrado": True,
        "pelicula": peli_data,
        "salas": salas_list 
    }

@app.post("/peliculas")
async def crear_pelicula(titulo: str = Form(...), imagen: UploadFile = File(None)):
    # 1. Subir imagen a Cloudinary si existe
    url_imagen = None
    if imagen:
        resultado_cloud = cloudinary.uploader.upload(imagen.file)
        url_imagen = resultado_cloud.get("url")

    # 2. Crear objeto película
    nueva_pelicula = Pelicula(titulo=titulo, cartel=url_imagen)
    
    # 3. Guardar en Mongo
    id_insertado = peliculas_collection.insert_one(nueva_pelicula.dict()).inserted_id
    
    # 4. Devolver la película creada
    return pelicula_schema(peliculas_collection.find_one({"_id": id_insertado}))

# --- ENDPOINTS DE SALAS ---

@app.get("/salas")
def obtener_salas():
    datos = salas_collection.find()
    return salas_schema(datos)

@app.post("/salas")
def crear_sala(sala: Sala):
    # 1. Calcular coordenadas automáticamente
    lat, lon = obtener_coordenadas(sala.direccion)
    sala.latitud = lat
    sala.longitud = lon
    
    # 2. Guardar
    id_insertado = salas_collection.insert_one(sala.dict()).inserted_id
    return sala_schema(salas_collection.find_one({"_id": id_insertado}))

# --- ENDPOINT: ASIGNAR PROYECCIÓN (Poner peli en sala) ---
# --- ENDPOINT: ASIGNAR PROYECCIÓN (Corregido) ---
@app.post("/proyecciones")
def asignar_proyeccion(datos: ProyeccionInput):
    # 1. Convertir la fecha de texto (String) a número (Timestamp)
    try:
        # El frontend manda algo como "2025-01-20T18:30"
        dt_obj = datetime.fromisoformat(datos.fecha_hora)
        timestamp = dt_obj.timestamp()
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de fecha inválido")

    # 2. Crear el objeto Proyección oficial
    nueva_proyeccion = Proyeccion(
        pelicula_titulo=datos.titulo_pelicula, 
        timestamp=timestamp
    )
    
    # 3. Guardar dentro de la sala
    resultado = salas_collection.update_one(
        {"nombre": datos.nombre_sala},
        {"$push": {"proyecciones": nueva_proyeccion.dict()}}
    )
    
    if resultado.modified_count == 0:
        raise HTTPException(status_code=404, detail="Sala no encontrada")
    
    return {"mensaje": "Proyección asignada correctamente"}