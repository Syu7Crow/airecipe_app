import '../server/env.js'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  console.log("Fetching inventory data from Supabase PostgreSQL...")
  const { data, error } = await supabase
    .from('inventory')
    .select(`
      inventory_id,
      ingredient_id,
      user_id,
      quantity,
      gram,
      expiration_date,
      purchase_date,
      memo,
      ingredient_management (
        ingredient_name,
        category,
        is_opened,
        best_before_date,
        expiration_date
      )
    `)
    .order('inventory_id', { ascending: true })
    .limit(100)

  if (error) {
    console.error("Error fetching inventory:", error)
    return
  }

  if (data.length === 0) {
    console.log("No rows found in inventory table.")
    return
  }

  console.log(`Found ${data.length} rows in inventory table:`)
  console.table(data.map(row => ({
    'Inv ID': row.inventory_id,
    'Name': row.ingredient_management?.ingredient_name || 'N/A',
    'Category': row.ingredient_management?.category || 'N/A',
    'Qty': row.quantity,
    'Gram': row.gram,
    'Exp (Inv)': row.expiration_date,
    'Best Before (Ing)': row.ingredient_management?.best_before_date || 'N/A',
    'Exp (Ing)': row.ingredient_management?.expiration_date || 'N/A',
    'Opened': row.ingredient_management?.is_opened ? 'Yes' : 'No',
    'Memo': row.memo,
    'User ID': row.user_id ? row.user_id.slice(0, 8) + '...' : 'N/A'
  })))
}

run()
