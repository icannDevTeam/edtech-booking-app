const { sendEmail } = require('../services/emailService');

exports.sendChatbotFallback = async (req, res) => {
  const { name, email, question } = req.body;
  if (!name || !email || !question) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  try {
    await sendEmail(
      'albert.arthur@binus.edu',
      'Chatbot Inquiry from Website',
      `A user asked an unknown question via the chatbot.\n\nName: ${name}\nEmail: ${email}\nQuestion: ${question}`
    );
    res.json({ message: 'Your question has been sent to Mr. Albert.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send email.' });
  }
};
