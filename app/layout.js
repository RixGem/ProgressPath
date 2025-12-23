import './globals.css'
import { Inter } from 'next/font/google'
import Navigation from '../components/Navigation'
import { AuthProvider } from '../components/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'ProgressPath - Learning Tracker',
  description: 'Track your learning progress across books and languages',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <Navigation />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
