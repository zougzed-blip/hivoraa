const { BrevoClient } = require('@getbrevo/brevo');

const client = new BrevoClient({
    apiKey: process.env.BREVO_API_KEY
});

const sendEmail = async (to, subject, htmlContent) => {
    try {
        const result = await client.transactionalEmails.sendTransacEmail({
            sender: { 
                email: process.env.BREVO_SENDER_EMAIL, 
                name: process.env.BREVO_SENDER_NAME 
            },
            to: [{ email: to }],
            subject: subject,
            htmlContent: htmlContent
        });
        console.log('Email sent to:', to);
        return { success: true, info: result };
    } catch (error) {
        console.error('Brevo error:', error.message);
        return { success: false, error };
    }
};

module.exports = sendEmail;