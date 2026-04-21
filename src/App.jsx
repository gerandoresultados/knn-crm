import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

// ─── TOKENS ──────────────────────────────────────────────────────────────────
const C = {
  blue:'#185FA5', blueLight:'#EBF3FB', blueMid:'#D0E5F5',
  green:'#27500A', greenLight:'#EAF3DE',
  red:'#791F1F', redLight:'#FCEBEB',
  amber:'#633806', amberLight:'#FAEEDA',
  purple:'#3C3489', purpleLight:'#EEEDFE',
  gray900:'#111', gray700:'#374151', gray500:'#6B7280',
  gray300:'#D1D5DB', gray100:'#F3F4F6',
  bg:'#F7F7F5', surface:'#FFFFFF', border:'#E8E8E4',
  sidebar:'#0F1623',
}

const ACCENT = '#185FA5'

const STATUS_LEAD = [
  { val:'agendado',   label:'Agendado',       bg:C.blueLight,   color:C.blue },
  { val:'visitou',    label:'Visitou',         bg:C.purpleLight, color:C.purple },
  { val:'matriculou', label:'Matriculou',      bg:C.greenLight,  color:C.green },
  { val:'preco',      label:'Só preço',        bg:C.amberLight,  color:C.amber },
  { val:'sumiu',      label:'Sumiu',           bg:C.redLight,    color:C.red },
  { val:'futuro',     label:'Mais pra frente', bg:'#F1EFE8',     color:'#444441' },
  { val:'comercial',  label:'Comercial',       bg:'#FBEAF0',     color:'#72243E' },
]

const STATUS_FRANQUEADO = [
  { val:'ativo',       label:'Ativo',          bg:C.greenLight,  color:C.green },
  { val:'implantacao', label:'Em implantação', bg:C.blueLight,   color:C.blue },
  { val:'suspenso',    label:'Suspenso',       bg:C.amberLight,  color:C.amber },
  { val:'cancelado',   label:'Cancelado',      bg:C.redLight,    color:C.red },
]

const STATUS_ONBOARDING = ['Onboarding recebido','Em configuração','Ativo','Cancelado']

const TIPOS_AJUSTE = [
  { val:'Tom de voz',                     desc:'A Lia está muito formal, informal ou não combina', icon:'🎙️' },
  { val:'Informações desatualizadas',     desc:'Mudei horário, endereço, preço de matrícula',      icon:'📋' },
  { val:'Novo coordenador ou responsável',desc:'Trocou a pessoa que vai receber os leads',         icon:'👤' },
  { val:'Comportamento específico',       desc:'A Lia está respondendo errado em alguma situação', icon:'⚙️' },
  { val:'Nova informação',                desc:'Parceria, evento, promoção ou condição especial',  icon:'✨' },
  { val:'Feriado ou fechamento especial', desc:'A unidade vai fechar em uma data específica',      icon:'📅' },
  { val:'Outro',                          desc:'Alguma coisa que não está na lista acima',         icon:'💬' },
]

function pct(a, b) { return b > 0 ? Math.round((a / b) * 100) : 0 }

// ─── SHARED COMPONENTS ───────────────────────────────────────────────────────
function Badge({ label, bg, color }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', fontSize:11, fontWeight:600, padding:'3px 9px', borderRadius:99, background:bg, color, whiteSpace:'nowrap' }}>
      {label}
    </span>
  )
}
function BadgeLead({ status }) {
  const s = STATUS_LEAD.find(x => x.val === status) || STATUS_LEAD[0]
  return <Badge label={s.label} bg={s.bg} color={s.color} />
}
function BadgeFranq({ status }) {
  const s = STATUS_FRANQUEADO.find(x => x.val === status) || STATUS_FRANQUEADO[0]
  return <Badge label={s.label} bg={s.bg} color={s.color} />
}
function BadgeOnb({ status }) {
  const map = {
    'Onboarding recebido': { bg:C.purpleLight, color:C.purple },
    'Em configuração':     { bg:C.amberLight,  color:C.amber },
    'Ativo':               { bg:C.greenLight,  color:C.green },
    'Cancelado':           { bg:C.redLight,    color:C.red },
  }
  const s = map[status] || map['Ativo']
  return <Badge label={status} bg={s.bg} color={s.color} />
}
function StatCard({ label, value, sub, color, small }) {
  return (
    <div style={{ background:C.surface, borderRadius:12, border:`1px solid ${C.border}`, padding:'16px 18px' }}>
      <div style={{ fontSize:11, color:C.gray500, fontWeight:500, marginBottom:5 }}>{label}</div>
      <div style={{ fontSize:small?20:26, fontWeight:800, color:color||C.gray900, lineHeight:1, letterSpacing:'-0.02em' }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:C.gray500, marginTop:3 }}>{sub}</div>}
    </div>
  )
}
function MiniProgress({ value, color }) {
  return (
    <div style={{ height:5, borderRadius:99, background:C.gray100, marginTop:10 }}>
      <div style={{ height:'100%', borderRadius:99, background:color, width:Math.min(value,100)+'%' }} />
    </div>
  )
}
function IconCopy() { return <svg width="12" height="12" fill="none" viewBox="0 0 12 12"><rect x="4" y="4" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M3 8H2a1 1 0 01-1-1V2a1 1 0 011-1h5a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.2"/></svg> }
function IconGrid() { return <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor"/><rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor"/><rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor"/><rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor"/></svg> }
function IconLeads() { return <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M2.5 14c0-2.485 2.462-4.5 5.5-4.5s5.5 2.015 5.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> }
function IconOnb() { return <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path d="M13 2H3a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V3a1 1 0 00-1-1z" stroke="currentColor" strokeWidth="1.5"/><path d="M5 8h6M5 5.5h4M5 10.5h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> }
function IconLia() { return <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M6 9.5s.5 1.5 2 1.5 2-1.5 2-1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="6" cy="7" r="1" fill="currentColor"/><circle cx="10" cy="7" r="1" fill="currentColor"/></svg> }
function IconExit() { return <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path d="M6 3H3a1 1 0 00-1 1v8a1 1 0 001 1h3M10 5l3 3-3 3M13 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> }

// ─── RELATÓRIO ────────────────────────────────────────────────────────────────
function gerarTextoRelatorio(f, tipo, leads) {
  const fl = leads || []
  const total     = fl.length
  const agendados = fl.filter(l => l.status === 'agendado').length
  const visitas   = fl.filter(l => l.status === 'visitou' || l.status === 'matriculou').length
  const matr      = fl.filter(l => l.status === 'matriculou').length
  const convAV    = pct(visitas, agendados + visitas)
  const convVM    = pct(matr, visitas)

  if (tipo === 'dia7') {
    return `Olá, ${f.nome}! 👋\n\nAqui está o resumo da primeira semana da Lia na ${f.unidade}!\n\n📊 *Resultados — Dia 7*\n\n• Leads recebidos: *${total}*\n• Agendados pela Lia: *${agendados + visitas + matr}*\n• Visitas realizadas: *${visitas}*\n• Matrículas confirmadas: *${matr}*\n• Conversão agendado → visita: *${convAV}%*\n\nA Lia já está qualificando os leads e agendando visitas automaticamente.\n\nQualquer dúvida, pode me chamar! 🚀\nGabriel — Gerando Resultados`
  }
  if (tipo === 'dia14') {
    return `Olá, ${f.nome}! 🚀\n\nChegou a hora do balanço dos *14 dias de trial* da Lia na ${f.unidade}!\n\n📊 *Resultados — Dia 14*\n\n• Leads recebidos: *${total}*\n• Visitas agendadas pela Lia: *${visitas}*\n• Matrículas geradas: *${matr}*\n• Conversão agendado → visita: *${convAV}%*\n• Conversão visita → matrícula: *${convVM}%*\n\n${matr > 0 ? `✅ A Lia já gerou *${matr} matrícula${matr > 1 ? 's' : ''}* neste período.` : `👀 O funil está ativo — as visitas agendadas estão sendo convertidas.`}\n\nO investimento é de *R$ 397/mês*. Vamos fechar? 💪\n\nGabriel — Gerando Resultados\n(13) 99798-1443`
  }
  return `Olá, ${f.nome}! 📊\n\nAqui está o relatório mensal da Lia na *${f.unidade}*!\n\n🗓️ *Relatório — 30 dias*\n\n• Total de leads atendidos: *${total}*\n• Agendamentos realizados: *${agendados + visitas + matr}*\n• Visitas na unidade: *${visitas}*\n• Matrículas confirmadas: *${matr}*\n\n📈 *Métricas de conversão*\n• Leads → Visita: *${pct(visitas, total)}%*\n• Agendados → Visita: *${convAV}%*\n• Visita → Matrícula: *${convVM}%*\n\n${matr > 0 ? `💰 Resultado estimado: *${matr} matrícula${matr > 1 ? 's novas' : ' nova'}* geradas com apoio da Lia.` : ''}\n\nGabriel — Gerando Resultados`
}

function ModalRelatorio({ f, tipo, leads, onClose }) {
  const [texto, setTexto] = useState(() => gerarTextoRelatorio(f, tipo, leads))
  const [copiado, setCopiado] = useState(false)
  const tituloMap = { dia7:'Relatório — Dia 7', dia14:'Relatório — Dia 14 (fechamento)', mes30:'Relatório — 30 dias' }

  function copiar() {
    navigator.clipboard.writeText(texto).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 2000) })
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:C.surface, borderRadius:16, padding:28, width:'100%', maxWidth:640, maxHeight:'90vh', display:'flex', flexDirection:'column', boxShadow:'0 24px 64px rgba(0,0,0,0.25)' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700 }}>{tituloMap[tipo]}</div>
            <div style={{ fontSize:12, color:C.gray500, marginTop:2 }}>{f.unidade} · {f.nome}</div>
          </div>
          <button onClick={onClose} style={{ fontSize:12, padding:'6px 14px', border:`1px solid ${C.border}`, borderRadius:8, background:C.surface, cursor:'pointer', color:C.gray700 }}>Fechar</button>
        </div>
        <div style={{ fontSize:11, color:C.gray500, marginBottom:10 }}>Edite o texto abaixo antes de enviar, se necessário:</div>
        <textarea value={texto} onChange={e => setTexto(e.target.value)}
          style={{ flex:1, minHeight:360, padding:14, border:`1px solid ${C.border}`, borderRadius:10, fontSize:13, fontFamily:'monospace', resize:'vertical', outline:'none', lineHeight:1.7, color:C.gray700 }} />
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:14 }}>
          <button onClick={copiar}
            style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, padding:'9px 18px', border:`1px solid ${C.border}`, borderRadius:10, background:copiado ? C.greenLight : C.surface, cursor:'pointer', color:copiado ? C.green : C.gray700, fontWeight:500 }}>
            <IconCopy /> {copiado ? '✓ Copiado!' : 'Copiar texto'}
          </button>
          <a href={`https://wa.me/?text=${encodeURIComponent(texto)}`} target="_blank" rel="noreferrer"
            style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, padding:'9px 18px', border:'none', borderRadius:10, background:'#25D366', color:'#fff', cursor:'pointer', fontWeight:600, textDecoration:'none' }}>
            📲 Enviar via WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
