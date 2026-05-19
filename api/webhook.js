const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Productos de Hotmart mapeados a planes
const PLAN_MAP = {
  'M105887628M': 'inicial',  // Plan Inicial $9.99
  'X105888044I': 'premium',  // Plan Premium $21.99
};

function getPlanFromProduct(productId, checkoutLink) {
  // Intentar por product ID directo
  if (PLAN_MAP[productId]) return PLAN_MAP[productId];
  // Intentar por checkout link
  for (const [key, plan] of Object.entries(PLAN_MAP)) {
    if (checkoutLink && checkoutLink.includes(key)) return plan;
  }
  return null;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body;
    const event = body?.event || body?.data?.event;
    const buyerEmail = body?.data?.buyer?.email || body?.buyer?.email;
    const productId = body?.data?.product?.id || body?.product?.id;
    const checkoutLink = body?.data?.purchase?.checkout_url || '';

    console.log('Hotmart webhook:', JSON.stringify({ event, buyerEmail, productId }));

    if (!buyerEmail) return res.status(200).json({ ok: true, msg: 'No email found' });

    // Eventos que activan el plan
    const activateEvents = [
      'PURCHASE_APPROVED',
      'PURCHASE_COMPLETE',
      'SUBSCRIPTION_REACTIVATED',
      'SWITCH_PLAN'
    ];

    // Eventos que cancelan el plan
    const cancelEvents = [
      'PURCHASE_CANCELED',
      'PURCHASE_REFUNDED',
      'SUBSCRIPTION_CANCELLATION',
      'PURCHASE_CHARGEBACK'
    ];

    if (activateEvents.includes(event)) {
      const plan = getPlanFromProduct(productId, checkoutLink);
      if (!plan) return res.status(200).json({ ok: true, msg: 'Plan not found for product' });

      // Buscar usuario por email en auth
      const { data: users } = await sb.auth.admin.listUsers();
      const user = users?.users?.find(u => u.email === buyerEmail);

      if (!user) {
        console.log('User not found for email:', buyerEmail);
        return res.status(200).json({ ok: true, msg: 'User not found, will activate when they register' });
      }

      // Actualizar plan en profiles
      const { error } = await sb.from('profiles')
        .update({ plan })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating plan:', error);
        return res.status(500).json({ error: 'Error updating plan' });
      }

      console.log(`Plan ${plan} activated for ${buyerEmail}`);
      return res.status(200).json({ ok: true, plan, email: buyerEmail });
    }

    if (cancelEvents.includes(event)) {
      // Buscar usuario y bajar a free
      const { data: users } = await sb.auth.admin.listUsers();
      const user = users?.users?.find(u => u.email === buyerEmail);

      if (user) {
        await sb.from('profiles').update({ plan: 'free' }).eq('id', user.id);
        console.log(`Plan reset to free for ${buyerEmail}`);
      }

      return res.status(200).json({ ok: true, msg: 'Plan reset to free' });
    }

    // Evento no relevante
    return res.status(200).json({ ok: true, msg: `Event ${event} ignored` });

  } catch (e) {
    console.error('Webhook error:', e);
    return res.status(200).json({ ok: true, msg: 'Error handled' }); // 200 para que Hotmart no reintente
  }
}
