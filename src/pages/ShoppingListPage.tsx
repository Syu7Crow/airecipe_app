import {
  useEffect,
  useState,
  useMemo,
  useRef,
  type FormEvent,
} from 'react'
import { Icon } from '../components/Icon'
import { useI18n } from '../lib/useI18n'
import { getCache, setCache } from '../lib/dataCache'
import {
  fetchInventory,
  fetchSavedRecipes,
  fetchCookingHistory,
} from '../lib/recipeApi'
import {
  createShoppingList,
  deleteShoppingList,
  fetchShoppingLists,
  fetchShoppingList,
} from '../lib/shoppingApi'
import type {
  AppDestination,
  Ingredient,
  Recipe,
  ShoppingList,
  ShoppingListSummary,
} from '../types/ui'

type ShoppingItem = {
  id: string
  name: string
  category: string
  quantity: number | null 
  gram: number | null     
  isManual: boolean       
  memo?: string           
}

type ManualShoppingForm = {
  name: string
  category: string
  quantity: string
  gram: string
  memo: string
}

const emptyManualShoppingForm: ManualShoppingForm = {
  name: '',
  category: '',
  quantity: '',
  gram: '',
  memo: '',
}

const CATEGORY_MEAT_EGG_FISH = 'meatEggFish'
const CATEGORY_VEGETABLE = 'vegetable'
const CATEGORY_DAIRY = 'dairy'
const CATEGORY_PROCESSED = 'processed'
const CATEGORY_OTHER = 'other'

const meatEggFishWords = [
  '\u8089',
  '\u9d8f',
  '\u8c5a',
  '\u725b',
  '\u9b5a',
  '\u5375',
  '\u305f\u307e\u3054',
  '\u30cf\u30e0',
  '\u30bd\u30fc\u30bb\u30fc\u30b8',
  'sausage',
  'chicken',
  'pork',
  'beef',
  'fish',
  'egg',
]

const vegetableWords = [
  '\u91ce\u83dc',
  '\u7389\u306d\u304e',
  '\u7389\u8471',
  '\u306b\u3093\u3058\u3093',
  '\u4eba\u53c2',
  '\u30ad\u30e3\u30d9\u30c4',
  '\u30ec\u30bf\u30b9',
  '\u30c8\u30de\u30c8',
  '\u304d\u306e\u3053',
  '\u306d\u304e',
  '\u3058\u3083\u304c\u3044\u3082',
  '\u30d4\u30fc\u30de\u30f3',
  'vegetable',
]

const dairyWords = [
  '\u725b\u4e73',
  '\u30c1\u30fc\u30ba',
  '\u30d0\u30bf\u30fc',
  '\u30e8\u30fc\u30b0\u30eb\u30c8',
  'milk',
  'cheese',
  'butter',
  'yogurt',
]

const processedWords = [
  '\u52a0\u5de5',
  '\u7c73',
  '\u30d1\u30f3',
  '\u30d1\u30b9\u30bf',
  '\u9eba',
  '\u8c46\u8150',
  '\u7f36',
  'processed',
  'rice',
  'bread',
  'pasta',
]

function inferCategory(name: string): string {
  const n = name.toLowerCase()
  if (meatEggFishWords.some((word) => n.includes(word))) {
    return CATEGORY_MEAT_EGG_FISH
  }
  if (vegetableWords.some((word) => n.includes(word))) {
    return CATEGORY_VEGETABLE
  }
  if (dairyWords.some((word) => n.includes(word))) {
    return CATEGORY_DAIRY
  }
  if (processedWords.some((word) => n.includes(word))) {
    return CATEGORY_PROCESSED
  }
  return CATEGORY_OTHER
}

function compareCategoryNames(left: string, right: string, language: string) {
  if (left === CATEGORY_OTHER && right !== CATEGORY_OTHER) return 1
  if (right === CATEGORY_OTHER && left !== CATEGORY_OTHER) return -1
  return left.localeCompare(right, language)
}

function getShoppingItemKey(name: string) {
  return name.trim().toLowerCase()
}