function Sidebar({ view, setView, isAdmin, onLogout }) {
  const adminNav = [
    { id:'master',      label:'Visão geral',  icon:<IconGrid /> },
    { id:'onboarding',  label:'Onboardings',  icon:<IconOnb /> },
  ]
  const franqNav = [
    { id:'crm', label:'Leads & Funil',    icon:<IconLeads /> },
    { id:'lia', label:'Solicitar ajuste', icon:<IconLia /> },
  ]
  const nav = isAdmin ? adminNav : franqNav

  return (
    <div style={{ width:220, flexShrink:0, background:C.sidebar, display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ padding:'16px 16px 14px', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:ACCENT, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>✦</div>
          <div>
            <div style={{ color:'#fff', fontSize:13, fontWeight:700 }}>Lia CRM</div>
            <div style={{ color:'rgba(255,255,255,0.4)', fontSize:9, letterSpacing:'0.06em', textTransform:'uppercase' }}>{isAdmin ? 'Painel Master' : 'Franqueado'}</div>
          </div>
        </div>
      </div>
      <nav style={{ flex:1, padding:'10px 8px' }}>
        {nav.map(item => {
          const active = view === item.id
          return (
            <button key={item.id} onClick={() => setView(item.id)}
              style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'9px 12px', borderRadius:8, border:'none', cursor:'pointer', marginBottom:2, textAlign:'left', background:active ? 'rgba(255,255,255,0.1)' : 'transparent', color:active ? '#fff' : 'rgba(255,255,255,0.45)', fontSize:13, fontWeight:active ? 600 : 400 }}>
              <span style={{ opacity:active ? 1 : 0.6 }}>{item.icon}</span>
              <span style={{ flex:1 }}>{item.label}</span>
            </button>
          )
        })}
      </nav>
      <div style={{ padding:'10px 8px', borderTop:'1px solid rgba(255,255,255,0.07)' }}>
        <button onClick={onLogout}
          style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'9px 12px', borderRadius:8, border:'none', cursor:'pointer', background:'transparent', color:'rgba(255,255,255,0.4)', fontSize:13, textAlign:'left' }}>
          <IconExit /> Sair
        </button>
        <div style={{ marginTop:10, paddingTop:10, borderTop:'1px solid rgba(255,255,255,0.06)', fontSize:9, color:'rgba(255,255,255,0.25)', textTransform:'uppercase', letterSpacing:'0.06em' }}>
          powered by Gerando Resultados
        </div>
      </div>
    </div>
  )
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
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
    <div style={{ minHeight:'100vh', display:'flex', background:C.bg }}>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:40 }}>
        <div style={{ width:'100%', maxWidth:380 }}>
          <div style={{ marginBottom:36 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:28 }}>
              <div style={{ width:32, height:32, borderRadius:9, background:ACCENT, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>✦</div>
              <span style={{ fontSize:18, fontWeight:800 }}>Lia CRM</span>
            </div>
            <h1 style={{ fontSize:24, fontWeight:800, letterSpacing:'-0.02em', marginBottom:5 }}>Bem-vindo de volta</h1>
            <p style={{ fontSize:13, color:C.gray500 }}>Entre com suas credenciais para acessar</p>
          </div>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, fontWeight:500, color:C.gray700, display:'block', marginBottom:5 }}>Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com"
                style={{ width:'100%', padding:'10px 14px', border:`1px solid ${C.border}`, borderRadius:10, fontSize:14, outline:'none', background:C.surface, boxSizing:'border-box' }} />
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:12, fontWeight:500, color:C.gray700, display:'block', marginBottom:5 }}>Senha</label>
              <input type="password" required value={senha} onChange={e => setSenha(e.target.value)} placeholder="••••••••"
                style={{ width:'100%', padding:'10px 14px', border:`1px solid ${C.border}`, borderRadius:10, fontSize:14, outline:'none', background:C.surface, boxSizing:'border-box' }} />
            </div>
            {erro && <div style={{ fontSize:13, color:C.red, background:C.redLight, padding:'10px 14px', borderRadius:8, marginBottom:14 }}>{erro}</div>}
            <button type="submit" disabled={loading}
              style={{ width:'100%', padding:'12px', background:loading ? C.gray300 : ACCENT, color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:600, cursor:loading ? 'default' : 'pointer' }}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
      <div style={{ width:460, background:C.sidebar, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:48 }}>
        <div style={{ textAlign:'center', color:'rgba(255,255,255,0.9)', marginBottom:36 }}>
          <div style={{ fontSize:21, fontWeight:800, marginBottom:10, letterSpacing:'-0.02em', lineHeight:1.3 }}>Lia responde.<br />Você converte.</div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', lineHeight:1.7, maxWidth:260 }}>Automação de atendimento + CRM integrado para franquias KNN Idiomas.</div>
        </div>
        {[{l:'SDR 24/7',v:'sem férias'},{l:'Tempo médio de resposta',v:'< 8 seg'},{l:'Conversão média',v:'25%+'}].map(s => (
          <div key={s.l} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderRadius:10, background:'rgba(255,255,255,0.05)', marginBottom:8, width:'100%' }}>
            <span style={{ fontSize:13, color:'rgba(255,255,255,0.5)' }}>{s.l}</span>
            <span style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.9)' }}>{s.v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── ABA SOLICITAÇÕES ────────────────────────────────────────────────────────
