// _worker.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Manejar POST a /api/enviar-correo
    if (url.pathname === '/api/enviar-correo' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { to, subject, html } = body;

        // Validar campos
        if (!to || !subject || !html) {
          return new Response(
            JSON.stringify({ error: 'Faltan campos: to, subject, html' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const RESEND_API_KEY = env.RESEND_API_KEY;
        if (!RESEND_API_KEY) {
          return new Response(
            JSON.stringify({ error: 'RESEND_API_KEY no configurada en el entorno' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }

        // Asegurar que 'to' sea un array
        const destinatarios = Array.isArray(to) ? to : [to];

        // Enviar correo con Resend
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Control Drones <onboarding@resend.dev>',
            to: destinatarios,
            subject: subject,
            html: html,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          return new Response(
            JSON.stringify({ error: 'Error de Resend', details: data }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, data }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Para el resto de rutas, devolver el asset estático (tu app React)
    return env.ASSETS.fetch(request);
  }
};