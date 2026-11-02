import { Navbar } from './Navbar'
import { Footer } from './Footer'

interface PublicLayoutProps {
  children: React.ReactNode
  hideFooter?: boolean
}

export function PublicLayout({ children, hideFooter }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        {children}
      </main>
      {!hideFooter && <Footer />}
    </div>
  )
}
