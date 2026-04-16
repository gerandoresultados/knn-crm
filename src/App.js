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

function pct(a, b) { return b > 0 ? Math.round((a / b) * 100) : 0 }

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

function PainelMaster({ onLogout }) {
  const [franqueados, setFranqueados] = useState([])
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [novoNome, setNovoNome] = useState('')
  const [novaUnidade, setNovaUnidade] = useState('')
  const [novoEmail, setNovoEmail] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { carregarDados() }, [])

  async function carregarDados() {
    const { data: f } = await supabase.from('franqueados').select('*').eq('is_admin', false)
    const { data: l } = await supabase.from('leads').select('*')
    setFranqueados(f || [])
    setLeads(l || [])
    setLoading(false)
  }

  async function adicionarFranqueado(e) {
    e.preventDefault()
    setSalvando(true)
    setMsg('')
    const { data: signData, error: signError } = await supabase.auth.signUp({ email: novoEmail, password: novaSenha })
    if (signError) { setMsg('Erro: ' + signError.message); setSalvando(false); return }
    const userId = signData?.user?.id
    if (!userId) { setMsg('Erro ao criar usuário.'); setSalvando(false); return }
    const { error: dbError } = await supabase.from('franqueados').insert({
      nome: novoNome, unidade: novaUnidade, email: novoEmail, user_id: userId, is_admin: false
    })
    if (dbError) { setMsg('Erro ao salvar franqueado.'); setSalvando(false); return }
    setMsg('Franqueado criado com sucesso!')
    setNovoNome(''); setNovaUnidade(''); setNovoEmail(''); setNovaSenha('')
    setModalAberto(false)
    carregarDados()
    setSalvando(false)
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#888' }}>Carregando...</div>

  const s = {
    wrap: { fontFamily: "'Segoe UI', sans-serif", maxWidth: 1100, margin: '0 auto', padding: '24px 16px' },
    topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
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
    sectionLabel: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888', marginBottom: 12 },
  }

  return (
    <div style={s.wrap}>
      <div style={s.topbar}>
        <div>
          <div style={s.title}>Painel Master — KNN Idiomas</div>
          <div style={s.subtitle}>Visão geral de todas as unidades</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={s.btnPrimary} onClick={() => setModalAberto(true)}>+ Novo franqueado</button>
          <button style={s.btn} onClick={onLogout}>Sair</button>
        </div>
      </div>
      {msg && <div style={{ fontSize: 13, color: '#27500A', background: '#EAF3DE', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{msg}</div>}
      <div style={s.statsGrid}>
        <div style={s.stat}><div style={s.statLabel}>Total de franqueados</div><div style={s.statVal}>{franqueados.length}</div></div>
        <div style={s.stat}><div style={s.statLabel}>Total de leads</div><div style={{ ...s.statVal, color: '#185FA5' }}>{leads.length}</div></div>
        <div style={s.stat}><div style={s.statLabel}>Total de matrículas</div><div style={{ ...s.statVal, color: '#3B6D11' }}>{leads.filter(l => l.status === 'matriculou').length}</div></div>
      </div>
      <div style={s.sectionLabel}>Franqueados</div>
      <div style={{ border: '1px solid #eee', borderRadius: 12, overflow: 'hidden' }}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Unidade</th>
              <th style={s.th}>Responsável</th>
              <th style={s.th}>Email</th>
              <th style={s.th}>Leads</th>
              <th style={s.th}>Matrículas</th>
              <th style={s.th}>Conversão</th>
              <th style={s.th}>Receita</th>
            </tr>
          </thead>
          <tbody>
            {franqueados.map(f => {
              const fl = leads.filter(l => l.franqueado_id === f.id)
              const fm = fl.filter(l => l.status === 'matriculou')
              const fr = fl.reduce((s, l) => s + (parseFloat(l.mensalidade) || 0), 0)
              return (
                <tr key={f.id}>
                  <td style={{ ...s.td, fontWeight: 600 }}>{f.unidade}</td>
                  <td style={s.td}>{f.nome}</td>
                  <td style={{ ...s.td, color: '#888' }}>{f.email}</td>
                  <td style={s.td}>{fl.length}</td>
                  <td style={{ ...s.td, color: '#3B6D11', fontWeight: 600 }}>{fm.length}</td>
                  <td style={s.td}>{pct(fm.length, fl.length)}%</td>
                  <td style={{ ...s.td, color: '#3B6D11' }}>R$ {fr.toLocaleString('pt-BR')}</td>
                </tr>
              )
            })}
            {franqueados.length === 0 && (
              <tr><td colSpan={7} style={{ ...s.td, textAlign: 'center', color: '#aaa', padding: 32 }}>Nenhum franqueado ainda.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {modalAberto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', width: 360, border: '1px solid #eee' }}>
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
