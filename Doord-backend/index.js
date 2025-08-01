const port = process.env.PORT || 4000;
const express = require("express");
const mongoose = require("mongoose");
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
require('dotenv').config();
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();
app.use(bodyParser.json());
app.use(express.json({ limit: '10mb' }));

app.use(cors());

mongoose.connect('mongodb+srv://veeradyani2:S%40nju_143@cluster0.uafyz.mongodb.net/Jobs?retryWrites=true&w=majority');

const JobApplicationSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    companyName: { type: String, required: true },
    jobTitle: { type: String, required: true },
    jobDescription: { type: String, required: true },
    founderName: { type: [String], required: true },
    founderEmail: { type: [String], required: true },
    comments: { type: String, required: false },
    dateApplied: { type: Date, default: Date.now },
    founderLinkedIn: { type: [String] },
    companyLinkedIn: { type: String },
    status: {
        type: String,
        enum: ['Applied', 'Interviewing', 'Offer', 'Rejected', 'Follow-up Pending', 'Awaiting Response'],
        default: 'Applied'
    }
}, { timestamps: true });

const JobApplication = mongoose.model('JobApplication', JobApplicationSchema);

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
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent?key=${API_KEY}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [{ text: prompt }]
                    }
                ]
            })
        });

        const data = await response.json();
        console.log('Gemini API raw response:', JSON.stringify(data, null, 2));

        if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
            console.error('Gemini API malformed response:', data);
            throw new Error('Gemini API returned no candidates or malformed response');
        }

        return data.candidates[0].content.parts[0].text;
    } catch (err) {
        console.error('Error calling Gemini API:', err);
        throw new Error('Failed to generate content from Gemini API');
    }
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

app.put('/applications/:id', async (req, res) => {
    try {
        console.log(`PUT /applications/${req.params.id} called with body:`, req.body);

        
        const applicationId = req.params.id;
        const updateData = req.body;
        
        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(applicationId)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid application ID format' 
            });
        }
        
        const updatedApplication = await JobApplication.findByIdAndUpdate(
            applicationId, 
            updateData, 
            { new: true, runValidators: true }
        );
        
        if (!updatedApplication) {
            return res.status(404).json({ 
                success: false, 
                error: 'Application not found' 
            });
        }
        
        console.log('Application updated successfully:', updatedApplication._id);
        res.json({ 
            success: true, 
            application: updatedApplication,
            message: 'Application updated successfully'
        });
    } catch (error) {
        console.error('PUT /applications/:id error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            details: 'Error updating application'
        });
    }
});


