import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eujdxvegcpoicpapuafu.supabase.co'
const supabaseKey = 'sb_publishable_xqeCBAVcNP1etWS1Dy7PSQ_M5q4nQTS'

export const supabase = createClient(supabaseUrl, supabaseKey)
