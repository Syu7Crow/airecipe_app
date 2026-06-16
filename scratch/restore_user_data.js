import { supabase } from '../server/supabase.js'

const userId = '522bde7c-8948-4ed9-b0fb-0f80be51eb36'

const items = [
  {
    ingredient_name: 'ぶりの照り焼き',
    category: 'その他',
    quantity: 1,
    gram: 300,
    expiration_date: '2026-06-10',
    purchase_date: '2026-06-09',
    memo: '食材登録テスト',
  },
  {
    ingredient_name: 'tamago',
    category: 'その他',
    quantity: 1,
    gram: null,
    expiration_date: '2026-06-17',
    purchase_date: '2026-06-09',
    memo: 'レシートOCR詳細登録',
  },
  {
    ingredient_name: 'tamagu',
    category: 'その他',
    quantity: 1,
    gram: null,
    expiration_date: '2026-06-17',
    purchase_date: '2026-06-09',
    memo: 'レシートOCR詳細登録',
  },
  {
    ingredient_name: 'tamagi',
    category: 'その他',
    quantity: 1,
    gram: null,
    expiration_date: '2026-06-17',
    purchase_date: '2026-06-09',
    memo: 'レシートOCR詳細登録',
  },
]

const restored = []

for (const item of items) {
  const { data: ingredient, error: ingredientError } = await supabase
    .from('ingredient_management')
    .insert({
      user_id: userId,
      ingredient_name: item.ingredient_name,
      category: item.category,
    })
    .select('ingredient_id')
    .single()

  if (ingredientError) {
    console.error('ingredient insert failed:', ingredientError.message, item)
    process.exit(1)
  }

  const { data: inventory, error: inventoryError } = await supabase
    .from('inventory')
    .insert({
      user_id: userId,
      ingredient_id: ingredient.ingredient_id,
      quantity: item.quantity,
      gram: item.gram,
      expiration_date: item.expiration_date,
      purchase_date: item.purchase_date,
      memo: item.memo,
    })
    .select('inventory_id')
    .single()

  if (inventoryError) {
    console.error('inventory insert failed:', inventoryError.message, item)
    process.exit(1)
  }

  restored.push({
    inventory_id: inventory.inventory_id,
    name: item.ingredient_name,
    quantity: item.quantity,
    gram: item.gram,
    expiration: item.expiration_date,
    memo: item.memo,
  })
}

console.log(JSON.stringify({ restoredCount: restored.length, restored }, null, 2))
