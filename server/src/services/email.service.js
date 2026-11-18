
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async ({
  to,
  name,
  token,
}) => {
  const verificationUrl =`${process.env.API_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`;

  const { data, error } = await resend.emails.send({
    from: 'WebLab <onboarding@resend.dev>',
    to: [to],
    subject: 'Verifikasi Akun WebLab',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2>Selamat datang di WebLab!</h2>

        <p>Halo ${name},</p>

        <p>
          Terima kasih telah mendaftar di WebLab.
          Silakan klik tombol di bawah untuk memverifikasi alamat email kamu.
        </p>

        <a
          href="${verificationUrl}"
          style="
            display: inline-block;
            padding: 12px 24px;
            background-color: #2563eb;
            color: white;
            text-decoration: none;
            border-radius: 6px;
          "
        >
          Verifikasi Email
        </a>

        <p>
          Tautan ini hanya berlaku selama 15 menit
          dan hanya dapat digunakan satu kali.
        </p>

        <p>Jika kamu tidak merasa melakukan pendaftaran,
        abaikan email ini.</p>

        <p>Salam,<br>Tim WebLab</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};
