"use client"
import { useState, useEffect } from "react"
import axios from "axios"
import dynamic from "next/dynamic"

// Importamos el Mapa de forma dinámica para que no falle al cargar la página
// (Esto es un truco necesario en Next.js con mapas)
const Mapa = dynamic(() => import("./Mapa"), { ssr: false })

export default function Dashboard({ session }) {
  const [peliculas, setPeliculas] = useState([])
  const [salas, setSalas] = useState([])
  
  // ... tus estados anteriores ...
  
  // 1. NUEVOS ESTADOS (Añádelos aquí)
  const [nuevaProyeccion, setNuevaProyeccion] = useState({ movie: "", hall: "", date: "" })
  const [busqueda, setBusqueda] = useState("")
  const [resultadoBusqueda, setResultadoBusqueda] = useState(null)
  const [puntuacion, setPuntuacion] = useState(5)
  const [salasMapa, setSalasMapa] = useState([]) // Importante para filtrar el mapa

  // Estados para los formularios
  const [nuevaPeli, setNuevaPeli] = useState({ titulo: "", imagen: null })
  const [nuevaSala, setNuevaSala] = useState({ nombre: "", direccion: "" })

  //const API_URL = process.env.NEXT_PUBLIC_API_URL
// const API_URL = process.env.NEXT_PUBLIC_API_URL
const API_URL = "https://cineweb-backend.onrender.com"
  // --- 1. CARGAR DATOS AL INICIAR ---
  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      const resPelis = await axios.get(`${API_URL}/peliculas`)
      setPeliculas(resPelis.data)
      
      const resSalas = await axios.get(`${API_URL}/salas`)
      setSalas(resSalas.data)

      setSalasMapa(resSalas.data)
    } catch (error) {
      console.error("Error cargando datos:", error)
    }
  }

  // --- 2. CREAR PELÍCULA (Con subida de imagen) ---
  const handleCrearPelicula = async (e) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append("titulo", nuevaPeli.titulo)
    if (nuevaPeli.imagen) formData.append("imagen", nuevaPeli.imagen)

    try {
      await axios.post(`${API_URL}/peliculas`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      alert("Película creada!")
      setNuevaPeli({ titulo: "", imagen: null }) // Limpiar form
      cargarDatos() // Recargar lista
    } catch (error) {
      alert("Error al crear película")
    }
  }

  // --- 3. CREAR SALA (Geocoding automático en backend) ---
  const handleCrearSala = async (e) => {
    e.preventDefault()
    // Añadimos el propietario automáticamente desde la sesión de Google
    const datosSala = { 
      ...nuevaSala, 
      propietario: session?.user?.email 
    }

    try {
      await axios.post(`${API_URL}/salas`, datosSala)
      alert("Sala creada y geolocalizada!")
      setNuevaSala({ nombre: "", direccion: "" }) // Limpiar form
      cargarDatos() // Recargar lista
    } catch (error) {
      alert("Error al crear sala")
    }
  }

  // --- 4. ASIGNAR PROYECCIÓN (Añadir esto) ---
  const handleCrearProyeccion = async (e) => {
    e.preventDefault()
    try {
      await axios.post(`${API_URL}/proyecciones`, {
        nombre_sala: nuevaProyeccion.hall,
        titulo_pelicula: nuevaProyeccion.movie,
        fecha_hora: nuevaProyeccion.date
      })
      alert("¡Proyección asignada correctamente!")
      setNuevaProyeccion({ movie: "", hall: "", date: "" })
    } catch (error) { alert("Error asignando proyección") }
  }

  // --- 5. BUSCAR PELÍCULA Y ACTUALIZAR MAPA (Añadir esto) ---
  const handleBuscar = async (e) => {
    e.preventDefault()
    if (!busqueda) return
    try {
      const res = await axios.get(`${API_URL}/peliculas/buscar/${busqueda}`)
      if (res.data.encontrado) {
        setResultadoBusqueda(res.data)
        // AQUÍ ESTÁ EL TRUCO: Solo pasamos al mapa las salas donde echan la peli
        setSalasMapa(res.data.salas) 
      } else {
        alert("Película no encontrada")
        setResultadoBusqueda(null)
      }
    } catch (error) { console.error(error) }
  }

  // --- 6. VALORAR PELÍCULA (Añadir esto) ---
  const handleValorar = async () => {
    if (!resultadoBusqueda) return
    try {
      await axios.post(`${API_URL}/peliculas/valorar`, {
        titulo_pelicula: resultadoBusqueda.pelicula.titulo,
        email_usuario: session?.user?.email,
        puntuacion: parseInt(puntuacion)
      })
      alert("¡Valoración enviada!")
    } catch (error) { alert("Error al valorar") }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🎬 CineWeb Manager</h1>
      <p className="mb-4">Hola, <b>{session?.user?.name}</b> ({session?.user?.email})</p>

      {/* --- SECCIÓN DE FORMULARIOS --- */}
      {/* --- SECCIÓN DE FORMULARIOS (3 COLUMNAS) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        
        {/* 1. Formulario Película */}
        <div className="bg-gray-100 p-4 rounded shadow">
          <h2 className="text-xl font-bold mb-4">Nueva Película</h2>
          <form onSubmit={handleCrearPelicula} className="flex flex-col gap-3">
            <input 
              type="text" 
              placeholder="Título de la película" 
              className="p-2 border rounded text-black"
              value={nuevaPeli.titulo}
              onChange={(e) => setNuevaPeli({...nuevaPeli, titulo: e.target.value})}
              required
            />
            <input 
              type="file" 
              onChange={(e) => setNuevaPeli({...nuevaPeli, imagen: e.target.files[0]})}
              className="text-sm"
            />
            <button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
              Subir Película
            </button>
          </form>
        </div>

        {/* 2. Formulario Sala */}
        <div className="bg-gray-100 p-4 rounded shadow">
          <h2 className="text-xl font-bold mb-4">Nueva Sala</h2>
          <form onSubmit={handleCrearSala} className="flex flex-col gap-3">
            <input 
              type="text" 
              placeholder="Nombre del Cine" 
              className="p-2 border rounded text-black"
              value={nuevaSala.nombre}
              onChange={(e) => setNuevaSala({...nuevaSala, nombre: e.target.value})}
              required
            />
            <input 
              type="text" 
              placeholder="Dirección (Ej: Calle Larios, Málaga)" 
              className="p-2 border rounded text-black"
              value={nuevaSala.direccion}
              onChange={(e) => setNuevaSala({...nuevaSala, direccion: e.target.value})}
              required
            />
            <button type="submit" className="bg-green-600 text-white p-2 rounded hover:bg-green-700">
              Registrar Sala
            </button>
          </form>
        </div>

        {/* 3. ASIGNAR PROYECCIÓN (El que faltaba) */}
        <div className="bg-purple-50 p-4 rounded shadow border border-purple-200">
            <h2 className="text-xl font-bold mb-4 text-purple-800">Asignar Proyección</h2>
            <form onSubmit={handleCrearProyeccion} className="flex flex-col gap-3">
            <select 
                className="p-2 border rounded text-black"
                value={nuevaProyeccion.movie} 
                onChange={(e) => setNuevaProyeccion({...nuevaProyeccion, movie: e.target.value})} 
                required
            >
                <option value="">Elegir Película...</option>
                {peliculas.map(p => <option key={p.id} value={p.titulo}>{p.titulo}</option>)}
            </select>

            <select 
                className="p-2 border rounded text-black"
                value={nuevaProyeccion.hall} 
                onChange={(e) => setNuevaProyeccion({...nuevaProyeccion, hall: e.target.value})} 
                required
            >
                <option value="">Elegir Sala...</option>
                {salas.map(s => <option key={s.id} value={s.nombre}>{s.nombre}</option>)}
            </select>

            <input 
                type="datetime-local" 
                className="p-2 border rounded text-black"
                value={nuevaProyeccion.date} 
                onChange={(e) => setNuevaProyeccion({...nuevaProyeccion, date: e.target.value})} 
                required 
            />
            <button type="submit" className="bg-purple-600 text-white p-2 rounded hover:bg-purple-700">
                Asignar
            </button>
            </form>
        </div>
      </div>

      {/* --- MAPA --- */}
      {/* --- NUEVA ZONA: BUSCADOR Y MAPA --- */}
      <div className="mb-10 p-6 border rounded-xl bg-blue-50">
        <h2 className="text-2xl font-bold mb-4">🔍 Buscar Película y Cartelera</h2>
        
        {/* Barra de Búsqueda */}
        <div className="flex gap-2 mb-6">
          <input 
            type="text" 
            placeholder="Escribe el nombre de la película..." 
            className="flex-1 p-3 border rounded text-black"
            value={busqueda} 
            onChange={(e) => setBusqueda(e.target.value)} 
          />
          <button onClick={handleBuscar} className="bg-blue-600 text-white px-6 rounded font-bold">
            BUSCAR
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* El Mapa ahora usa 'salasMapa' en vez de 'salas' */}
          <div className="h-96 w-full border rounded overflow-hidden bg-white">
             <Mapa salas={salasMapa} />
          </div>

          {/* Resultados y Valoración */}
          <div className="bg-white p-4 rounded shadow h-96 overflow-y-auto">
            {!resultadoBusqueda ? (
              <p className="text-gray-500 mt-10 text-center">Busca una película para ver horarios y mapa.</p>
            ) : (
              <div>
                <h2 className="text-2xl font-bold text-blue-800">{resultadoBusqueda.pelicula.titulo}</h2>
                
                {/* Sistema de Valoración */}
                <div className="my-4 p-3 bg-yellow-50 rounded border border-yellow-200 flex items-center gap-2">
                  <span className="font-bold text-yellow-700">Valorar:</span>
                  <select 
                    value={puntuacion} 
                    onChange={(e) => setPuntuacion(e.target.value)} 
                    className="border p-1 rounded text-black"
                  >
                    <option value="5">5 ⭐ Excelente</option>
                    <option value="4">4 ⭐ Muy buena</option>
                    <option value="3">3 ⭐ Normal</option>
                    <option value="2">2 ⭐ Regular</option>
                    <option value="1">1 ⭐ Mala</option>
                  </select>
                  <button onClick={handleValorar} className="bg-yellow-500 text-white px-3 py-1 rounded text-sm">
                    Enviar
                  </button>
                </div>

                {/* Lista de horarios */}
                <h3 className="font-bold border-b pb-2 mb-2">Horarios de Proyección:</h3>
                <ul className="space-y-3 text-sm">
                  {resultadoBusqueda.salas.map(s => (
                    <li key={s.id} className="bg-gray-50 p-2 rounded">
                      <div className="font-bold">📍 {s.nombre}</div>
                      <div className="text-gray-600 mb-1">{s.direccion}</div>
                      <div className="text-blue-600 font-mono">
                        {s.horarios && s.horarios.join(" | ")}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- LISTAS DE DATOS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-bold border-b pb-2 mb-4">Películas Disponibles</h3>
          <ul className="space-y-4">
            {peliculas.map((p) => (
              <li key={p.id} className="flex items-center gap-4 border p-2 rounded">
                {p.cartel && <img src={p.cartel} alt={p.titulo} className="w-16 h-24 object-cover rounded" />}
                <span className="font-semibold">{p.titulo}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xl font-bold border-b pb-2 mb-4">Salas Registradas</h3>
          <ul className="space-y-2">
            {salas.map((s) => (
              <li key={s.id} className="border p-2 rounded">
                <div className="font-bold">{s.nombre}</div>
                <div className="text-sm text-gray-600">{s.direccion}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}