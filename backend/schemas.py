# Convierte una película de la base de datos a un diccionario limpio
def pelicula_schema(pelicula) -> dict:
    return {
        "id": str(pelicula["_id"]),
        "titulo": pelicula["titulo"],
        "cartel": pelicula.get("cartel"),
        "valoraciones": pelicula.get("valoraciones", [])
    }

# Convierte una lista de películas
def peliculas_schema(peliculas) -> list:
    return [pelicula_schema(pelicula) for pelicula in peliculas]

# Convierte una sala de la base de datos a un diccionario limpio
def sala_schema(sala) -> dict:
    return {
        "id": str(sala["_id"]),
        "nombre": sala["nombre"],
        "direccion": sala["direccion"],
        "propietario": sala["propietario"],
        "latitud": sala.get("latitud", 0.0),
        "longitud": sala.get("longitud", 0.0),
        "proyecciones": sala.get("proyecciones", [])
    }

# Convierte una lista de salas
def salas_schema(salas) -> list:
    return [sala_schema(sala) for sala in salas]