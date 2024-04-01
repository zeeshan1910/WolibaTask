const bodyParser = require('body-parser');
const express = require('express');
const { createUser, authenticateUser, sendOTP, checkUser } = require('./user');
const randomstring = require('randomstring');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const pool = require('./db');
const multer = require('multer');
const app = express()
const port = 3000

app.use(bodyParser.json());

// Middleware to parse cookies
app.use(cookieParser());

app.get('/', (req, res) => {
    res.send('Hello World!')
})

// In-memory storage for OTPs
const otpStorage = {};

// Set up multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
});

const upload = multer({ storage: storage });

// Endpoint for user registration
app.post('/register', (req, res) => {
    const { username, email, password, role } = req.body;
    createUser(username, email, password, role, (error, result) => {
        if (error) {
            console.error('Error creating user:', error);
            return;
        }
        console.log(result);
        res.status(200).json({ message: 'User registered successfully' });
    });
})

// Endpoint for user login (first factor)
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !pass
            // Authentiword) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    // Authenticate user
    authenticateUser(email, password, (error, user) => {
        if (error) {
            return res.status(500).json({ message: 'Internal server error' });
        }

        if (user) {
            // Authentication successful generate and send OTP
            const otp = randomstring.generate({
                length: 6,
                charset: 'numeric'
            });
            otpStorage[email] = otp; // Store OTP temporarily
            sendOTP(email, otp);

            // Generate JWT token
            const token = jwt.sign({ sub: user.id,role:user.role, email: user.email }, 'wEZCCJaHOCyA85dxt3pO6z62vQD7bN82HgdwMgN9fIQSfzrMmzu6cE75cNU4Briw', { expiresIn: '1h' });

            // Set token in cookie
            res.cookie('token', token, { httpOnly: true });

            res.status(200).json({ message: 'Authentication successful and OTP sent to email', user });
        } else {
            // Authentication failed
            return res.status(401).json({ message: 'Invalid email or password' });
        }
    });
});

// Endpoint for OTP verification (second factor)
app.post('/verify', (req, res) => {
    const { email, otp } = req.body;
    const storedOTP = otpStorage[email];
    if (storedOTP && storedOTP === otp) {
        // OTP matched, authentication successful
        res.status(200).json({ message: 'OTP verification successful' });
    } else {
        // Invalid OTP
        res.status(401).json({ message: 'Invalid OTP' });
    }
});

// Endpoint to view profile details
app.get('/profile', checkUser, (req, res) => {
    const userId = req.user.userId; // Assuming you have user information available in req.user after authentication

    // Query to fetch user's profile details
    const query = 'SELECT id, username, email, role, profile_picture FROM users WHERE id = ?';

    // Execute the query
    pool.query(query, [userId], (error, results) => {
        if (error) {
            console.error('Error fetching profile details:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const profile = results[0];
        res.status(200).json(profile);
    });
});

// Endpoint to update profile details
app.put('/profile', checkUser, (req, res) => {
    const userId = req.user.userId;
    const { username, email, role, profilePicture } = req.body;

    // Update user's profile details in the database
    const query = 'UPDATE users SET username = ?, email = ?, role = ?, profile_picture = ? WHERE id = ?';
    const values = [username, email, role, profilePicture, userId];

    pool.query(query, values, (error, results) => {
        if (error) {
            console.error('Error updating profile details:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found or no changes were made' });
        }

        res.status(200).json({ message: 'Profile details updated successfully' });
    });
});

// Endpoint to request password reset
app.post('/reset-password', (req, res) => {
    const { email } = req.body;
    const otp = randomstring.generate({ length: 6, charset: 'numeric' });
    otpStorage[email] = otp;
    // Send OTP to user's email
    sendOTP(email, otp);
    res.status(200).json({ message: 'OTP sent to email' });
});

// Endpoint to verify OTP and reset password
app.post('/reset-password/verify', (req, res) => {
    const { email, otp, newPassword } = req.body;
    var userId;
    if (otpStorage[email] === otp) {

        const query = 'SELECT id FROM users WHERE email = ?';
        pool.query(query, [email], (error, results) => {
            if (error) {
                console.error('Error checking email:', error);
                return res.status(500).json({ error: 'Internal server error' });
            }

            if (results.length === 0) {
                // Email not found in the database
                return res.status(404).json({ error: 'Email not found' });
            }

            userId = results[0].id;

            // Update user's password in the database
            const updateQuery = 'UPDATE users SET password = ? WHERE id = ?';
            pool.query(updateQuery, [newPassword, userId], (error, results) => {
                if (error) {
                    console.error('Error updating password:', error);
                    return res.status(500).json({ error: 'Internal server error' });
                }
                // delete otpStorage[email]; // Remove OTP from storage
                res.status(200).json({ message: 'Password reset successful' });
            })
        })
    } else {
        res.status(400).json({ message: 'Invalid OTP' });
    }
});

// Endpoint to update password
app.put('/update-password', checkUser, (req, res) => {
    const userId = req.user.userId;
    const { oldPassword, newPassword } = req.body;

    // Check if old password matches the password in the database
    const checkPasswordQuery = 'SELECT id FROM users WHERE id = ? AND password = ?';
    const checkPasswordValues = [userId, oldPassword];

    pool.query(checkPasswordQuery, checkPasswordValues, (error, results) => {
        if (error) {
            console.error('Error checking password:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: 'Incorrect old password' });
        }

        // Update user's password in the database with the new password
        const updatePasswordQuery = 'UPDATE users SET password = ? WHERE id = ?';
        const updatePasswordValues = [newPassword, userId];

        pool.query(updatePasswordQuery, updatePasswordValues, (error, results) => {
            if (error) {
                console.error('Error updating password:', error);
                return res.status(500).json({ error: 'Internal server error' });
            }

            res.status(200).json({ message: 'Password updated successfully' });
        });
    });
});

// Endpoint to upload profile picture
app.post('/profile-picture', checkUser, upload.single('profilePicture'), upload.single('profilePicture'), (req, res) => {
    const userId = req.user.userId;

    // Get the file path of the uploaded profile picture
    const profilePicturePath = req.file.path;

    // Update the profile picture URL in the database
    const updateQuery = 'UPDATE users SET profile_picture = ? WHERE id = ?';
    const updateValues = [profilePicturePath, userId];

    pool.query(updateQuery, updateValues, (error, results) => {
        if (error) {
            console.error('Error updating profile picture URL:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }

        // Return URL of the uploaded profile picture
        res.status(200).json({ profilePictureUrl: profilePicturePath });
    });
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
