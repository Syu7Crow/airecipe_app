import { useEffect, useMemo, useState } from 'react'
import { FeatureCard } from '../components/FeatureCard'
import { HeroPanel } from '../components/HeroPanel'
import { IngredientsPanel } from '../components/IngredientsPanel'
import { RecipesPanel } from '../components/RecipesPanel'
import { SummaryGrid } from '../components/SummaryGrid'
import { Topbar } from '../components/Topbar'
import { primaryFeatures, secondaryFeatures } from '../data/home'
import {
  fetchInventory,
  fetchSavedRecipes,
  generateRecipes,
  markRecipeCooked,
} from '../lib/recipeApi'
import type { AppDestination, Ingredient, Recipe } from '../types/ui'

type HomePageProps = {
  onNavigate?: (page: AppDestination) => void
  onSelectRecipe?: (recipe: Recipe) => void
  onLogout?: () => void | Promise<void>
}

function isNearExpiration(ingredient: Ingredient) {
  if (!ingredient.expirationDate) {
    return false
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiration = new Date(`${ingredient.expirationDate}T00:00:00`)

  if (Number.isNaN(expiration.getTime())) {
    return false
  }

  const diffDays = Math.ceil(
    (expiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  )

  return diffDays >= 0 && diffDays <= 3
}

function buildSummaryItems(ingredients: Ingredient[], recipes: Recipe[]) {
  const nearExpirationCount = ingredients.filter(isNearExpiration).length
  const favoriteCount = recipes.filter((recipe) => recipe.isFavorite).length

  return [
    {
      label: '登録食材',
      value: String(ingredients.length),
      note: ingredients.length
        ? 'ログイン中のユーザーの在庫'
        : 'まず食材を登録してください',
    },
    {
      label: '期限間近',
      value: String(nearExpirationCount),
      note:
        nearExpirationCount > 0
          ? '3日以内に期限が近い食材'
          : '期限が近い食材はありません',
    },
    {
      label: 'レシピ候補',
      value: String(recipes.length),
      note: recipes.length ? '保存済みのレシピ' : 'まだ生成されていません',
    },
    {
      label: 'お気に入り',
      value: String(favoriteCount),
      note: '保存済みレシピから集計',
    },
  ]
}

export function HomePage({
  onNavigate,
  onSelectRecipe,
  onLogout,
}: HomePageProps) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCooking, setIsCooking] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [cookingRecipe, setCookingRecipe] = useState<Recipe | null>(null)
  const [servings, setServings] = useState(1)
  const currentSummaryItems = useMemo(
    () => buildSummaryItems(ingredients, recipes),
    [ingredients, recipes],
  )

  useEffect(() => {
    let isMounted = true

    fetchInventory()
      .then((result) => {
        if (isMounted) {
          setIngredients(result.inventory)
        }
      })
      .catch((error) => {
        console.warn('[vite] Inventory fetch failed:', error)
        if (isMounted) {
          setStatusMessage(
            error instanceof Error ? error.message : '食材の取得に失敗しました',
          )
        }
      })

    fetchSavedRecipes()
      .then((result) => {
        if (isMounted) {
          setRecipes(result.recipes)
        }
      })
      .catch((error) => {
        console.warn('[vite] Saved recipes fetch failed:', error)
      })

    return () => {
      isMounted = false
    }
  }, [])

  function navigateToReceipt() {
    onNavigate?.('receipt')
  }

  async function handleGenerateRecipe() {
    if (!ingredients.length) {
      setStatusMessage(
        '食材を登録してからレシピを生成してください。レシート登録から食材を追加できます。',
      )
      return
    }

    setIsGenerating(true)
    setStatusMessage('')

    try {
      const result = await generateRecipes(2)

      if (result.recipes.length) {
        setRecipes(result.recipes)
        setStatusMessage('レシピ候補を生成しました')
      }
    } catch (error) {
      console.error('[vite] Recipe generation failed:', error)
      setStatusMessage(
        error instanceof Error ? error.message : 'レシピ生成に失敗しました',
      )
    } finally {
      setIsGenerating(false)
    }
  }

  function openCookedDialog(recipe: Recipe) {
    setCookingRecipe(recipe)
    setServings(1)
    setStatusMessage('')
  }

  async function handleConfirmCooked() {
    if (!cookingRecipe?.recipeId) {
      return
    }

    setIsCooking(true)
    setStatusMessage('')

    try {
      const result = await markRecipeCooked(cookingRecipe.recipeId, servings)
      setIngredients(result.inventory)
      setStatusMessage(`${servings}人前として在庫を更新しました`)
      setCookingRecipe(null)
    } catch (error) {
      console.error('[vite] Cooking update failed:', error)
      setStatusMessage(
        error instanceof Error ? error.message : '在庫の更新に失敗しました',
      )
    } finally {
      setIsCooking(false)
    }
  }

  return (
    <div className="app-shell">
      <Topbar onNavigate={onNavigate} onLogout={onLogout} />

      <main className="home">
        <HeroPanel
          isGenerating={isGenerating}
          onGenerateRecipe={handleGenerateRecipe}
          onAddIngredient={navigateToReceipt}
          onScanReceipt={navigateToReceipt}
          onShowRecipes={() => onNavigate?.('history')}
        />

        {statusMessage ? (
          <p className="status-message" role="status">
            {statusMessage}
          </p>
        ) : null}

        <SummaryGrid items={currentSummaryItems} />

        <section className="feature-section" aria-label="クイックアクセス">
          <div className="feature-grid">
            {primaryFeatures.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                feature={feature}
                onAction={
                  index === 0
                    ? handleGenerateRecipe
                    : index === 1
                      ? navigateToReceipt
                      : index === 3
                        ? () => onNavigate?.('history')
                        : undefined
                }
              />
            ))}
          </div>
        </section>

        <div className="dashboard-grid">
          <IngredientsPanel
            ingredients={ingredients}
            onAddIngredient={navigateToReceipt}
          />
          <RecipesPanel
            recipes={recipes}
            isGenerating={isGenerating}
            onGenerateRecipe={handleGenerateRecipe}
            onSelectRecipe={onSelectRecipe}
            onCookRecipe={openCookedDialog}
          />
        </div>

        <section
          className="secondary-section"
          id="shopping"
          aria-label="アカウントとサポート"
        >
          <div className="secondary-grid">
            {secondaryFeatures.map((feature) => (
              <FeatureCard key={feature.title} feature={feature} />
            ))}
          </div>
        </section>
      </main>

      {cookingRecipe ? (
        <div className="modal-backdrop" role="presentation">
          <section
            className="cook-modal"
            aria-labelledby="cook-modal-title"
            aria-modal="true"
            role="dialog"
          >
            <p className="eyebrow">調理済み</p>
            <h2 id="cook-modal-title">{cookingRecipe.name}</h2>
            <label className="serving-field">
              <span>何人前作りましたか</span>
              <input
                type="number"
                min="1"
                max="20"
                value={servings}
                onChange={(event) =>
                  setServings(Math.max(1, Number(event.target.value) || 1))
                }
              />
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setCookingRecipe(null)}
                disabled={isCooking}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={handleConfirmCooked}
                disabled={isCooking}
              >
                {isCooking ? '更新中...' : '在庫を減らす'}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}
