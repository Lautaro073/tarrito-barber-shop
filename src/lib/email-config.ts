import nodemailer from 'nodemailer';

// Email del barbero que recibirá las notificaciones
export const BARBER_EMAIL = process.env.BARBER_EMAIL || 'staingosanchez@gmail.com';

// Configurar transporter de Nodemailer con Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  try {
    const info = await transporter.sendMail({
      from: `"Tarrito Barber Shop" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log('✅ Email enviado exitosamente:', info.messageId);
    return { success: true, data: info };
  } catch (error) {
    console.error('❌ Error al enviar email:', error);
    return { success: false, error };
  }
}
