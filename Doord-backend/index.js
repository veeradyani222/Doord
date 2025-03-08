const port = process.env.PORT || 4000;
const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const fs = require('fs');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();



app.use(bodyParser.json());
app.use(express.json({ limit: '10mb' }));
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});



// Middleware for parsing URL-encoded bodies with a size limit

app.use(express.urlencoded({ limit: '10mb', extended: true }));



app.use(cors());

// MongoDB connection
mongoose.connect('mongodb+srv://veeradyani2:S%40nju_143@cluster0.uafyz.mongodb.net/Doord?retryWrites=true&w=majority');


app.get("/", (req, res) => {
    res.send("Express app is running");
});

// Multer configuration for image upload
const uploadPath = path.join('/tmp', 'upload', 'images');

// Ensure the `/tmp/upload/images` directory exists
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true }); // Create the directory if it doesn't exist
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadPath); // Use the writable `/tmp` directory
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueSuffix); // Generate a unique filename
    },
});

const upload = multer({ storage: storage });


app.use('/images', express.static(path.join(__dirname, 'upload/images')));


// Endpoint for uploading product images
app.post("/upload", upload.single('product'), (req, res) => {
    cloudinary.uploader.upload(req.file.path, (error, result) => {
        if (error) {
            return res.status(500).json({ success: 0, message: "Image upload failed", error });
        }

        res.json({
            success: 1,
            image_url: result.secure_url // Use the secure URL provided by Cloudinary
        });
    });
});


// For faculty

app.post("/upload-faculty", upload.single('image'), (req, res) => {
    const path = req.file.path; // Get the path of the uploaded file (from multer)

    // Upload the image to Cloudinary
    cloudinary.uploader.upload(path, { folder: "faculty_images" }, (error, result) => {
        if (error) {
            console.error("Error uploading to Cloudinary:", error);
            return res.status(500).json({ success: 0, message: "Image upload failed" });
        }

        // Respond with the Cloudinary image URL
        res.json({
            success: 1,
            image_url: result.secure_url // This is the persistent Cloudinary URL
        });
    });
});


// Simplified User Schema
const Users = mongoose.model('Users', new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    date: { type: Date, default: Date.now }
}));

const pendingVerifications = {}; // Store pending email verifications

// Simplified signup route
app.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, errors: "All fields are required." });
        }

        // Check if email already exists
        const existingUser = await Users.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                errors: "Email is already registered."
            });
        }

        // Generate verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Store pending verification
        pendingVerifications[email] = {
            name,
            email,
            password,
            verificationCode,
            createdAt: Date.now()
        };

        // Send verification email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Verify Your Email',
            html: `
                <h2>Email Verification</h2>
                <p>Hi ${name},</p>
                <p>Your verification code is: <strong>${verificationCode}</strong></p>
                <p>This code will expire in 15 minutes.</p>
            `
        });

        res.json({ success: true, message: "Please verify your email address." });

    } catch (error) {
        console.error("Error during signup:", error);
        res.status(500).json({ error: "Signup failed." });
    }
});

// Verify email route
app.post('/verify-email', async (req, res) => {
    try {
        const { email, verificationCode } = req.body;
        const pendingUser = pendingVerifications[email];

        if (!pendingUser) {
            return res.status(400).json({ success: false, errors: "Verification expired or invalid email." });
        }

        if (pendingUser.verificationCode !== verificationCode) {
            return res.status(400).json({ success: false, errors: "Invalid verification code." });
        }

        // Create and save verified user
        const user = new Users({
            name: pendingUser.name,
            email: pendingUser.email,
            password: pendingUser.password
        });

        await user.save();
        delete pendingVerifications[email];

        res.json({ success: true, message: "Email verified successfully." });
    } catch (error) {
        console.error("Error during verification:", error);
        res.status(500).json({ error: "Verification failed." });
    }
});

// Login route
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await Users.findOne({ email });

        if (!user) {
            return res.json({ success: false, errors: "Email not found" });
        }

        if (password !== user.password) {
            return res.json({ success: false, errors: "Incorrect password" });
        }

        const token = jwt.sign({ user: { id: user.id } }, 'secret_ecom', { expiresIn: '730h' });
        res.json({ success: true, token });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, errors: "Login failed" });
    }
});

