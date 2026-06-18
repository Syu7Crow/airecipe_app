import { useEffect, useState, useMemo, useDeferredValue } from 'react'
import { Icon } from '../components/Icon'
import { useI18n } from '../lib/useI18n'
import { getCache, setCache } from '../lib/dataCache'
import {
  fetchInventory,
  fetchSavedRecipes,
  fetchCookingHistory,
  createInventoryItem,
} from '../lib/recipeApi'
import type { AppDestination, Ingredient, Recipe } from '../types/ui'

type ShoppingItem = {
  id: string
  name: string
  category: string
  quantity: number | null 
  gram: number | null     
  isManual: boolean       
  memo?: string           
  checked: boolean        
}

function inferCategory(name: string): string {
  const n = name.toLowerCase()
  if (
    n.includes('肉') || n.includes('豚') || n.includes('牛') || n.includes('鶏') ||
    n.includes('卵') || n.includes('魚') || n.includes('鮭') || n.includes('サケ') ||
    n.includes('ソーセージ') || n.includes('ベーコン') || n.includes('ハム') ||
    n.includes('貝') || n.includes('エビ') || n.includes('カニ')
  ) {
    return '肉・卵・魚'
  }
  if (
    n.includes('キャベツ') || n.includes('レタス') || n.includes('トマト') ||
    n.includes('人参') || n.includes('にんじん') || n.includes('じゃがいも') ||
    n.includes('玉ねぎ') || n.includes('たまねぎ') || n.includes('ナス') ||
    n.includes('ピーマン') || n.includes('大根') || n.includes('だいこん') ||
    n.includes('白菜') || n.includes('はくさい') || n.includes('小松菜') ||
    n.includes('ねぎ') || n.includes('ネギ') || n.includes('きのこ') ||
    n.includes('しいたけ') || n.includes('しめじ') || n.includes('えのき') ||
    n.includes('野菜') || n.includes('ほうれん草')
  ) {
    return '野菜'
  }
  if (
    n.includes('乳') || n.includes('ミルク') || n.includes('チーズ') ||
    n.includes('バター') || n.includes('ヨーグルト') || n.includes('クリーム')
  ) {
    return '乳製品'
  }
  if (
    n.includes('加工') || n.includes('缶') || n.includes('豆腐') ||
    n.includes('納豆') || n.includes('ちくわ') || n.includes('キムチ') ||
    n.includes('パスタ') || n.includes('米') || n.includes('パン') ||
    n.includes('麺') || n.includes('うどん') || n.includes('そば')
  ) {
    return '加工品'
  }
  return 'その他'
}

