import Navbar from './Navbar'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex">
      <Navbar />
      <main className="flex-1 md:ml-56 pb-20 md:pb-0">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  )
}
