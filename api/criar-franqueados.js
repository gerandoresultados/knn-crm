import { createClient } from '@supabase/supabase-js'
import { rateLimit } from './_ratelimit.js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' })

  // ✅ Rate limit: 5 criações por minuto por IP (endpoint sensível)
  if (rateLimit(req, res, { max: 5, windowMs: 60000 })) return

  // Valida que é admin via JWT
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Token não enviado' })

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Token inválido' })

  const isAdmin = user.app_metadata?.is_admin === true
  if (!isAdmin) return res.status(403).json({ error: 'Apenas admin pode criar franqueados' })

  const { nome, unidade, email, senha, status } = req.body
  if (!nome || !unidade || !email || !senha) {
    return res.status(400).json({ error: 'Campos obrigatórios: nome, unidade, email, senha' })
  }

  // ✅ Validação de senha forte
  if (senha.length < 8) return res.status(400).json({ error: 'A senha deve ter no mínimo 8 caracteres.' })
  if (!/[a-zA-Z]/.test(senha)) return res.status(400).json({ error: 'A senha deve conter ao menos uma letra.' })
  if (!/[0-9]/.test(senha)) return res.status(400).json({ error: 'A senha deve conter ao menos um número.' })

  try {
    // 1. Cria usuário no Auth
    const { data: newUser, error: userError } = await supabase.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true
    })
    if (userError) return res.status(400).json({ error: userError.message })

    // 2. Cria registro na tabela franqueados
    const { data: franq, error: franqError } = await supabase.from('franqueados').insert({
      nome,
      unidade,
      email,
      user_id: newUser.user.id,
      status: status || 'implantacao',
      is_admin: false
    }).select().single()

    if (franqError) {
      // Rollback: deleta o usuário se falhou ao criar franqueado
      await supabase.auth.admin.deleteUser(newUser.user.id)
      return res.status(500).json({ error: franqError.message })
    }

    return res.status(201).json({ sucesso: true, franqueado: franq })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
