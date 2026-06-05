import '../server/env.js'
import { createClient } from '@supabase/supabase-js'
import path from 'path'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  console.log("Checking Supabase Tables...")
  
  // Get ingredient_management columns by doing a simple query
  const { data: ingData, error: ingError } = await supabase
    .from('ingredient_management')
    .select('*')
    .limit(1)
    
  if (ingError) {
    console.error("Error fetching ingredient_management:", ingError)
  } else {
    console.log("ingredient_management first row (columns keys):", ingData.length > 0 ? Object.keys(ingData[0]) : "No rows found")
    console.log("ingredient_management data:", ingData)
  }

  // Get inventory columns
  const { data: invData, error: invError } = await supabase
    .from('inventory')
    .select('*')
    .limit(1)

  if (invError) {
    console.error("Error fetching inventory:", invError)
  } else {
    console.log("inventory first row (columns keys):", invData.length > 0 ? Object.keys(invData[0]) : "No rows found")
    console.log("inventory data:", invData)
  }
}

check()
