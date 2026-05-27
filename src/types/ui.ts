export type IconName =
  | 'spark'
  | 'basket'
  | 'camera'
  | 'list'
  | 'clock'
  | 'heart'
  | 'settings'
  | 'bell'
  | 'user'
  | 'message'
  | 'plus'
  | 'arrow'

export type FeatureTone =
  | 'green'
  | 'red'
  | 'yellow'
  | 'blue'
  | 'violet'
  | 'slate'

export type Feature = {
  title: string
  description: string
  action: string
  icon: IconName
  tone: FeatureTone
}

export type Ingredient = {
  inventoryId?: number
  ingredientId?: number
  name: string
  amount: string
  status: string
  category?: string | null
  quantity?: number
  gram?: number
  expirationDate?: string | null
  memo?: string | null
}

export type Recipe = {
  recipeId?: string
  name: string
  meta: string
  tags: string[]
  cookTime?: number
  servings?: number
  difficulty?: string
  reason?: string
  steps?: string[]
  ingredients?: RecipeIngredientAmount[]
}

export type RecipeIngredientAmount = {
  ingredientId: number
  name: string
  amount: number
  unit: string
}
