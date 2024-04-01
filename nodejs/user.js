// users.js

const pool = require('./db');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

function createUser(username, email, password, role, callback) {
    pool.query(
        'INSERT INTO users (username, role, email, password) VALUES (?, ?, ?, ?)',
        [username, role, email, password],
        (error, results) => {
            if (error) {
                return callback(error, null);
            }
            return callback(null, 'User created successfully');
        }
    );
}

// Function to authenticate user by email and password
function authenticateUser(email, password, callback) {
    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error connecting to database:', err);
            return callback(err, null);
        }

        const query = 'SELECT * FROM users WHERE email = ? AND password = ?';
        connection.query(query, [email, password], (error, results) => {
            connection.release(); // Release connection after query execution

            if (error) {
                console.error('Error executing query:', error);
                return callback(error, null);
            }

            if (results.length > 0) {
                // User found, return user data
                const user = results[0];
                return callback(null, user);
            } else {
                // User not found
                return callback(null, null);
            }
        });
    });
}

// Initialize nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'Gmail', // Use your email service here
    auth: {
        user: '', // Use your SMTP email username for otp configuration 
        pass: ''  // Use your SMTP password for otp configuration
    }
});

// Function to send OTP via email
function sendOTP(email, otp) {
    const mailOptions = {
        from: '', // Add from email here
        to: email,
        subject: 'OTP for Login',
        text: `Your OTP for login is: ${otp}`
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
}

// Middleware to authenticate user using JWT token
function checkUser(req, res, next) {
    // Extract token from headers or query parameters
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token
    jwt.verify(token, 'add_your_jwt_secret_key', (error, decoded) => {
        if (error) {
            console.error('Error verifying token:', error);
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Attach user information to the request object
        req.user = decoded;
        next();
    });
}

module.exports = {
    createUser,
    authenticateUser,
    sendOTP, checkUser
};
