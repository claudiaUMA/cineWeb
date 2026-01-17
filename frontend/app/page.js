import { auth, signIn, signOut } from "@/auth"
import Dashboard from "@/components/Dashboard"

export default async function Home() {
  // Comprobamos si el usuario tiene sesión iniciada
  const session = await auth()

  // --- CASO 1: NO LOGUEADO ---
  // Mostramos pantalla de bienvenida con botón de Google
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <h1 className="text-4xl font-bold mb-6 text-blue-600">🎬 CineWeb Examen</h1>
        <p className="mb-8 text-gray-600">Sistema de Gestión de Cines y Películas</p>
        
        <form
          action={async () => {
            "use server"
            await signIn("google")
          }}
        >
          <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow hover:bg-blue-700 transition">
            Iniciar Sesión con Google
          </button>
        </form>
      </div>
    )
  }

  // --- CASO 2: LOGUEADO ---
  // Mostramos el Dashboard y un botoncito para salir arriba
  return (
    <main className="min-h-screen bg-white">
      {/* Barra superior negra con botón de salir */}
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center shadow-md">
        <span className="font-bold">Panel de Administración</span>
        <form
          action={async () => {
            "use server"
            await signOut()
          }}
        >
          <button type="submit" className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded transition">
            Cerrar Sesión
          </button>
        </form>
      </div>

      {/* Aquí cargamos todo el código que pegaste antes */}
      <Dashboard session={session} />
    </main>
  )
}