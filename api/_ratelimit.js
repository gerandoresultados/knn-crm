// api/_ratelimit.js — helper de rate limit em memória
// Limita requisições por IP numa janela de tempo

const requisicoes = new Map()

export function rateLimit(req, res, { max = 10, windowMs = 60000 } = {}) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() 
          || req.headers['x-real-ip'] 
          || req.socket?.remoteAddress 
          || 'unknown'
  
  const agora = Date.now()
  const registros = requisicoes.get(ip) || []
  
  // Remove registros fora da janela
  const validos = registros.filter(t => agora - t < windowMs)
  
  if (validos.length >= max) {
    res.setHeader('Retry-After', Math.ceil(windowMs / 1000))
    res.status(429).json({ 
      erro: 'Muitas requisições. Tente novamente em alguns segundos.' 
    })
    return true // bloqueou
  }
  
  validos.push(agora)
  requisicoes.set(ip, validos)
  
  // Limpa IPs antigos periodicamente (evita memory leak)
  if (requisicoes.size > 1000) {
    for (const [key, vals] of requisicoes.entries()) {
      const filtrados = vals.filter(t => agora - t < windowMs)
      if (filtrados.length === 0) requisicoes.delete(key)
      else requisicoes.set(key, filtrados)
    }
  }
  
  return false // liberou
}
