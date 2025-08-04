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
    const sendSmtpEmail = {
      to: [{ email: data.studentEmail, name: data.studentName || 'Student' }],
      sender: { email: 'arthurapp05@gmail.com', name: 'Your Name' },
      subject: 'Your Booking is Confirmed!',
      htmlContent: `<h1>Booking Confirmed</h1><p>Hi ${data.studentName || ''},<br>Your booking for ${data.date} at ${data.time} is confirmed!</p>`
    };
    await emailApi.sendTransacEmail(sendSmtpEmail);
    logger.info('Booking confirmation email sent to', data.studentEmail);
  } catch (err) {
    logger.error('Failed to send booking email', err);
  }
});

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
