import { useCallback, useState } from 'react'
import { AsciiHero } from './components/AsciiHero'
import { AsciiProjects } from './components/AsciiProjects'
import { BurgerMenu } from './components/BurgerMenu'
import './App.css'

type Page = 'home' | 'projects' | 'about' | 'contact'

function App() {
  const [activePage, setActivePage] = useState<Page>('home')

  const handleNavigate = useCallback((id: string) => {
    setActivePage(id as Page)
  }, [])

  return (
    <main className="app">
      <BurgerMenu activePage={activePage} onNavigate={handleNavigate} />

      {activePage === 'home' && <AsciiHero />}
      {activePage === 'projects' && <AsciiProjects />}
      {activePage === 'about' && (
        <section className="app-section" aria-label="About me">
          <h2 className="app-section__title">About me</h2>
        </section>
      )}
      {activePage === 'contact' && (
        <section className="app-section" aria-label="Contact">
          <h2 className="app-section__title">Contact</h2>
        </section>
      )}
    </main>
  )
}

export default App
