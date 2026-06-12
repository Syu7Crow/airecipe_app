import type { UserPreferences } from '../types/ui'
import { getJson, patchJson } from './apiClient'

export const defaultPreferences: UserPreferences = {
  defaultServings: 2,
  avoidedIngredients: '',
  recipeModel: 'groq',
  seasoningMode: 'unlimited',
  notifications: {
    expiration: true,
    expirationLeadDays: 3,
  },
}

export async function fetchPreferences() {
  return getJson<{
    userId: string
    preferences: UserPreferences
  }>('/api/preferences')
}

export async function savePreferences(preferences: UserPreferences) {
  const result = await patchJson<{
    userId: string
    preferences: UserPreferences
  }>('/api/preferences', { preferences })

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('preferences-updated'))
  }

  return result
}
