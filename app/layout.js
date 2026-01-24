import './globals.css'
import { Inter } from 'next/font/google'
import Navigation from '../components/Navigation'
import { AuthProvider } from '../contexts/AuthContext'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: "Chris's Learning Goal - Track Your Progress",
  description: "Chris's personalized learning tracker for books, languages, and educational progress. Monitor your learning journey and achieve your goals.",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
  },
  manifest: '/site.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: "Chris's Learning Goal",
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#6366f1' },
    { media: '(prefers-color-scheme: dark)', color: '#4f46e5' }
  ],
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Theme initialization script - runs before page render to prevent flash */}
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            (function() {
              function getThemeMode() {
                return localStorage.getItem('theme-mode') || 'system';
              }
              
              function getManualTheme() {
                return localStorage.getItem('theme-manual') || 'light';
              }
              
              function getSystemTheme() {
                return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
              }
              
              function isDarkHours() {
                const hour = new Date().getHours();
                return hour >= 18 || hour < 6;
              }
              
              function calculateTheme() {
                const mode = getThemeMode();
                
                switch (mode) {
                  case 'manual':
                    return getManualTheme();
                  case 'system':
                    return getSystemTheme();
                  case 'time-based':
                    return isDarkHours() ? 'dark' : 'light';
                  default:
                    return getSystemTheme();
                }
              }
              
              const theme = calculateTheme();
              if (theme === 'dark') {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
            })();
          `}
        </Script>
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-200">
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
