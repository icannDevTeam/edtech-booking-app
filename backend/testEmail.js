require('dotenv').config();
const { sendEmail } = require('./services/emailService');

// Test data
const testData = {
  studentName: 'Test Student',
  date: '2025-08-05',
  time: '10:00-10:30',
  studentClass: '4A'
};

(async () => {
  await sendEmail(
    'albert.arthur@binus.edu',
    'Test Booking Confirmation',
    'This is a test booking confirmation email.',
    testData
  );
})();
