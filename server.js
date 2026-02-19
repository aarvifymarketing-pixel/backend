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
app.use(cors({
    origin: [
        'https://aarvify-jqim.vercel.app',
        'https://aarvify.com',
        'https://www.aarvify.com',
        'http://localhost:5173'
    ],
    methods: ['GET', 'POST'],
    credentials: true
}));
app.use(express.json());

// Set up storage for uploaded resumes
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

import { Resend } from 'resend';

// Initialize Resend
const resend = new Resend('re_Jmie5ou2_dFuo6AmEuoLNBosoQmRxwbUP');


app.get('/', (req, res) => {
    return res.status(201).json({ success: true, message: 'backend is running' });
})

// API Route for Career Applications
app.post('/api/apply', upload.single('resume'), async (req, res) => {
    try {
        const { fullName, email, phone, jobPosition, coverLetter } = req.body;
        const resume = req.file;

        if (!resume) {
            return res.status(400).json({ error: 'Resume is required' });
        }

        const { data, error } = await resend.emails.send({
            from: 'AARVIFY Careers <careers@aarvify.com>', // MUST be verified domain on Resend
            to: ['info@aarvify.com'],
            reply_to: email,
            subject: `📋 New Job Application: ${jobPosition} - ${fullName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: #1e40af; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                        <h1 style="margin: 0; font-size: 22px;">📋 New Job Application</h1>
                    </div>
                    <div style="border: 1px solid #e5e7eb; padding: 24px; border-radius: 0 0 8px 8px;">
                        <p><strong>Name:</strong> ${fullName}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Phone:</strong> ${phone}</p>
                        <p><strong>Position:</strong> ${jobPosition}</p>
                        <hr/>
                        <p><strong>Cover Letter:</strong></p>
                        <p>${coverLetter || 'No cover letter provided.'}</p>
                    </div>
                </div>
            `,
            attachments: [
                {
                    filename: resume.originalname,
                    content: resume.buffer
                }
            ]
        });

        if (error) {
            console.error('Resend Error:', error);
            return res.status(500).json({ error: error.message });
        }

        res.status(200).json({ message: 'Application sent successfully' });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: error.message || 'Failed to send application.' });
    }
});

// API Route for Contact Form
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const { data, error } = await resend.emails.send({
            from: 'AARVIFY Contact <contact@aarvify.com>',
            to: ['info@aarvify.com'],
            reply_to: email,
            subject: `📩 New Inquiry: ${subject}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: #0e2247; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                        <h1 style="margin: 0; font-size: 22px;">📩 New Contact Inquiry</h1>
                    </div>
                    <div style="border: 1px solid #e5e7eb; padding: 24px; border-radius: 0 0 8px 8px;">
                        <p><strong>Name:</strong> ${name}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Subject:</strong> ${subject}</p>
                        <hr/>
                        <p><strong>Message:</strong></p>
                        <p>${message}</p>
                    </div>
                </div>
            `
        });

        if (error) {
            console.error('Resend Error:', error);
            return res.status(500).json({ error: error.message });
        }

        res.status(200).json({ message: 'Message sent successfully' });
    } catch (error) {
        console.error('Contact Server Error:', error);
        res.status(500).json({ error: error.message || 'Failed to send message.' });
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

        const { data, error } = await resend.emails.send({
            from: 'AARVIFY Partners <partners@aarvify.com>',
            to: ['info@aarvify.com'],
            reply_to: email,
            subject: `🏛️ Strategic Inquiry: ${companyName} (${serviceType})`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: #0a1128; color: white; padding: 20px; text-align: center;">
                        <h1>STRATEGIC PARTNERSHIP INQUIRY</h1>
                    </div>
                    <div style="padding: 20px; border: 1px solid #ddd;">
                        <p><strong>Company:</strong> ${companyName}</p>
                        <p><strong>Role:</strong> ${designation}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Service:</strong> ${serviceType}</p>
                        <p><strong>Portfolio Size:</strong> ${portfolioSize}</p>
                        <hr/>
                        <p><strong>Message:</strong></p>
                        <p>${message}</p>
                    </div>
                </div>
            `
        });

        if (error) {
            console.error('Resend Error:', error);
            return res.status(500).json({ error: error.message });
        }

        res.status(200).json({ message: 'Strategic inquiry submitted' });
    } catch (error) {
        console.error('Partner Portal Error:', error);
        res.status(500).json({ error: error.message || 'Portal synchronization failed.' });
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
