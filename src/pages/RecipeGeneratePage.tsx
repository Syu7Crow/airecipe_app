import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Icon } from '../components/Icon'
import { RecipesPanel } from '../components/RecipesPanel'
import { Topbar } from '../components/Topbar'
import {
  fetchInventory,
  fetchSavedRecipes,
  generateRecipes,
} from '../lib/recipeApi'
import { defaultPreferences, fetchPreferences } from '../lib/preferencesApi'
import { useI18n } from '../lib/useI18n'
import type { AppDestination, Ingredient, Recipe, UserPreferences } from '../types/ui'

type RecipeGeneratePageProps = {
  onNavigate?: (page: AppDestination) => void
  onSelectRecipe?: (recipe: Recipe) => void
  onLogout?: () => void | Promise<void>
}

function formatIngredientAmount(
  ingredient: Ingredient,
  language: string,
  stockAvailable: string,
) {
  const parts: string[] = []

  if (ingredient.quantity && ingredient.quantity > 0) {
    parts.push(`${ingredient.quantity}${language === 'ja' ? '個' : ' pc(s)'}`)
  }

  if (ingredient.gram && ingredient.gram > 0) {
    parts.push(`${ingredient.gram}g`)
  }

  return parts.join(' / ') || ingredient.amount || stockAvailable
}

export function RecipeGeneratePage({
  onNavigate,
  onSelectRecipe,
  onLogout,
}: RecipeGeneratePageProps) {
  const { language, t } = useI18n()
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [preferences, setPreferences] =
    useState<UserPreferences>(defaultPreferences)
  const [servings, setServings] = useState(defaultPreferences.defaultServings)
  const [cookingRequest, setCookingRequest] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)

  const visibleIngredients = useMemo(
    () => ingredients.slice(0, 12),
    [ingredients],
  )

  useEffect(() => {
    let isMounted = true

    async function loadPageData() {
      setIsLoading(true)

      try {
        const [inventoryResult, recipesResult, preferencesResult] =
          await Promise.all([
            fetchInventory(language),
            fetchSavedRecipes(language),
            fetchPreferences(),
          ])

        if (!isMounted) {
          return
        }

        setIngredients(inventoryResult.inventory)
        setRecipes(recipesResult.recipes)
        setPreferences(preferencesResult.preferences)
        setServings(preferencesResult.preferences.defaultServings)
      } catch (error) {
        if (isMounted) {
          setStatusMessage(
            error instanceof Error
              ? error.message
              : t('recipeGenerate.loadFailed'),
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadPageData()

    return () => {
      isMounted = false
    }
  }, [language, t])

  async function handleGenerate(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()

    if (!ingredients.length) {
      setStatusMessage(t('recipeGenerate.generateEmpty'))
      return
    }

    setIsGenerating(true)
    setStatusMessage('')

    try {
      const result = await generateRecipes(
        servings,
        language,
        preferences.avoidedIngredients,
        cookingRequest,
      )

      setRecipes(result.recipes)
      setStatusMessage(t('recipeGenerate.generateSuccess'))
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : t('recipeGenerate.generateFailed'),
      )
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="app-shell">
      <Topbar onNavigate={onNavigate} onLogout={onLogout} />

      <main className="recipe-generate-page">
        <div className="fridge-header">
          <div>
            <p className="eyebrow">{t('recipeGenerate.eyebrow')}</p>
            <h1>{t('recipeGenerate.title')}</h1>
            <p className="recipe-generate-page__lead">
              {t('recipeGenerate.lead')}
            </p>
          </div>
          <button
            type="button"
            className="secondary-button back-home-button"
            onClick={() => onNavigate?.('home')}
          >
            {t('common.backHome')}
          </button>
        </div>

        {statusMessage ? (
          <p className="status-message" role="status">
            {statusMessage}
          </p>
        ) : null}

        <section className="recipe-generate-layout">
          <form className="panel recipe-prompt-panel" onSubmit={handleGenerate}>
            <div className="section-heading">
              <div>
                <p className="eyebrow">{t('recipeGenerate.conditionEyebrow')}</p>
                <h2>{t('recipeGenerate.conditionTitle')}</h2>
              </div>
            </div>

            <label className="recipe-prompt-field">
              <span>{t('recipeGenerate.requestLabel')}</span>
              <textarea
                value={cookingRequest}
                onChange={(event) => setCookingRequest(event.target.value)}
                placeholder={t('recipeGenerate.requestPlaceholder')}
              />
            </label>

            <label className="recipe-servings-field">
              <span>{t('recipeGenerate.servingsLabel')}</span>
              <input
                type="number"
                min="1"
                max="12"
                value={servings}
                onChange={(event) =>
                  setServings(Math.max(1, Number(event.target.value) || 1))
                }
              />
            </label>

            <button
              type="submit"
              className="primary-button"
              disabled={isGenerating || isLoading}
            >
              {isGenerating
                ? t('recipeGenerate.generating')
                : t('recipeGenerate.submit')}
              <Icon name="spark" />
            </button>
          </form>

          <aside className="panel recipe-inventory-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">{t('recipeGenerate.inventoryEyebrow')}</p>
                <h2>{t('recipeGenerate.inventoryTitle')}</h2>
              </div>
              <button
                type="button"
                className="small-button"
                onClick={() => onNavigate?.('ingredient-register')}
              >
                {t('recipeGenerate.register')}
              </button>
            </div>

            {visibleIngredients.length ? (
              <div className="recipe-inventory-list">
                {visibleIngredients.map((ingredient, index) => (
                  <span
                    key={ingredient.inventoryId ?? `${ingredient.name}-${index}`}
                    className="recipe-inventory-chip"
                  >
                    <strong>{ingredient.name}</strong>
                    <small>
                      {formatIngredientAmount(
                        ingredient,
                        language,
                        t('recipeGenerate.stockAvailable'),
                      )}
                    </small>
                  </span>
                ))}
              </div>
            ) : (
              <p className="empty-text">
                {t('recipeGenerate.emptyInventory')}
              </p>
            )}
          </aside>
        </section>

        <RecipesPanel
          recipes={recipes}
          isGenerating={isGenerating}
          onGenerateRecipe={() => void handleGenerate()}
          onSelectRecipe={onSelectRecipe}
        />
      </main>
    </div>
  )
}
