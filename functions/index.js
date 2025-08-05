/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */


require('dotenv').config();         // ← load .env into process.env
const functions   = require('firebase-functions');
const SibApiV3Sdk = require('sib-api-v3-sdk');
const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/https");
const logger = require("firebase-functions/logger");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const {getFirestore} = require("firebase-admin/firestore");
const admin = require("firebase-admin");
if (!admin.apps.length) admin.initializeApp();

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// --- Brevo (Sendinblue) Email Setup ---
const client = SibApiV3Sdk.ApiClient.instance;
client.authentications['api-key'].apiKey = process.env.SENDINBLUE_KEY;
const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();

// Minimal test endpoint to send an email
exports.sendTestEmail = onRequest(async (req, res) => {
  try {
    const sendSmtpEmail = {
      to: [{ email: req.body.to || 'your@email.com', name: req.body.name || 'Test User' }],
      sender: { email: 'arthurapp05@gmail.com', name: 'Discovery Room Booking' },
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
      sender: { email: 'arthurapp05@gmail.com', name: 'Discovery Room Booking' },
      subject: 'Your Discovery Room Booking is confirmed!',
      htmlContent: `
        <h1>Your Discovery Room Booking is confirmed.</h1>
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

// Scheduled function: send daily summary of all bookings
exports.sendDailyBookingSummary = onSchedule({
  schedule: 'every day 08:00', // 8 AM UTC daily
  timeZone: 'Asia/Jakarta',
}, async (event) => {
  const db = getFirestore();
  const snapshot = await db.collection('bookings').get();
  if (snapshot.empty) return;

  let rows = '';
  snapshot.forEach(doc => {
    const d = doc.data();
    rows += `<tr><td>${d.studentName || ''}</td><td>${d.studentEmail || ''}</td><td>${d.date || ''}</td><td>${d.time || ''}</td></tr>`;
  });

  const htmlTable = `
    <h2>Discovery Room Booking - Daily Summary</h2>
    <table border="1" cellpadding="5" cellspacing="0">
      <thead>
        <tr><th>Name</th><th>Email</th><th>Date</th><th>Time</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  const sendSmtpEmail = {
    to: [{ email: 'albert.arthur@binus.edu', name: 'Albert Arthur' }],
    sender: { email: 'arthurapp05@gmail.com', name: 'Discovery Room Booking' },
    subject: 'Daily Discovery Room Booking Summary',
    htmlContent: htmlTable
  };
  await emailApi.sendTransacEmail(sendSmtpEmail);
});

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