// GET all job applications
app.get('/applications', async (req, res) => {
    try {
       
        const applications = await JobApplication.find();
        res.json({ success: true, applications });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});



app.patch('/applications/:id', async (req, res) => {
    try {
        const { action, target } = req.body;
        const applicationId = req.params.id;
        const application = await JobApplication.findById(applicationId);

        if (!application) {
            return res.status(404).json({ success: false, error: 'Application not found' });
        }

        let result;

        switch (action) {
            case 'send-email': {
                const emailResults = [];

                for (let i = 0; i < application.founderName.length; i++) {
                    const name = application.founderName[i];
                    const email = application.founderEmail[i];

                 const emailPrompt = `Compose a highly professional, concise, yet compelling cold email to ${application.founderName}, founder of ${name}, for the role of ${application.jobTitle}.

Context:
Job Description: ${application.jobDescription}.

About Me:
I am Veer Adyani — a passionate and detail-focused full-stack developer from Indore, India, currently pursuing my B.Tech in Computer Science (2023-2027) at Chameli Devi Group of Institutions. I specialize in the MERN stack, crafting responsive, high-performance web applications with a strong focus on UI/UX, backend architecture, database optimization, security, and scalability. I handle projects end-to-end, from design to deployment, blending creativity with robust technical implementation.
In terms of experience, I’ve worked on real-world freelance projects:
•	At W EVER CLASSES (Sep 2024 – Nov 2024, Hybrid/Remote from Indore), I worked as a Freelance Full-Stack Developer where I built a comprehensive e-commerce platform from scratch using the MERN stack. I integrated features like cart, wishlist, reviews, admin panel, secure payments, and optimized the database for large-scale performance. I independently handled the UI/UX, backend, APIs, and deployment — delivering a feature-rich and scalable platform.
•	Since April 2025, I’ve been a Freelance Backend Developer for DOORD (Canada). I developed the core REST APIs for user authentication, order creation, and service filtering. I collaborated with frontend and chat integration teams to build real-time, seamless experiences. I designed MongoDB schemas optimized for user roles, services, and live order tracking, ensuring clean, modular, and scalable code.
I’ve also created impactful projects like:
•	W EVER CLASSES Website: An e-commerce site for CA courses with dashboards, admin management, and secure payments.
🌐 Visit Site
•	Quiz.v: A dynamic quiz platform for topic-based and personality quizzes with instant feedback.
🌐 Play Now
•	nestMe: A flatmate matching app with lifestyle-based profile filtering using MERN + Next.js.
🔗 GitHub Repo
•	Well.io: A hackathon-built health tracking platform with AI insights and real-time doctor-patient interaction.
🔗 GitHub Repo
•	VisionParse: An AI-powered document parser that extracts data from structured formats using CV and ML.
🔗 GitHub Repo
My problem-solving abilities shined at the vCode Hackathon, where I secured First Runner-Up with Safeloop, a web application for community safety and incident reporting — built within tight hackathon deadlines.
When I’m not coding, I’m journaling, engaging in public speaking, playing table tennis or badminton, and connecting with people to learn and grow. I’m fluent in English and Hindi, driven by curiosity, innovation, and a desire to build tech that creates real impact.
📂 My GitHub: github.com/veeradyani222
My Portfolio: https://veeradyani.vercel.app/
This is me — I am Veer Adyani: always building, always learning, always growing.


Email Requirements:
Professional subject line that directly relates to my candidacy for ${application.jobTitle}.

Email body should:

Align my skills, experience, and projects directly to the job description.

Clearly articulate how I can contribute immediate value to the company’s mission and goals.

Highlight my key projects (with links) to showcase relevant expertise.

Express enthusiasm and respect for the founder's vision.

End with a polite call to action (e.g., expressing openness to discuss or interview further).

Maintain professional yet warm tone, under 4 concise paragraphs.

Include line breaks where necessary for readability.

Avoid generic statements — personalize based on the role and my experience.
Also include my GitHub link at the end along with the portfolio link.
"When including any links, insert them directly as hyperlinks in the text without prefacing them with phrases like 'Here is the link:' or 'Link:' or 'GitHub link:'. The links should be seamlessly embedded within the sentence."

ALSO I REPEAT-  Generate a professional, concise, and human-like cold email without adding any introductory remarks about the email itself. Do not include meta-comments like "Here's a professional email" or formatting markers such as ***, --- or Subject:. The email should flow naturally without unnecessary markers. Avoid making claims that aren't provided, such as "I have attached my resume." Keep the tone polished, personalized, and directly relevant to the provided data, making it seem as if written thoughtfully by an experienced candidate. Maintain proper structure with a polite greeting, body, and a professional closing — all styled formally yet approachable.

Also u dont have tpo include any headings like the email, no hashtags to show the heading, pls understand that this is a part of an automated functionality so no human interference will be done to your answer. Just respons witht he message content directly without any additional formatting or headings. i hope u understand that this is a part of an automated functionality so no human interference will be done to your answer.

also the msg shdnot be very short, it should highlight my things properly and how they align w the jobs desc properly.

Also pls if u dont have some data u wanna write about in the message and u dont have it from my prompt, just manaeg it rather than leaving spaces for me to fill or replace. pls understand that your response will be a part of an automadted functionality so no human interference will be done to hyour answer.
`;
                    
                    const emailContent = await generateWithGemini(emailPrompt);
                    const [subjectLine, ...bodyLines] = emailContent.split('\n');
                    const subject = subjectLine.replace('Subject:', '').trim();
                    const body = bodyLines.join('\n').trim();

                    const emailSent = await sendEmailViaNodemailer(
                        email,
                        subject,
                        body.replace(/\n/g, '<br>')
                    );

                    if (!emailSent) throw new Error(`Failed to send email to ${email}`);

                    emailResults.push({
                        to: email,
                        name,
                        subject,
                        message: body
                    });
                }

                result = {
                    success: true,
                    message: 'Emails sent to all founders successfully',
                    details: emailResults
                };
                break;
            }

            case 'founder-linkedin': {
                const linkedinMessages = [];

                for (let i = 0; i < application.founderName.length; i++) {
                    const name = application.founderName[i];

                const founderPrompt = `Create a concise, professional yet friendly LinkedIn connection request message (strictly under 300 characters) for ${name}, founder of ${application.companyName}. This is in regard to my application for the ${application.jobTitle} position.

### Job Description:
${application.jobDescription}

### About Me:
I am Veer Adyani — a passionate and detail-focused full-stack developer from Indore, India, currently pursuing my B.Tech in Computer Science (2023-2027) at Chameli Devi Group of Institutions. I specialize in the MERN stack, crafting responsive, high-performance web applications with a strong focus on UI/UX, backend architecture, database optimization, security, and scalability. I handle projects end-to-end, from design to deployment, blending creativity with robust technical implementation.
In terms of experience, I’ve worked on real-world freelance projects:
•	At W EVER CLASSES (Sep 2024 – Nov 2024, Hybrid/Remote from Indore), I worked as a Freelance Full-Stack Developer where I built a comprehensive e-commerce platform from scratch using the MERN stack. I integrated features like cart, wishlist, reviews, admin panel, secure payments, and optimized the database for large-scale performance. I independently handled the UI/UX, backend, APIs, and deployment — delivering a feature-rich and scalable platform.
•	Since April 2025, I’ve been a Freelance Backend Developer for DOORD (Canada). I developed the core REST APIs for user authentication, order creation, and service filtering. I collaborated with frontend and chat integration teams to build real-time, seamless experiences. I designed MongoDB schemas optimized for user roles, services, and live order tracking, ensuring clean, modular, and scalable code.
I’ve also created impactful projects like:
•	W EVER CLASSES Website: An e-commerce site for CA courses with dashboards, admin management, and secure payments.
🌐 Visit Site
•	Quiz.v: A dynamic quiz platform for topic-based and personality quizzes with instant feedback.
🌐 Play Now
•	nestMe: A flatmate matching app with lifestyle-based profile filtering using MERN + Next.js.
🔗 GitHub Repo
•	Well.io: A hackathon-built health tracking platform with AI insights and real-time doctor-patient interaction.
🔗 GitHub Repo
•	VisionParse: An AI-powered document parser that extracts data from structured formats using CV and ML.
🔗 GitHub Repo
My problem-solving abilities shined at the vCode Hackathon, where I secured First Runner-Up with Safeloop, a web application for community safety and incident reporting — built within tight hackathon deadlines.
When I’m not coding, I’m journaling, engaging in public speaking, playing table tennis or badminton, and connecting with people to learn and grow. I’m fluent in English and Hindi, driven by curiosity, innovation, and a desire to build tech that creates real impact.
📂 My GitHub: github.com/veeradyani222
My Portfolio: https://veeradyani.vercel.app/
This is me — I am Veer Adyani: always building, always learning, always growing.


### Objectives for the Message:
- Mention that I've applied for the ${application.jobTitle} role.
- Express my enthusiasm for the opportunity to connect and potentially collaborate.
- Politely hint at the value I can bring based on my experience.
- Use a respectful, warm tone — no flattery.
- Keep it authentic, no sales-y tone.
- Must be direct and natural for a LinkedIn connection note.

### Additional Info:
- I have prior experience in projects relevant to the role.
- I'm genuinely interested in ${application.companyName}'s mission and growth.
Also include my GitHub link at the end along with the portfolio link.
"When including any links, insert them directly as hyperlinks in the text without prefacing them with phrases like 'Here is the link:' or 'Link:' or 'GitHub link:'. The links should be seamlessly embedded within the sentence."

ALSO I REPEAT-  Generate a professional, concise, and human-like cold email without adding any introductory remarks about the email itself. Do not include meta-comments like "Here's a professional email" or formatting markers such as ***, --- or Subject:. The email should flow naturally without unnecessary markers. Avoid making claims that aren't provided, such as "I have attached my resume." Keep the tone polished, personalized, and directly relevant to the provided data, making it seem as if written thoughtfully by an experienced candidate. Maintain proper structure with a polite greeting, body, and a professional closing — all styled formally yet approachable.;

Also pls if u dont have some data u wanna write about in the message and u dont have it from my prompt, just manaeg it rather than leaving spaces for me to fill or replace. pls understand that your response will be a part of an automadted functionality so no human interference will be done to hyour answer.
Also u dont have tpo include any headings like the email, no hashtags to show the heading, pls understand that this is a part of an automated functionality so no human interference will be done to your answer. Just respons witht he message content directly without any additional formatting or headings. i hope u understand that this is a part of an automated functionality so no human interference will be done to your answer.

Also the msg shdnot be very short, it should highlight my things properly and how they align w the jobs desc properly.
`

                    
                    const founderMessage = await generateWithGemini(founderPrompt);

                    linkedinMessages.push({
                        name,
                        message: founderMessage,
                        linkedIn: application.founderLinkedIn[i] || null
                    });
                }

                result = {
                    success: true,
                    message: 'LinkedIn messages generated for all founders',
                    details: linkedinMessages
                };
                break;
            }

            case 'company-email': {
                  const companyEmailPrompt = `Compose a highly professional, concise, yet compelling cold email to the HR team or hiring manager at ${application.companyName} for the role of ${application.jobTitle}.

Context:
Job Description: ${application.jobDescription}.

About Me:
I am Veer Adyani — a passionate and detail-focused full-stack developer from Indore, India, currently pursuing my B.Tech in Computer Science (2023-2027) at Chameli Devi Group of Institutions. I specialize in the MERN stack, crafting responsive, high-performance web applications with a strong focus on UI/UX, backend architecture, database optimization, security, and scalability. I handle projects end-to-end, from design to deployment, blending creativity with robust technical implementation.
In terms of experience, I’ve worked on real-world freelance projects:
•	At W EVER CLASSES (Sep 2024 – Nov 2024, Hybrid/Remote from Indore), I worked as a Freelance Full-Stack Developer where I built a comprehensive e-commerce platform from scratch using the MERN stack. I integrated features like cart, wishlist, reviews, admin panel, secure payments, and optimized the database for large-scale performance. I independently handled the UI/UX, backend, APIs, and deployment — delivering a feature-rich and scalable platform.
•	Since April 2025, I’ve been a Freelance Backend Developer for DOORD (Canada). I developed the core REST APIs for user authentication, order creation, and service filtering. I collaborated with frontend and chat integration teams to build real-time, seamless experiences. I designed MongoDB schemas optimized for user roles, services, and live order tracking, ensuring clean, modular, and scalable code.
I’ve also created impactful projects like:
•	W EVER CLASSES Website: An e-commerce site for CA courses with dashboards, admin management, and secure payments.
🌐 Visit Site
•	Quiz.v: A dynamic quiz platform for topic-based and personality quizzes with instant feedback.
🌐 Play Now
•	nestMe: A flatmate matching app with lifestyle-based profile filtering using MERN + Next.js.
🔗 GitHub Repo
•	Well.io: A hackathon-built health tracking platform with AI insights and real-time doctor-patient interaction.
🔗 GitHub Repo
•	VisionParse: An AI-powered document parser that extracts data from structured formats using CV and ML.
🔗 GitHub Repo
My problem-solving abilities shined at the vCode Hackathon, where I secured First Runner-Up with Safeloop, a web application for community safety and incident reporting — built within tight hackathon deadlines.
When I’m not coding, I’m journaling, engaging in public speaking, playing table tennis or badminton, and connecting with people to learn and grow. I’m fluent in English and Hindi, driven by curiosity, innovation, and a desire to build tech that creates real impact.
📂 My GitHub: github.com/veeradyani222
My Portfolio: https://veeradyani.vercel.app/
This is me — I am Veer Adyani: always building, always learning, always growing.


Email Requirements:
- Professional subject line for ${application.jobTitle} application
- Address to HR/Hiring team at ${application.companyName}
- Highlight relevant skills and projects
- Express enthusiasm for the company and role
- Professional yet warm tone
- Under 4 concise paragraphs
- Include line breaks for readability
Also include my GitHub link at the end along with the portfolio link.
"When including any links, insert them directly as hyperlinks in the text without prefacing them with phrases like 'Here is the link:' or 'Link:' or 'GitHub link:'. The links should be seamlessly embedded within the sentence."

Target: HR team or hiring manager at ${application.companyName}

ALSO I REPEAT-  Generate a professional, concise, and human-like cold email without adding any introductory remarks about the email itself. Do not include meta-comments like "Here's a professional email" or formatting markers such as ***, --- or Subject:. The email should flow naturally without unnecessary markers. Avoid making claims that aren't provided, such as "I have attached my resume." Keep the tone polished, personalized, and directly relevant to the provided data, making it seem as if written thoughtfully by an experienced candidate. Maintain proper structure with a polite greeting, body, and a professional closing — all styled formally yet approachable.

Also pls if u dont have some data u wanna write about in the message and u dont have it from my prompt, just manaeg it rather than leaving spaces for me to fill or replace. pls understand that your response will be a part of an automadted functionality so no human interference will be done to hyour answer.

also the msg shdnot be very short, it should highlight my things properly and how they align w the jobs desc properly.

Also u dont have tpo include any headings like the email, no hashtags to show the heading, pls understand that this is a part of an automated functionality so no human interference will be done to your answer. Just respons witht he message content directly without any additional formatting or headings. i hope u understand that this is a part of an automated functionality so no human interference will be done to your answer.`;
                
                const companyEmailContent = await generateWithGemini(companyEmailPrompt);
                const [companySubjectLine, ...companyBodyLines] = companyEmailContent.split('\n');
                const companySubject = companySubjectLine.replace('Subject:', '').trim();
                const companyBody = companyBodyLines.join('\n').trim();

                result = {
                    success: true,
                    message: 'Company email generated successfully',
                    content: companyBody,
                    subject: companySubject,
                    to: 'hr@' + application.companyName.toLowerCase().replace(/\s+/g, '') + '.com'
                };
                break;
            }

            case 'company-linkedin': {
                const companyPrompt = `Create a concise, professional LinkedIn message to the official LinkedIn page of ${application.companyName} regarding my application for the ${application.jobTitle} position.\n\nJob Description:\n${application.jobDescription}
                
                ### About Me:
I am Veer Adyani — a passionate and detail-focused full-stack developer from Indore, India, currently pursuing my B.Tech in Computer Science (2023-2027) at Chameli Devi Group of Institutions. I specialize in the MERN stack, crafting responsive, high-performance web applications with a strong focus on UI/UX, backend architecture, database optimization, security, and scalability. I handle projects end-to-end, from design to deployment, blending creativity with robust technical implementation.
In terms of experience, I’ve worked on real-world freelance projects:
•	At W EVER CLASSES (Sep 2024 – Nov 2024, Hybrid/Remote from Indore), I worked as a Freelance Full-Stack Developer where I built a comprehensive e-commerce platform from scratch using the MERN stack. I integrated features like cart, wishlist, reviews, admin panel, secure payments, and optimized the database for large-scale performance. I independently handled the UI/UX, backend, APIs, and deployment — delivering a feature-rich and scalable platform.
•	Since April 2025, I’ve been a Freelance Backend Developer for DOORD (Canada). I developed the core REST APIs for user authentication, order creation, and service filtering. I collaborated with frontend and chat integration teams to build real-time, seamless experiences. I designed MongoDB schemas optimized for user roles, services, and live order tracking, ensuring clean, modular, and scalable code.
I’ve also created impactful projects like:
•	W EVER CLASSES Website: An e-commerce site for CA courses with dashboards, admin management, and secure payments.
🌐 Visit Site
•	Quiz.v: A dynamic quiz platform for topic-based and personality quizzes with instant feedback.
🌐 Play Now
•	nestMe: A flatmate matching app with lifestyle-based profile filtering using MERN + Next.js.
🔗 GitHub Repo
•	Well.io: A hackathon-built health tracking platform with AI insights and real-time doctor-patient interaction.
🔗 GitHub Repo
•	VisionParse: An AI-powered document parser that extracts data from structured formats using CV and ML.
🔗 GitHub Repo
My problem-solving abilities shined at the vCode Hackathon, where I secured First Runner-Up with Safeloop, a web application for community safety and incident reporting — built within tight hackathon deadlines.
When I’m not coding, I’m journaling, engaging in public speaking, playing table tennis or badminton, and connecting with people to learn and grow. I’m fluent in English and Hindi, driven by curiosity, innovation, and a desire to build tech that creates real impact.
📂 My GitHub: github.com/veeradyani222
My Portfolio: https://veeradyani.vercel.app/
This is me — I am Veer Adyani: always building, always learning, always growing.


### Objectives:
- Mention that this is a follow-up to my application.
- Reaffirm interest in the ${application.jobTitle} role.
- Express admiration for ${application.companyName}'s vision.
- Politely express my enthusiasm to connect.

also the msg shdnot be very short, it should highlight my things properly and how they align w the jobs desc properly.

### Guidelines:
- Respectful, non-pushy
- No flattery
- Natural and authentic tone
-Also include my GitHub link at the end along with the portfolio link.
"When including any links, insert them directly as hyperlinks in the text without prefacing them with phrases like 'Here is the link:' or 'Link:' or 'GitHub link:'. The links should be seamlessly embedded within the sentence."

ALSO I REPEAT: Do not include any meta-comment like "Here's the message." Only generate the final message.
Also pls if u dont have some data u wanna write about in the message and u dont have it from my prompt, just manaeg it rather than leaving spaces for me to fill or replace. pls understand that your response will be a part of an automadted functionality so no human interference will be done to hyour answer.
              Also u dont have tpo include any headings like the email, no hashtags to show the heading, pls understand that this is a part of an automated functionality so no human interference will be done to your answer. Just respons witht he message content directly without any additional formatting or headings. i hope u understand that this is a part of an automated functionality so no human interference will be done to your answer.  `;
                
                const companyMessage = await generateWithGemini(companyPrompt);

                result = {
                    success: true,
                    message: 'Company LinkedIn message generated',
                    content: companyMessage
                };
                break;
            }

            case 'follow-up': {
                if (!target) {
                    return res.status(400).json({ success: false, error: 'Follow-up target not specified' });
                }

                let followUpContent;

                if (target === 'founder-email') {
                    const followUps = [];

                    for (let i = 0; i < application.founderName.length; i++) {
                        const name = application.founderName[i];
                        const followUpPrompt = `Compose a professional, polite follow-up email to ${name}, founder of ${application.companyName}, regarding my previous application for the ${application.jobTitle} position.
                        
                        ### About Me:
I am Veer Adyani — a passionate and detail-focused full-stack developer from Indore, India, currently pursuing my B.Tech in Computer Science (2023-2027) at Chameli Devi Group of Institutions. I specialize in the MERN stack, crafting responsive, high-performance web applications with a strong focus on UI/UX, backend architecture, database optimization, security, and scalability. I handle projects end-to-end, from design to deployment, blending creativity with robust technical implementation.
In terms of experience, I’ve worked on real-world freelance projects:
•	At W EVER CLASSES (Sep 2024 – Nov 2024, Hybrid/Remote from Indore), I worked as a Freelance Full-Stack Developer where I built a comprehensive e-commerce platform from scratch using the MERN stack. I integrated features like cart, wishlist, reviews, admin panel, secure payments, and optimized the database for large-scale performance. I independently handled the UI/UX, backend, APIs, and deployment — delivering a feature-rich and scalable platform.
•	Since April 2025, I’ve been a Freelance Backend Developer for DOORD (Canada). I developed the core REST APIs for user authentication, order creation, and service filtering. I collaborated with frontend and chat integration teams to build real-time, seamless experiences. I designed MongoDB schemas optimized for user roles, services, and live order tracking, ensuring clean, modular, and scalable code.
I’ve also created impactful projects like:
•	W EVER CLASSES Website: An e-commerce site for CA courses with dashboards, admin management, and secure payments.
🌐 Visit Site
•	Quiz.v: A dynamic quiz platform for topic-based and personality quizzes with instant feedback.
🌐 Play Now
•	nestMe: A flatmate matching app with lifestyle-based profile filtering using MERN + Next.js.
🔗 GitHub Repo
•	Well.io: A hackathon-built health tracking platform with AI insights and real-time doctor-patient interaction.
🔗 GitHub Repo
•	VisionParse: An AI-powered document parser that extracts data from structured formats using CV and ML.
🔗 GitHub Repo
My problem-solving abilities shined at the vCode Hackathon, where I secured First Runner-Up with Safeloop, a web application for community safety and incident reporting — built within tight hackathon deadlines.
When I’m not coding, I’m journaling, engaging in public speaking, playing table tennis or badminton, and connecting with people to learn and grow. I’m fluent in English and Hindi, driven by curiosity, innovation, and a desire to build tech that creates real impact.
📂 My GitHub: github.com/veeradyani222
My Portfolio: https://veeradyani.vercel.app/
This is me — I am Veer Adyani: always building, always learning, always growing.


### Objectives:
- Mention that this is a follow-up to my application.
- Reaffirm interest in the ${application.jobTitle} role.
- Express admiration for ${application.companyName}'s vision.
- Politely express my enthusiasm to connect.

### Guidelines:
- Respectful, non-pushy
- No flattery
- Natural and authentic tone
-Also include my GitHub link at the end along with the portfolio link.
"When including any links, insert them directly as hyperlinks in the text without prefacing them with phrases like 'Here is the link:' or 'Link:' or 'GitHub link:'. The links should be seamlessly embedded within the sentence."

also the msg shdnot be very short, it should highlight my things properly and how they align w the jobs desc properly.

ALSO I REPEAT: Do not include any meta-comment like "Here's the message." Only generate the final message.
Also pls if u dont have some data u wanna write about in the message and u dont have it from my prompt, just manaeg it rather than leaving spaces for me to fill or replace. pls understand that your response will be a part of an automadted functionality so no human interference will be done to hyour answer.

Also u dont have tpo include any headings like the email, no hashtags to show the heading, pls understand that this is a part of an automated functionality so no human interference will be done to your answer. Just respons witht he message content directly without any additional formatting or headings. i hope u understand that this is a part of an automated functionality so no human interference will be done to your answer.
`;


                        const content = await generateWithGemini(followUpPrompt);
                        followUps.push({
                            name,
                            content
                        });
                    }

                    followUpContent = followUps;

                } else if (target === 'founder-linkedin') {
                    const followUps = [];

                    for (let i = 0; i < application.founderName.length; i++) {
                        const name = application.founderName[i];
                        const followUpPrompt = `Create a concise, polite LinkedIn follow-up message to ${name}, founder of ${application.companyName}, regarding my previous application for the ${application.jobTitle} position.
                        
                        ### About Me:
I am Veer Adyani — a passionate and detail-focused full-stack developer from Indore, India, currently pursuing my B.Tech in Computer Science (2023-2027) at Chameli Devi Group of Institutions. I specialize in the MERN stack, crafting responsive, high-performance web applications with a strong focus on UI/UX, backend architecture, database optimization, security, and scalability. I handle projects end-to-end, from design to deployment, blending creativity with robust technical implementation.
In terms of experience, I’ve worked on real-world freelance projects:
•	At W EVER CLASSES (Sep 2024 – Nov 2024, Hybrid/Remote from Indore), I worked as a Freelance Full-Stack Developer where I built a comprehensive e-commerce platform from scratch using the MERN stack. I integrated features like cart, wishlist, reviews, admin panel, secure payments, and optimized the database for large-scale performance. I independently handled the UI/UX, backend, APIs, and deployment — delivering a feature-rich and scalable platform.
•	Since April 2025, I’ve been a Freelance Backend Developer for DOORD (Canada). I developed the core REST APIs for user authentication, order creation, and service filtering. I collaborated with frontend and chat integration teams to build real-time, seamless experiences. I designed MongoDB schemas optimized for user roles, services, and live order tracking, ensuring clean, modular, and scalable code.
I’ve also created impactful projects like:
•	W EVER CLASSES Website: An e-commerce site for CA courses with dashboards, admin management, and secure payments.
🌐 Visit Site
•	Quiz.v: A dynamic quiz platform for topic-based and personality quizzes with instant feedback.
🌐 Play Now
•	nestMe: A flatmate matching app with lifestyle-based profile filtering using MERN + Next.js.
🔗 GitHub Repo
•	Well.io: A hackathon-built health tracking platform with AI insights and real-time doctor-patient interaction.
🔗 GitHub Repo
•	VisionParse: An AI-powered document parser that extracts data from structured formats using CV and ML.
🔗 GitHub Repo
My problem-solving abilities shined at the vCode Hackathon, where I secured First Runner-Up with Safeloop, a web application for community safety and incident reporting — built within tight hackathon deadlines.
When I’m not coding, I’m journaling, engaging in public speaking, playing table tennis or badminton, and connecting with people to learn and grow. I’m fluent in English and Hindi, driven by curiosity, innovation, and a desire to build tech that creates real impact.
📂 My GitHub: github.com/veeradyani222
My Portfolio: https://veeradyani.vercel.app/
This is me — I am Veer Adyani: always building, always learning, always growing.

also the msg shdnot be very short, it should highlight my things properly and how they align w the jobs desc properly.

### Objectives:
- Mention that this is a follow-up to my application.
- Reaffirm interest in the ${application.jobTitle} role.
- Express admiration for ${application.companyName}'s vision.
- Politely express my enthusiasm to connect.

### Guidelines:
- Respectful, non-pushy
- No flattery
- Natural and authentic tone
-Also include my GitHub link at the end along with the portfolio link.
"When including any links, insert them directly as hyperlinks in the text without prefacing them with phrases like 'Here is the link:' or 'Link:' or 'GitHub link:'. The links should be seamlessly embedded within the sentence."

ALSO I REPEAT: Do not include any meta-comment like "Here's the message." Only generate the final message.
Also pls if u dont have some data u wanna write about in the message and u dont have it from my prompt, just manaeg it rather than leaving spaces for me to fill or replace. pls understand that your response will be a part of an automadted functionality so no human interference will be done to hyour answer.
Also u dont have tpo include any headings like the email, no hashtags to show the heading, pls understand that this is a part of an automated functionality so no human interference will be done to your answer. Just respons witht he message content directly without any additional formatting or headings. i hope u understand that this is a part of an automated functionality so no human interference will be done to your answer.
`;


                        const content = await generateWithGemini(followUpPrompt);
                        followUps.push({
                            name,
                            content,
                            linkedIn: application.founderLinkedIn[i] || null
                        });
                    }

                    followUpContent = followUps;

                } else {
                    return res.status(400).json({ success: false, error: 'Invalid follow-up target' });
                }

                await JobApplication.findByIdAndUpdate(applicationId, { status: 'Follow-up Pending' });

                result = {
                    success: true,
                    message: `Follow-up messages generated for ${target}`,
                    details: followUpContent,
                    statusUpdated: true
                };
                break;
            }

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