function AbaSolicitacoes({ solicitacoes, setSolicitacoes }) {
  const urgMap = {
    alta:  { label:'Alta',  bg:C.redLight,   color:C.red },
    media: { label:'Média', bg:C.amberLight, color:C.amber },
    baixa: { label:'Baixa', bg:C.greenLight, color:C.green },
  }
  const pendentes = solicitacoes.filter(s => s.status === 'pendente').length

  async function marcarAplicado(id) {
    await supabase.from('solicitacoes').update({ status:'aplicado' }).eq('id', id)
    setSolicitacoes(prev => prev.map(s => s.id === id ? { ...s, status:'aplicado' } : s))
  }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div style={{ fontSize:13, color:C.gray500 }}>
          Pedidos dos franqueados — aplicados toda <strong>segunda e quinta-feira</strong>
        </div>
        {pendentes > 0 && (
          <span style={{ fontSize:12, padding:'4px 12px', borderRadius:99, background:C.amberLight, color:C.amber, fontWeight:700 }}>
            {pendentes} pendente{pendentes > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {solicitacoes.length === 0 && (
        <div style={{ textAlign:'center', padding:60, color:C.gray500, fontSize:13, background:C.surface, borderRadius:14, border:`1px solid ${C.border}` }}>
          Nenhuma solicitação ainda.
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {solicitacoes.map(s => {
          const urg = urgMap[s.urgencia] || urgMap.baixa
          const isPendente = s.status === 'pendente'
          return (
            <div key={s.id} style={{ background:C.surface, border:`1px solid ${isPendente && s.urgencia === 'alta' ? '#F5C2C2' : C.border}`, borderRadius:14, padding:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12, flexWrap:'wrap' }}>
                <span style={{ fontSize:14, fontWeight:700 }}>{s.unidade}</span>
                <span style={{ fontSize:12, color:C.gray500 }}>· {s.responsavel}</span>
                <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
                  <Badge label={urg.label} bg={urg.bg} color={urg.color} />
                  <Badge
                    label={isPendente ? 'Pendente' : 'Aplicado'}
                    bg={isPendente ? C.blueLight : C.greenLight}
                    color={isPendente ? C.blue : C.green}
                  />
                  <span style={{ fontSize:11, color:C.gray500 }}>
                    {new Date(s.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
              {s.tipos && s.tipos.length > 0 && (
                <div style={{ display:'flex', gap:6, marginBottom:12, flexWrap:'wrap' }}>
                  {s.tipos.map(t => (
                    <span key={t} style={{ fontSize:11, padding:'3px 10px', borderRadius:99, background:C.bg, color:C.gray700, border:`1px solid ${C.border}`, fontWeight:500 }}>{t}</span>
                  ))}
                </div>
              )}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {[['Como está hoje', s.como_hoje], ['Como quer que fique', s.como_quer], ['Exemplo', s.exemplo], ['Sugestão', s.sugestao]]
                  .filter(([, v]) => v)
                  .map(([l, v]) => (
                    <div key={l} style={{ background:C.bg, borderRadius:9, padding:'10px 12px' }}>
                      <div style={{ fontSize:10, color:C.gray500, fontWeight:600, marginBottom:3, textTransform:'uppercase', letterSpacing:'0.04em' }}>{l}</div>
                      <div style={{ fontSize:12, color:C.gray700, lineHeight:1.5 }}>{v}</div>
                    </div>
                  ))}
              </div>
              {isPendente && (
                <div style={{ display:'flex', justifyContent:'flex-end', marginTop:12 }}>
                  <button onClick={() => marcarAplicado(s.id)}
                    style={{ fontSize:12, padding:'7px 16px', border:'none', borderRadius:9, background:ACCENT, color:'#fff', cursor:'pointer', fontWeight:600 }}>
                    ✓ Marcar como aplicado
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── PAINEL MASTER ────────────────────────────────────────────────────────────
function PainelMaster({ onLogout }) {
  const [franqueados, setFranqueados] = useState([])
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [tabF, setTabF] = useState('todos')
  const [tabPrincipal, setTabPrincipal] = useState('franqueados')
  const [solicitacoes, setSolicitacoes] = useState([])
  const [modalAberto, setModalAberto] = useState(false)
  const [editandoFranq, setEditandoFranq] = useState(null)
  const [relatorio, setRelatorio] = useState(null)
  const [msg, setMsg] = useState('')
  const [msgTipo, setMsgTipo] = useState('ok')
  // Form novo franqueado
  const [novoNome, setNovoNome] = useState('')
  const [novaUnidade, setNovaUnidade] = useState('')
  const [novoEmail, setNovoEmail] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [novoStatus, setNovoStatus] = useState('implantacao')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => { carregarDados() }, [])

  async function carregarDados() {
    const { data: f } = await supabase.from('franqueados').select('*').eq('is_admin', false)
    const { data: l } = await supabase.from('leads').select('*')
    const { data: s } = await supabase.from('solicitacoes').select('*').order('created_at', { ascending: false })
    setFranqueados(f || [])
    setLeads(l || [])
    setSolicitacoes(s || [])
    setLoading(false)
  }

  // ✅ SEGURO: usa API route com service_role, não desloga o admin
  async function adicionarFranqueado(e) {
    e.preventDefault()
    setSalvando(true)
    setMsg('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/criar-franqueado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ nome: novoNome, unidade: novaUnidade, email: novoEmail, senha: novaSenha, status: novoStatus })
      })
      const result = await response.json()
      if (!response.ok) { setMsg('Erro: ' + (result.error || 'Falha')); setMsgTipo('erro') }
      else { setMsg('Franqueado criado!'); setMsgTipo('ok'); setModalAberto(false); setNovoNome(''); setNovaUnidade(''); setNovoEmail(''); setNovaSenha(''); carregarDados() }
    } catch (err) { setMsg('Erro: ' + err.message); setMsgTipo('erro') }
    setSalvando(false)
  }

  async function salvarEdicaoFranqueado() {
    await supabase.from('franqueados').update(editandoFranq).eq('id', editandoFranq.id)
    setFranqueados(prev => prev.map(f => f.id === editandoFranq.id ? editandoFranq : f))
    setEditandoFranq(null)
  }

  if (loading) return <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:C.gray500 }}>Carregando...</div>

  const ativos   = franqueados.filter(f => f.status === 'ativo')
  const trial    = franqueados.filter(f => f.status === 'implantacao')
  const inativos = franqueados.filter(f => f.status === 'suspenso' || f.status === 'cancelado')
  const lAll     = leads
  const mat      = (lst) => lst.filter(l => l.status === 'matriculou').length
  const listaTabela = tabF === 'todos' ? franqueados : tabF === 'ativos' ? ativos : tabF === 'trial' ? trial : inativos
  const inp = { width:'100%', padding:'9px 12px', border:`1px solid ${C.border}`, borderRadius:9, fontSize:13, outline:'none', background:C.surface, boxSizing:'border-box' }

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'26px 30px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.02em', marginBottom:2 }}>Painel Master</h1>
          <p style={{ fontSize:12, color:C.gray500 }}>Visão geral de todas as unidades KNN</p>
        </div>
        <button onClick={() => setModalAberto(true)}
          style={{ fontSize:13, padding:'9px 18px', border:'none', borderRadius:10, background:ACCENT, color:'#fff', cursor:'pointer', fontWeight:600 }}>
          + Novo franqueado
        </button>
      </div>

      {msg && <div style={{ fontSize:13, color:msgTipo === 'ok' ? C.green : C.red, background:msgTipo === 'ok' ? C.greenLight : C.redLight, padding:'10px 14px', borderRadius:8, marginBottom:16 }}>{msg}</div>}

      {/* Tabs principais */}
      <div style={{ display:'flex', gap:4, marginBottom:24, borderBottom:`1px solid ${C.border}` }}>
        {[
          { val:'franqueados', label:'Franqueados' },
          { val:'solicitacoes', label:`Solicitações${solicitacoes.filter(s=>s.status==='pendente').length > 0 ? ` (${solicitacoes.filter(s=>s.status==='pendente').length})` : ''}` },
        ].map(tab => (
          <button key={tab.val} onClick={() => setTabPrincipal(tab.val)}
            style={{ fontSize:13, padding:'8px 16px', border:'none', background:'transparent',
              color: tabPrincipal === tab.val ? ACCENT : C.gray500,
              cursor:'pointer', fontWeight: tabPrincipal === tab.val ? 600 : 400,
              borderBottom: tabPrincipal === tab.val ? `2px solid ${ACCENT}` : '2px solid transparent',
              marginBottom:-1 }}>
            {tab.label}
          </button>
        ))}
      </div>

      {tabPrincipal === 'solicitacoes' && <AbaSolicitacoes solicitacoes={solicitacoes} setSolicitacoes={setSolicitacoes} />}

      {tabPrincipal === 'franqueados' && <>
      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
        <StatCard label="Franqueados ativos" value={ativos.length} color={C.green} />
        <StatCard label="Em trial" value={trial.length} color={ACCENT} />
        <StatCard label="Total de leads" value={lAll.length} color={ACCENT} />
        <StatCard label="Total de matrículas" value={mat(lAll)} color={C.green} />
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:12 }}>
        {[{v:'todos',l:`Todos (${franqueados.length})`},{v:'ativos',l:`Ativos (${ativos.length})`},{v:'trial',l:`Trial (${trial.length})`},{v:'inativos',l:`Inativos (${inativos.length})`}].map(t => (
          <button key={t.v} onClick={() => setTabF(t.v)}
            style={{ fontSize:12, padding:'6px 14px', borderRadius:8, border:tabF === t.v ? 'none' : `1px solid ${C.border}`, background:tabF === t.v ? ACCENT : C.surface, color:tabF === t.v ? '#fff' : C.gray500, cursor:'pointer', fontWeight:tabF === t.v ? 600 : 400 }}>
            {t.l}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13, minWidth:1100 }}>
            <thead>
              <tr style={{ background:'#FAFAF8' }}>
                {['Unidade','Responsável','Email','Status','Leads','Matrículas','Conv.','Ações','ID (Lia)'].map(h => (
                  <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontSize:10, fontWeight:600, color:C.gray500, textTransform:'uppercase', letterSpacing:'0.04em', borderBottom:`1px solid ${C.border}`, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {listaTabela.map(f => {
                const fl  = leads.filter(l => l.franqueado_id === f.id)
                const fv  = fl.filter(l => l.status === 'visitou' || l.status === 'matriculou').length
                const fm  = fl.filter(l => l.status === 'matriculou').length
                const ag  = fl.filter(l => l.status === 'agendado').length
                const isTrial = f.status === 'implantacao'
                const isAtivo = f.status === 'ativo'
                return (
                  <tr key={f.id} style={{ borderBottom:`1px solid ${C.border}` }}>
                    <td style={{ padding:'10px 12px', fontWeight:600, fontSize:13 }}>{f.unidade}</td>
                    <td style={{ padding:'10px 12px', fontSize:12 }}>{f.nome}</td>
                    <td style={{ padding:'10px 12px', fontSize:11, color:C.gray500 }}>{f.email}</td>
                    <td style={{ padding:'10px 12px' }}><BadgeFranq status={f.status} /></td>
                    <td style={{ padding:'10px 12px', fontSize:13 }}>{fl.length}</td>
                    <td style={{ padding:'10px 12px', fontWeight:600, color:C.green, fontSize:13 }}>{fm}</td>
                    <td style={{ padding:'10px 12px', fontSize:12 }}>{pct(fv, ag + fv)}%</td>
                    <td style={{ padding:'10px 12px' }}>
                      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                        <button onClick={() => setEditandoFranq({ ...f })} style={{ fontSize:11, padding:'4px 8px', border:`1px solid ${C.border}`, borderRadius:6, background:C.surface, cursor:'pointer', color:C.gray700 }}>Editar</button>
                        {isAtivo && <button onClick={() => setRelatorio({ f, tipo:'mes30', leads: fl })} style={{ fontSize:11, padding:'4px 8px', border:'none', borderRadius:6, background:C.greenLight, color:C.green, cursor:'pointer', fontWeight:600 }}>📊 30d</button>}
                        {isTrial && <>
                          <button onClick={() => setRelatorio({ f, tipo:'dia7', leads: fl })} style={{ fontSize:11, padding:'4px 8px', border:'none', borderRadius:6, background:C.blueLight, color:C.blue, cursor:'pointer', fontWeight:600 }}>📅 D7</button>
                          <button onClick={() => setRelatorio({ f, tipo:'dia14', leads: fl })} style={{ fontSize:11, padding:'4px 8px', border:'none', borderRadius:6, background:'#FDE8D8', color:'#7A3010', cursor:'pointer', fontWeight:600 }}>🚀 D14</button>
                        </>}
                      </div>
                    </td>
                    <td style={{ padding:'10px 12px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                        <span style={{ fontSize:10, color:C.gray500, fontFamily:'monospace' }}>{f.id.substring(0, 8)}…</span>
                        <button onClick={() => { navigator.clipboard.writeText(f.id); alert('ID copiado!') }} style={{ fontSize:10, padding:'2px 7px', border:`1px solid ${C.border}`, borderRadius:4, background:C.bg, cursor:'pointer' }}>copiar</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {listaTabela.length === 0 && <tr><td colSpan={9} style={{ padding:40, textAlign:'center', color:C.gray500, fontSize:13 }}>Nenhum franqueado nesta lista.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal novo franqueado */}
      {modalAberto && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:C.surface, borderRadius:16, padding:28, width:'100%', maxWidth:400, boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize:16, fontWeight:700, marginBottom:18 }}>Novo franqueado</div>
            <form onSubmit={adicionarFranqueado}>
              {[{l:'Nome do responsável',v:novoNome,s:setNovoNome,t:'text',ph:'Ex: João Silva'},{l:'Unidade',v:novaUnidade,s:setNovaUnidade,t:'text',ph:'Ex: KNN Moema'},{l:'Email de acesso',v:novoEmail,s:setNovoEmail,t:'email',ph:'franqueado@email.com'},{l:'Senha inicial',v:novaSenha,s:setNovaSenha,t:'password',ph:'Mínimo 6 caracteres'}].map(f => (
                <div key={f.l} style={{ marginBottom:12 }}>
                  <label style={{ fontSize:11, color:C.gray500, display:'block', marginBottom:4, fontWeight:500 }}>{f.l}</label>
                  <input type={f.t} required value={f.v} onChange={e => f.s(e.target.value)} placeholder={f.ph} style={inp} />
                </div>
              ))}
              <div style={{ marginBottom:16 }}>
                <label style={{ fontSize:11, color:C.gray500, display:'block', marginBottom:4, fontWeight:500 }}>Status inicial</label>
                <select value={novoStatus} onChange={e => setNovoStatus(e.target.value)} style={inp}>
                  {STATUS_FRANQUEADO.map(st => <option key={st.val} value={st.val}>{st.label}</option>)}
                </select>
              </div>
              <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                <button type="button" onClick={() => setModalAberto(false)} style={{ fontSize:13, padding:'8px 16px', border:`1px solid ${C.border}`, borderRadius:9, background:C.surface, cursor:'pointer', color:C.gray700 }}>Cancelar</button>
                <button type="submit" disabled={salvando} style={{ fontSize:13, padding:'8px 16px', border:'none', borderRadius:9, background:ACCENT, color:'#fff', cursor:'pointer', fontWeight:600 }}>{salvando ? 'Salvando…' : 'Criar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal editar franqueado */}
      {editandoFranq && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:C.surface, borderRadius:16, padding:28, width:'100%', maxWidth:560, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize:16, fontWeight:700, marginBottom:18 }}>Editar — {editandoFranq.unidade}</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {[['Unidade','unidade'],['Responsável','nome'],['Email','email']].map(([label, key]) => (
                <div key={key}>
                  <label style={{ fontSize:11, color:C.gray500, display:'block', marginBottom:4, fontWeight:500 }}>{label}</label>
                  <input style={inp} value={editandoFranq[key] || ''} onChange={e => setEditandoFranq({ ...editandoFranq, [key]: e.target.value })} />
                </div>
              ))}
              <div>
                <label style={{ fontSize:11, color:C.gray500, display:'block', marginBottom:4, fontWeight:500 }}>Status</label>
                <select style={inp} value={editandoFranq.status} onChange={e => setEditandoFranq({ ...editandoFranq, status: e.target.value })}>
                  {STATUS_FRANQUEADO.map(s => <option key={s.val} value={s.val}>{s.label}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:18 }}>
              <button onClick={() => setEditandoFranq(null)} style={{ fontSize:13, padding:'8px 16px', border:`1px solid ${C.border}`, borderRadius:9, background:C.surface, cursor:'pointer', color:C.gray700 }}>Cancelar</button>
              <button onClick={salvarEdicaoFranqueado} style={{ fontSize:13, padding:'8px 16px', border:'none', borderRadius:9, background:ACCENT, color:'#fff', cursor:'pointer', fontWeight:600 }}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      {relatorio && <ModalRelatorio f={relatorio.f} tipo={relatorio.tipo} leads={relatorio.leads} onClose={() => setRelatorio(null)} />}
      </>}
    </div>
  )
}

// ─── ABA ONBOARDING ───────────────────────────────────────────────────────────
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

  // ✅ SEGURO: chama API route, não expõe a key da Anthropic
  async function gerarPrompt(ob) {
    setPromptModal(ob); setPromptTexto(''); setGerandoPrompt(true)
    try {
      const response = await fetch('/api/gerar-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ob })
      })
      const data = await response.json()
      setPromptTexto(data.prompt || 'Erro ao gerar.')
    } catch (err) { setPromptTexto('Erro de conexão.') }
    setGerandoPrompt(false)
  }

  const inp = { width:'100%', padding:'8px 10px', border:`1px solid ${C.border}`, borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box', background:C.surface }

  if (loading) return <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:C.gray500 }}>Carregando...</div>

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'26px 30px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.02em', marginBottom:2 }}>Onboardings</h1>
          <p style={{ fontSize:12, color:C.gray500 }}>Unidades KNN configuradas e em configuração</p>
        </div>
        <span style={{ fontSize:12, padding:'5px 12px', borderRadius:99, background:C.blueLight, color:C.blue, fontWeight:600 }}>{onboardings.length} unidades</span>
      </div>
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13, minWidth:900 }}>
            <thead>
              <tr style={{ background:'#FAFAF8' }}>
                {['Unidade','Cidade','Responsável','WhatsApp Lia','Tom','Volume','Status','Ações'].map(h => (
                  <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:10, fontWeight:600, color:C.gray500, textTransform:'uppercase', letterSpacing:'0.04em', borderBottom:`1px solid ${C.border}`, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {onboardings.map(ob => (
                <tr key={ob.id} style={{ borderBottom:`1px solid ${C.border}` }}>
                  <td style={{ padding:'12px 14px', fontWeight:600 }}>{ob.nome}</td>
                  <td style={{ padding:'12px 14px', color:C.gray500, fontSize:12 }}>{ob.cidade}</td>
                  <td style={{ padding:'12px 14px', fontSize:12 }}>{ob.responsavel}</td>
                  <td style={{ padding:'12px 14px', fontSize:11, color:C.gray500, fontFamily:'monospace' }}>{ob.wa_lia || '—'}</td>
                  <td style={{ padding:'12px 14px', fontSize:12 }}>{ob.tom || '—'}</td>
                  <td style={{ padding:'12px 14px', fontSize:12 }}>{ob.volume || '—'}</td>
                  <td style={{ padding:'12px 14px' }}><BadgeOnb status={ob.status} /></td>
                  <td style={{ padding:'12px 14px' }}>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={() => setEditando({ ...ob })} style={{ fontSize:11, padding:'4px 10px', border:`1px solid ${C.border}`, borderRadius:7, background:C.surface, cursor:'pointer', color:C.gray700 }}>Editar</button>
                      <button onClick={() => gerarPrompt(ob)} style={{ fontSize:11, padding:'4px 10px', border:'none', borderRadius:7, background:ACCENT, color:'#fff', cursor:'pointer', fontWeight:600 }}>Prompt IA</button>
                    </div>
                  </td>
                </tr>
              ))}
              {onboardings.length === 0 && <tr><td colSpan={8} style={{ padding:40, textAlign:'center', color:C.gray500 }}>Nenhum onboarding ainda.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal editar onboarding */}
      {editando && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:C.surface, borderRadius:16, padding:28, width:'100%', maxWidth:620, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize:16, fontWeight:700, marginBottom:18 }}>Editar onboarding — {editando.nome}</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {[['Nome da unidade','nome'],['Cidade','cidade'],['Responsável','responsavel'],['Coordenador','coordenador'],['WA Responsável','wa_dono'],['WA da Lia','wa_lia'],['Endereço','endereco'],['Instagram','instagram'],['Horário Seg-Sex','horario_semana'],['Horário Sábado','horario_sabado'],['Tom de voz','tom'],['Volume de leads','volume']].map(([label, key]) => (
                <div key={key}>
                  <label style={{ fontSize:11, color:C.gray500, display:'block', marginBottom:4, fontWeight:500 }}>{label}</label>
                  <input style={inp} value={editando[key] || ''} onChange={e => setEditando({ ...editando, [key]: e.target.value })} />
                </div>
              ))}
              <div style={{ gridColumn:'1/-1' }}>
                <label style={{ fontSize:11, color:C.gray500, display:'block', marginBottom:4, fontWeight:500 }}>Status</label>
                <select style={inp} value={editando.status} onChange={e => setEditando({ ...editando, status: e.target.value })}>
                  {STATUS_ONBOARDING.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={{ fontSize:11, color:C.gray500, display:'block', marginBottom:4, fontWeight:500 }}>Observações</label>
                <textarea style={{ ...inp, resize:'vertical', minHeight:80 }} value={editando.obs || ''} onChange={e => setEditando({ ...editando, obs: e.target.value })} />
              </div>
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:18 }}>
              <button onClick={() => setEditando(null)} style={{ fontSize:13, padding:'8px 16px', border:`1px solid ${C.border}`, borderRadius:9, background:C.surface, cursor:'pointer', color:C.gray700 }}>Cancelar</button>
              <button onClick={salvarEdicao} style={{ fontSize:13, padding:'8px 16px', border:'none', borderRadius:9, background:ACCENT, color:'#fff', cursor:'pointer', fontWeight:600 }}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal prompt IA */}
      {promptModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:C.surface, borderRadius:16, padding:28, width:'100%', maxWidth:740, maxHeight:'90vh', display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div>
                <div style={{ fontSize:16, fontWeight:700 }}>Prompt da Lia</div>
                <div style={{ fontSize:12, color:C.gray500, marginTop:2 }}>{promptModal.nome}</div>
              </div>
              <button onClick={() => setPromptModal(null)} style={{ fontSize:12, padding:'6px 14px', border:`1px solid ${C.border}`, borderRadius:8, background:C.surface, cursor:'pointer', color:C.gray700 }}>Fechar</button>
            </div>
            {gerandoPrompt ? (
              <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, color:C.gray500, minHeight:200 }}>
                <div style={{ fontSize:28 }}>🤖</div>
                <div style={{ fontSize:14 }}>Gerando prompt com IA...</div>
              </div>
            ) : (
              <>
                <textarea value={promptTexto} onChange={e => setPromptTexto(e.target.value)}
                  style={{ flex:1, minHeight:360, padding:14, border:`1px solid ${C.border}`, borderRadius:10, fontSize:12.5, fontFamily:'monospace', resize:'vertical', outline:'none', color:C.gray700, lineHeight:1.7 }} />
                <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:12 }}>
                  <button onClick={() => navigator.clipboard.writeText(promptTexto).then(() => alert('Prompt copiado!'))}
                    style={{ display:'flex', alignItems:'center', gap:5, fontSize:13, padding:'8px 14px', border:`1px solid ${C.border}`, borderRadius:9, background:C.surface, cursor:'pointer', color:C.gray700 }}>
                    <IconCopy /> Copiar
                  </button>
                  <button onClick={() => gerarPrompt(promptModal)} style={{ fontSize:13, padding:'8px 14px', border:'none', borderRadius:9, background:ACCENT, color:'#fff', cursor:'pointer', fontWeight:600 }}>Regerar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── MODAL ALTERAR SENHA ─────────────────────────────────────────────────────
function ModalSenha({ onClose }) {
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [salvando, setSalvando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    if (novaSenha.length < 6) { setErro('A senha deve ter no mínimo 6 caracteres.'); return }
    if (novaSenha !== confirmar) { setErro('As senhas não coincidem.'); return }
    setSalvando(true)
    // Valida senha atual
    const { data: { user } } = await supabase.auth.getUser()
    const { error: loginError } = await supabase.auth.signInWithPassword({ email: user.email, password: senhaAtual })
    if (loginError) { setErro('Senha atual incorreta.'); setSalvando(false); return }
    // Atualiza senha
    const { error } = await supabase.auth.updateUser({ password: novaSenha })
    if (error) setErro('Erro: ' + error.message)
    else setSucesso(true)
    setSalvando(false)
  }

  const inp = { width:'100%', padding:'10px 14px', border:`1px solid ${C.border}`, borderRadius:10, fontSize:13, outline:'none', background:C.surface, boxSizing:'border-box' }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:C.surface, borderRadius:16, padding:28, width:'100%', maxWidth:400, boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
        {sucesso ? (
          <>
            <div style={{ textAlign:'center', padding:'20px 0' }}>
              <div style={{ width:54, height:54, borderRadius:'50%', background:C.greenLight, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, margin:'0 auto 14px' }}>✅</div>
              <div style={{ fontSize:16, fontWeight:700, marginBottom:6 }}>Senha alterada!</div>
              <div style={{ fontSize:13, color:C.gray500 }}>Use a nova senha no próximo login.</div>
            </div>
            <button onClick={onClose} style={{ width:'100%', padding:'10px', background:ACCENT, color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer' }}>Fechar</button>
          </>
        ) : (
          <>
            <div style={{ fontSize:16, fontWeight:700, marginBottom:18 }}>Alterar senha</div>
            <form onSubmit={handleSubmit}>
              {[
                { l:'Senha atual', v:senhaAtual, s:setSenhaAtual },
                { l:'Nova senha', v:novaSenha, s:setNovaSenha },
                { l:'Confirmar nova senha', v:confirmar, s:setConfirmar },
              ].map(f => (
                <div key={f.l} style={{ marginBottom:12 }}>
                  <label style={{ fontSize:11, color:C.gray500, display:'block', marginBottom:4, fontWeight:500 }}>{f.l}</label>
                  <input type="password" required value={f.v} onChange={e => f.s(e.target.value)} style={inp} />
                </div>
              ))}
              {erro && <div style={{ fontSize:12, color:C.red, background:C.redLight, padding:'8px 12px', borderRadius:8, marginBottom:12 }}>{erro}</div>}
              <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                <button type="button" onClick={onClose} style={{ fontSize:13, padding:'8px 16px', border:`1px solid ${C.border}`, borderRadius:9, background:C.surface, cursor:'pointer', color:C.gray700 }}>Cancelar</button>
                <button type="submit" disabled={salvando} style={{ fontSize:13, padding:'8px 16px', border:'none', borderRadius:9, background:ACCENT, color:'#fff', cursor:'pointer', fontWeight:600 }}>{salvando ? 'Salvando...' : 'Alterar'}</button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

// ─── CRM FRANQUEADO ───────────────────────────────────────────────────────────
function CRMFranqueado({ franqueado }) {
  const [leads, setLeads] = useState([])
  const [consultores, setConsultores] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalConsultores, setModalConsultores] = useState(false)
  const [modalSenha, setModalSenha] = useState(false)
  const [novoConsultor, setNovoConsultor] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [busca, setBusca] = useState('')

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

  if (loading) return <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:C.gray500 }}>Carregando...</div>

  const total    = leads.length
  const agendados = leads.filter(l => l.status === 'agendado').length
  const visitas  = leads.filter(l => l.status === 'visitou' || l.status === 'matriculou').length
  const matr     = leads.filter(l => l.status === 'matriculou').length
  const frio     = leads.filter(l => l.status === 'preco' || l.status === 'sumiu').length
  const comercial = leads.filter(l => l.status === 'comercial').length
  const receita  = leads.reduce((s, l) => s + (parseFloat(l.mensalidade) || 0), 0)
  const comMens  = leads.filter(l => parseFloat(l.mensalidade) > 0).length
  const ticket   = comMens > 0 ? Math.round(receita / comMens) : 0

  const filtrados = leads.filter(l => {
    const ms = filtroStatus === 'todos' || l.status === filtroStatus
    const mb = !busca || l.nome.toLowerCase().includes(busca.toLowerCase()) || (l.responsavel || '').toLowerCase().includes(busca.toLowerCase())
    return ms && mb
  })

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'26px 30px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.02em', marginBottom:2 }}>Leads & Funil</h1>
          <p style={{ fontSize:12, color:C.gray500 }}>Unidade: {franqueado.unidade} · {new Date().toLocaleDateString('pt-BR', { month:'long', year:'numeric' })}</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => setModalSenha(true)} style={{ fontSize:13, padding:'8px 14px', border:`1px solid ${C.border}`, borderRadius:10, background:C.surface, cursor:'pointer', color:C.gray700, fontWeight:500 }}>
            Alterar senha
          </button>
          <button onClick={() => setModalConsultores(true)} style={{ fontSize:13, padding:'8px 14px', border:`1px solid ${C.border}`, borderRadius:10, background:C.surface, cursor:'pointer', color:C.gray700, fontWeight:500 }}>
            Gerenciar consultores
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:12 }}>
        <StatCard label="Total de leads" value={total} />
        <StatCard label="Agendados" value={agendados} color={ACCENT} />
        <StatCard label="Visitas realizadas" value={visitas} color={C.purple} sub="principal métrica da Lia" />
        <StatCard label="Matrículas" value={matr} color={C.green} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
        <StatCard label="Só preço / Sumiu" value={frio} color={C.amber} />
        <StatCard label="Comercial ativo" value={comercial} color={C.purple} />
        <StatCard label="Receita estimada" value={`R$ ${receita.toLocaleString('pt-BR')}`} color={C.green} small />
        <StatCard label="Ticket médio" value={comMens > 0 ? `R$ ${ticket.toLocaleString('pt-BR')}` : '—'} small />
      </div>

      {/* Funil */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:11, fontWeight:600, color:C.gray500, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:10 }}>Funil de conversão</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
          {[
            { l:'Leads → Agendados', p:pct(agendados, total), sub:`${agendados} de ${total} leads`, color:ACCENT },
            { l:'Agendados → Visita ✦ métrica Lia', p:pct(visitas, agendados + visitas), sub:`${visitas} de ${agendados + visitas}`, color:C.purple, destaque:true },
            { l:'Visita → Matrícula', p:pct(matr, visitas), sub:`${matr} de ${visitas} visitas`, color:C.green },
          ].map(c => (
            <div key={c.l} style={{ background:C.surface, border:`${c.destaque ? '2px' : '1px'} solid ${c.destaque ? C.purple : C.border}`, borderRadius:12, padding:'14px 16px' }}>
              <div style={{ fontSize:11, color:C.gray500, marginBottom:6 }}>{c.l}</div>
              <div style={{ fontSize:24, fontWeight:800, color:c.color, letterSpacing:'-0.02em' }}>{c.p}%</div>
              <div style={{ fontSize:10, color:C.gray500, marginTop:3 }}>{c.sub}</div>
              <MiniProgress value={c.p} color={c.color} />
            </div>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:12, flexWrap:'wrap' }}>
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar lead..."
          style={{ padding:'7px 12px', border:`1px solid ${C.border}`, borderRadius:9, fontSize:13, outline:'none', background:C.surface, width:180 }} />
        <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
          {[{ v:'todos', l:'Todos' }, ...STATUS_LEAD.map(s => ({ v:s.val, l:s.label }))].map(f => (
            <button key={f.v} onClick={() => setFiltroStatus(f.v)}
              style={{ fontSize:11, padding:'5px 10px', borderRadius:7, border:filtroStatus === f.v ? 'none' : `1px solid ${C.border}`, background:filtroStatus === f.v ? ACCENT : C.surface, color:filtroStatus === f.v ? '#fff' : C.gray500, cursor:'pointer', whiteSpace:'nowrap' }}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela leads */}
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13, minWidth:960 }}>
            <thead>
              <tr style={{ background:'#FAFAF8' }}>
                {['#','Cliente','Idade','Responsável','Telefone','Status','Consultor','Contraproposta','Mensalidade'].map(h => (
                  <th key={h} style={{ padding:'9px 12px', textAlign:'left', fontSize:10, fontWeight:600, color:C.gray500, textTransform:'uppercase', letterSpacing:'0.04em', borderBottom:`1px solid ${C.border}`, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((lead, i) => {
                const st = STATUS_LEAD.find(x => x.val === lead.status) || STATUS_LEAD[0]
                return (
                  <tr key={lead.id} style={{ borderBottom:`1px solid ${C.border}` }}>
                    <td style={{ padding:'8px 12px', color:C.gray500, fontSize:11 }}>{i + 1}</td>
                    <td style={{ padding:'8px 12px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <span style={{ fontWeight:500 }}>{lead.nome}</span>
                        {lead.inserido_pela_lia && <span style={{ fontSize:10, background:'#E1F5EE', color:'#085041', borderRadius:4, padding:'1px 5px', fontWeight:600 }}>Lia</span>}
                      </div>
                    </td>
                    <td style={{ padding:'8px 12px' }}>
                      <input type="number" defaultValue={lead.idade} onBlur={e => atualizarLead(lead.id, 'idade', e.target.value)}
                        style={{ width:40, padding:'3px 6px', border:`1px solid ${C.border}`, borderRadius:5, fontSize:11, outline:'none', background:C.bg, textAlign:'center' }} />
                    </td>
                    <td style={{ padding:'8px 12px' }}>
                      <input defaultValue={lead.responsavel} placeholder="—" onBlur={e => atualizarLead(lead.id, 'responsavel', e.target.value)}
                        style={{ border:'none', background:'transparent', fontSize:12, color:C.gray700, outline:'none', width:110 }} />
                    </td>
                    <td style={{ padding:'8px 12px' }}>
                      <input defaultValue={lead.telefone} placeholder="—" onBlur={e => atualizarLead(lead.id, 'telefone', e.target.value)}
                        style={{ border:'none', background:'transparent', fontSize:12, color:C.gray700, outline:'none', width:125 }} />
                    </td>
                    <td style={{ padding:'8px 12px' }}>
                      <select value={lead.status} onChange={e => atualizarLead(lead.id, 'status', e.target.value)}
                        style={{ fontSize:11, fontWeight:600, padding:'3px 8px', borderRadius:99, border:'none', cursor:'pointer', background:st.bg, color:st.color, outline:'none' }}>
                        {STATUS_LEAD.map(x => <option key={x.val} value={x.val}>{x.label}</option>)}
                      </select>
                    </td>
                    <td style={{ padding:'8px 12px' }}>
                      <select value={lead.consultor || ''} onChange={e => atualizarLead(lead.id, 'consultor', e.target.value)}
                        style={{ fontSize:12, border:'none', background:'transparent', color:C.gray700, outline:'none', cursor:'pointer' }}>
                        <option value="">—</option>
                        {consultores.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                      </select>
                    </td>
                    <td style={{ padding:'8px 12px' }}>
                      <textarea defaultValue={lead.contraproposta} placeholder="—" rows={1} onBlur={e => atualizarLead(lead.id, 'contraproposta', e.target.value)}
                        style={{ border:'none', background:'transparent', fontSize:11, color:C.gray500, outline:'none', resize:'none', width:150, lineHeight:1.4 }} />
                    </td>
                    <td style={{ padding:'8px 12px' }}>
                      <input defaultValue={lead.mensalidade || ''} placeholder="—" onBlur={e => atualizarLead(lead.id, 'mensalidade', e.target.value)}
                        style={{ width:72, padding:'3px 6px', border:`1px solid ${C.border}`, borderRadius:5, fontSize:12, outline:'none', background:C.bg }} />
                    </td>
                  </tr>
                )
              })}
              {filtrados.length === 0 && <tr><td colSpan={9} style={{ padding:40, textAlign:'center', color:C.gray500, fontSize:13 }}>Nenhum lead encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ fontSize:11, color:C.gray500, marginTop:7, display:'flex', alignItems:'center', gap:4 }}>
        <span style={{ fontSize:10, background:'#E1F5EE', color:'#085041', borderRadius:4, padding:'1px 5px', fontWeight:600 }}>Lia</span>
        = inserido automaticamente pela Lia
      </div>

      {/* Modal consultores */}
      {modalSenha && <ModalSenha onClose={() => setModalSenha(false)} />}

      {modalConsultores && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:C.surface, borderRadius:16, padding:24, width:340, boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize:15, fontWeight:700, marginBottom:14 }}>Consultores da unidade</div>
            {consultores.map(c => (
              <div key={c.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 0', borderBottom:`1px solid ${C.border}`, fontSize:13 }}>
                {c.nome}
                <button onClick={() => removerConsultor(c.id)} style={{ fontSize:11, color:C.red, cursor:'pointer', border:'none', background:'none' }}>remover</button>
              </div>
            ))}
            {consultores.length === 0 && <div style={{ fontSize:13, color:C.gray500, padding:'8px 0' }}>Nenhum consultor ainda.</div>}
            <div style={{ display:'flex', gap:8, marginTop:14 }}>
              <input placeholder="Nome do consultor..." value={novoConsultor} onChange={e => setNovoConsultor(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && adicionarConsultor()}
                style={{ flex:1, padding:'7px 10px', border:`1px solid ${C.border}`, borderRadius:8, fontSize:13, outline:'none' }} />
              <button onClick={adicionarConsultor} style={{ fontSize:12, padding:'7px 14px', border:'none', borderRadius:8, background:ACCENT, color:'#fff', cursor:'pointer', fontWeight:600 }}>Add</button>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:12 }}>
              <button onClick={() => setModalConsultores(false)} style={{ fontSize:12, padding:'6px 14px', border:`1px solid ${C.border}`, borderRadius:8, background:C.surface, cursor:'pointer', color:C.gray700 }}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── SOLICITAR AJUSTE (Franqueado) ────────────────────────────────────────────
function LiaConfig({ franqueado }) {
  const [tipos, setTipos] = useState([])
  const [form, setForm] = useState({ como_hoje:'', como_quer:'', exemplo:'', sugestao:'' })
  const [urgencia, setUrgencia] = useState('baixa')
  const [enviado, setEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)

  function toggleTipo(t) { setTipos(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]) }

  async function handleEnviar(e) {
    e.preventDefault()
    if (tipos.length === 0) return
    setEnviando(true)
    const { error } = await supabase.from('solicitacoes').insert({
      franqueado_id: franqueado.id,
      unidade: franqueado.unidade,
      responsavel: franqueado.nome,
      tipos,
      como_hoje: form.como_hoje,
      como_quer: form.como_quer,
      exemplo: form.exemplo,
      sugestao: form.sugestao,
      urgencia,
      status: 'pendente'
    })
    if (error) { console.error(error); alert('Erro ao enviar. Tente novamente.') }
    else setEnviado(true)
    setEnviando(false)
  }

  const inp = { width:'100%', padding:'10px 14px', border:`1px solid ${C.border}`, borderRadius:10, fontSize:13, outline:'none', background:C.surface }

  if (enviado) return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:40, gap:14 }}>
      <div style={{ width:60, height:60, borderRadius:'50%', background:C.greenLight, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>✅</div>
      <div style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.02em' }}>Solicitação enviada!</div>
      <div style={{ fontSize:13, color:C.gray500, textAlign:'center', maxWidth:360, lineHeight:1.7 }}>
        Gabriel vai analisar e aplicar na próxima <strong>segunda ou quinta-feira</strong>.<br />Você receberá confirmação por WhatsApp.
      </div>
      <button onClick={() => { setTipos([]); setForm({ como_hoje:'', como_quer:'', exemplo:'', sugestao:'' }); setUrgencia('baixa'); setEnviado(false) }}
        style={{ fontSize:13, padding:'9px 20px', border:`1px solid ${C.border}`, borderRadius:10, background:C.surface, cursor:'pointer', color:C.gray700, fontWeight:500, marginTop:6 }}>
        Enviar outro ajuste
      </button>
    </div>
  )

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'26px 30px' }}>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.02em', marginBottom:2 }}>Solicitar ajuste na Lia</h1>
        <p style={{ fontSize:12, color:C.gray500 }}>Ajustes aplicados toda <strong>segunda e quinta-feira</strong>. Quanto mais detalhado, melhor.</p>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', background:C.blueLight, border:`1px solid ${C.blueMid}`, borderRadius:11, marginBottom:22 }}>
        <span style={{ fontSize:18 }}>📅</span>
        <div style={{ fontSize:12, color:C.blue, lineHeight:1.5 }}>
          <strong>Prazo:</strong> Recebidas até terça/quarta → aplicadas quinta. Recebidas de sexta a domingo → aplicadas segunda seguinte.
        </div>
      </div>
      <form onSubmit={handleEnviar}>
        {/* Tipos */}
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:22, marginBottom:14 }}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:16 }}>O que você quer ajustar?</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9 }}>
            {TIPOS_AJUSTE.map(t => {
              const sel = tipos.includes(t.val)
              return (
                <button type="button" key={t.val} onClick={() => toggleTipo(t.val)}
                  style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'12px 14px', borderRadius:11, border:sel ? `2px solid ${ACCENT}` : `1px solid ${C.border}`, background:sel ? C.blueLight : C.surface, cursor:'pointer', textAlign:'left' }}>
                  <span style={{ fontSize:18, flexShrink:0 }}>{t.icon}</span>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:sel ? ACCENT : C.gray900, marginBottom:2 }}>{t.val}</div>
                    <div style={{ fontSize:11, color:C.gray500, lineHeight:1.4 }}>{t.desc}</div>
                  </div>
                </button>
              )
            })}
          </div>
          {tipos.length === 0 && <div style={{ fontSize:11, color:C.amber, marginTop:9 }}>Selecione ao menos um tipo.</div>}
        </div>

        {/* Descrição */}
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:22, marginBottom:14 }}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:16 }}>Descreva o ajuste</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {[['Como está hoje','como_hoje','Descreva o comportamento atual da Lia...'],['Como quer que fique','como_quer','Como deveria ser...'],['Exemplo de situação','exemplo','Conversa onde a Lia errou (opcional)...'],['Sugestão de melhoria','sugestao','Tem alguma ideia? (opcional)...']].map(([l, k, ph]) => (
              <div key={k}>
                <label style={{ fontSize:11, fontWeight:600, color:C.gray700, display:'block', marginBottom:5 }}>{l}</label>
                <textarea style={{ ...inp, resize:'vertical', minHeight:80 }} placeholder={ph} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} />
              </div>
            ))}
          </div>
        </div>

        {/* Urgência */}
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:22, marginBottom:20 }}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:14 }}>Urgência</div>
          <div style={{ display:'flex', gap:10 }}>
            {[{ val:'baixa', label:'Baixa', sub:'Pode esperar', icon:'🟢' }, { val:'media', label:'Média', sub:'Afetando alguns', icon:'🟡' }, { val:'alta', label:'Alta', sub:'Informação errada agora', icon:'🔴' }].map(u => (
              <button type="button" key={u.val} onClick={() => setUrgencia(u.val)}
                style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'flex-start', gap:5, padding:'12px 14px', borderRadius:11, border:urgencia === u.val ? `2px solid ${ACCENT}` : `1px solid ${C.border}`, background:urgencia === u.val ? C.blueLight : C.surface, cursor:'pointer', textAlign:'left' }}>
                <span style={{ fontSize:18 }}>{u.icon}</span>
                <div style={{ fontSize:13, fontWeight:600, color:urgencia === u.val ? ACCENT : C.gray900 }}>{u.label}</div>
                <div style={{ fontSize:11, color:C.gray500 }}>{u.sub}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display:'flex', justifyContent:'flex-end' }}>
          <button type="submit" disabled={tipos.length === 0 || enviando}
            style={{ padding:'11px 28px', background:tipos.length === 0 ? C.gray300 : ACCENT, color:'#fff', border:'none', borderRadius:11, fontSize:14, fontWeight:700, cursor:tipos.length === 0 ? 'default' : 'pointer' }}>
            {enviando ? 'Enviando...' : 'Enviar solicitação'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null)
  const [franqueado, setFranqueado] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('master')

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
    setView(data?.is_admin ? 'master' : 'crm')
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'system-ui,sans-serif', color:C.gray500 }}>
      Carregando...
    </div>
  )

  if (!session) return <LoginPage />
  if (!franqueado) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'system-ui,sans-serif', color:C.gray500 }}>Usuário não encontrado.</div>

  const isAdmin = franqueado.is_admin

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', fontFamily:"'Inter', system-ui, sans-serif" }}>
      <Sidebar view={view} setView={setView} isAdmin={isAdmin} onLogout={handleLogout} />
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:C.bg }}>
        {view === 'master'     && isAdmin  && <PainelMaster onLogout={handleLogout} />}
        {view === 'onboarding' && isAdmin  && <AbaOnboarding />}
        {view === 'crm'        && !isAdmin && <CRMFranqueado franqueado={franqueado} />}
        {view === 'lia'        && !isAdmin && <LiaConfig franqueado={franqueado} />}
      </div>
    </div>
  )
}
