import Anthropic from '@anthropic-ai/sdk'
import { rateLimit } from './_ratelimit.js'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' })

  // ✅ Rate limit: 10 prompts por minuto por IP (gerar-prompt é mais caro)
  if (rateLimit(req, res, { max: 10, windowMs: 60000 })) return

  const { ob } = req.body
  if (!ob) return res.status(400).json({ erro: 'Dados do onboarding obrigatórios' })

  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Você é especialista em criar prompts para agentes de IA que atendem no WhatsApp. Crie um prompt completo e profissional em português brasileiro para a "Lia", assistente virtual da unidade KNN Idiomas abaixo:

Nome da unidade: ${ob.nome || 'KNN'}
Cidade: ${ob.cidade || 'não informado'}
Responsável: ${ob.responsavel || 'não informado'}
Coordenador: ${ob.coordenador || 'não informado'}
Endereço: ${ob.endereco || 'não informado'}
Instagram: ${ob.instagram || 'não informado'}
Horário seg-sex: ${ob.horario_semana || 'não informado'}
Horário sábado: ${ob.horario_sabado || 'não informado'}
Idiomas: ${ob.idiomas || 'não informado'}
Tom de voz: ${ob.tom || 'profissional e acolhedor'}
Volume esperado: ${ob.volume || 'não informado'}
${ob.obs ? 'Observações: ' + ob.obs : ''}

O prompt deve incluir: persona da Lia, regras de atendimento, fluxo de qualificação (nome, idade, interesse), como agendar visita, como lidar com objeções de preço, e instruções para registrar os leads no CRM. Retorne APENAS o prompt final, sem introduções.`
      }]
    })
    return res.status(200).json({ prompt: msg.content[0].text })
  } catch (err) {
    return res.status(500).json({ erro: err.message, prompt: 'Erro ao gerar prompt: ' + err.message })
  }
}