const fetchUser = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('auth-token');
        if (!token) {
            return res.status(401).json({ success: false, errors: "Please authenticate using a valid token" });
        }

        // Verify token
        const decoded = jwt.verify(token, 'secret_ecom');
        
        // Get user from database
        const user = await Users.findById(decoded.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, errors: "User not found" });
        }

        // Add user data to request
        req.user = user;
        next();

    } catch (error) {
        console.error("Authentication error:", error);
        res.status(401).json({ success: false, errors: "Please authenticate using a valid token" });
    }
};

// Forgot password route
app.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        const user = await Users.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Generate OTP
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        const resetToken = jwt.sign({ userId: user._id }, "secret_ecom", { expiresIn: "15m" });

        // Store OTP temporarily
        pendingVerifications[email] = { resetCode, resetToken, createdAt: Date.now() };

        // Send OTP via Email
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Password Reset Code",
            html: `<h2>Password Reset</h2><p>Hi ${user.name},</p><p>Your OTP is: <strong>${resetCode}</strong></p><p>This code expires in 15 minutes.</p>`,
        });

        res.json({ success: true, message: "OTP sent to email", resetToken });

    } catch (error) {
        console.error("Forgot Password Error:", error);
        res.status(500).json({ message: "Error sending OTP" });
    }
});

// ⬇️ 2️⃣ Verify OTP (New Route)
app.post("/verify-forgot-otp", async (req, res) => {
    try {
        const { resetToken, resetCode } = req.body;
        const decoded = jwt.verify(resetToken, "secret_ecom");
        const user = await Users.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if OTP matches
        const pendingReset = pendingVerifications[user.email];
        if (!pendingReset || pendingReset.resetCode !== resetCode) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        res.json({ success: true, message: "OTP verified!" });

    } catch (error) {
        console.error("OTP Verification Error:", error);
        res.status(400).json({ message: "Invalid or expired OTP" });
    }
});

app.post("/reset-password", async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;

        if (!resetToken || !newPassword) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Verify reset token
        const decoded = jwt.verify(resetToken, "secret_ecom");
        const user = await Users.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Ensure OTP was verified before resetting password
        if (!pendingVerifications[user.email]) {
            return res.status(400).json({ message: "OTP verification required" });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        // Clean up verification record
        delete pendingVerifications[user.email];

        res.json({ success: true, message: "Password reset successful!" });

    } catch (error) {
        console.error("Reset Password Error:", error);
        res.status(400).json({ message: "Invalid or expired token" });
    }
});

app.get('/allusers', async (req, res) => {
    try {
        let users = await Users.find({}).sort({ date: -1 });
        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

// ... existing code ...

// Merchant Schema
const Merchants = mongoose.model('Merchants', new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    address: { type: String, required: true },
    services: [{ type: String }], // Array of services
    images: [{ type: String }], // Array of image URLs
    description: { type: String },
    phone: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    date: { type: Date, default: Date.now }
}));

const pendingMerchantVerifications = {}; // Store pending merchant email verifications

// Merchant signup route
app.post('/merchant/signup', async (req, res) => {
    try {
        const { name, email, password, address, services, phone, description } = req.body;

        // Validate input
        if (!name || !email || !password || !address || !phone) {
            return res.status(400).json({ success: false, errors: "Required fields missing." });
        }

        // Check if email already exists
        const existingMerchant = await Merchants.findOne({ email });
        if (existingMerchant) {
            return res.status(400).json({
                success: false,
                errors: "Email is already registered."
            });
        }

        // Generate verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Store pending verification
        pendingMerchantVerifications[email] = {
            name,
            email,
            password,
            address,
            services: services || [],
            phone,
            description: description || '',
            verificationCode,
            createdAt: Date.now()
        };

        // Send verification email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Verify Your Merchant Account',
            html: `
                <h2>Merchant Email Verification</h2>
                <p>Hi ${name},</p>
                <p>Your verification code is: <strong>${verificationCode}</strong></p>
                <p>This code will expire in 15 minutes.</p>
            `
        });

        res.json({ success: true, message: "Please verify your email address." });

    } catch (error) {
        console.error("Error during merchant signup:", error);
        res.status(500).json({ error: "Signup failed." });
    }
});

