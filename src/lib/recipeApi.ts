import type { Ingredient, Recipe } from '../types/ui'

type ApiResponse<T> =
  | ({ ok: true } & T)
  | {
      ok: false
      message?: string
    }

async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiResponse<T>

  if (!response.ok) {
    throw new Error(
      'message' in payload ? (payload.message ?? response.statusText) : response.statusText,
    )
  }

  if (!payload.ok) {
    throw new Error(payload.message ?? response.statusText)
  }

  return payload as T
}

export async function fetchInventory() {
  const response = await fetch('/api/inventory')
  return readJson<{
    userId: string
    inventory: Ingredient[]
  }>(response)
}

export async function generateRecipes(servings = 2) {
  const response = await fetch('/api/recipes/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      servings,
    }),
  })

  return readJson<{
    userId: string
    recipes: Recipe[]
  }>(response)
}

export async function markRecipeCooked(recipeId: string, servings: number) {
  const response = await fetch('/api/recipes/cooked', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipeId,
      servings,
    }),
  })

  return readJson<{
    userId: string
    recipeId: string
    servings: number
    inventory: Ingredient[]
  }>(response)
}
