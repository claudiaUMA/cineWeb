from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime

# --- SUB-MODELOS (Partes pequeñas de otros modelos) ---

# Una valoración hecha por un usuario (para meter dentro de la película)
class Valoracion(BaseModel):
    usuario: EmailStr
    puntuacion: int = Field(..., ge=1, le=5)  # Nota del 1 al 5
    timestamp: float = Field(default_factory=lambda: datetime.now().timestamp())

# Una proyección (para meter dentro de la sala)
class Proyeccion(BaseModel):
    pelicula_titulo: str
    timestamp: float  # Fecha y hora de la proyección

# --- MODELOS PRINCIPALES ---

# Modelo de Película
class Pelicula(BaseModel):
    titulo: str
    cartel: Optional[str] = None  # URL de la imagen (se llenará sola al subirla)
    valoraciones: List[Valoracion] = []  # Lista de valoraciones, empieza vacía

# Modelo de Sala
class Sala(BaseModel):
    nombre: str
    direccion: str
    propietario: EmailStr  # Email del dueño (tú)
    latitud: float = 0.0  # Coordenadas (las calcularemos automáticamente)
    longitud: float = 0.0
    proyecciones: List[Proyeccion] = []  # Lista de pelis en esta sala, empieza vacía

class ProyeccionInput(BaseModel):
    nombre_sala: str
    titulo_pelicula: str
    fecha_hora: str  # Recibiremos fecha como texto del formulario

class ValoracionInput(BaseModel):
    titulo_pelicula: str
    email_usuario: str
    puntuacion: int