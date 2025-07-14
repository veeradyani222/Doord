const port = process.env.PORT || 4000;
const express = require("express");
const mongoose = require("mongoose");
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
app.use(bodyParser.json());
app.use(express.json({ limit: '10mb' }));

// --- MongoDB Connection ---
async function connectDB() {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');
    }
}

// --- Schema ---
const JobApplicationSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    companyName: { type: String, required: true },
    jobTitle: { type: String, required: true },
    jobDescription: { type: String, required: true },
    founderName: { type: String, required: true },
    founderEmail: { type: String, required: true },
    dateApplied: { type: Date, default: Date.now },
    founderLinkedIn: { type: String },
    companyLinkedIn: { type: String },
    status: {
        type: String,
        enum: ['Applied', 'Interviewing', 'Offer', 'Rejected', 'Follow-up Pending', 'Awaiting Response'],
        default: 'Applied'
    }
}, { timestamps: true });

const JobApplication = mongoose.models.JobApplication || mongoose.model('JobApplication', JobApplicationSchema);

// --- Nodemailer ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// --- Gemini API Call ---
async function generateWithGemini(prompt) {
    const API_KEY = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

// --- Email sender ---
async function sendEmailViaNodemailer(to, subject, html) {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            html
        };
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
}

// --- ROUTES ---

// CREATE a new job application
app.post('/applications', async (req, res) => {
    try {
        await connectDB();
        const { userId, ...applicationData } = req.body;

        const newApplication = new JobApplication({
            ...applicationData,
            userId
        });

        await newApplication.save();
        res.json({ success: true, application: newApplication });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET all job applications
app.get('/applications', async (req, res) => {
    try {
        await connectDB();
        const applications = await JobApplication.find();
        res.json({ success: true, applications });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PATCH - perform actions like send-email, founder-linkedin, etc.
app.patch('/applications/:id', async (req, res) => {
    try {
        await connectDB();
        const { action } = req.body;
        const applicationId = req.params.id;
        const application = await JobApplication.findById(applicationId);

        if (!application) return res.status(404).json({ success: false, error: 'Application not found' });

        let result;

        switch (action) {
            case 'send-email':
                const emailPrompt = `Compose a professional email to ${application.founderName} at ${application.companyName} regarding the ${application.jobTitle} position. 
Job description: ${application.jobDescription}. Keep it concise, polite, and express continued interest. Include a professional subject line.`;

                const emailContent = await generateWithGemini(emailPrompt);
                const [subjectLine, ...bodyLines] = emailContent.split('\n');
                const subject = subjectLine.replace('Subject:', '').trim();
                const body = bodyLines.join('\n').trim();

                const emailSent = await sendEmailViaNodemailer(
                    application.founderEmail,
                    subject,
                    body.replace(/\n/g, '<br>')
                );

                if (!emailSent) throw new Error('Failed to send email');

                result = {
                    success: true,
                    message: 'Email sent successfully',
                    to: application.founderEmail
                };
                break;

            case 'founder-linkedin':
                const founderPrompt = `Create a LinkedIn connection request message for ${application.founderName} at ${application.companyName} regarding the ${application.jobTitle} position.
Job description: ${application.jobDescription}.
Keep it professional but friendly, under 300 characters.`;

                const founderMessage = await generateWithGemini(founderPrompt);

                result = {
                    success: true,
                    message: 'Founder LinkedIn message generated',
                    content: founderMessage
                };
                break;

            case 'company-linkedin':
                const companyPrompt = `Create a LinkedIn message for ${application.companyName} regarding the ${application.jobTitle} position.
Job description: ${application.jobDescription}.
Keep it professional but enthusiastic, under 300 characters.`;

                const companyMessage = await generateWithGemini(companyPrompt);

                result = {
                    success: true,
                    message: 'Company LinkedIn message generated',
                    content: companyMessage
                };
                break;

            case 'follow-up':
                const followUpPrompt = `Create a follow-up message for ${application.founderName} at ${application.companyName} regarding the ${application.jobTitle} position.
Original application date: ${application.dateApplied}.
Keep it polite and professional, expressing continued interest.`;

                const followUpMessage = await generateWithGemini(followUpPrompt);

                await JobApplication.findByIdAndUpdate(applicationId, {
                    status: 'Follow-up Pending'
                });

                result = {
                    success: true,
                    message: 'Follow-up message generated',
                    content: followUpMessage,
                    statusUpdated: true
                };
                break;

            default:
                return res.status(400).json({ success: false, error: 'Invalid action' });
        }

        res.json(result);

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE an application
app.delete('/applications/:id', async (req, res) => {
    try {
        await connectDB();
        const applicationId = req.params.id;
        await JobApplication.findByIdAndDelete(applicationId);
        res.json({ success: true, message: 'Application deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- Start Server ---
app.listen(port, (error) => {
    if (!error) {
        console.log(`Server is running on port ${port}`);
    } else {
        console.error('Server failed to start:', error);
    }
});
