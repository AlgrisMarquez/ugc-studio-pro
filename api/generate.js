module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { imageBase64, imageType, prompt, userId, action, rating, comment } = req.body || {};

  function getMonthYear() {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
  }

  function getMonthsDiff(dateStr) {
    const s = new Date(dateStr), n = new Date();
    return (n.getFullYear() - s.getFullYear()) * 12 + (n.getMonth() - s.getMonth());
  }

  function getPlanLimit(plan) {
    if (plan === 'premium') return 99999;
    if (plan === 'inicial') return 12;
    return 2; // free
  }

  // ── STATUS ──
  if (action === 'status') {
    if (!userId || !process.env.SUPABASE_URL) {
      return res.status(200).json({ plan: 'free', totalMonth: 0, limit: 2, blocked: false, showFeedback: false, showUpgrade: false });
    }
    try {
      const { createClient } = require('@supabase/supabase-js');
      const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

      const { data: profile } = await sb.from('profiles').select('*').eq('id', userId).single();
      if (!profile) return res.status(200).json({ plan: 'free', totalMonth: 0, limit: 2, blocked: false, showFeedback: false, showUpgrade: false });

      const monthYear = getMonthYear();
      const monthsDiff = getMonthsDiff(profile.first_use_at);
      const limit = getPlanLimit(profile.plan);

      const { count: totalMonth } = await sb.from('brief_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId).eq('month_year', monthYear);

      const used = totalMonth || 0;
      let blocked = false, message = '', showUpgrade = false, showFeedback = false;

      if (profile.plan === 'premium') {
        // sin límite
      } else if (profile.plan === 'inicial') {
        if (used >= limit) {
          blocked = true; showUpgrade = true;
          message = 'Alcanzaste los 12 briefs del Plan Inicial este mes. Subí a Premium para briefs ilimitados.';
        }
      } else {
        // free — flujo de conversión
        if (monthsDiff >= 5) {
          blocked = true; showUpgrade = true;
          message = 'Tu período gratuito terminó. Elegí un plan para seguir creando.';
        } else if (monthsDiff >= 3) {
          if (used >= 1) {
            blocked = true; showUpgrade = true;
            const next = new Date(); next.setMonth(next.getMonth() + 1); next.setDate(1);
            message = `Ya usaste tu brief de este mes. Próximo el 1 de ${next.toLocaleDateString('es-ES', { month: 'long' })} — o elegí un plan.`;
          }
        } else if (monthsDiff >= 2) {
          blocked = true; showUpgrade = true;
          message = 'Usaste UGC Studio por 2 meses. Es momento de elegir tu plan.';
        } else {
          if (used >= limit) {
            blocked = true; showUpgrade = true;
            message = `Usaste tus ${limit} briefs gratuitos de este mes. Elegí un plan para seguir.`;
          }
          // feedback en el 2do brief del mes 2
          if (monthsDiff >= 1 && used === 1) showFeedback = true;
        }
      }

      return res.status(200).json({ plan: profile.plan, monthsDiff, totalMonth: used, limit, blocked, message, showFeedback, showUpgrade });
    } catch (e) {
      return res.status(200).json({ plan: 'free', totalMonth: 0, limit: 2, blocked: false, showFeedback: false, showUpgrade: false });
    }
  }

  // ── FEEDBACK ──
  if (action === 'feedback') {
    if (userId && process.env.SUPABASE_URL) {
      try {
        const { createClient } = require('@supabase/supabase-js');
        const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
        await sb.from('feedback').insert({ user_id: userId, rating: rating || 0, comment: comment || '' });
      } catch (e) {}
    }
    return res.status(200).json({ ok: true });
  }

  // ── GENERATE ──
  if (!imageBase64 || !prompt) return res.status(400).json({ error: 'Faltan datos requeridos' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'API key no configurada' });

  // Registrar uso
  if (userId && process.env.SUPABASE_URL) {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
      await sb.from('brief_usage').insert({ user_id: userId, month_year: getMonthYear() });
    } catch (e) {}
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: imageType || 'image/jpeg', data: imageBase64 } },
            { type: 'text', text: prompt }
          ]
        }]
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'Error de API' });
    return res.status(200).json({ result: data.content?.[0]?.text || '' });
  } catch (e) {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
