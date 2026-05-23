module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, name } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email requerido' });

  const RESEND_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_KEY) return res.status(500).json({ error: 'Resend key no configurada' });

  const firstName = name || email.split('@')[0];

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Bienvenida a UGC Studio</title>
</head>
<body style="margin:0;padding:0;background:#FAFAF8;font-family:'Helvetica Neue',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF8;padding:40px 20px">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

      <!-- HEADER -->
      <tr><td style="background:linear-gradient(135deg,#4A1A62,#6B2D8B);border-radius:16px 16px 0 0;padding:36px 40px;text-align:left;position:relative">
        <div style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#fff;letter-spacing:0.5px">ALGRIS MÁRQUEZ</div>
        <div style="font-size:10px;color:rgba(200,170,220,0.8);letter-spacing:2px;text-transform:uppercase;margin-top:3px">UGC CONSULTING</div>
        <div style="position:absolute;right:40px;top:50%;transform:translateY(-50%);font-size:10px;font-weight:700;color:rgba(201,148,58,0.9);letter-spacing:1.5px;text-transform:uppercase;text-align:right">
          UGC STUDIO<br>
          <span style="font-size:9px;color:rgba(200,170,220,0.6);font-weight:400">Acceso activado</span>
        </div>
      </td></tr>

      <!-- GOLD LINE -->
      <tr><td style="height:3px;background:linear-gradient(90deg,#C9943A,#E8B84B,#C9943A)"></td></tr>

      <!-- BODY -->
      <tr><td style="background:#fff;padding:40px">

        <p style="font-family:Georgia,serif;font-size:26px;font-weight:700;color:#1A0A2E;margin:0 0 6px">
          Bienvenida, ${firstName} ✦
        </p>
        <p style="font-size:14px;color:#8A7A9A;margin:0 0 28px">Ya tienes acceso a UGC Studio</p>

        <p style="font-size:15px;color:#1A0A2E;line-height:1.8;margin:0 0 20px">
          Tu cuenta está lista. A partir de ahora puedes generar briefs creativos profesionales listos para presentar a marcas — antes de grabar un solo video.
        </p>

        <!-- WHAT YOU HAVE -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F3FC;border-radius:12px;padding:24px;margin-bottom:24px">
          <tr><td>
            <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6B2D8B;margin:0 0 14px">Con tu plan gratuito tienes:</p>
            <table cellpadding="0" cellspacing="0">
              <tr><td style="padding:5px 0;font-size:14px;color:#1A0A2E">
                <span style="color:#6B2D8B;font-weight:700;margin-right:8px">✓</span> 2 briefs mensuales durante tu período de prueba
              </td></tr>
              <tr><td style="padding:5px 0;font-size:14px;color:#1A0A2E">
                <span style="color:#6B2D8B;font-weight:700;margin-right:8px">✓</span> Formato Reel y Fotos
              </td></tr>
              <tr><td style="padding:5px 0;font-size:14px;color:#1A0A2E">
                <span style="color:#6B2D8B;font-weight:700;margin-right:8px">✓</span> Brief en PDF listo para presentar a marcas
              </td></tr>
              <tr><td style="padding:5px 0;font-size:14px;color:#1A0A2E">
                <span style="color:#6B2D8B;font-weight:700;margin-right:8px">✓</span> Análisis visual del producto con IA
              </td></tr>
            </table>
          </td></tr>
        </table>

        <!-- CTA -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
          <tr><td align="center">
            <a href="https://studio.algrismarquez.com/" style="display:inline-block;background:linear-gradient(135deg,#4A1A62,#6B2D8B);color:#fff;text-decoration:none;padding:15px 36px;border-radius:12px;font-family:Georgia,serif;font-size:17px;font-weight:700;letter-spacing:0.3px">
              ✦ Generar mi primer brief
            </a>
          </td></tr>
        </table>

        <!-- TIP -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#FBF7EE;border-left:3px solid #C9943A;border-radius:0 10px 10px 0;padding:16px 20px;margin-bottom:28px">
          <tr><td>
            <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#C9943A;margin:0 0 6px">Tip de Algris</p>
            <p style="font-size:13.5px;color:#1A0A2E;line-height:1.7;margin:0">
              Presenta el brief a la marca antes de grabar. Ese documento cambia cómo perciben tu trabajo — y cuánto están dispuestas a pagarte.
            </p>
          </td></tr>
        </table>

        <p style="font-size:14px;color:#1A0A2E;line-height:1.8;margin:0 0 6px">
          Cualquier duda, escríbeme directamente.
        </p>
        <p style="font-size:14px;color:#1A0A2E;margin:0 0 28px">
          Con gusto te acompaño,<br>
          <strong style="font-family:Georgia,serif;font-size:16px">Algris Márquez</strong><br>
          <span style="font-size:12px;color:#8A7A9A">UGC Consulting</span>
        </p>

        <!-- SOCIAL -->
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding-right:16px">
              <a href="https://www.instagram.com/algris.marquez" style="font-size:12px;color:#6B2D8B;text-decoration:none;display:inline-flex;align-items:center;gap:6px">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B2D8B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.2" fill="#6B2D8B" stroke="none"/></svg>
                @algris.marquez
              </a>
            </td>
            <td>
              <a href="https://www.tiktok.com/@algris.marquez" style="font-size:12px;color:#6B2D8B;text-decoration:none;display:inline-flex;align-items:center;gap:6px">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#6B2D8B"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.27 8.27 0 0 0 4.84 1.56V6.8a4.85 4.85 0 0 1-1.07-.11z"/></svg>
                @algris.marquez
              </a>
            </td>
          </tr>
        </table>

      </td></tr>

      <!-- FOOTER -->
      <tr><td style="background:#FBF7EE;border-top:1px solid rgba(201,148,58,0.2);border-radius:0 0 16px 16px;padding:16px 40px;display:flex;justify-content:space-between">
        <p style="font-size:11px;color:#8A7A9A;margin:0">
          © 2025 Algris Márquez · UGC Consulting · Todos los derechos reservados
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_KEY}`
      },
      body: JSON.stringify({
        from: 'Algris Márquez · UGC Studio <onboarding@resend.dev>',
        to: [email],
        subject: '✦ Bienvenida a UGC Studio — Tu acceso está listo',
        html
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.message || 'Error enviando email' });
    return res.status(200).json({ ok: true, id: data.id });

  } catch (e) {
    return res.status(500).json({ error: 'Error interno al enviar email' });
  }
}
