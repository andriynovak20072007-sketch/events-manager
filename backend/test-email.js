const nodemailer = require('nodemailer');

async function test() {
    console.log('Sending test email...\n');

    const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
            user: 'loy.borer37@ethereal.email',
            pass: '47P4pRTvww2s7xVPkY'
        }
    });

    const info = await transporter.sendMail({
        from: 'EventManager <loy.borer37@ethereal.email>',
        to: 'loy.borer37@ethereal.email',
        subject: '🔔 Нагадування: Концерт у Києві',
        html: `
            <div style="font-family: Arial; padding: 20px; background: #f4f6f9;">
                <div style="max-width: 500px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
                    <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 24px; color: #fff; text-align: center;">
                        <h1 style="margin: 0;">🔔 Event Manager</h1>
                    </div>
                    <div style="padding: 24px;">
                        <p>Привіт, <strong>користувачу</strong>!</p>
                        <p>⏰ Завтра у вас подія <strong>"Концерт у Києві"</strong> о 19:00. Не пропустіть!</p>
                        <p style="color: #667eea; font-weight: bold; font-size: 18px;">Концерт у Києві</p>
                    </div>
                    <div style="padding: 16px; background: #f8f9fa; text-align: center; color: #999; font-size: 12px;">
                        Event Manager - Планувальник подій
                    </div>
                </div>
            </div>
        `
    });

    console.log('Email sent! Message ID:', info.messageId);
    console.log('\n>>> Open this link to see the email:');
    console.log(nodemailer.getTestMessageUrl(info));
}

test().catch(console.error);
