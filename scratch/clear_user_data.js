import { supabase } from '../server/supabase.js'
import {
  defaultUserPreferences,
  updateUserPreferences,
} from '../server/preferences.js'

const userName = process.argv[2] ?? '2310104847'

const { data: users, error: userError } = await supabase
  .from('users')
  .select('user_id, user_name, user_mail')
  .eq('user_name', userName)
  .limit(1)

if (userError) {
  console.error(userError.message)
  process.exit(1)
}

const user = users?.[0]
if (!user) {
  console.error(`User not found: ${userName}`)
  process.exit(1)
}

const userId = user.user_id
console.log(`Clearing data for ${user.user_name} (${user.user_mail})`)

const { count: inventoryBefore } = await supabase
  .from('inventory')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId)

const { error: inventoryError } = await supabase
  .from('inventory')
  .delete()
  .eq('user_id', userId)

if (inventoryError) {
  console.error('inventory delete failed:', inventoryError.message)
  process.exit(1)
}

const { count: ingredientsBefore } = await supabase
  .from('ingredient_management')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId)

const { error: ingredientError } = await supabase
  .from('ingredient_management')
  .delete()
  .eq('user_id', userId)

if (ingredientError) {
  console.error('ingredient_management delete failed:', ingredientError.message)
  process.exit(1)
}

await updateUserPreferences({
  userId,
  preferences: defaultUserPreferences,
})

const { count: inventoryAfter } = await supabase
  .from('inventory')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId)

console.log(
  JSON.stringify(
    {
      user: user.user_name,
      deleted: {
        inventory: inventoryBefore ?? 0,
        ingredient_management: ingredientsBefore ?? 0,
      },
      preferences: 'reset to default',
      remainingInventory: inventoryAfter ?? 0,
    },
    null,
    2,
  ),
)
