// functions/api/enviar-correo.js
export async function onRequest(context) {
  // Solo aceptar POST
  if (context.request.method !== 'POST') {
    return new Response('Método no permitido', { status: 405 });
  }

  try {
    // Obtener datos del cuerpo de la solicitud
    const body = await context.request.json();
    const { to, subject, html } = body;

    // Validar campos obligatorios
    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos: to, subject, html' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener la API Key de Resend desde las variables de entorno
    const RESEND_API_KEY = context.env.RESEND_API_KEY;

    // Enviar correo con Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Control Drones <onboarding@resend.dev>', // Cambia si tienes dominio propio
        to: to,
        subject: subject,
        html: html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: 'Error al enviar correo', details: data }),
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