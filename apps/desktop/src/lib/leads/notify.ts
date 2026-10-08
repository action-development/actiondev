import "server-only";
import nodemailer from "nodemailer";
import type { ParsedLead } from "./parse";
import { leadEmailText, leadSubject, leadTelegramText } from "./message";

/**
 * Aviso inmediato de un lead nuevo. Se llama desde `after()` del route handler,
 * es decir DESPUÉS de responder: si algo falla solo se registra, nunca rompe el
 * envío (el lead ya está en Firestore). Sin variables de aviso no hace nada.
 *
 * Solo servidor: `nodemailer` no puede acabar en un bundle de cliente.
 */

function splitList(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function sendEmail(lead: ParsedLead, id: string): Promise<void> {
  const host = process.env.LEAD_SMTP_HOST;
  const user = process.env.LEAD_SMTP_USER;
  const pass = process.env.LEAD_SMTP_PASS;
  const from = process.env.LEAD_NOTIFY_FROM;
  const to = splitList(process.env.LEAD_NOTIFY_TO);
  if (!host || !user || !pass || !from || to.length === 0) return;

  const port = Number(process.env.LEAD_SMTP_PORT) || 465;
  const transport = nodemailer.createTransport({
    host,
    port,
    // 465 = SSL implícito; cualquier otro puerto negocia STARTTLS.
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 15000,
  });

  await transport.sendMail({
    from,
    to,
    replyTo: lead.email,
    subject: leadSubject(lead),
    text: leadEmailText(lead, id),
  });
}

async function sendTelegram(lead: ParsedLead): Promise<void> {
  const token = process.env.LEAD_TELEGRAM_BOT_TOKEN;
  const chatId = process.env.LEAD_TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: leadTelegramText(lead), disable_web_page_preview: true }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`Telegram ${response.status}`);
}

export async function notifyLead(lead: ParsedLead, id: string): Promise<void> {
  // Cada canal por su cuenta: que falle el correo no impide el Telegram.
  const results = await Promise.allSettled([sendEmail(lead, id), sendTelegram(lead)]);
  for (const result of results) {
    if (result.status === "rejected") {
      // Mensaje sin el token del bot ni credenciales: solo el motivo.
      const reason = result.reason instanceof Error ? result.reason.message : String(result.reason);
      console.error("[lead] aviso fallido:", reason.replace(/bot\d+:[\w-]+/g, "bot***"));
    }
  }
}
