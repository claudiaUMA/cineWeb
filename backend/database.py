from pymongo import MongoClient
import cloudinary
import os
from dotenv import load_dotenv

# Cargar variables de entorno desde .env
load_dotenv()

# 1. Configuración de MongoDB
MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)
db = client.cineweb_db  # Nombre de tu base de datos para este examen

# Colecciones específicas para CineWeb
peliculas_collection = db.peliculas
salas_collection = db.salas
usuarios_collection = db.usuarios

# 2. Configuración de Cloudinary (para las imágenes)
cloudinary.config( 
  cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME"), 
  api_key = os.getenv("CLOUDINARY_API_KEY"), 
  api_secret = os.getenv("CLOUDINARY_API_SECRET"),
  secure = True
)