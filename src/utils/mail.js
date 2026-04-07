import Mailgen from "mailgen";
import nodemailer from "nodemailer"
import "dotenv/config";

/**
  semd mail is always async 

 */
const sendEmail = async (options) => {
    const mailGenerator = new Mailgen({
        theme: "default",
        product: {
            name: "Task Manager",
            link: "https://taskmanagelink.com",
        }
    })
    // preapare a email
    const emailTextual = mailGenerator.generatePlaintext(options.mailgenContent)
    const emailHtml = mailGenerator.generate(options.mailgenContent);

    // send an email

    const transporter = nodemailer.createTransport({
        host: process.env.MAILTRAP_SMTP_HOST,
        port: process.env.MAILTRAP_SMTP_PORT,
        auth: {
            user: process.env.MAILTRAP_SMTP_USER,
            pass: process.env.MAILTRAP_SMTP_PASS,
        }
    });

    const mail = {
        from: "mail.taskmanager@example.com",
        to: options.email,
        subject: options.subject,
        text: emailTextual,
        html: emailHtml
    }

    try {
        await transporter.sendMail(mail);

    } catch (error) {
        console.error("Email Service Failed silently, Make sure that you provided your mailtrap credentials in the .env  file.")
        console.error("Error: ", error)
    }
};


/**
 * generate a content for mail 
 // create a mail 
 it will accept username , verifivation_url
 return an object
 body : name,intro , action, outro

 */
const emailVerificationMailgenContent = (username, verificationUrl) => {
    return {
        body: {
            name: username,
            intro: "Welcome to our app, we are excited to have you on board.",
            action: {
                instructions: "To Verify your Email , Please Click on followinf button",
                button: {
                    color: "#22BC66",
                    text: "verify your Email",
                    link: verificationUrl
                }
            },
            // bottompart
            outro: "Need Help, Or have Questions? just reply to this email, we'd love to help.",
        }
    }
};

/**
 * forgotpassword
 * same 
 */

const forgotPasswordMailgenContent = (username, passwordResetUrl) => {
    return {
        body: {
            name: username,
            action: {
                intro: "We got a request to reset password of your account to reset your password click on the following button or link ",
                button: "#9511a9",
                text: "Reset Password ",
                link: passwordResetUrl,
            },
            outro: "Need Help, Or have Questions? just reply to this email, we'd love to help.",
        }
    }
};

export {
    emailVerificationMailgenContent,
    forgotPasswordMailgenContent,
    sendEmail,
}