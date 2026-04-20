export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'API key não configurada no servidor' })
  }

  try {
    const { ob } = req.body
    if (!ob) return res.status(400).json({ error: 'Dados do onboarding ausentes' })

    const userMsg = `Você é especialista em criar prompts para agentes de IA de agendamento. 
Crie um prompt completo e detalhado para a Lia, agente de agendamento da KNN Idiomas, com base nos seguintes dados do onboarding:

DADOS DA UNIDADE:
- Nome: ${ob.nome}
- Cidade: ${ob.cidade}
- Endereço: ${ob.endereco || 'Não informado'}
- Coordenador: ${ob.coordenador || 'Não informado'}
- Instagram: ${ob.instagram || 'Não informado'}

CONTATOS:
- WhatsApp do responsável: ${ob.wa_dono}
- WhatsApp da Lia: ${ob.wa_lia}

HORÁRIOS DE ATENDIMENTO:
- Segunda a Sexta: ${ob.horario_semana || 'Não informado'}
- Sábado: ${ob.horario_sabado || 'Não informado'}
- Domingo: ${ob.horario_domingo || 'Não informado'}
- Turmas disponíveis: ${ob.turmas || 'Não informado'}

IDIOMAS E CURSOS:
- Idiomas: ${ob.idiomas ? ob.idiomas.join(', ') : 'Não informado'}
- Curso intensivo: ${ob.intensivo ? 'Sim' : 'Não'}
- Idade mínima: ${ob.idade_minima || 'Não informado'}
- Parcerias: ${ob.parcerias || 'Nenhuma'}
- Transporte/Van: ${ob.transporte || 'Não oferece'}
- KNN AT Home: ${ob.at_home ? 'Sim' : 'Não'}

CONFIGURAÇÕES DA LIA:
- Tom de voz: ${ob.tom}
- Autoriza informar faixa de preço: ${ob.autoriza_preco ? 'Sim (R$280 a R$400)' : 'Não'}
- Pode oferecer videochamada: ${ob.videochamada ? 'Sim' : 'Não'}
- Volume de leads/mês: ${ob.volume}

OBSERVAÇÕES DO FRANQUEADO:
${ob.obs || 'Nenhuma observação adicional'}

Crie um prompt completo no mesmo estilo e estrutura do exemplo abaixo, adaptando todos os dados para essa unidade específica. O prompt deve incluir: identidade, objetivo, endereços, regras de resposta, fluxo da conversa passo a passo, informações sobre o curso, horários de atendimento, feriados relevantes da cidade, objeções comuns e tag de agendamento.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{ role: 'user', content: userMsg }]
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      return res.status(response.status).json({ error: 'Erro ao chamar Anthropic', detalhe: errText })
    }

    const data = await response.json()
    const texto = data.content?.map(c => c.text || '').join('') || ''
    return res.status(200).json({ prompt: texto })

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
