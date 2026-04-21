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

  // ✅ Rate limit: 30 leads por minuto por IP (Lia pode ter pico de atendimento)
  if (rateLimit(req, res, { max: 30, windowMs: 60000 })) return

  const { nome, telefone, responsavel, idade, franqueado_id, status } = req.body
  if (!nome || !franqueado_id) {
    return res.status(400).json({ erro: 'nome e franqueado_id são obrigatórios' })
  }

  const { data, error } = await supabase.from('leads').insert({
    nome,
    telefone: telefone || null,
    responsavel: responsavel || null,
    idade: idade || null,
    franqueado_id,
    status: status || 'agendado',
    inserido_pela_lia: true,
  }).select().single()

  if (error) return res.status(500).json({ erro: error.message })
  return res.status(201).json({ sucesso: true, lead: data })
}
