import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

const STATUS_LIST = [
  { val: 'agendado',   label: 'Agendado',                bg: '#E6F1FB', color: '#0C447C' },
  { val: 'visitou',    label: 'Visitou',                 bg: '#EEEDFE', color: '#3C3489' },
  { val: 'matriculou', label: 'Matriculou',              bg: '#EAF3DE', color: '#27500A' },
  { val: 'preco',      label: 'Só preço',                bg: '#FAEEDA', color: '#633806' },
  { val: 'sumiu',      label: 'Sumiu',                   bg: '#FCEBEB', color: '#791F1F' },
  { val: 'futuro',     label: 'Contato mais pra frente', bg: '#F1EFE8', color: '#444441' },
  { val: 'comercial',  label: 'Comercial em contato',    bg: '#FBEAF0', color: '#72243E' },
]

const STATUS_FRANQUEADO = [
  { val: 'ativo',       label: 'Ativo',           bg: '#EAF3DE', color: '#27500A' },
  { val: 'implantacao', label: 'Em implantação',   bg: '#E6F1FB', color: '#0C447C' },
  { val: 'suspenso',    label: 'Suspenso',         bg: '#FAEEDA', color: '#633806' },
  { val: 'cancelado',   label: 'Cancelado',        bg: '#FCEBEB', color: '#791F1F' },
]

const STATUS_ONBOARDING = [
  { val: 'Onboarding recebido', bg: '#E6F1FB', color: '#0C447C' },
  { val: 'Em configuração',     bg: '#FAEEDA', color: '#633806' },
  { val: 'Ativo',               bg: '#EAF3DE', color: '#27500A' },
  { val: 'Cancelado',           bg: '#FCEBEB', color: '#791F1F' },
]

function pct(a, b) { return b > 0 ? Math.round((a / b) * 100) : 0 }

function BadgeFranqueado({ status }) {
  const s = STATUS_FRANQUEADO.find(x => x.val === status) || STATUS_FRANQUEADO[0]
  return <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>{s.label}</span>
}

function BadgeOnboarding({ status }) {
  const s = STATUS_ONBOARDING.find(x => x.val === status) || STATUS_ONBOARDING[0]
  return <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>{status}</span>
}

