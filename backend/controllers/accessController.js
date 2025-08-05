const db = require('../db');
const { sendEmail } = require('../services/emailService');
const crypto = require('crypto');

// Helper to generate a secure random password
function generatePassword(length = 10) {
  return crypto.randomBytes(length).toString('base64').slice(0, length);
}

// POST /api/request-access
exports.requestAccess = async (req, res) => {
  const { email } = req.body;
  if (!email || !email.endsWith('@binus.edu')) {
    return res.status(400).json({ message: 'Only BINUSIAN emails allowed.' });
  }
  // Check if user already exists
  db.get('SELECT * FROM teachers WHERE email = ?', [email], async (err, row) => {
    if (row) {
      return res.status(409).json({ message: 'User already exists. Please login.' });
    }
    // Generate password
    const password = generatePassword(12);
    // Store user in DB
    db.run('INSERT INTO teachers (email, password, createdAt) VALUES (?, ?, ?)', [email, password, new Date().toISOString()], async function (err) {
      if (err) return res.status(500).json({ error: err.message });
      // Send password email
      await sendEmail(
        email,
        'Your Teacher Portal Access',
        `Welcome! Your password for the Teacher Portal is: ${password}`,
        { teacherEmail: email, password }
      );
      res.status(201).json({ message: 'Access granted. Password sent to your email.' });
    });
  });
};
