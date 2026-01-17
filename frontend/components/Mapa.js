"use client"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { useEffect } from "react"

// Esto es para arreglar un bug de los iconos de Leaflet en Next.js
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

export default function Mapa({ salas }) {
  // Si no hay salas, no pintamos nada o pintamos un mapa por defecto
  if (!salas) return null;

  return (
    <MapContainer center={[36.7213, -4.4216]} zoom={13} style={{ height: "400px", width: "100%", borderRadius: "10px" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {salas.map((sala) => (
        sala.latitud && sala.longitud ? (
          <Marker key={sala.id} position={[sala.latitud, sala.longitud]} icon={icon}>
            <Popup>
              <b>{sala.nombre}</b> <br /> {sala.direccion}
            </Popup>
          </Marker>
        ) : null
      ))}
    </MapContainer>
  )
}