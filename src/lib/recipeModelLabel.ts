export type RecipeModelProvider = 'gemini' | 'groq'

export function formatRecipeModelSource(
  provider?: RecipeModelProvider,
  modelName?: string,
) {
  if (!provider && !modelName) {
    return ''
  }

  const providerLabel =
    provider === 'gemini' ? 'Gemini' : provider === 'groq' ? 'Groq' : 'AI'

  return modelName ? `${providerLabel}: ${modelName}` : providerLabel
}
