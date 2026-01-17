from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from bson import ObjectId
import requests
import cloudinary.uploader
import math
from datetime import datetime

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
    # Buscamos la peli (ignorando mayúsculas/minúsculas)
    pelicula = peliculas_collection.find_one({"titulo": {"$regex": titulo, "$options": "i"}})
    if not pelicula:
        raise HTTPException(status_code=404, detail="Película no encontrada")
    
    # Buscamos en qué salas se proyecta
    # (Truco: buscamos salas que tengan una proyección con este título)
    salas = salas_collection.find({"proyecciones.pelicula_titulo": pelicula["titulo"]})
    
    resultado = pelicula_schema(pelicula)
    resultado["salas_donde_se_proyecta"] = salas_schema(salas)
    return resultado

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
@app.post("/proyecciones")
def asignar_proyeccion(nombre_sala: str, titulo_pelicula: str, fecha_hora: float):
    # Creamos la proyección
    nueva_proyeccion = Proyeccion(pelicula_titulo=titulo_pelicula, timestamp=fecha_hora)
    
    # La metemos dentro de la lista 'proyecciones' de la sala correspondiente
    resultado = salas_collection.update_one(
        {"nombre": nombre_sala},
        {"$push": {"proyecciones": nueva_proyeccion.dict()}}
    )
    
    if resultado.modified_count == 0:
        raise HTTPException(status_code=404, detail="Sala no encontrada")
    
    return {"mensaje": "Proyección asignada correctamente"}