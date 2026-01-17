import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  callbacks: {
    async jwt({ token, account }) {
      // Si estamos iniciando sesión, guardamos el id_token de Google
      if (account) {
        token.id_token = account.id_token;
      }
      return token;
    },
    async session({ session, token }) {
      // Pasamos el id_token a la sesión para poder usarlo en el frontend
      session.id_token = token.id_token;
      return session;
    },
  },
})