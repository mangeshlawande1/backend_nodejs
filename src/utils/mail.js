import Mailgen from "mailgen";
import nodemailer from "nodemailer";
import "dotenv/config";

/* =========================================================
   SEND EMAIL
========================================================= */

const sendEmail = async (options) => {
  const { email, subject, mailgenContent } = options;

  if (!email || !subject || !mailgenContent) {
    throw new Error(
      "Email, subject and mail content are required"
    );
  }

  try {
    const mailGenerator = new Mailgen({
      theme: "default",
      product: {
        name: "Task Manager",
        link: "https://taskmanager.com",
      },
    });

    // Generate email body
    const emailText = mailGenerator.generatePlaintext(
      mailgenContent
    );

    const emailHtml = mailGenerator.generate(
      mailgenContent
    );

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_SMTP_HOST,
      port: Number(process.env.MAILTRAP_SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.MAILTRAP_SMTP_USER,
        pass: process.env.MAILTRAP_SMTP_PASS,
      },
    });

    // Email object
    const mail = {
      from: process.env.MAIL_FROM,
      to: email,
      subject,
      text: emailText,
      html: emailHtml,
    };

    // Send mail
    const response = await transporter.sendMail(mail);

    return response;
  } catch (error) {
    console.error("Email service error:", error);

    throw new Error(
      error?.message || "Failed to send email"
    );
  }
};

/* =========================================================
   EMAIL VERIFICATION TEMPLATE
========================================================= */

const emailVerificationMailgenContent = (
  username,
  verificationUrl
) => {
  return {
    body: {
      name: username,

      intro:
        "Welcome to Task Manager! We're excited to have you onboard.",

      action: {
        instructions:
          "To verify your email, please click the button below:",

        button: {
          color: "#22BC66",
          text: "Verify Email",
          link: verificationUrl,
        },
      },

      outro:
        "Need help or have questions? Reply to this email — we'd love to help.",
    },
  };
};

/* =========================================================
   FORGOT PASSWORD TEMPLATE
========================================================= */

const forgotPasswordMailgenContent = (
  username,
  passwordResetUrl
) => {
  return {
    body: {
      name: username,

      intro:
        "We received a request to reset your password.",

      action: {
        instructions:
          "Click the button below to reset your password:",

        button: {
          color: "#9511A9",
          text: "Reset Password",
          link: passwordResetUrl,
        },
      },

      outro:
        "If you did not request this, please ignore this email.",
    },
  };
};

export {
  sendEmail,
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
};