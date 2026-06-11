import { postJson } from './apiClient'
import type { Ingredient, ReceiptIngredientCandidate } from '../types/ui'

export async function parseReceiptText(
  ocrText: string,
  registrationDate: string,
) {
  return postJson<{
    items: ReceiptIngredientCandidate[]
  }>('/api/receipts/parse', { ocrText, registrationDate })
}

function dispatchInventoryUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('inventory-updated'))
  }
}

export async function importReceiptItems(
  items: ReceiptIngredientCandidate[],
) {
  const result = await postJson<{
    userId: string
    importedCount: number
    inventory: Ingredient[]
  }>('/api/receipts/import', { items })
  dispatchInventoryUpdated()
  return result
}

export async function importReceiptItemsDetail(
  items: ReceiptIngredientCandidate[],
) {
  const result = await postJson<{
    userId: string
    importedCount: number
  }>('/api/receipts/import-detail', { items })
  dispatchInventoryUpdated()
  return result
}
