import nodemailer from "nodemailer";

export type Delivery = { status: "SENT" } | { status: "SKIPPED"; reason: string };
export type SmsMessage = { to: string; text: string };
export type EmailMessage = SmsMessage & { subject: string };

export interface SmsProvider {
  send(message: SmsMessage): Promise<Delivery>;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<Delivery>;
}

export class DeliveryError extends Error {
  constructor(message: string, readonly retryable = false) {
    super(message);
  }
}

export class ConsoleSmsProvider implements SmsProvider {
  async send(message: SmsMessage): Promise<Delivery> {
    console.info(`[SMS konsol] ${message.text.length} karakterlik deneme işlendi.`);
    return { status: "SKIPPED", reason: "Konsol modu. SMS dışarıya gönderilmedi." };
  }
}

export class NetgsmSmsProvider implements SmsProvider {
  constructor(
    private readonly config: { user: string; password: string; header: string },
    private readonly request: typeof fetch = fetch,
  ) {}

  async send({ to, text }: SmsMessage): Promise<Delivery> {
    let response: Response;
    try {
      response = await this.request("https://api.netgsm.com.tr/sms/rest/v2/send", {
        method: "POST",
        redirect: "error",
        headers: {
          Authorization: `Basic ${Buffer.from(`${this.config.user}:${this.config.password}`).toString("base64")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          msgheader: this.config.header,
          messages: [{ msg: text, no: to.slice(2) }],
          encoding: "UTF-8",
        }),
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      throw new DeliveryError("Netgsm yanıtı alınamadı. Gönderim sonucu belirsiz.");
    }
    const result = await response.json().catch(() => null);
    const code = typeof result?.code === "string" && /^\d{2,3}$/.test(result.code) ? result.code : null;
    if (response.ok && code && ["00", "01", "02"].includes(code)) return { status: "SENT" };
    if (response.status === 429) throw new DeliveryError("Netgsm istek sınırı.", true);
    if (code) throw new DeliveryError(`Netgsm gönderimi reddetti (kod ${code}).`, ["80", "85", "100", "101"].includes(code));
    throw new DeliveryError(`Netgsm geçerli bir gönderim yanıtı vermedi (HTTP ${response.status}).`);
  }
}

class SmtpEmailProvider implements EmailProvider {
  private readonly transport;

  constructor(private readonly config: { host: string; port: number; user?: string; password?: string; from: string; secure: boolean }) {
    this.transport = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      requireTLS: !config.secure,
      auth: config.user && config.password ? { user: config.user, pass: config.password } : undefined,
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 8000,
      disableFileAccess: true,
      disableUrlAccess: true,
    });
  }

  async send({ to, subject, text }: EmailMessage): Promise<Delivery> {
    try {
      const result = await this.transport.sendMail({ from: this.config.from, to, subject, text });
      if (!result.accepted.length) throw new DeliveryError("SMTP alıcıyı kabul etmedi.");
      return { status: "SENT" };
    } catch (error) {
      if (error instanceof DeliveryError) throw error;
      const failure = error as { responseCode?: unknown; code?: unknown; command?: unknown };
      const status = typeof failure?.responseCode === "number" ? failure.responseCode : 0;
      const beforeMessage = failure?.command === "CONN" || failure?.code === "EDNS";
      const retryable = (status >= 400 && status <= 499) || (status === 0 && beforeMessage);
      throw new DeliveryError(status ? `SMTP gönderimi reddetti (kod ${status}).` : beforeMessage
        ? "SMTP bağlantısı kurulamadı."
        : "SMTP sonucu doğrulanamadı.", retryable);
    }
  }
}

export type NotificationProviders = { sms: SmsProvider; email: EmailProvider | null };

export function notificationProviders(env = process.env): NotificationProviders {
  const sms = env.SMS_PROVIDER === "netgsm" && env.NETGSM_USERCODE && env.NETGSM_PASSWORD && env.NETGSM_MSGHEADER
    ? new NetgsmSmsProvider({ user: env.NETGSM_USERCODE, password: env.NETGSM_PASSWORD, header: env.NETGSM_MSGHEADER })
    : new ConsoleSmsProvider();
  const port = Number(env.SMTP_PORT || (env.SMTP_SECURE === "true" ? 465 : 587));
  const email = env.SMTP_HOST && env.SMTP_FROM && Number.isInteger(port) && port > 0 && port <= 65535
    && Boolean(env.SMTP_USER) === Boolean(env.SMTP_PASSWORD)
    ? new SmtpEmailProvider({
      host: env.SMTP_HOST, port, from: env.SMTP_FROM, user: env.SMTP_USER, password: env.SMTP_PASSWORD,
      secure: env.SMTP_SECURE === "true" || port === 465,
    })
    : null;
  return { sms, email };
}
