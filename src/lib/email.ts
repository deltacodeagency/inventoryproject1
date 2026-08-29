import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = new Resend(resendApiKey);

interface SendEmailValues {
  to: string;
  subject: string;
  text: string;
}

export async function sendEmail({ to, subject, text }: SendEmailValues) {
  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "inventory@dreamspos.com",
      to,
      subject,
      text,
    });
    if (result.error) throw result.error;
  } catch (err) {
    console.error("Resend email failed:", err);
    throw err;
  }
}
