import nodemailer from 'nodemailer';

interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

// Pobieranie konfiguracji ze zmiennych środowiskowych
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || '"TechniShop" <no-reply@technishop.pl>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Inicjalizacja transportera email
function createEmailTransporter() {
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }

  // W trybie deweloperskim (brak podanego SMTP) używamy JSON transportera, który loguje wiadomości
  return nodemailer.createTransport({
    jsonTransport: true,
  });
}

const transporter = createEmailTransporter();

async function sendMailSafe(options: SendEmailOptions): Promise<boolean> {
  try {
    const isMock = !SMTP_HOST || !SMTP_USER || !SMTP_PASS;

    if (isMock) {
      console.log('\n================== [TECHNISHOP EMAIL SERVICE] ==================');
      console.log(`✉️  DO:       ${options.to}`);
      console.log(`📌 TEMAT:    ${options.subject}`);
      console.log(`🕒 DATA:     ${new Date().toLocaleString('pl-PL')}`);
      console.log('📄 TREŚĆ:');
      console.log(options.text);
      console.log('💡 (Skonfiguruj SMTP_HOST, SMTP_USER, SMTP_PASS w .env, aby wysyłać prawdziwe maile)');
      console.log('================================================================\n');
      return true;
    }

    const info = await transporter.sendMail({
      from: SMTP_FROM,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log(`✅ [EMAIL] Wysłano wiadomość do ${options.to}, MessageID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ [EMAIL ERROR] Nie udało się wysłać maila do ${options.to}:`, error);
    return false;
  }
}

/**
 * Wysyła email powitalny po udanej rejestracji użytkownika.
 */
export async function sendRegistrationEmail(email: string, name: string): Promise<boolean> {
  const subject = 'Witaj w TechniShop! Twoje konto zostało pomyślnie utworzone';

  const text = `Cześć ${name}!

Zostałeś pomyślnie zarejestrowany w oficjalnym sklepie TechniShop.

Twoje konto jest w pełni aktywne. Możesz teraz przeglądać naszą najnowszą kolekcję odzieży i akcesoriów, składać zamówienia oraz korzystać z darmowej dostawy do Paczkomatu od 200 zł.

Przejdź do sklepu: ${FRONTEND_URL}

Pozdrawiamy,
Zespół TechniShop
Techni Schools & Techni Zdalni`;

  const html = `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF7F2; margin: 0; padding: 20px; color: #1e293b; }
    .card { max-width: 580px; margin: 0 auto; background-color: #ffffff; border: 1px border #E5E0D6; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #7C3AED 0%, #4338CA 100%); padding: 36px 32px; text-align: center; color: #ffffff; }
    .logo-badge { display: inline-block; padding: 6px 16px; background-color: rgba(255,255,255,0.2); border-radius: 9999px; font-size: 12px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 900; }
    .body { padding: 36px 32px; }
    .welcome-text { font-size: 16px; font-weight: bold; color: #0f172a; margin-top: 0; }
    .content-p { font-size: 14px; line-height: 1.6; color: #475569; margin: 16px 0; }
    .perks-box { background-color: #FAF8F5; border: 1px solid #EAE4D9; border-radius: 16px; padding: 20px; margin: 24px 0; }
    .perk-item { display: flex; align-items: center; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 10px; }
    .perk-item:last-child { margin-bottom: 0; }
    .perk-dot { color: #7C3AED; font-weight: 900; margin-right: 8px; font-size: 16px; }
    .btn-container { text-align: center; margin: 32px 0 16px 0; }
    .btn { display: inline-block; background-color: #7C3AED; color: #ffffff !important; font-size: 14px; font-weight: 800; text-decoration: none; padding: 14px 32px; border-radius: 14px; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3); }
    .footer { background-color: #F5F2EB; border-top: 1px solid #E7E2D8; padding: 24px 32px; text-align: center; font-size: 11px; color: #64748b; }
    .footer a { color: #7C3AED; text-decoration: none; font-weight: 700; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="logo-badge">TechniShop</div>
      <h1>Witaj w Społeczności Techni!</h1>
    </div>
    <div class="body">
      <p class="welcome-text">Cześć ${name},</p>
      <p class="content-p">
        Twoje konto zostało <strong>pomyślnie zarejestrowane</strong> w oficjalnym sklepie odzieżowym <strong>TechniShop</strong>.
      </p>
      <div class="perks-box">
        <div class="perk-item"><span class="perk-dot">✓</span> Oficjalna kolekcja odzieży Techni Schools & Techni Zdalni</div>
        <div class="perk-item"><span class="perk-dot">✓</span> Darmowa dostawa do Paczkomatu InPost od 200 zł</div>
        <div class="perk-item"><span class="perk-dot">✓</span> Wygodne i bezpieczne płatności BLIK oraz PayPo (30 dni)</div>
      </div>
      <div class="btn-container">
        <a href="${FRONTEND_URL}" class="btn" target="_blank">PRZEJDŹ DO SKLEPU</a>
      </div>
      <p class="content-p" style="font-size: 12px; color: #94a3b8; text-align: center;">
        Życzymy udanych zakupów! Jeśli to nie Ty zakładałeś(-aś) konto, zignoruj tę wiadomość.
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} TechniShop &bull; Techni Schools & Techni Zdalni</p>
      <p><a href="${FRONTEND_URL}">technishop.pl</a> &bull; Bezpieczne zakupy odzieżowe</p>
    </div>
  </div>
</body>
</html>`;

  return sendMailSafe({ to: email, subject, text, html });
}

/**
 * Wysyła email powiadamiający o zalogowaniu na konto.
 */
export async function sendLoginNotificationEmail(email: string, name: string): Promise<boolean> {
  const loginDate = new Date().toLocaleString('pl-PL', {
    timeZone: 'Europe/Warsaw',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const subject = 'Powiadomienie o logowaniu do konta TechniShop';

  const text = `Witaj ${name}!

Zostałeś pomyślnie zalogowany do swojego konta w sklepie TechniShop.

Szczegóły logowania:
- Użytkownik: ${name} (${email})
- Data i czas: ${loginDate} (czas polski)

Jeśli to Ty logowałeś(-aś) się na swoje konto, nie musisz podejmować żadnych działań.
Jeśli to nie Ty, zalecamy natychmiastowe zalogowanie się i zmianę hasła.

Przejdź do sklepu: ${FRONTEND_URL}

Pozdrawiamy,
Zespół Bezpieczeństwa TechniShop`;

  const html = `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF7F2; margin: 0; padding: 20px; color: #1e293b; }
    .card { max-width: 580px; margin: 0 auto; background-color: #ffffff; border: 1px solid #E5E0D6; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #1E1B4B 0%, #312E81 100%); padding: 32px; text-align: center; color: #ffffff; }
    .logo-badge { display: inline-block; padding: 6px 14px; background-color: rgba(124,58,237,0.3); border: 1px solid rgba(167,139,250,0.4); border-radius: 9999px; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 10px; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 900; }
    .body { padding: 32px; }
    .welcome-text { font-size: 16px; font-weight: bold; color: #0f172a; margin-top: 0; }
    .content-p { font-size: 14px; line-height: 1.6; color: #475569; margin: 14px 0; }
    .info-card { background-color: #FAF8F5; border: 1px solid #E3DDD2; border-radius: 16px; padding: 18px; margin: 20px 0; font-size: 13px; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; color: #475569; }
    .info-row:last-child { margin-bottom: 0; }
    .info-label { font-weight: 600; color: #64748b; }
    .info-value { font-weight: 800; color: #0f172a; }
    .security-notice { background-color: #FEF3C7; border: 1px solid #FDE68A; border-radius: 12px; padding: 14px; font-size: 12px; color: #92400E; line-height: 1.5; margin: 20px 0; }
    .btn-container { text-align: center; margin: 28px 0 12px 0; }
    .btn { display: inline-block; background-color: #7C3AED; color: #ffffff !important; font-size: 13px; font-weight: 800; text-decoration: none; padding: 12px 28px; border-radius: 12px; }
    .footer { background-color: #F5F2EB; border-top: 1px solid #E7E2D8; padding: 20px 32px; text-align: center; font-size: 11px; color: #64748b; }
    .footer a { color: #7C3AED; text-decoration: none; font-weight: 700; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="logo-badge">Bezpieczeństwo TechniShop</div>
      <h1>Pomyślne Logowanie</h1>
    </div>
    <div class="body">
      <p class="welcome-text">Witaj ${name},</p>
      <p class="content-p">
        Informujemy, że <strong>zostałeś(-aś) pomyślnie zalogowany(-a)</strong> do swojego konta w sklepie <strong>TechniShop</strong>.
      </p>

      <div class="info-card">
        <div class="info-row">
          <span class="info-label">Konto:</span>
          <span class="info-value">${email}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Czas logowania:</span>
          <span class="info-value">${loginDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Status:</span>
          <span class="info-value" style="color: #059669;">Autoryzacja udana</span>
        </div>
      </div>

      <div class="security-notice">
        <strong>Wskazówka bezpieczeństwa:</strong> Jeśli to logowanie było inicjowane przez Ciebie, nie musisz podejmować żadnych kroków. Jeśli nie rozpoznajesz tej aktywności, zalecamy jak najszybszą zmianę hasła.
      </div>

      <div class="btn-container">
        <a href="${FRONTEND_URL}" class="btn" target="_blank">PRZEJDŹ DO SKLEPU</a>
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} TechniShop &bull; Techni Schools & Techni Zdalni</p>
      <p>Wiadomość wygenerowana automatycznie w celach bezpieczeństwa.</p>
    </div>
  </div>
</body>
</html>`;

  return sendMailSafe({ to: email, subject, text, html });
}
