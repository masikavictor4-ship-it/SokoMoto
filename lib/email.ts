import { Resend } from "resend";

type VerificationEmailOptions = {
  email: string;
  name: string;
  verificationUrl: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendVerificationEmail({
  email,
  name,
  verificationUrl,
}: VerificationEmailOptions) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  if (!from) {
    throw new Error("RESEND_FROM_EMAIL is not configured.");
  }

  console.log("Sending verification email...");
  console.log("Resend API key loaded:", true);
  console.log("Resend API key length:", apiKey.length);
  console.log("From:", from);
  console.log("To:", email);

  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    from,
    to: [email],
    subject: "Verify your SokoMtaani account",
    html: `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: 0 auto;
        padding: 32px;
      ">

        <h1 style="color: #16a34a;">
          Welcome to SokoMtaani
        </h1>

        <p>
          Hello ${escapeHtml(name)},
        </p>

        <p>
          Thank you for creating your SokoMtaani account.
          Please verify your email address by clicking the button below.
        </p>

        <p style="margin: 32px 0;">
          <a
            href="${verificationUrl}"
            style="
              display: inline-block;
              background: #16a34a;
              color: white;
              padding: 14px 24px;
              border-radius: 8px;
              text-decoration: none;
              font-weight: bold;
            "
          >
            Verify My Email
          </a>
        </p>

        <p>
          This verification link expires in 24 hours.
        </p>

        <p style="color: #64748b; font-size: 14px;">
          If you did not create this account, you can safely ignore this email.
        </p>

        <hr
          style="
            margin: 32px 0;
            border: none;
            border-top: 1px solid #e2e8f0;
          "
        />

        <p style="color: #94a3b8; font-size: 12px;">
          © ${new Date().getFullYear()} SokoMtaani
        </p>

      </div>
    `,
  });

  if (error) {
    console.error("========== RESEND ERROR ==========");
    console.error(error);
    console.error("==================================");

    throw new Error(
      `Unable to send verification email: ${
        error.message || "Unknown Resend error"
      }`
    );
  }

  console.log("Verification email sent successfully:", data);

  return data;
}