// ─── Login ────────────────────────────────────────────────────────────────────
function LoginPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setErro('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) { setErro('Email ou senha incorretos.'); setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eee', padding: '2rem', width: 360 }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>KNN CRM</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Entre com sua conta</div>
        </div>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 4 }}>Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              placeholder="seu@email.com" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 4 }}>Senha</label>
            <input type="password" required value={senha} onChange={e => setSenha(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              placeholder="••••••••" />
          </div>
          {erro && <div style={{ fontSize: 13, color: '#A32D2D', marginBottom: 12, background: '#FCEBEB', padding: '8px 12px', borderRadius: 8 }}>{erro}</div>}
          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '10px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Aba Onboarding ───────────────────────────────────────────────────────────
function AbaOnboarding() {
  const [onboardings, setOnboardings] = useState([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(null)
  const [promptModal, setPromptModal] = useState(null)
  const [promptTexto, setPromptTexto] = useState('')
  const [gerandoPrompt, setGerandoPrompt] = useState(false)

  useEffect(() => { carregarOnboardings() }, [])

  async function carregarOnboardings() {
    const { data } = await supabase.from('onboardings').select('*').order('created_at', { ascending: false })
    setOnboardings(data || [])
    setLoading(false)
  }

  async function salvarEdicao() {
    await supabase.from('onboardings').update(editando).eq('id', editando.id)
    setOnboardings(prev => prev.map(o => o.id === editando.id ? editando : o))
    setEditando(null)
  }

  // ✅ CORRIGIDO: chama API route segura em vez de Anthropic direto
  async function gerarPrompt(ob) {
    setPromptModal(ob)
    setPromptTexto('')
    setGerandoPrompt(true)
    try {
      const response = await fetch('/api/gerar-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ob })
      })
      const data = await response.json()
      setPromptTexto(data.prompt || 'Erro ao gerar.')
    } catch (err) {
      setPromptTexto('Erro de conexão.')
    }
    setGerandoPrompt(false)
  }

  const s = {
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
    th: { background: '#f9f9f9', color: '#888', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', padding: '10px 14px', textAlign: 'left', borderBottom: '1px solid #eee' },
    td: { padding: '12px 14px', borderBottom: '1px solid #f0f0f0', color: '#1a1a1a', verticalAlign: 'middle' },
    btn: { fontSize: 12, padding: '5px 10px', border: '1px solid #ddd', borderRadius: 6, background: '#fff', cursor: 'pointer' },
    btnBlue: { fontSize: 12, padding: '5px 10px', border: 'none', borderRadius: 6, background: '#185FA5', color: '#fff', cursor: 'pointer' },
    input: { width: '100%', padding: '7px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box' },
    label: { fontSize: 12, color: '#888', display: 'block', marginBottom: 4 },
  }

  if (loading) return <div style={{ padding: 32, color: '#888', textAlign: 'center' }}>Carregando onboardings...</div>

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888' }}>
          Onboardings KNN ({onboardings.length})
        </div>
      </div>

      <div style={{ border: '1px solid #eee', borderRadius: 12, overflow: 'hidden' }}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Unidade</th>
              <th style={s.th}>Cidade</th>
              <th style={s.th}>Responsável</th>
              <th style={s.th}>WhatsApp Lia</th>
              <th style={s.th}>Tom</th>
              <th style={s.th}>Volume</th>
              <th style={s.th}>Status</th>
              <th style={s.th}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {onboardings.map(ob => (
              <tr key={ob.id}>
                <td style={{ ...s.td, fontWeight: 600 }}>{ob.nome}</td>
                <td style={s.td}>{ob.cidade}</td>
                <td style={s.td}>{ob.responsavel}</td>
                <td style={{ ...s.td, fontSize: 12, color: '#888' }}>{ob.wa_lia}</td>
                <td style={{ ...s.td, fontSize: 12 }}>{ob.tom}</td>
                <td style={{ ...s.td, fontSize: 12 }}>{ob.volume}</td>
                <td style={s.td}><BadgeOnboarding status={ob.status} /></td>
                <td style={s.td}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={s.btn} onClick={() => setEditando({ ...ob })}>Editar</button>
                    <button style={s.btnBlue} onClick={() => gerarPrompt(ob)}>Gerar prompt</button>
                  </div>
                </td>
              </tr>
            ))}
            {onboardings.length === 0 && (
              <tr><td colSpan={8} style={{ ...s.td, textAlign: 'center', color: '#aaa', padding: 32 }}>
                Nenhum onboarding ainda. Os dados chegam automaticamente pelo formulário.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editando && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Editar onboarding — {editando.nome}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Nome da unidade', key: 'nome' },
                { label: 'Cidade', key: 'cidade' },
                { label: 'Responsável', key: 'responsavel' },
                { label: 'Coordenador', key: 'coordenador' },
                { label: 'WhatsApp Responsável', key: 'wa_dono' },
                { label: 'WhatsApp da Lia', key: 'wa_lia' },
                { label: 'Endereço', key: 'endereco' },
                { label: 'Instagram', key: 'instagram' },
                { label: 'Horário Seg-Sex', key: 'horario_semana' },
                { label: 'Horário Sábado', key: 'horario_sabado' },
                { label: 'Tom de voz', key: 'tom' },
                { label: 'Volume de leads', key: 'volume' },
              ].map(f => (
                <div key={f.key}>
                  <label style={s.label}>{f.label}</label>
                  <input style={s.input} value={editando[f.key] || ''} onChange={e => setEditando({ ...editando, [f.key]: e.target.value })} />
                </div>
              ))}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={s.label}>Status</label>
                <select style={{ ...s.input }} value={editando.status} onChange={e => setEditando({ ...editando, status: e.target.value })}>
                  {STATUS_ONBOARDING.map(st => <option key={st.val} value={st.val}>{st.val}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={s.label}>Observações</label>
                <textarea style={{ ...s.input, resize: 'vertical', minHeight: 80 }} value={editando.obs || ''} onChange={e => setEditando({ ...editando, obs: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button style={s.btn} onClick={() => setEditando(null)}>Cancelar</button>
              <button style={s.btnBlue} onClick={salvarEdicao}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      {promptModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', width: '100%', maxWidth: 800, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Prompt da Lia — {promptModal.nome}</div>
              <button style={s.btn} onClick={() => setPromptModal(null)}>Fechar</button>
            </div>
            {gerandoPrompt ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: 14 }}>
                Gerando prompt com IA... aguarde 🤖
              </div>
            ) : (
              <>
                <textarea
                  style={{ flex: 1, minHeight: 400, padding: 12, border: '1px solid #ddd', borderRadius: 8, fontSize: 13, fontFamily: 'monospace', resize: 'vertical', outline: 'none' }}
                  value={promptTexto}
                  onChange={e => setPromptTexto(e.target.value)}
                />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                  <button style={s.btn} onClick={() => { navigator.clipboard.writeText(promptTexto); alert('Prompt copiado!') }}>Copiar</button>
                  <button style={s.btnBlue} onClick={() => gerarPrompt(promptModal)}>Regerar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Painel Master ────────────────────────────────────────────────────────────
function PainelMaster({ onLogout }) {
  const [franqueados, setFranqueados] = useState([])
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [novoNome, setNovoNome] = useState('')
  const [novaUnidade, setNovaUnidade] = useState('')
  const [novoEmail, setNovoEmail] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [novoStatus, setNovoStatus] = useState('implantacao')
  const [modalAberto, setModalAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgTipo, setMsgTipo] = useState('ok')
  const [abaAtiva, setAbaAtiva] = useState('ativos')
  const [tabPrincipal, setTabPrincipal] = useState('franqueados')

  useEffect(() => { carregarDados() }, [])

  async function carregarDados() {
    const { data: f } = await supabase.from('franqueados').select('*').eq('is_admin', false)
    const { data: l } = await supabase.from('leads').select('*')
    setFranqueados(f || [])
    setLeads(l || [])
    setLoading(false)
  }

  // ✅ CORRIGIDO: usa API route segura, não desloga o admin
  async function adicionarFranqueado(e) {
    e.preventDefault()
    setSalvando(true)
    setMsg('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/criar-franqueado', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ nome: novoNome, unidade: novaUnidade, email: novoEmail, senha: novaSenha, status: novoStatus })
      })
      const result = await response.json()
      if (!response.ok) {
        setMsg('Erro: ' + (result.error || 'Falha ao criar franqueado'))
        setMsgTipo('erro')
      } else {
        setMsg('Franqueado criado com sucesso!')
        setMsgTipo('ok')
        setNovoNome(''); setNovaUnidade(''); setNovoEmail(''); setNovaSenha(''); setNovoStatus('implantacao')
        setModalAberto(false)
        carregarDados()
      }
    } catch (err) {
      setMsg('Erro: ' + err.message)
      setMsgTipo('erro')
    }
    setSalvando(false)
  }

  async function alterarStatus(id, novoSt) {
    await supabase.from('franqueados').update({ status: novoSt }).eq('id', id)
    setFranqueados(prev => prev.map(f => f.id === id ? { ...f, status: novoSt } : f))
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#888' }}>Carregando...</div>

  const ativos = franqueados.filter(f => f.status === 'ativo' || f.status === 'implantacao')
  const inativos = franqueados.filter(f => f.status === 'suspenso' || f.status === 'cancelado')

  const s = {
    wrap: { fontFamily: "'Segoe UI', sans-serif", maxWidth: 1200, margin: '0 auto', padding: '24px 16px' },
    topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
    title: { fontSize: 20, fontWeight: 700, color: '#1a1a1a' },
    subtitle: { fontSize: 13, color: '#888', marginTop: 2 },
    btn: { fontSize: 12, padding: '7px 14px', border: '1px solid #ddd', borderRadius: 8, background: '#fff', cursor: 'pointer' },
    btnPrimary: { fontSize: 12, padding: '7px 14px', border: 'none', borderRadius: 8, background: '#185FA5', color: '#fff', cursor: 'pointer' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 },
    stat: { background: '#f5f5f5', borderRadius: 8, padding: '14px 16px' },
    statLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
    statVal: { fontSize: 24, fontWeight: 700 },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
    th: { background: '#f9f9f9', color: '#888', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', padding: '10px 14px', textAlign: 'left', borderBottom: '1px solid #eee' },
    td: { padding: '12px 14px', borderBottom: '1px solid #f0f0f0', color: '#1a1a1a' },
  }

  function TabelaFranqueados({ lista }) {
    return (
      <div style={{ border: '1px solid #eee', borderRadius: 12, overflow: 'hidden' }}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Unidade</th>
              <th style={s.th}>Responsável</th>
              <th style={s.th}>Email</th>
              <th style={s.th}>Status</th>
              <th style={s.th}>Leads</th>
              <th style={s.th}>Matrículas</th>
              <th style={s.th}>Conversão</th>
              <th style={s.th}>Receita</th>
              <th style={s.th}>Alterar status</th>
              <th style={s.th}>ID (Lia)</th>
            </tr>
          </thead>
          <tbody>
            {lista.map(f => {
              const fl = leads.filter(l => l.franqueado_id === f.id)
              const fm = fl.filter(l => l.status === 'matriculou')
              const fr = fl.reduce((s, l) => s + (parseFloat(l.mensalidade) || 0), 0)
              return (
                <tr key={f.id}>
                  <td style={{ ...s.td, fontWeight: 600 }}>{f.unidade}</td>
                  <td style={s.td}>{f.nome}</td>
                  <td style={{ ...s.td, color: '#888', fontSize: 12 }}>{f.email}</td>
                  <td style={s.td}><BadgeFranqueado status={f.status} /></td>
                  <td style={s.td}>{fl.length}</td>
                  <td style={{ ...s.td, color: '#3B6D11', fontWeight: 600 }}>{fm.length}</td>
                  <td style={s.td}>{pct(fm.length, fl.length)}%</td>
                  <td style={{ ...s.td, color: '#3B6D11' }}>R$ {fr.toLocaleString('pt-BR')}</td>
                  <td style={s.td}>
                    <select value={f.status} onChange={e => alterarStatus(f.id, e.target.value)}
                      style={{ fontSize: 12, padding: '4px 8px', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', outline: 'none' }}>
                      {STATUS_FRANQUEADO.map(st => <option key={st.val} value={st.val}>{st.label}</option>)}
                    </select>
                  </td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, color: '#888', fontFamily: 'monospace' }}>{f.id.substring(0, 8)}...</span>
                      <button onClick={() => { navigator.clipboard.writeText(f.id); alert('ID copiado!') }}
                        style={{ fontSize: 10, padding: '2px 8px', border: '1px solid #ddd', borderRadius: 4, background: '#f5f5f5', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        copiar
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {lista.length === 0 && (
              <tr><td colSpan={10} style={{ ...s.td, textAlign: 'center', color: '#aaa', padding: 32 }}>Nenhum franqueado nessa lista.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div style={s.wrap}>
      <div style={s.topbar}>
        <div>
          <div style={s.title}>Painel Master — KNN Idiomas</div>
          <div style={s.subtitle}>Visão geral de todas as unidades</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {tabPrincipal === 'franqueados' && <button style={s.btnPrimary} onClick={() => setModalAberto(true)}>+ Novo franqueado</button>}
          <button style={s.btn} onClick={onLogout}>Sair</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #eee', paddingBottom: 0 }}>
        {[
          { val: 'franqueados', label: 'Franqueados' },
          { val: 'onboarding', label: 'Onboardings KNN' },
        ].map(tab => (
          <button key={tab.val} onClick={() => setTabPrincipal(tab.val)}
            style={{
              fontSize: 13, padding: '8px 16px', borderRadius: '8px 8px 0 0',
              border: tabPrincipal === tab.val ? '1px solid #eee' : 'none',
              borderBottom: tabPrincipal === tab.val ? '1px solid #fff' : 'none',
              background: tabPrincipal === tab.val ? '#fff' : 'transparent',
              color: tabPrincipal === tab.val ? '#185FA5' : '#888',
              cursor: 'pointer', fontWeight: tabPrincipal === tab.val ? 600 : 400,
              marginBottom: tabPrincipal === tab.val ? -1 : 0
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {tabPrincipal === 'franqueados' && (
        <>
          {msg && <div style={{ fontSize: 13, color: msgTipo === 'ok' ? '#27500A' : '#A32D2D', background: msgTipo === 'ok' ? '#EAF3DE' : '#FCEBEB', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{msg}</div>}
          <div style={s.statsGrid}>
            <div style={s.stat}><div style={s.statLabel}>Franqueados ativos</div><div style={s.statVal}>{ativos.length}</div></div>
            <div style={s.stat}><div style={s.statLabel}>Total de leads</div><div style={{ ...s.statVal, color: '#185FA5' }}>{leads.length}</div></div>
            <div style={s.stat}><div style={s.statLabel}>Total de matrículas</div><div style={{ ...s.statVal, color: '#3B6D11' }}>{leads.filter(l => l.status === 'matriculou').length}</div></div>
          </div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
            {[{ val: 'ativos', label: `Ativos e em implantação (${ativos.length})` }, { val: 'inativos', label: `Inativos (${inativos.length})` }].map(tab => (
              <button key={tab.val} onClick={() => setAbaAtiva(tab.val)}
                style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, border: abaAtiva === tab.val ? 'none' : '1px solid #ddd', background: abaAtiva === tab.val ? '#185FA5' : '#fff', color: abaAtiva === tab.val ? '#fff' : '#1a1a1a', cursor: 'pointer' }}>
                {tab.label}
              </button>
            ))}
          </div>
          <TabelaFranqueados lista={abaAtiva === 'ativos' ? ativos : inativos} />
        </>
      )}

      {tabPrincipal === 'onboarding' && <AbaOnboarding />}

      {modalAberto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', width: 380, border: '1px solid #eee' }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Novo franqueado</div>
            <form onSubmit={adicionarFranqueado}>
              {[
                { label: 'Nome do responsável', val: novoNome, set: setNovoNome, type: 'text', ph: 'Ex: João Silva' },
                { label: 'Unidade', val: novaUnidade, set: setNovaUnidade, type: 'text', ph: 'Ex: Moema' },
                { label: 'Email de acesso', val: novoEmail, set: setNovoEmail, type: 'email', ph: 'franqueado@email.com' },
                { label: 'Senha inicial', val: novaSenha, set: setNovaSenha, type: 'password', ph: 'Mínimo 6 caracteres' },
              ].map(f => (
                <div key={f.label} style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 4 }}>{f.label}</label>
                  <input type={f.type} required value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 4 }}>Status inicial</label>
                <select value={novoStatus} onChange={e => setNovoStatus(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}>
                  {STATUS_FRANQUEADO.map(st => <option key={st.val} value={st.val}>{st.label}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
                <button type="button" style={s.btn} onClick={() => setModalAberto(false)}>Cancelar</button>
                <button type="submit" disabled={salvando} style={s.btnPrimary}>{salvando ? 'Salvando...' : 'Criar franqueado'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── CRM Franqueado ───────────────────────────────────────────────────────────
function CRMFranqueado({ franqueado, onLogout }) {
  const [leads, setLeads] = useState([])
  const [consultores, setConsultores] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalConsultores, setModalConsultores] = useState(false)
  const [novoConsultor, setNovoConsultor] = useState('')

  useEffect(() => { carregarDados() }, [])

  async function carregarDados() {
    const { data: l } = await supabase.from('leads').select('*').eq('franqueado_id', franqueado.id).order('created_at', { ascending: true })
    const { data: c } = await supabase.from('consultores').select('*').eq('franqueado_id', franqueado.id)
    setLeads(l || [])
    setConsultores(c || [])
    setLoading(false)
  }

  async function atualizarLead(id, campo, valor) {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, [campo]: valor } : l))
    await supabase.from('leads').update({ [campo]: valor, updated_at: new Date() }).eq('id', id)
  }

  async function adicionarConsultor() {
    if (!novoConsultor.trim()) return
    const { data } = await supabase.from('consultores').insert({ franqueado_id: franqueado.id, nome: novoConsultor.trim() }).select().single()
    setConsultores(prev => [...prev, data])
    setNovoConsultor('')
  }

  async function removerConsultor(id) {
    await supabase.from('consultores').delete().eq('id', id)
    setConsultores(prev => prev.filter(c => c.id !== id))
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#888' }}>Carregando...</div>

  const total = leads.length
  const agendados = leads.filter(l => l.status === 'agendado').length
  const visitas = leads.filter(l => l.status === 'visitou' || l.status === 'matriculou').length
  const matr = leads.filter(l => l.status === 'matriculou').length
  const frio = leads.filter(l => l.status === 'preco' || l.status === 'sumiu').length
  const comercial = leads.filter(l => l.status === 'comercial').length
  const receita = leads.reduce((s, l) => s + (parseFloat(l.mensalidade) || 0), 0)
  const comMens = leads.filter(l => parseFloat(l.mensalidade) > 0).length
  const ticket = comMens > 0 ? Math.round(receita / comMens) : 0

  const s = {
    wrap: { fontFamily: "'Segoe UI', sans-serif", maxWidth: 1200, margin: '0 auto', padding: '24px 16px', color: '#1a1a1a' },
    topbar: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
    title: { fontSize: 20, fontWeight: 700, color: '#1a1a1a' },
    subtitle: { fontSize: 13, color: '#888', marginTop: 2 },
    btn: { fontSize: 12, padding: '6px 14px', border: '1px solid #ddd', borderRadius: 8, background: '#fff', cursor: 'pointer' },
    sectionLabel: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888', marginBottom: 10 },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 },
    stat: { background: '#f5f5f5', borderRadius: 8, padding: '12px 14px' },
    statLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
    statVal: { fontSize: 22, fontWeight: 700 },
    convGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 },
    convCard: { background: '#f5f5f5', borderRadius: 8, padding: '12px 14px' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 1000 },
    th: { background: '#f9f9f9', color: '#888', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' },
    td: { padding: '8px 12px', borderBottom: '1px solid #f0f0f0', verticalAlign: 'middle' },
    input: { fontSize: 13, border: 'none', background: 'transparent', color: '#1a1a1a', width: '100%', outline: 'none', padding: 0, fontFamily: 'inherit' },
    textarea: { fontSize: 12, border: 'none', background: 'transparent', color: '#666', width: '100%', outline: 'none', padding: 0, resize: 'none', lineHeight: 1.4, fontFamily: 'inherit' },
    select: { fontSize: 13, border: 'none', background: 'transparent', color: '#1a1a1a', width: '100%', outline: 'none', padding: 0, fontFamily: 'inherit', cursor: 'pointer' },
    liaTag: { display: 'inline-block', fontSize: 10, background: '#E1F5EE', color: '#085041', borderRadius: 4, padding: '1px 5px', marginLeft: 4 },
    divider: { height: 1, background: '#eee', margin: '20px 0' },
  }

  return (
    <div style={s.wrap}>
      <div style={s.topbar}>
        <div>
          <div style={s.title}>CRM — KNN Idiomas</div>
          <div style={s.subtitle}>Unidade: {franqueado.unidade} · {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={s.btn} onClick={() => setModalConsultores(true)}>Gerenciar consultores</button>
          <button style={s.btn} onClick={onLogout}>Sair</button>
        </div>
      </div>

      <div style={s.sectionLabel}>Leads</div>
      <div style={s.statsGrid}>
        <div style={s.stat}><div style={s.statLabel}>Total de leads</div><div style={s.statVal}>{total}</div></div>
        <div style={s.stat}><div style={s.statLabel}>Agendados</div><div style={{ ...s.statVal, color: '#185FA5' }}>{agendados}</div></div>
        <div style={s.stat}><div style={s.statLabel}>Só preço / Sumiu</div><div style={{ ...s.statVal, color: '#854F0B' }}>{frio}</div></div>
        <div style={s.stat}><div style={s.statLabel}>Comercial ativo</div><div style={{ ...s.statVal, color: '#534AB7' }}>{comercial}</div></div>
      </div>

      <div style={s.sectionLabel}>Visitas</div>
      <div style={s.statsGrid}>
        <div style={s.stat}><div style={s.statLabel}>Visitas realizadas</div><div style={{ ...s.statVal, color: '#534AB7' }}>{visitas}</div></div>
        <div style={s.stat}><div style={s.statLabel}>Matriculados</div><div style={{ ...s.statVal, color: '#3B6D11' }}>{matr}</div></div>
        <div style={s.stat}><div style={s.statLabel}>Receita estimada</div><div style={{ ...s.statVal, color: '#3B6D11', fontSize: 16 }}>R$ {receita.toLocaleString('pt-BR')}</div></div>
        <div style={s.stat}><div style={s.statLabel}>Ticket médio</div><div style={{ ...s.statVal, fontSize: 16 }}>{comMens > 0 ? 'R$ ' + ticket.toLocaleString('pt-BR') : '—'}</div></div>
      </div>

      <div style={s.sectionLabel}>Funil de conversão</div>
      <div style={s.convGrid}>
        {[
          { label: 'Leads → Agendados', p: pct(agendados, total), sub: `${agendados} de ${total} leads`, color: '#378ADD' },
          { label: 'Agendados → Visita', p: pct(visitas, agendados + visitas + matr), sub: `${visitas} de ${agendados + visitas + matr} agendados`, color: '#7F77DD' },
          { label: 'Visita → Matrícula', p: pct(matr, visitas), sub: `${matr} de ${visitas} visitas`, color: '#639922' },
        ].map(c => (
          <div key={c.label} style={s.convCard}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: c.color }}>{c.p}%</div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>{c.sub}</div>
            <div style={{ height: 5, background: '#e0e0e0', borderRadius: 99, marginTop: 8 }}>
              <div style={{ height: 5, borderRadius: 99, background: c.color, width: c.p + '%' }} />
            </div>
          </div>
        ))}
      </div>

      <div style={s.divider} />
      <div style={s.sectionLabel}>Todos os leads</div>

      <div style={{ overflowX: 'auto', border: '1px solid #eee', borderRadius: 12 }}>
        <table style={s.table}>
          <thead>
            <tr>
              {['#','Cliente','Idade','Responsável','Telefone','Status','Consultor','Contraproposta','Mensalidade'].map(h => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.map((lead, i) => {
              const st = STATUS_LIST.find(x => x.val === lead.status) || STATUS_LIST[0]
              return (
                <tr key={lead.id}>
                  <td style={{ ...s.td, color: '#aaa', fontSize: 12 }}>{i + 1}</td>
                  <td style={s.td}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {lead.nome}
                      {lead.inserido_pela_lia && <span style={s.liaTag}>Lia</span>}
                    </span>
                  </td>
                  <td style={s.td}><input style={{ ...s.input, width: 40 }} type="number" defaultValue={lead.idade} onBlur={e => atualizarLead(lead.id, 'idade', e.target.value)} /></td>
                  <td style={s.td}><input style={s.input} type="text" defaultValue={lead.responsavel} placeholder="—" onBlur={e => atualizarLead(lead.id, 'responsavel', e.target.value)} /></td>
                  <td style={s.td}><input style={s.input} type="text" defaultValue={lead.telefone} placeholder="—" onBlur={e => atualizarLead(lead.id, 'telefone', e.target.value)} /></td>
                  <td style={s.td}>
                    <select style={{ background: st.bg, color: st.color, fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, border: 'none', cursor: 'pointer' }}
                      value={lead.status} onChange={e => atualizarLead(lead.id, 'status', e.target.value)}>
                      {STATUS_LIST.map(x => <option key={x.val} value={x.val}>{x.label}</option>)}
                    </select>
                  </td>
                  <td style={s.td}>
                    <select style={s.select} value={lead.consultor || ''} onChange={e => atualizarLead(lead.id, 'consultor', e.target.value)}>
                      <option value="">—</option>
                      {consultores.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                    </select>
                  </td>
                  <td style={s.td}><textarea style={s.textarea} rows={2} defaultValue={lead.contraproposta} placeholder="Digite aqui..." onBlur={e => atualizarLead(lead.id, 'contraproposta', e.target.value)} /></td>
                  <td style={s.td}><input style={{ ...s.input, width: 80 }} type="text" defaultValue={lead.mensalidade} placeholder="—" onBlur={e => atualizarLead(lead.id, 'mensalidade', e.target.value)} /></td>
                </tr>
              )
            })}
            {leads.length === 0 && (
              <tr><td colSpan={9} style={{ ...s.td, textAlign: 'center', color: '#aaa', padding: 32 }}>Nenhum lead ainda. A Lia vai preencher automaticamente!</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 11, color: '#aaa', marginTop: 8 }}>
        <span style={s.liaTag}>Lia</span> = inserido automaticamente pela Lia
      </div>

      {modalConsultores && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eee', padding: 20, width: 320 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Consultores da unidade</div>
            <ul style={{ listStyle: 'none', marginBottom: 16, padding: 0 }}>
              {consultores.map(c => (
                <li key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>
                  {c.nome}
                  <button style={{ fontSize: 11, color: '#A32D2D', cursor: 'pointer', border: 'none', background: 'none' }} onClick={() => removerConsultor(c.id)}>remover</button>
                </li>
              ))}
              {consultores.length === 0 && <li style={{ fontSize: 13, color: '#aaa' }}>Nenhum consultor ainda.</li>}
            </ul>
            <div style={{ display: 'flex', gap: 8 }}>
              <input style={{ flex: 1, fontSize: 13, padding: '6px 10px', border: '1px solid #ddd', borderRadius: 8, outline: 'none' }}
                placeholder="Nome do consultor..." value={novoConsultor}
                onChange={e => setNovoConsultor(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && adicionarConsultor()} />
              <button style={{ fontSize: 12, padding: '6px 14px', border: 'none', borderRadius: 8, background: '#185FA5', color: '#fff', cursor: 'pointer' }} onClick={adicionarConsultor}>Adicionar</button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button style={{ fontSize: 12, padding: '6px 14px', border: '1px solid #ddd', borderRadius: 8, background: '#fff', cursor: 'pointer' }} onClick={() => setModalConsultores(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── App Principal ────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null)
  const [franqueado, setFranqueado] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) carregarFranqueado(session.user.id)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) carregarFranqueado(session.user.id)
      else { setFranqueado(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function carregarFranqueado(userId) {
    const { data } = await supabase.from('franqueados').select('*').eq('user_id', userId).single()
    setFranqueado(data)
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#888' }}>
      Carregando...
    </div>
  )

  if (!session) return <LoginPage />
  if (!franqueado) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#888' }}>Usuário não encontrado.</div>
  if (franqueado.is_admin) return <PainelMaster onLogout={handleLogout} />
  return <CRMFranqueado franqueado={franqueado} onLogout={handleLogout} />
}
