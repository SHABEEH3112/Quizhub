const nodemailer = require("nodemailer");

const sendVerificationEmail = async ({ to, verificationUrl, role }) => {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASS,
    SMTP_FROM,
  } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error("Email service is not configured. Add SMTP settings to backend/.env.");
  }

  const port = Number(SMTP_PORT) || 587;
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: SMTP_SECURE === "true" || (SMTP_SECURE !== "false" && port === 465),
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: SMTP_FROM || `QuizHub <${SMTP_USER}>`,
    to,
    subject: "Confirm your QuizHub account",
    text: `Confirm your ${role} account by opening this link: ${verificationUrl}\nThis link expires in 24 hours.`,
    html: `<p>Confirm your ${role} account to finish registration.</p><p><a href="${verificationUrl}" style="display:inline-block;padding:12px 18px;background:#2878c7;color:#fff;text-decoration:none;border-radius:6px">Confirm email</a></p><p>This link expires in 24 hours. If you did not request this account, ignore this email.</p>`,
  });
};

const sendPasswordResetEmail = async ({ to, resetUrl }) => {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASS,
    SMTP_FROM,
  } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error("Email service is not configured. Add SMTP settings to backend/.env.");
  }

  const port = Number(SMTP_PORT) || 587;
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: SMTP_SECURE === "true" || (SMTP_SECURE !== "false" && port === 465),
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: SMTP_FROM || `QuizHub <${SMTP_USER}>`,
    to,
    subject: "Reset your QuizHub password",
    text: `Reset your QuizHub password using this one-time link: ${resetUrl}\nThis link expires in 15 minutes. If you did not request it, ignore this email.`,
    html: `<p>We received a request to reset your QuizHub password.</p><p><a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#5143ec;color:#fff;text-decoration:none;border-radius:6px">Reset password</a></p><p>This one-time link expires in 15 minutes. If you did not request it, ignore this email.</p>`,
  });
};

module.exports = { sendPasswordResetEmail, sendVerificationEmail };