import express from 'express';
import nodemailer from 'nodemailer';
import multer from 'multer';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middleware
app.use(cors(  
));
app.use(express.json());

// Set up storage for uploaded resumes
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// SMTP Transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Verify SMTP connection on startup
transporter.verify((error, success) => {
    if (error) {
        console.error('SMTP Connection Error:', error);
    } else {
        console.log('SMTP Server is ready to send emails');
        console.log('Sending from:', process.env.EMAIL_USER);
        console.log('Sending to:', process.env.RECEIVER_EMAIL);
    }
});



app.get('/',(req,res)=>{
    return res.status(201).json({success : true  , message : 'backend is running'});
})

// API Route for Career Applications
app.post('/api/apply', upload.single('resume'), async (req, res) => {
    try {
        const { fullName, email, phone, jobPosition, coverLetter } = req.body;
        const resume = req.file;

        if (!resume) {
            return res.status(400).json({ error: 'Resume is required' });
        }

        const mailOptions = {
            from: `"${fullName} - Job Application" <${process.env.EMAIL_USER}>`,
            to: process.env.RECEIVER_EMAIL,
            replyTo: email,
            subject: `📋 New Job Application: ${jobPosition} - ${fullName}`,
            headers: {
                'X-Application-Source': 'AARVIFY Career Portal',
                'X-Applicant-Email': email
            },
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: #1e40af; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                        <h1 style="margin: 0; font-size: 22px;">📋 New Job Application</h1>
                    </div>
                    <div style="border: 1px solid #e5e7eb; padding: 24px; border-radius: 0 0 8px 8px;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 10px; font-weight: bold; color: #374151; border-bottom: 1px solid #f3f4f6; width: 140px;">Full Name</td>
                                <td style="padding: 10px; border-bottom: 1px solid #f3f4f6;">${fullName}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; font-weight: bold; color: #374151; border-bottom: 1px solid #f3f4f6;">Email</td>
                                <td style="padding: 10px; border-bottom: 1px solid #f3f4f6;"><a href="mailto:${email}">${email}</a></td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; font-weight: bold; color: #374151; border-bottom: 1px solid #f3f4f6;">Phone</td>
                                <td style="padding: 10px; border-bottom: 1px solid #f3f4f6;"><a href="tel:${phone}">${phone}</a></td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; font-weight: bold; color: #374151; border-bottom: 1px solid #f3f4f6;">Position</td>
                                <td style="padding: 10px; border-bottom: 1px solid #f3f4f6;"><strong>${jobPosition}</strong></td>
                            </tr>
                        </table>
                        <div style="margin-top: 20px; padding: 16px; background: #f9fafb; border-radius: 8px;">
                            <p style="font-weight: bold; color: #374151; margin: 0 0 8px 0;">Cover Letter / Message:</p>
                            <p style="color: #6b7280; margin: 0; white-space: pre-wrap;">${coverLetter || 'No cover letter provided.'}</p>
                        </div>
                        <p style="margin-top: 20px; font-size: 12px; color: #9ca3af; text-align: center;">
                            📎 Resume attached below | Sent from AARVIFY Career Portal
                        </p>
                    </div>
                </div>
            `,
            attachments: [
                {
                    filename: resume.originalname,
                    content: resume.buffer
                }
            ]
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('=== EMAIL DELIVERY REPORT ===');
        console.log('Message ID:', info.messageId);
        console.log('Accepted:', info.accepted);
        console.log('Rejected:', info.rejected);
        console.log('SMTP Response:', info.response);
        console.log('Envelope:', JSON.stringify(info.envelope));
        console.log('=============================');

        res.status(200).json({ message: 'Application sent successfully' });
    } catch (error) {
        console.error('Email error:', error);
        res.status(500).json({ error: 'Failed to send application. Please try again later.' });
    }
});

// API Route for Contact Form
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const mailOptions = {
            from: `"${name} (Contact Form)" <${process.env.EMAIL_USER}>`,
            to: process.env.RECEIVER_EMAIL,
            replyTo: email,
            subject: `📩 New Inquiry: ${subject}`,
            headers: {
                'X-Source': 'AARVIFY Contact Page',
                'X-Sender-Email': email
            },
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: #0e2247; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                        <h1 style="margin: 0; font-size: 22px;">📩 New Contact Inquiry</h1>
                    </div>
                    <div style="border: 1px solid #e5e7eb; padding: 24px; border-radius: 0 0 8px 8px;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 10px; font-weight: bold; color: #374151; border-bottom: 1px solid #f3f4f6; width: 100px;">Name</td>
                                <td style="padding: 10px; border-bottom: 1px solid #f3f4f6;">${name}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; font-weight: bold; color: #374151; border-bottom: 1px solid #f3f4f6;">Email</td>
                                <td style="padding: 10px; border-bottom: 1px solid #f3f4f6;"><a href="mailto:${email}">${email}</a></td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; font-weight: bold; color: #374151; border-bottom: 1px solid #f3f4f6;">Subject</td>
                                <td style="padding: 10px; border-bottom: 1px solid #f3f4f6;"><strong>${subject}</strong></td>
                            </tr>
                        </table>
                        <div style="margin-top: 20px; padding: 16px; background: #f9fafb; border-radius: 8px;">
                            <p style="font-weight: bold; color: #374151; margin: 0 0 8px 0;">Message:</p>
                            <p style="color: #6b7280; margin: 0; white-space: pre-wrap;">${message}</p>
                        </div>
                        <p style="margin-top: 20px; font-size: 12px; color: #9ca3af; text-align: center;">
                            Sent from AARVIFY Website Contact Page
                        </p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('=== CONTACT FORM EMAIL SENT ===');
        console.log('From:', name, email);
        console.log('Subject:', subject);
        console.log('===============================');

        res.status(200).json({ message: 'Message sent successfully' });
    } catch (error) {
        console.error('Contact Email Error:', error);
        res.status(500).json({ error: 'Failed to send message. Please try again.' });
    }
});

// API Route for Get Started (Partner Onboarding)
app.post('/api/partner-onboarding', async (req, res) => {
    console.log('Received Partner Portal Request:', req.body);
    try {
        const { companyName, designation, email, portfolioSize, message, serviceType } = req.body;

        if (!companyName || !email) {
            return res.status(400).json({ error: 'Basic details are required' });
        }

        const mailOptions = {
            from: `"${companyName} (Partnership Portal)" <${process.env.EMAIL_USER}>`,
            to: process.env.RECEIVER_EMAIL,
            replyTo: email,
            subject: `🏛️ Strategic Inquiry: ${companyName} (${serviceType})`,
            headers: {
                'X-Source': 'AARVIFY Strategic Portal',
                'X-Company': companyName
            },
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f4f7ff;">
                    <div style="background: #0a1128; color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; border-bottom: 4px solid #253e8d;">
                        <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">STRATEGIC PARTNERSHIP INQUIRY</h1>
                        <p style="opacity: 0.6; margin-top: 10px; font-size: 12px;">CONFIDENTIAL PORTAL SUBMISSION</p>
                    </div>
                    <div style="background: white; border: 1px solid #e5e7eb; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 12px 0; font-weight: bold; color: #374151; border-bottom: 1px solid #f3f4f6; width: 160px;">Institution</td>
                                <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-weight: 800;">${companyName}</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px 0; font-weight: bold; color: #374151; border-bottom: 1px solid #f3f4f6;">Authority / Role</td>
                                <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">${designation}</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px 0; font-weight: bold; color: #374151; border-bottom: 1px solid #f3f4f6;">Corporate Email</td>
                                <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;"><a href="mailto:${email}" style="color: #2563eb;">${email}</a></td>
                            </tr>
                            <tr>
                                <td style="padding: 12px 0; font-weight: bold; color: #374151; border-bottom: 1px solid #f3f4f6;">Service Interest</td>
                                <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;"><span style="background: #e0e7ff; color: #4338ca; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">${serviceType.toUpperCase()}</span></td>
                            </tr>
                            <tr>
                                <td style="padding: 12px 0; font-weight: bold; color: #374151; border-bottom: 1px solid #f3f4f6;">Operational Tier</td>
                                <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">${portfolioSize}</td>
                            </tr>
                        </table>
                        <div style="margin-top: 25px; padding: 20px; background: #f9fafb; border-radius: 12px; border-left: 4px solid #0a1128;">
                            <p style="font-weight: bold; color: #374151; margin: 0 0 10px 0; font-size: 14px;">Partnership Intent / Message:</p>
                            <p style="color: #4b5563; margin: 0; white-space: pre-wrap; line-height: 1.6;">${message}</p>
                        </div>
                        <div style="margin-top: 30px; padding-top: 20px; border-t: 1px solid #eee; text-align: center;">
                            <p style="font-size: 11px; color: #9ca3af; margin-bottom: 4px;">AUTOMATED PARTNERSHIP HANDLER</p>
                            <p style="font-size: 11px; color: #374151; font-weight: bold;">AARVIFY TECH SERVICES PVT LTD</p>
                        </div>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('=== PARTNER PORTAL SUBMISSION ===');
        console.log('Company:', companyName);
        console.log('Service:', serviceType);
        console.log('Response:', info.response);
        console.log('=================================');

        res.status(200).json({ message: 'Strategic inquiry submitted' });
    } catch (error) {
        console.error('Partner Portal Error:', error);
        res.status(500).json({ error: 'Portal synchronization failed. Please use info@aarvify.com directly.' });
    }
});

const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${port} is already in use! Kill the old server first or use a different port.`);
    } else {
        console.error('Server error:', err);
    }
    process.exit(1);
});