const RECIPE_PAGE_SIZE = 12

export function ShoppingListPage({
  onNavigate,
}: {
  onNavigate: (page: AppDestination) => void
  onLogout?: () => void | Promise<void>
}) {
  const { language, t } = useI18n()

  const [fridgeIngredients, setFridgeIngredients] = useState<Ingredient[]>(() => {
    const cached = getCache<Ingredient[]>(`inventory:${language}`)
    return cached || []
  })
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState('')
  const toastTimerRef = useRef<number | null>(null)

  const [selectedRecipeIds, setSelectedRecipeIds] = useState<Set<string>>(() => new Set())
  const [isRecipeListOpen, setIsRecipeListOpen] = useState(true)
  const [visibleRecipeCount, setVisibleRecipeCount] = useState(RECIPE_PAGE_SIZE)

  const [manualItems, setManualItems] = useState<ShoppingItem[]>([])
  const [savedLists, setSavedLists] = useState<ShoppingListSummary[]>([])
  const [selectedSavedList, setSelectedSavedList] = useState<ShoppingList | null>(null)
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false)
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false)
  const [saveListName, setSaveListName] = useState('')
  const [isShoppingListLoading, setIsShoppingListLoading] = useState(false)

  const [isSaving, setIsSaving] = useState(false)
  const [manualForm, setManualForm] = useState<ManualShoppingForm>(
    emptyManualShoppingForm,
  )

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current)
        toastTimerRef.current = null
      }
    }
  }, [])

  function showToast(message: string) {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current)
    }

    setToastMessage(message)
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage('')
      toastTimerRef.current = null
    }, 2400)
  }

  useEffect(() => {
    let isMounted = true

    Promise.all([
      fetchInventory(language),
      fetchSavedRecipes(language),
      fetchCookingHistory(language),
    ])
      .then(([inventoryRes, savedRes, historyRes]) => {
        if (!isMounted) return

        const uniqueRecipesMap = new Map<string, Recipe>()
        const addRecipe = (r: Recipe) => {
          const key = r.recipeId || r.name
          if (key && !uniqueRecipesMap.has(key)) {
            uniqueRecipesMap.set(key, r)
          }
        }
        savedRes.recipes.forEach(addRecipe)
        historyRes.recipes.forEach(addRecipe)

        setFridgeIngredients(inventoryRes.inventory)
        setCache(`inventory:${language}`, inventoryRes.inventory)
        setRecipes(Array.from(uniqueRecipesMap.values()))
        setError(null)
        setLoading(false)
      })
      .catch((err) => {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : t('fridge.fetchFailed'))
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [language, t])

  useEffect(() => {
    // Clear legacy localStorage shopping data so stale lists don't reappear
    // when navigating back to this page.
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('ai-recipe-manual-shopping')
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    fetchShoppingLists()
      .then((result) => {
        if (!isMounted) return
        setSavedLists(result.shoppingLists)
      })
      .catch((error) => {
        if (!isMounted) return
        console.warn('[vite] Failed to fetch shopping lists:', error)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const recipeCandidateItems = useMemo(() => {
    const requiredMap = new Map<string, { name: string; g: number; pcs: number; recipes: Set<string> }>()
    const manualItemKeys = new Set(
      manualItems.map((item) => getShoppingItemKey(item.name)),
    )

    recipes.forEach((recipe) => {
      const recipeKey = recipe.recipeId || recipe.name
      if (!recipeKey || !selectedRecipeIds.has(recipeKey)) return

      recipe.ingredients?.forEach((ing) => {
        const nameKey = ing.name.trim().toLowerCase()
        const existing = requiredMap.get(nameKey) || {
          name: ing.name,
          g: 0,
          pcs: 0,
          recipes: new Set<string>(),
        }
        existing.recipes.add(recipe.name)
        if (ing.unit === 'g') {
          existing.g += ing.amount
        } else {
          existing.pcs += ing.amount
        }
        requiredMap.set(nameKey, existing)
      })
    })

    const inventoryMap = new Map<string, { g: number; pcs: number; category: string }>()
    fridgeIngredients.forEach((ing) => {
      const nameKey = ing.name.trim().toLowerCase()
      const existing = inventoryMap.get(nameKey) || {
        g: 0,
        pcs: 0,
        category: ing.category || CATEGORY_OTHER,
      }
      existing.g += ing.gram || 0
      existing.pcs += ing.quantity || 0
      if (ing.category && ing.category !== CATEGORY_OTHER) {
        existing.category = ing.category
      }
      inventoryMap.set(nameKey, existing)
    })

    const autoGenerated: ShoppingItem[] = []
    requiredMap.forEach((req, nameKey) => {
      if (manualItemKeys.has(nameKey)) return

      const inv = inventoryMap.get(nameKey)
      const invG = inv ? inv.g : 0
      const invPcs = inv ? inv.pcs : 0
      const lackG = Math.max(0, req.g - invG)
      const lackPcs = Math.max(0, req.pcs - invPcs)
      const displayG = lackG > 0 ? lackG : req.g
      const displayPcs = lackPcs > 0 ? lackPcs : req.pcs
      const category = inv ? inv.category : inferCategory(req.name)
      const memo = Array.from(req.recipes).join(', ')

      autoGenerated.push({
        id: `auto-${nameKey}`,
        name: req.name,
        category,
        quantity: displayPcs > 0 ? Math.ceil(displayPcs) : null,
        gram: displayG > 0 ? Math.ceil(displayG) : null,
        isManual: false,
        memo: `${t('recipe.ingredientsEyebrow')}: ${memo}`,
      })
    })

    return autoGenerated
  }, [recipes, selectedRecipeIds, fridgeIngredients, manualItems, t])

  const shoppingItems = manualItems

  const availableCategories = useMemo(() => {
    const existing = shoppingItems.map((item) => item.category?.trim() || CATEGORY_OTHER)
    return Array.from(new Set(existing)).toSorted((left, right) =>
      compareCategoryNames(left, right, language),
    )
  }, [shoppingItems, language])

  const groupedItems = useMemo(() => {
    return shoppingItems.reduce(
      (groups, item) => {
        const cat = item.category || CATEGORY_OTHER
        groups[cat] ??= []
        groups[cat].push(item)
        return groups
      },
      {} as Record<string, ShoppingItem[]>,
    )
  }, [shoppingItems])

  const recipeCandidateCategories = useMemo(() => {
    const existing = recipeCandidateItems.map(
      (item) => item.category?.trim() || CATEGORY_OTHER,
    )
    return Array.from(new Set(existing)).toSorted((left, right) =>
      compareCategoryNames(left, right, language),
    )
  }, [recipeCandidateItems, language])

  const groupedRecipeCandidateItems = useMemo(() => {
    return recipeCandidateItems.reduce(
      (groups, item) => {
        const cat = item.category || CATEGORY_OTHER
        groups[cat] ??= []
        groups[cat].push(item)
        return groups
      },
      {} as Record<string, ShoppingItem[]>,
    )
  }, [recipeCandidateItems])

  function toggleRecipeSelection(recipeId: string) {
    setSelectedRecipeIds((current) => {
      const next = new Set(current)
      if (next.has(recipeId)) {
        next.delete(recipeId)
      } else {
        next.add(recipeId)
      }
      return next
    })
  }

  function handleAddRecipeCandidatesToShoppingList() {
    const itemsToAdd = recipeCandidateItems
    if (itemsToAdd.length === 0) {
      showToast(t('shopping.addSelectedNone'))
      return
    }

    setIsSaving(true)

    setManualItems((current) => {
      const existingKeys = new Set(
        current.map((item) => getShoppingItemKey(item.name)),
      )
      const nextItems = itemsToAdd
        .filter((item) => !existingKeys.has(getShoppingItemKey(item.name)))
        .map((item, index) => ({
          id: `manual-${Date.now()}-${index}`,
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          gram: item.gram,
          isManual: true,
          memo: item.memo,
        }))

      return [...nextItems, ...current]
    })

    showToast(t('shopping.moveSuccessAlert', { count: itemsToAdd.length }))
    setIsSaving(false)
  }

  function updateManualForm(field: keyof ManualShoppingForm, value: string) {
    setManualForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function handleAddManualItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const name = manualForm.name.trim()
    if (!name) {
      showToast(t('shopping.nameRequired'))
      return
    }

    const quantity = manualForm.quantity ? Number(manualForm.quantity) : null
    const gram = manualForm.gram ? Number(manualForm.gram) : null

    setManualItems((current) => [
      {
        id: `manual-${Date.now()}`,
        name,
        category: manualForm.category.trim() || inferCategory(name),
        quantity: quantity && quantity > 0 ? quantity : null,
        gram: gram && gram > 0 ? gram : null,
        isManual: true,
        memo: manualForm.memo.trim() || undefined,
      },
      ...current,
    ])
    setManualForm(emptyManualShoppingForm)
    showToast(t('shopping.addSuccess'))
  }

  function handleRemoveManualItem(itemId: string) {
    setManualItems((current) => current.filter((item) => item.id !== itemId))
  }

  async function handleSaveShoppingList(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const name = saveListName.trim()
    if (!name) {
      showToast(t('shopping.nameRequired'))
      return
    }

    if (shoppingItems.length === 0) {
      showToast(t('shopping.addSelectedNone'))
      return
    }

    setIsShoppingListLoading(true)

    try {
      const result = await createShoppingList({
        name,
        items: shoppingItems.map((item) => ({
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          gram: item.gram,
          memo: item.memo ?? null,
          checked: false,
        })),
      })
      setSavedLists((current) =>
        [result.shoppingList, ...current].sort(
          (left, right) =>
            new Date(right.updatedAt).getTime() -
            new Date(left.updatedAt).getTime(),
        ),
      )
      setSaveListName('')
      setIsSaveModalOpen(false)
      showToast(t('shopping.saveSuccess'))
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('shopping.saveFailed'))
    } finally {
      setIsShoppingListLoading(false)
    }
  }

  async function handleViewShoppingList(shoppingListId: string) {
    setIsShoppingListLoading(true)

    try {
      const result = await fetchShoppingList(shoppingListId)
      setSelectedSavedList(result.shoppingList)
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('shopping.loadFailed'))
    } finally {
      setIsShoppingListLoading(false)
    }
  }

  async function handleDeleteSavedList(shoppingListId: string) {
    setIsShoppingListLoading(true)

    try {
      const result = await deleteShoppingList(shoppingListId)
      setSavedLists(result.shoppingLists)
      setSelectedSavedList((current) =>
        current?.shoppingListId === shoppingListId ? null : current,
      )
      showToast(t('shopping.deleteSuccess'))
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('shopping.deleteFailed'))
    } finally {
      setIsShoppingListLoading(false)
    }
  }

  function getCategoryLabel(category: string) {
    switch (category) {
      case CATEGORY_MEAT_EGG_FISH:
        return t('category.meatEggFish')
      case CATEGORY_VEGETABLE:
        return t('category.vegetable')
      case CATEGORY_DAIRY:
        return t('category.dairy')
      case CATEGORY_PROCESSED:
        return t('category.processed')
      case CATEGORY_OTHER:
        return t('category.other')
      default:
        return category
    }
  }
  if (loading) {
    return (
      <main className="fridge-container shopping-page">
        <div className="fridge-header">
          <h1>{t('shopping.title')}</h1>
        </div>
        <div className="fridge-error">
          <p>{t('shopping.loading')}</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="fridge-container shopping-page">
        <div className="fridge-header">
          <h1>{t('shopping.title')}</h1>
          <div className="fridge-header-actions">
            <button
              type="button"
              className="secondary-button back-home-button"
              onClick={() => onNavigate('home')}
            >
              <div style={{ transform: 'scaleX(-1)', display: 'inline-flex' }}>
                <Icon name="arrow" />
              </div>
              <span>{t('common.backHome')}</span>
            </button>
          </div>
        </div>
        <div className="fridge-error">
          <p>{error}</p>
          <button type="button" className="primary-button" onClick={() => window.location.reload()}>
            {t('common.reload')}
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="fridge-container shopping-page">
      <div className="fridge-header">
        <div>
          <h1>{t('shopping.title')}</h1>
          <p className="ingredient-detail-summary">
            {t('shopping.subtitle')}
          </p>
        </div>
        <div className="fridge-header-actions">
          <button
            type="button"
            className="secondary-button back-home-button"
            onClick={() => onNavigate('home')}
          >
            <div style={{ transform: 'scaleX(-1)', display: 'inline-flex' }}>
              <Icon name="arrow" />
            </div>
            <span>{t('common.backHome')}</span>
          </button>
        </div>
      </div>

      <section
        className="panel settings-section shopping-panel shopping-manual-panel"
        aria-labelledby="shopping-manual-title"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t('shopping.memoEyebrow')}</p>
            <h2 id="shopping-manual-title">{t('shopping.addNewTitle')}</h2>
          </div>
        </div>
        <p className="settings-section__description">
          {t('shopping.memoDescription')}
        </p>
        <form onSubmit={handleAddManualItem}>
          <div className="shopping-form-grid">
            <label className="settings-field">
              <span>{t('fridge.form.name')}</span>
              <input
                type="text"
                value={manualForm.name}
                placeholder={t('shopping.namePlaceholder')}
                onChange={(event) => updateManualForm('name', event.target.value)}
              />
            </label>
            <label className="settings-field">
              <span>{t('fridge.form.category')}</span>
              <input
                type="text"
                value={manualForm.category}
                placeholder={t('shopping.categoryPlaceholder')}
                onChange={(event) =>
                  updateManualForm('category', event.target.value)
                }
              />
            </label>
            <label className="settings-field">
              <span>{t('fridge.form.quantity')}</span>
              <input
                type="number"
                min="1"
                value={manualForm.quantity}
                placeholder={t('shopping.quantityPlaceholder')}
                onChange={(event) =>
                  updateManualForm('quantity', event.target.value)
                }
              />
            </label>
            <label className="settings-field">
              <span>{t('fridge.form.gram')}</span>
              <input
                type="number"
                min="1"
                value={manualForm.gram}
                placeholder={t('shopping.gramPlaceholder')}
                onChange={(event) => updateManualForm('gram', event.target.value)}
              />
            </label>
          </div>
          <div className="shopping-form-grid shopping-form-grid--footer">
            <label className="settings-field">
              <span>{t('fridge.form.memo')}</span>
              <input
                type="text"
                value={manualForm.memo}
                placeholder={t('shopping.memoPlaceholder')}
                onChange={(event) => updateManualForm('memo', event.target.value)}
              />
            </label>
            <button type="submit" className="primary-button">
              <Icon name="plus" />
              <span>{t('shopping.addBtn')}</span>
            </button>
          </div>
        </form>
      </section>

      <section className="shopping-panel shopping-recipe-panel">
        <button
          type="button"
          className="shopping-section-toggle"
          onClick={() => setIsRecipeListOpen(!isRecipeListOpen)}
        >
          <span>{t('recipeGenerate.title')} {selectedRecipeIds.size} {t('shopping.selectedRecipeText')}</span>
          <span className={`shopping-section-toggle__icon ${isRecipeListOpen ? 'is-open' : ''}`}>
            <Icon name="arrow" />
          </span>
        </button>
        {isRecipeListOpen && (
          <div className="shopping-recipe-panel__body">
            {recipes.length === 0 ? (
              <p className="empty-state">
                {t('history.empty')}
              </p>
            ) : (
              <>
                <div className="shopping-recipe-grid">
                  {recipes.slice(0, visibleRecipeCount).map((recipe) => {
                    const key = recipe.recipeId || recipe.name
                    if (!key) return null
                    const isSelected = selectedRecipeIds.has(key)
                    return (
                      <label
                        key={key}
                        className={`shopping-recipe-option ${isSelected ? 'is-selected' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRecipeSelection(key)}
                        />
                        <span className="ingredient-name">
                          {recipe.name}
                        </span>
                      </label>
                    )
                  })}
                </div>
                {visibleRecipeCount < recipes.length && (
                  <div className="shopping-recipe-more">
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() =>
                        setVisibleRecipeCount((current) =>
                          Math.min(current + RECIPE_PAGE_SIZE, recipes.length),
                        )
                      }
                    >
                      <span>{t('shopping.showMore', {
                        remaining: recipes.length - visibleRecipeCount,
                      })}</span>
                      <span className="shopping-recipe-more__icon">
                        <Icon name="arrow" />
                      </span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </section>

      {recipeCandidateItems.length > 0 && (
        <section className="shopping-panel shopping-candidate-panel">
          <div className="section-heading shopping-list-heading">
            <div>
              <p className="eyebrow">{t('recipe.ingredientsEyebrow')}</p>
              <h2>{t('shopping.recipeCandidateTitle')}</h2>
              <p className="settings-section__description shopping-list-heading__description">
                {t('shopping.recipeCandidateDescription')}
              </p>
            </div>
            <button
              type="button"
              className="primary-button"
              disabled={isSaving}
              onClick={handleAddRecipeCandidatesToShoppingList}
            >
              {isSaving ? t('common.saving') : t('shopping.moveToFridgeBtn')}
            </button>
          </div>
          <div className="fridge-tables shopping-candidate-tables">
            {recipeCandidateCategories.map((category) => {
              const items = groupedRecipeCandidateItems[category]
              if (!items || items.length === 0) return null

              return (
                <div key={category} className="category-table-wrapper">
                  <h3 className="category-title">{getCategoryLabel(category)}</h3>
                  <div className="table-container">
                    <table className="fridge-table shopping-table">
                      <thead>
                        <tr>
                          <th>{t('fridge.table.ingredient')}</th>
                          <th>{t('fridge.form.quantity')}</th>
                          <th>{t('fridge.form.gram')}</th>
                          <th>{t('fridge.table.memo')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr key={item.id}>
                            <td className="ingredient-name-cell">
                              <span className="ingredient-name">{item.name}</span>
                            </td>
                            <td>
                              {item.quantity
                                ? t('shopping.amountText', { amount: item.quantity })
                                : '-'}
                            </td>
                            <td>
                              {item.gram
                                ? t('shopping.weightText', { weight: item.gram })
                                : '-'}
                            </td>
                            <td className="shopping-table__memo">
                              {item.memo || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
      <div className="section-heading shopping-list-heading">
        <div>
          <p className="eyebrow">{t('shopping.memoEyebrow')}</p>
          <h2>{t('shopping.listTitle')}</h2>
          <p className="settings-section__description shopping-list-heading__description">
            {t('shopping.markBoughtHint')}
          </p>
        </div>
        <div className="shopping-list-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => setIsLoadModalOpen(true)}
          >
            {t('shopping.loadListBtn')}
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={() => setIsSaveModalOpen(true)}
          >
            {t('shopping.saveListBtn')}
          </button>
        </div>
      </div>

      {shoppingItems.length === 0 ? (
        <div className="fridge-error">
          <p>{t('shopping.empty')}</p>
        </div>
      ) : (
        <div className="fridge-tables">
          {availableCategories.map((category) => {
            const items = groupedItems[category]
            if (!items || items.length === 0) return null

            return (
              <div key={category} className="category-table-wrapper">
                <h3 className="category-title">{getCategoryLabel(category)}</h3>
                <div className="table-container">
                  <table className="fridge-table shopping-table">
                    <thead>
                      <tr>
                        <th>{t('fridge.table.ingredient')}</th>
                        <th>{t('fridge.form.quantity')}</th>
                        <th>{t('fridge.form.gram')}</th>
                        <th>{t('fridge.table.memo')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr
                          key={item.id}
                        >
                          <td className="ingredient-name-cell">
                            <span className="ingredient-name">{item.name}</span>
                            {item.isManual && (
                              <span className="shopping-item-badge">
                                {t('receipt.candidatesEyebrow')}
                              </span>
                            )}
                          </td>
                          <td>
                            {item.quantity ? t('shopping.amountText', { amount: item.quantity }) : '-'}
                          </td>
                          <td>
                            {item.gram ? t('shopping.weightText', { weight: item.gram }) : '-'}
                          </td>
                          <td className="shopping-table__memo">
                            <span>{item.memo || '-'}</span>
                            {item.isManual ? (
                              <button
                                type="button"
                                className="secondary-button shopping-item-delete-button"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  handleRemoveManualItem(item.id)
                                }}
                              >
                                {t('shopping.deleteBtn')}
                              </button>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {isSaveModalOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsSaveModalOpen(false)
            }
          }}
        >
          <div className="cook-modal shopping-modal">
            <h2>{t('shopping.saveListTitle')}</h2>
            <p className="settings-section__description">
              {t('shopping.saveListDescription', { count: shoppingItems.length })}
            </p>
            <form onSubmit={handleSaveShoppingList}>
              <label className="serving-field">
                <span>{t('shopping.saveListNameLabel')}</span>
                <input
                  type="text"
                  value={saveListName}
                  placeholder={t('shopping.saveListNamePlaceholder')}
                  onChange={(event) => setSaveListName(event.target.value)}
                  disabled={isShoppingListLoading}
                />
              </label>
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setIsSaveModalOpen(false)}
                  disabled={isShoppingListLoading}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={isShoppingListLoading}
                >
                  {isShoppingListLoading ? t('common.saving') : t('shopping.saveListBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoadModalOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsLoadModalOpen(false)
              setSelectedSavedList(null)
            }
          }}
        >
          <div className="cook-modal shopping-modal">
            <h2>{t('shopping.loadListTitle')}</h2>
            {savedLists.length === 0 ? (
              <p className="settings-section__description">
                {t('shopping.loadListEmpty')}
              </p>
            ) : (
              <ul className="shopping-saved-list">
                {savedLists.map((list) => (
                  <li key={list.shoppingListId} className="shopping-saved-list__item">
                    <button
                      type="button"
                      className="shopping-saved-list__name"
                      onClick={() => handleViewShoppingList(list.shoppingListId)}
                      disabled={isShoppingListLoading}
                    >
                      <span>{list.name}</span>
                      <small>
                        {t('shopping.itemCount', { count: list.itemCount })}
                      </small>
                    </button>
                    <button
                      type="button"
                      className="danger-text-button"
                      onClick={() => handleDeleteSavedList(list.shoppingListId)}
                      disabled={isShoppingListLoading}
                    >
                      {t('shopping.deleteBtn')}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {selectedSavedList ? (
              <div className="shopping-saved-detail">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">{t('shopping.memoEyebrow')}</p>
                    <h3>{selectedSavedList.name}</h3>
                  </div>
                  <span>{t('shopping.itemCount', { count: selectedSavedList.itemCount })}</span>
                </div>
                <ul className="shopping-saved-detail__items">
                  {selectedSavedList.items.map((item) => (
                    <li key={item.itemId ?? `${selectedSavedList.shoppingListId}-${item.name}`}>
                      <strong>{item.name}</strong>
                      <span>
                        {[
                          item.quantity ? t('shopping.amountText', { amount: item.quantity }) : '',
                          item.gram ? t('shopping.weightText', { weight: item.gram }) : '',
                          item.memo ?? '',
                        ].filter(Boolean).join(' / ') || '-'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setIsLoadModalOpen(false)
                  setSelectedSavedList(null)
                }}
                disabled={isShoppingListLoading}
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMessage ? (
        <div className="toast-message" role="status">
          {toastMessage}
        </div>
      ) : null}
    </main>
  )
}
