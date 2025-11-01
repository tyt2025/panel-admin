import Sidebar from '@/components/Sidebar'

export const metadata = {
  title: 'Taller - Panel Admin Tintas',
  description: 'Gestión de servicios de taller',
}

export default function TallerLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  )
}
