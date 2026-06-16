import { supabase } from '../server/supabase.js'

const { data: users } = await supabase.from('users').select('user_id,user_name,user_mail')
const userMap = Object.fromEntries((users ?? []).map((u) => [u.user_id, u.user_name || u.user_mail]))

const { data, error } = await supabase
  .from('inventory')
  .select(
    `
    inventory_id,
    user_id,
    quantity,
    gram,
    expiration_date,
    purchase_date,
    memo,
    ingredient_management (
      ingredient_name,
      category,
      barcode
    )
  `,
  )
  .order('user_id')
  .order('expiration_date', { ascending: true, nullsFirst: false })

if (error) {
  console.error(error.message)
  process.exit(1)
}

const rows = (data ?? []).map((r) => ({
  user: userMap[r.user_id] ?? r.user_id,
  id: r.inventory_id,
  name: r.ingredient_management?.ingredient_name ?? '(不明)',
  category: r.ingredient_management?.category ?? '',
  quantity: r.quantity,
  gram: r.gram,
  expiration: r.expiration_date,
  purchase: r.purchase_date,
  memo: r.memo,
}))

console.log(JSON.stringify({ total: rows.length, inventory: rows }, null, 2))
