import { supabase } from './supabase';

export async function enviarCorreo(destinatarios, asunto, contenidoHtml) {
  // destinatarios puede ser un string (un correo) o un array de strings
  const to = Array.isArray(destinatarios) ? destinatarios : [destinatarios];

  // Llamar a la función de Cloudflare
  const response = await fetch('/api/enviar-correo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: to,
      subject: asunto,
      html: contenidoHtml,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    console.error('Error al enviar correo:', result);
    throw new Error(result.error || 'Error al enviar correo');
  }

  return result;
}