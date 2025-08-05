/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onRequest } = require("firebase-functions/v2/https");


require('dotenv').config();
const functions   = require('firebase-functions');
const admin = require('firebase-admin');
const SibApiV3Sdk = require('sib-api-v3-sdk');

admin.initializeApp();
const db = admin.firestore();

// Set up Brevo (Sendinblue)
const client = SibApiV3Sdk.ApiClient.instance;
client.authentications['api-key'].apiKey = process.env.BREVO_KEY;
const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();

// Minimal test endpoint to send an email
exports.sendTestEmail = onRequest(async (req, res) => {
  try {
    const sendSmtpEmail = {
      to: [{ email: req.body.to || 'your@email.com', name: req.body.name || 'Test User' }],
      sender: { email: 'arthurapp05@gmail.com', name: 'Your Name' },
      subject: 'Test Email from Firebase Function',
      htmlContent: '<h1>Hello from Firebase & Brevo!</h1><p>This is a test email.</p>'
    };
    const result = await emailApi.sendTransacEmail(sendSmtpEmail);
    res.status(200).send({ success: true, result });
  } catch (err) {
    logger.error('Email send failed', err);
    res.status(500).send({ success: false, error: err.message });
  }
});



// Firestore trigger: send email when a new booking is created (v2 API)
const {onDocumentCreated} = require("firebase-functions/v2/firestore");
exports.sendBookingEmail = onDocumentCreated("bookings/{bookingId}", async (event) => {
  const data = event.data?.data();
  if (!data || !data.studentEmail) {
    logger.error('Missing booking data or studentEmail');
    return;
  }
  try {
    const calendarLink = `https://www.google.com/calendar/render?action=TEMPLATE&text=Booking+with+${encodeURIComponent(data.studentName || 'Student')}&dates=${data.date.replace(/-/g, '')}T${data.time.replace(/:/g, '')}00Z/${data.date.replace(/-/g, '')}T${data.time.replace(/:/g, '')}00Z&details=Your+booking+is+confirmed+at+${data.time}+on+${data.date}&location=Online`;

    const sendSmtpEmail = {
      to: [{ email: data.studentEmail, name: data.studentName || 'Student' }],
      sender: { email: 'arthurapp05@gmail.com', name: 'Your Name' },
      subject: 'Your Booking is Confirmed!',
      htmlContent: `
        <h1>Booking Confirmed</h1>
        <p>Hi ${data.studentName || ''},</p>
        <p>Your booking for ${data.date} at ${data.time} is confirmed!</p>
        <p>At BINUS, we value:</p>
        <ul>
          <li><strong>Perseverance</strong>: Keep striving for your goals.</li>
          <li><strong>Integrity</strong>: Always act with honesty and ethics.</li>
          <li><strong>Teamwork</strong>: Collaborate and grow together.</li>
          <li><strong>Striving for Excellence</strong>: Aim for the best in everything you do.</li>
        </ul>
        <p><a href="${calendarLink}" target="_blank">Add to Calendar</a></p>
      `
    };
    await emailApi.sendTransacEmail(sendSmtpEmail);
    logger.info('Booking confirmation email sent to', data.studentEmail);
  } catch (err) {
    logger.error('Failed to send booking email', err);
  }
});

// Request access function
exports.requestAccess = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send({ message: 'Method not allowed' });
    return;
  }
  const { email } = req.body;
  if (!email || !email.endsWith('@binus.edu')) {
    res.status(400).send({ message: 'Only BINUSIAN emails allowed.' });
    return;
  }
  // Check if user already exists
  const teachersRef = db.collection('teachers');
  const existing = await teachersRef.where('email', '==', email).get();
  if (!existing.empty) {
    res.status(409).send({ message: 'User already exists. Please login.' });
    return;
  }
  // Generate password
  const password = Math.random().toString(36).slice(-10);
  // Store user in Firestore
  await teachersRef.add({
    email,
    password,
    createdAt: new Date().toISOString(),
  });
  // Send password email
  await emailApi.sendTransacEmail({
    to: [{ email }],
    sender: { email: process.env.BREVO_SENDER, name: 'EdTech Booking' },
    subject: 'Your Access Request',
    htmlContent: `
      <h1>Access Request Received</h1>
      <p>Hi there,</p>
      <p>Thank you for your interest in EdTech Booking. Your access request has been received.</p>
      <p>Please use the following credentials to log in:</p>
      <p>Email: ${email}</p>
      <p>Password: ${password}</p>
      <p>We recommend that you change your password after your first login.</p>
      <p>Best regards,<br/>The EdTech Booking Team</p>
    `
  });
  res.status(200).send({ message: 'Access requested successfully. Please check your email.' });
});

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
