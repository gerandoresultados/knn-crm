import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

const STATUS_LIST = [
  { val: 'agendado',   label: 'Agendado',                cls: { bg: '#E6F1FB', color: '#0C447C' } },
  { val: 'visitou',    label: 'Visitou',                 cls: { bg: '#EEEDFE', color: '#3C3489' } },
  { val: 'matriculou', label: 'Matriculou',              cls: { bg: '#EAF3DE', color: '#27500A' } },
  { val: 'preco',      label: 'Só preço',                cls: { bg: '#FAEEDA', color: '#633806' } },
  { val: 'sumiu',      label: 'Sumiu',                   cls: { bg: '#FCEBEB', color: '#791F1F' } },
  { val: 'futuro',     label: 'Contato mais pra frente', cls: { bg: '#F1EFE8', color: '#444441' } },
  { val: 'comercial',  label: 'Comercial em contato',    cls: { bg: '#FBEAF0', color: '#72243E' } },
]

function pct(a, b) { return b > 0 ? Math.round((a / b) * 100) : 0 }

export default function App() {
  const [leads, setLeads] = useState([])
  const [consultores, setConsultores] = useState([])
  const [franqueado, setFranqueado] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modalConsultores, setModalConsultores] = useState(false)
  const [novoConsultor, setNovoConsultor] = useState('')

  // Para demo: usa o primeiro franqueado encontrado
  useEffect(() => {
    async function init() {
      // Busca franqueado
      let { data: franqueados } = await supabase.from('franqueados').select('*').limit(1)
      if (!franqueados || franqueados.length === 0) {
        // Cria franqueado demo se não existir
        const { data: novo } = await supabase.from('franqueados').insert({
          nome: 'Gabriel', unidade: 'Moema', email: 'gabriel.comercialknn@gmail.com'
        }).select().single()
        setFranqueado(novo)
        await carregarDados(novo.id)
      } else {
        setFranqueado(franqueados[0])
        await carregarDados(franqueados[0].id)
      }
      setLoading(false)
    }
    init()
  }, [])

  async function carregarDados(fid) {
    const { data: l } = await supabase.from('leads').select('*').eq('franqueado_id', fid).order('created_at', { ascending: true })
    const { data: c } = await supabase.from('consultores').select('*').eq('franqueado_id', fid)
    setLeads(l || [])
    setConsultores(c || [])
  }

  async function atualizarLead(id, campo, valor) {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, [campo]: valor } : l))
    await supabase.from('leads').update({ [campo]: valor, updated_at: new Date() }).eq('id', id)
  }

  async function adicionarConsultor() {
    if (!novoConsultor.trim() || !franqueado) return
    const { data } = await supabase.from('consultores').insert({ franqueado_id: franqueado.id, nome: novoConsultor.trim() }).select().single()
    setConsultores(prev => [...prev, data])
    setNovoConsultor('')
  }

  async function removerConsultor(id) {
    await supabase.from('consultores').delete().eq('id', id)
    setConsultores(prev => prev.filter(c => c.id !== id))
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#888' }}>
      Carregando...
    </div>
  )

  const total = leads.length
  const agendados = leads.filter(l => l.status === 'agendado').length
  const visitas = leads.filter(l => l.status === 'visitou' || l.status === 'matriculou').length
  const matr = leads.filter(l => l.status === 'matriculou').length
  const frio = leads.filter(l => l.status === 'preco' || l.status === 'sumiu').length
  const comercial = leads.filter(l => l.status === 'comercial').length
  const receita = leads.reduce((s, l) => s + (parseFloat(l.mensalidade) || 0), 0)
  const comMens = leads.filter(l => parseFloat(l.mensalidade) > 0).length
  const ticket = comMens > 0 ? Math.round(receita / comMens) : 0
  const cvAg = pct(agendados, total)
  const cvVi = pct(visitas, agendados + visitas + matr)
  const cvMa = pct(matr, visitas)

  const s = {
    wrap: { fontFamily: "'Segoe UI', sans-serif", maxWidth: 1200, margin: '0 auto', padding: '24px 16px', color: '#1a1a1a' },
    topbar: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
    title: { fontSize: 20, fontWeight: 600, color: '#1a1a1a' },
    subtitle: { fontSize: 13, color: '#888', marginTop: 2 },
    btn: { fontSize: 12, padding: '6px 14px', border: '1px solid #ddd', borderRadius: 8, background: '#fff', cursor: 'pointer' },
    sectionLabel: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888', marginBottom: 10 },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 },
    stat: { background: '#f5f5f5', borderRadius: 8, padding: '12px 14px' },
    statLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
    statVal: { fontSize: 22, fontWeight: 600 },
    convGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 },
    convCard: { background: '#f5f5f5', borderRadius: 8, padding: '12px 14px' },
    convLabel: { fontSize: 12, color: '#888', marginBottom: 6 },
    convPct: { fontSize: 22, fontWeight: 600 },
    convSub: { fontSize: 11, color: '#888', marginTop: 4 },
    barBg: { height: 5, background: '#e0e0e0', borderRadius: 99, marginTop: 8 },
    tableWrap: { overflowX: 'auto', border: '1px solid #eee', borderRadius: 12 },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 1000 },
    th: { background: '#f9f9f9', color: '#888', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' },
    td: { padding: '8px 12px', borderBottom: '1px solid #f0f0f0', verticalAlign: 'middle' },
    input: { fontSize: 13, border: 'none', background: 'transparent', color: '#1a1a1a', width: '100%', outline: 'none', padding: 0, fontFamily: 'inherit' },
    textarea: { fontSize: 12, border: 'none', background: 'transparent', color: '#666', width: '100%', outline: 'none', padding: 0, resize: 'none', lineHeight: 1.4, fontFamily: 'inherit' },
    select: { fontSize: 13, border: 'none', background: 'transparent', color: '#1a1a1a', width: '100%', outline: 'none', padding: 0, fontFamily: 'inherit', cursor: 'pointer' },
    liaTag: { display: 'inline-block', fontSize: 10, background: '#E1F5EE', color: '#085041', borderRadius: 4, padding: '1px 5px', marginLeft: 4 },
    divider: { height: 1, background: '#eee', margin: '20px 0' },
    modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { background: '#fff', borderRadius: 12, border: '1px solid #eee', padding: 20, width: 320 },
    modalTitle: { fontSize: 15, fontWeight: 600, marginBottom: 16 },
    delBtn: { fontSize: 11, color: '#A32D2D', cursor: 'pointer', border: 'none', background: 'none', padding: '2px 6px', borderRadius: 4 },
  }

  return (
    <div style={s.wrap}>
      <div style={s.topbar}>
        <div>
          <div style={s.title}>CRM — KNN Idiomas</div>
          <div style={s.subtitle}>Unidade: {franqueado?.unidade} · {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</div>
        </div>
        <button style={s.btn} onClick={() => setModalConsultores(true)}>Gerenciar consultores</button>
      </div>

      <div style={s.sectionLabel}>Leads</div>
      <div style={s.statsGrid}>
        <div style={s.stat}><div style={s.statLabel}>Total de leads</div><div style={{ ...s.statVal }}>{total}</div></div>
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
          { label: 'Leads → Agendados', pct: cvAg, sub: `${agendados} de ${total} leads viraram agendamento`, color: '#378ADD' },
          { label: 'Agendados → Visita', pct: cvVi, sub: `${visitas} de ${agendados + visitas + matr} agendados vieram visitar`, color: '#7F77DD' },
          { label: 'Visita → Matrícula', pct: cvMa, sub: `${matr} de ${visitas} visitas viraram matrícula`, color: '#639922' },
        ].map(c => (
          <div key={c.label} style={s.convCard}>
            <div style={s.convLabel}>{c.label}</div>
            <div style={{ ...s.convPct, color: c.color }}>{c.pct}%</div>
            <div style={s.convSub}>{c.sub}</div>
            <div style={s.barBg}><div style={{ height: 5, borderRadius: 99, background: c.color, width: c.pct + '%' }} /></div>
          </div>
        ))}
      </div>

      <div style={s.divider} />
      <div style={s.sectionLabel}>Todos os leads</div>

      <div style={s.tableWrap}>
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
                  <td style={s.td}>
                    <input style={{ ...s.input, width: 40 }} type="number" defaultValue={lead.idade} onBlur={e => atualizarLead(lead.id, 'idade', e.target.value)} />
                  </td>
                  <td style={s.td}>
                    <input style={s.input} type="text" defaultValue={lead.responsavel} placeholder="—" onBlur={e => atualizarLead(lead.id, 'responsavel', e.target.value)} />
                  </td>
                  <td style={s.td}>
                    <input style={s.input} type="text" defaultValue={lead.telefone} placeholder="—" onBlur={e => atualizarLead(lead.id, 'telefone', e.target.value)} />
                  </td>
                  <td style={s.td}>
                    <select
                      style={{ ...st.cls, fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, border: 'none', cursor: 'pointer' }}
                      value={lead.status}
                      onChange={e => atualizarLead(lead.id, 'status', e.target.value)}
                    >
                      {STATUS_LIST.map(x => <option key={x.val} value={x.val}>{x.label}</option>)}
                    </select>
                  </td>
                  <td style={s.td}>
                    <select style={s.select} value={lead.consultor || ''} onChange={e => atualizarLead(lead.id, 'consultor', e.target.value)}>
                      <option value="">—</option>
                      {consultores.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                    </select>
                  </td>
                  <td style={s.td}>
                    <textarea style={s.textarea} rows={2} defaultValue={lead.contraproposta} placeholder="Digite aqui..." onBlur={e => atualizarLead(lead.id, 'contraproposta', e.target.value)} />
                  </td>
                  <td style={s.td}>
                    <input style={{ ...s.input, width: 80 }} type="text" defaultValue={lead.mensalidade} placeholder="—" onBlur={e => atualizarLead(lead.id, 'mensalidade', e.target.value)} />
                  </td>
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
        <div style={s.modalBg} onClick={() => setModalConsultores(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalTitle}>Consultores da unidade</div>
            <ul style={{ listStyle: 'none', marginBottom: 16, padding: 0 }}>
              {consultores.map(c => (
                <li key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>
                  {c.nome}
                  <button style={s.delBtn} onClick={() => removerConsultor(c.id)}>remover</button>
                </li>
              ))}
              {consultores.length === 0 && <li style={{ fontSize: 13, color: '#aaa', padding: '6px 0' }}>Nenhum consultor ainda.</li>}
            </ul>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                style={{ flex: 1, fontSize: 13, padding: '6px 10px', border: '1px solid #ddd', borderRadius: 8, outline: 'none' }}
                placeholder="Nome do consultor..."
                value={novoConsultor}
                onChange={e => setNovoConsultor(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && adicionarConsultor()}
              />
              <button style={{ ...s.btn, background: '#185FA5', color: '#fff', border: 'none' }} onClick={adicionarConsultor}>Adicionar</button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button style={s.btn} onClick={() => setModalConsultores(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