// Verify merchant email route
app.post('/merchant/verify-email', async (req, res) => {
    try {
        const { email, verificationCode } = req.body;
        const pendingMerchant = pendingMerchantVerifications[email];

        if (!pendingMerchant) {
            return res.status(400).json({ success: false, errors: "Verification expired or invalid email." });
        }

        if (pendingMerchant.verificationCode !== verificationCode) {
            return res.status(400).json({ success: false, errors: "Invalid verification code." });
        }

        // Create and save verified merchant
        const merchant = new Merchants({
            name: pendingMerchant.name,
            email: pendingMerchant.email,
            password: pendingMerchant.password,
            address: pendingMerchant.address,
            services: pendingMerchant.services,
            phone: pendingMerchant.phone,
            description: pendingMerchant.description,
            isVerified: true
        });

        await merchant.save();
        delete pendingMerchantVerifications[email];

        // Generate token for automatic login after verification
        const token = jwt.sign({ merchant: { id: merchant.id } }, 'secret_ecom', { expiresIn: '730h' });

        res.json({ 
            success: true, 
            message: "Email verified successfully.",
            token,
            merchant: {
                id: merchant.id,
                name: merchant.name,
                email: merchant.email
            }
        });
    } catch (error) {
        console.error("Error during merchant verification:", error);
        res.status(500).json({ error: "Verification failed." });
    }
});

// Merchant login route
app.post('/merchant/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const merchant = await Merchants.findOne({ email });

        if (!merchant) {
            return res.json({ success: false, errors: "Email not found" });
        }

        if (password !== merchant.password) {
            return res.json({ success: false, errors: "Incorrect password" });
        }

        const token = jwt.sign({ merchant: { id: merchant.id } }, 'secret_ecom', { expiresIn: '730h' });
        res.json({ 
            success: true, 
            token,
            merchant: {
                id: merchant.id,
                name: merchant.name,
                email: merchant.email
            }
        });

    } catch (error) {
        console.error("Merchant login error:", error);
        res.status(500).json({ success: false, errors: "Login failed" });
    }
});

// Middleware for merchant authentication
const fetchMerchant = async (req, res, next) => {
    try {
        const token = req.header('auth-token');
        if (!token) {
            return res.status(401).json({ success: false, errors: "Please authenticate using a valid token" });
        }

        const decoded = jwt.verify(token, 'secret_ecom');
        const merchant = await Merchants.findById(decoded.merchant.id).select('-password');
        
        if (!merchant) {
            return res.status(404).json({ success: false, errors: "Merchant not found" });
        }

        req.merchant = merchant;
        next();

    } catch (error) {
        console.error("Authentication error:", error);
        res.status(401).json({ success: false, errors: "Please authenticate using a valid token" });
    }
};

// Get merchant profile
app.get('/merchant/profile', fetchMerchant, async (req, res) => {
    try {
        res.json({
            success: true,
            merchant: req.merchant
        });
    } catch (error) {
        console.error("Error fetching merchant profile:", error);
        res.status(500).json({ error: "Failed to fetch merchant profile" });
    }
});

// Update merchant profile
app.put('/merchant/update-profile', fetchMerchant, async (req, res) => {
    try {
        const { name, address, services, phone, description } = req.body;
        const merchant = await Merchants.findById(req.merchant.id);

        merchant.name = name || merchant.name;
        merchant.address = address || merchant.address;
        merchant.services = services || merchant.services;
        merchant.phone = phone || merchant.phone;
        merchant.description = description || merchant.description;

        await merchant.save();

        res.json({ success: true, message: 'Profile updated successfully', merchant });
    } catch (error) {
        console.error("Error updating merchant profile:", error);
        res.status(500).json({ error: "Failed to update profile" });
    }
});

// ... existing code ...

app.listen(port, (error) => {
    if (!error) {
        console.log("Server is running on " + port);
    } else {
        console.log("Server is not running, error - " + error);
    }
});
