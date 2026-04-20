import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: 'Variáveis de ambiente não configuradas' })
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  try {
    // Valida que quem está chamando é admin
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de autenticação ausente' })
    }
    const token = authHeader.replace('Bearer ', '')

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (userError || !user) {
      return res.status(401).json({ error: 'Token inválido' })
    }

    const { data: caller } = await supabaseAdmin
      .from('franqueados')
      .select('is_admin')
      .eq('user_id', user.id)
      .single()

    if (!caller?.is_admin) {
      return res.status(403).json({ error: 'Apenas admins podem criar franqueados' })
    }

    // Cria o usuário
    const { nome, unidade, email, senha, status } = req.body
    if (!nome || !unidade || !email || !senha) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' })
    }
    if (senha.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' })
    }

    const { data: signData, error: signError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true
    })

    if (signError) {
      return res.status(400).json({ error: 'Erro ao criar usuário: ' + signError.message })
    }

    const userId = signData.user.id

    const { error: dbError } = await supabaseAdmin.from('franqueados').insert({
      nome,
      unidade,
      email,
      user_id: userId,
      is_admin: false,
      status: status || 'implantacao'
    })

    if (dbError) {
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return res.status(500).json({ error: 'Erro ao salvar: ' + dbError.message })
    }

    return res.status(200).json({ ok: true, user_id: userId })

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
