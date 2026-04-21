import { createClient } from '@supabase/supabase-js'
import { rateLimit } from './_ratelimit.js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' })

  // ✅ Rate limit: 5 onboardings por minuto por IP
  if (rateLimit(req, res, { max: 5, windowMs: 60000 })) return

  const {
    nome, cidade, responsavel, wa_dono, wa_lia,
    endereco, coordenador, instagram,
    horario_semana, horario_sabado, horario_domingo, turmas,
    idiomas, intensivo, idade_minima, parcerias,
    transporte, at_home, tom, autoriza_preco,
    videochamada, volume, obs
  } = req.body

  if (!nome || !responsavel) {
    return res.status(400).json({ erro: 'nome e responsavel são obrigatórios' })
  }

  const { data, error } = await supabase.from('onboardings').insert({
    nome, cidade, responsavel, wa_dono, wa_lia,
    endereco, coordenador, instagram,
    horario_semana, horario_sabado, horario_domingo, turmas,
    idiomas, intensivo, idade_minima, parcerias,
    transporte, at_home, tom, autoriza_preco,
    videochamada, volume, obs,
    status: 'Onboarding recebido'
  }).select().single()

  if (error) return res.status(500).json({ erro: error.message })
  return res.status(201).json({ sucesso: true, onboarding: data })
}
