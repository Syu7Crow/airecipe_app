import { useState } from 'react'
import './lib/supabase'
import './lib/groq'
import './App.css'
import { HomePage } from './pages/HomePage'
import { FridgePage } from './pages/FridgePage'
import { RecipeDetailPage } from './pages/RecipeDetailPage'
import type { Recipe } from './types/ui'

type Page = 'home' | 'fridge' | 'recipe'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)

  function handleNavigate(page: 'home' | 'fridge') {
    setCurrentPage(page)
  }

  function handleSelectRecipe(recipe: Recipe) {
    setSelectedRecipe(recipe)
    setCurrentPage('recipe')
  }

  if (currentPage === 'fridge') {
    return <FridgePage onNavigate={handleNavigate} />
  }

  if (currentPage === 'recipe' && selectedRecipe) {
    return (
      <RecipeDetailPage
        recipe={selectedRecipe}
        onBack={() => setCurrentPage('home')}
        onNavigate={handleNavigate}
      />
    )
  }

  return <HomePage onNavigate={handleNavigate} onSelectRecipe={handleSelectRecipe} />
}

export default App