function compareCategoryNames(left: string, right: string, language: string) {
  if (left === 'その他' && right !== ' savory') return 1
  if (right === 'その他' && left !== 'その他') return -1
  return left.localeCompare(right, language)
}

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
  const [statusMessage, setStatusMessage] = useState('')

  const [selectedRecipeIds, setSelectedRecipeIds] = useState<Set<string>>(() => new Set())
  const [isRecipeListOpen, setIsRecipeListOpen] = useState(true)

  const [manualItems, setManualItems] = useState<Omit<ShoppingItem, 'checked'>[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('ai-recipe-manual-shopping')
      return stored ? JSON.parse(stored) : []
    }
    return []
  })

  const [searchQuery, setSearchQuery] = useState('')
  const deferredSearchQuery = useDeferredValue(searchQuery)
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(() => new Set())
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)

  const [checkedItemIds, setCheckedItemIds] = useState<Set<string>>(() => new Set())
  const [isSaving, setIsSaving] = useState(false)

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
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('ai-recipe-manual-shopping', JSON.stringify(manualItems))
    }
  }, [manualItems])

  const shoppingItems = useMemo(() => {
    const requiredMap = new Map<string, { name: string; g: number; pcs: number; recipes: Set<string> }>()

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
      const existing = inventoryMap.get(nameKey) || { g: 0, pcs: 0, category: ing.category || 'その他' }
      existing.g += ing.gram || 0
      existing.pcs += ing.quantity || 0
      if (ing.category && ing.category !== 'その他') {
        existing.category = ing.category
      }
      inventoryMap.set(nameKey, existing)
    })

    const autoGenerated: ShoppingItem[] = []
    requiredMap.forEach((req, nameKey) => {
      const inv = inventoryMap.get(nameKey)
      const invG = inv ? inv.g : 0
      const invPcs = inv ? inv.pcs : 0

      const lackG = Math.max(0, req.g - invG)
      const lackPcs = Math.max(0, req.pcs - invPcs)

      if (lackG > 0 || lackPcs > 0) {
        const category = inv ? inv.category : inferCategory(req.name)
        const memo = Array.from(req.recipes).join(', ')

        autoGenerated.push({
          id: `auto-${nameKey}`,
          name: req.name,
          category,
          quantity: lackPcs > 0 ? Math.ceil(lackPcs) : null,
          gram: lackG > 0 ? Math.ceil(lackG) : null,
          isManual: false,
          memo: `${t('recipe.ingredientsEyebrow')}: ${memo}`,
          checked: checkedItemIds.has(`auto-${nameKey}`),
        })
      }
    })

    return [
      ...autoGenerated,
      ...manualItems.map((item) => ({
        ...item,
        checked: checkedItemIds.has(item.id),
      })),
    ]
  }, [recipes, selectedRecipeIds, fridgeIngredients, manualItems, checkedItemIds, t])

  const availableCategories = useMemo(() => {
    const existing = shoppingItems.map((item) => item.category?.trim() || 'その他')
    return Array.from(new Set(existing))
      .toSorted((left, right) => compareCategoryNames(left, right, language))
  }, [shoppingItems, language])

  const filteredShoppingItems = useMemo(() => {
    const search = deferredSearchQuery.trim().toLowerCase()
    const isCategoryAll = selectedCategories.size === 0

    return shoppingItems.filter((item) => {
      if (!isCategoryAll && !selectedCategories.has(item.category)) {
        return false
      }
      if (search && !item.name.toLowerCase().includes(search) && !item.category.toLowerCase().includes(search)) {
        return false
      }
      return true
    })
  }, [shoppingItems, deferredSearchQuery, selectedCategories])

  const groupedItems = useMemo(() => {
    return filteredShoppingItems.reduce(
      (groups, item) => {
        const cat = item.category || 'その他'
        groups[cat] ??= []
        groups[cat].push(item)
        return groups
      },
      {} as Record<string, ShoppingItem[]>,
    )
  }, [filteredShoppingItems])

  const isFilterActive = selectedCategories.size > 0 || searchQuery.trim() !== ''

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

  async function handleMoveToFridge() {
    const itemsToMove = shoppingItems.filter((item) => item.checked)
    if (itemsToMove.length === 0) return

    setIsSaving(true)
    setStatusMessage('')

    try {
      for (const item of itemsToMove) {
        await createInventoryItem({
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          gram: item.gram,
          memo: item.memo || t('shopping.fridgeMemo'),
        })
      }

      const manualIdsToRemove = new Set(itemsToMove.filter((item) => item.isManual).map((item) => item.id))
      setManualItems((current) => current.filter((item) => !manualIdsToRemove.has(item.id)))

      setCheckedItemIds((current) => {
        const next = new Set(current)
        itemsToMove.forEach((item) => next.delete(item.id))
        return next
      })

      const result = await fetchInventory(language)
      setFridgeIngredients(result.inventory)
      setCache(`inventory:${language}`, result.inventory)

      setStatusMessage(t('shopping.moveSuccessAlert'))
      setIsSaving(false)
    } catch (err) {
      console.error(err)
      setError(t('receipt.importFailed'))
      setIsSaving(false)
    }
  }

  function toggleCategoryFilter(category: string) {
    setSelectedCategories((current) => {
      const next = new Set(current)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  function clearFilters() {
    setSelectedCategories(new Set())
    setSearchQuery('')
    setIsCategoryDropdownOpen(false)
  }

  function getCategoryLabel(category: string) {
    switch (category) {
      case '肉・卵・魚':
        return t('category.meatEggFish')
      case '野菜':
        return t('category.vegetable')
      case '乳製品':
        return t('category.dairy')
      case '加工品':
        return t('category.processed')
      case 'その他':
        return t('category.other')
      default:
        return category
    }
  }

  if (loading) {
    return (
      <main className="fridge-container">
        <div className="fridge-header">
          <h1>{t('shopping.title')}</h1>
        </div>
        <div className="fridge-error" style={{ background: '#fff', border: '1px solid var(--line)', padding: '40px' }}>
          <p>{t('shopping.loading')}</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="fridge-container">
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
    <main className="fridge-container">
      <div className="fridge-header">
        <div>
          <h1>{t('shopping.title')}</h1>
          <p className="ingredient-detail-summary" style={{ margin: '4px 0 0' }}>
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

      {statusMessage && (
        <p className="status-message" role="status" style={{ marginBottom: '16px' }}>
          {statusMessage}
        </p>
      )}

      <section className="category-table-wrapper" style={{ marginBottom: '24px' }}>
        <button
          type="button"
          className="category-expand-toggle"
          style={{
            marginTop: 0,
            borderRadius: '12px 12px 0 0',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface-soft)',
            borderBottom: '1px solid var(--line)',
            color: 'var(--ink)',
            padding: '14px 20px',
            fontSize: '16px',
            fontWeight: '800',
          }}
          onClick={() => setIsRecipeListOpen(!isRecipeListOpen)}
        >
          <span>{t('recipeGenerate.title')} {selectedRecipeIds.size} {t('shopping.selectedRecipeText')}</span>
          <span style={{ transform: isRecipeListOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
            ▶
          </span>
        </button>
        {isRecipeListOpen && (
          <div style={{ padding: '20px', background: '#fff' }}>
            {recipes.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0 }}>
                {t('history.empty')}
              </p>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  gap: '12px',
                  maxHeight: '220px',
                  overflowY: 'auto',
                }}
              >
                {recipes.map((recipe) => {
                  const key = recipe.recipeId || recipe.name
                  if (!key) return null
                  const isSelected = selectedRecipeIds.has(key)
                  return (
                    <label
                      key={key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 14px',
                        border: '1px solid var(--line)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        background: isSelected ? 'var(--surface-soft)' : '#fff',
                        transition: 'background-color 0.15s',
                        fontSize: '14px',
                        fontWeight: '600',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRecipeSelection(key)}
                        style={{ width: '16px', height: '16px', accentColor: 'var(--control-ink)' }}
                      />
                      <span className="ingredient-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {recipe.name}
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="fridge-filter-panel" aria-label={t('fridge.filter.title')} style={{ marginBottom: '20px' }}>
        <div className="fridge-filter-bar">
          <label className="fridge-search-field">
            <span>{t('fridge.filter.search')}</span>
            <input
              type="search"
              placeholder={t('shopping.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </label>
          <button
            type="button"
            className={`secondary-button fridge-filter-toggle ${isFilterActive ? 'is-active' : ''}`}
            aria-expanded={isFilterOpen}
            onClick={() => setIsFilterOpen((current) => !current)}
          >
            {t('fridge.filter.open')}
          </button>
        </div>

        {isFilterOpen ? (
          <div className="fridge-filter-options">
            <fieldset className="fridge-filter-group">
              <legend>{t('fridge.filter.category')}</legend>
              <div className="fridge-category-dropdown">
                <button
                  type="button"
                  className="secondary-button fridge-category-dropdown__trigger"
                  aria-expanded={isCategoryDropdownOpen}
                  onClick={() =>
                    setIsCategoryDropdownOpen((current) => !current)
                  }
                >
                  <span>
                    {selectedCategories.size === 0
                      ? t('fridge.filter.categoryAll')
                      : t('fridge.filter.categorySelected', {
                          count: selectedCategories.size,
                        })}
                  </span>
                </button>
                {isCategoryDropdownOpen ? (
                  <div className="fridge-category-dropdown__menu">
                    <p>{t('fridge.filter.categoryHint')}</p>
                    {availableCategories.map((category) => (
                      <label key={category} className="fridge-category-option">
                        <input
                          type="checkbox"
                          checked={selectedCategories.has(category)}
                          onChange={() => toggleCategoryFilter(category)}
                        />
                        <span>{getCategoryLabel(category)}</span>
                      </label>
                    ))}
                  </div>
                ) : null}
              </div>
            </fieldset>

            <button
              type="button"
              className="secondary-button"
              onClick={clearFilters}
              disabled={!isFilterActive}
            >
              {t('fridge.filter.clear')}
            </button>
          </div>
        ) : null}
      </section>

      {shoppingItems.some((item) => item.checked) && (
        <div
          className="fridge-bulk-actions"
          style={{
            background: 'var(--surface-soft)',
            padding: '12px 20px',
            borderRadius: '8px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ margin: 0, fontWeight: '700' }}>
            {t('shopping.selectedItemsText', { count: shoppingItems.filter((item) => item.checked).length })}
          </span>
          <button
            type="button"
            className="primary-button"
            disabled={isSaving}
            onClick={handleMoveToFridge}
            style={{ padding: '0 16px', height: '38px', fontSize: '13px' }}
          >
            {isSaving ? t('common.saving') : t('shopping.moveToFridgeBtn')}
          </button>
        </div>
      )}

      {shoppingItems.length === 0 ? (
        <div className="fridge-error" style={{ background: '#fff', border: '1px solid var(--line)', padding: '40px' }}>
          <p>{t('shopping.empty')}</p>
        </div>
      ) : filteredShoppingItems.length === 0 ? (
        <div className="fridge-error" style={{ background: '#fff', border: '1px solid var(--line)', padding: '40px' }}>
          <p>{t('fridge.filter.noResults')}</p>
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
                  <table className="fridge-table">
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
                        <tr key={item.id} className={item.checked ? 'near-expiration-row' : ''}>
                          <td className="ingredient-name-cell" style={{ verticalAlign: 'middle' }}>
                            <span className="ingredient-name" style={{ fontWeight: '800' }}>{item.name}</span>
                            {item.isManual && (
                              <span
                                style={{
                                  marginLeft: '8px',
                                  fontSize: '10px',
                                  background: 'var(--line)',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                }}
                              >
                                {t('receipt.candidatesEyebrow')}
                              </span>
                            )}
                          </td>
                          <td style={{ verticalAlign: 'middle' }}>
                            {item.quantity ? `${item.quantity}個` : '-'}
                          </td>
                          <td style={{ verticalAlign: 'middle' }}>
                            {item.gram ? `${item.gram}g` : '-'}
                          </td>
                          <td style={{ color: 'var(--muted)', fontSize: '13px', verticalAlign: 'middle' }}>
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
      )}
    </main>
  )
}
