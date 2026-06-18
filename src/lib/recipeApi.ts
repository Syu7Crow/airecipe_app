import type { LanguageCode } from './i18n'
import { deleteJson, getJson, patchJson, postJson } from './apiClient'
import type { Ingredient, Recipe } from '../types/ui'

function withLanguage(path: string, language?: LanguageCode) {
  if (!language) {
    return path
  }

  const params = new URLSearchParams({ language })
  return `${path}?${params.toString()}`
}

export async function fetchInventory(language?: LanguageCode) {
  return getJson<{
    userId: string
    inventory: Ingredient[]
  }>(withLanguage('/api/inventory', language))
}

export type InventoryMutationInput = {
  inventoryId?: number
  name: string
  category?: string | null
  quantity?: number | null
  gram?: number | null
  expirationDate?: string | null
  bestBeforeDate?: string | null
  isOpened?: boolean | null
  memo?: string | null
}

function dispatchInventoryUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('inventory-updated'))
  }
}

export async function createInventoryItem(item: InventoryMutationInput) {
  const result = await postJson<{
    userId: string
    inventory: Ingredient[]
  }>('/api/inventory', item)
  dispatchInventoryUpdated()
  return result
}

export async function updateInventoryItem(item: InventoryMutationInput) {
  const result = await patchJson<{
    userId: string
    inventory: Ingredient[]
  }>('/api/inventory', item)
  dispatchInventoryUpdated()
  return result
}

export async function deleteInventoryItem(inventoryId: number) {
  const result = await deleteJson<{
    userId: string
    inventory: Ingredient[]
  }>(`/api/inventory/${encodeURIComponent(String(inventoryId))}`)
  dispatchInventoryUpdated()
  return result
}

export async function generateRecipes(
  servings = 2,
  language?: LanguageCode,
  avoidedIngredients?: string,
  cookingRequest?: string,
  seasoningMode?: 'unlimited' | 'strict',
) {
  const result = await postJson<{
    userId: string
    recipes: Recipe[]
    modelProvider?: 'gemini' | 'groq'
    modelName?: string
  }>('/api/recipes/generate', {
    servings,
    language,
    avoidedIngredients,
    cookingRequest,
    seasoningMode,
  })
  dispatchInventoryUpdated()
  return result
}

export async function markRecipeCooked(
  recipeId: string,
  servings: number,
  language?: LanguageCode,
) {
  const result = await postJson<{
    userId: string
    recipeId: string
    servings: number
    inventory: Ingredient[]
  }>('/api/recipes/cooked', {
    recipeId,
    servings,
    language,
  })
  dispatchInventoryUpdated()
  return result
}

export async function fetchCookingHistory(language?: LanguageCode) {
  return getJson<{
    userId: string
    recipes: Recipe[]
  }>(withLanguage('/api/cooking-history', language))
}

export async function fetchSavedRecipes(language?: LanguageCode) {
  return getJson<{
    userId: string
    recipes: Recipe[]
  }>(withLanguage('/api/recipes/saved', language))
}

export async function deleteSavedRecipe(
  recipeId: string,
  language?: LanguageCode,
) {
  const result = await deleteJson<{
    userId: string
    recipes: Recipe[]
  }>(
    withLanguage(
      `/api/recipes/saved/${encodeURIComponent(recipeId)}`,
      language,
    ),
  )
  dispatchInventoryUpdated()
  return result
}

export async function setRecipeFavorite(
  recipeId: string,
  isFavorite: boolean,
) {
  const result = await postJson<{
    userId: string
    recipeId: string
    isFavorite: boolean
  }>('/api/recipes/favorite', {
    recipeId,
    isFavorite,
  })
  dispatchInventoryUpdated()
  return result
}


