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

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🎬 CineWeb Manager</h1>
      <p className="mb-4">Hola, <b>{session?.user?.name}</b> ({session?.user?.email})</p>

      {/* --- SECCIÓN DE FORMULARIOS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        
        {/* Formulario Película */}
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

        {/* Formulario Sala */}
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
      </div>

      {/* --- MAPA --- */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-4">🗺️ Mapa de Salas</h2>
        <Mapa salas={salas} />
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