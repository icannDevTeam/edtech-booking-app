
const SibApiV3Sdk = require('sib-api-v3-sdk');

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const senderEmail = process.env.SENDER_EMAIL || 'albert.arthur@binus.edu';

exports.sendEmail = async (to, subject, text, data = {}) => {
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    // HTML email template with BINUS Simprug logo and improved design
    // Helper to format date/time for calendar links
    function getCalTimes(date, time) {
      if (!date || !time) return { start: '', end: '', startISO: '', endISO: '' };
      const [startStr, endStr] = time.split('-');
      const [year, month, day] = date.split('-');
      function pad(n) { return n.padStart(2, '0'); }
      const start = `${year}${pad(month)}${pad(day)}T${startStr.replace(':','')}00Z`;
      const end   = `${year}${pad(month)}${pad(day)}T${endStr.replace(':','')}00Z`;
      const startISO = `${year}-${pad(month)}-${pad(day)}T${startStr}:00Z`;
      const endISO   = `${year}-${pad(month)}-${pad(day)}T${endStr}:00Z`;
      return { start, end, startISO, endISO };
    }

    const calTitle = 'Meeting with Mr. Albert';
    const calDesc = `EdTech Booking for ${data.studentName || ''} (${data.studentClass || ''})`;
    const calLoc = 'Discovery Room, Tower A, 2nd Floor, BINUS School Simprug';
    const { start, end, startISO, endISO } = getCalTimes(data.date, data.time);
    const encode = encodeURIComponent;
    const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encode(calTitle)}&dates=${start}/${end}&details=${encode(calDesc)}&location=${encode(calLoc)}`;
    const outlookCalUrl = `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/view/Month&rru=addevent&startdt=${encode(startISO)}&enddt=${encode(endISO)}&subject=${encode(calTitle)}&body=${encode(calDesc)}&location=${encode(calLoc)}`;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; background: #f9fafb; color: #222;">
        <div style="max-width: 500px; margin: 24px auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 12px #e0e7ef; padding: 36px 32px 32px 32px;">
          <div style="text-align:center; margin-bottom: 18px;">
            <img src='https://binus.sch.id/wp-content/uploads/2021/09/BINUS-SCHOOL-SIMPRUG-LOGO.png' alt='BINUS Simprug Logo' style='height:60px; margin-bottom: 8px;'>
          </div>
          <h2 style="color: #2563eb; margin-top: 0; font-size: 2em;">🎉 Booking Confirmed!</h2>
          <p style="font-size: 1.1em;">Hi <b>${data.studentName || ''}</b>,</p>
          <p style="font-size: 1.1em;">Your booking with <b>Mr. Albert</b> is <span style="color: #16a34a; font-weight: bold;">confirmed</span>!</p>
          <table style="margin: 24px 0 20px 0; width: 100%; border-collapse: collapse; background: #f1f5f9; border-radius: 8px;">
            <tr>
              <td style="padding: 10px 0 10px 16px; color: #555;">Date:</td>
              <td style="padding: 10px 16px 10px 0;"><b>${data.date || ''}</b></td>
            </tr>
            <tr>
              <td style="padding: 10px 0 10px 16px; color: #555;">Time:</td>
              <td style="padding: 10px 16px 10px 0;"><b>${data.time || ''}</b></td>
            </tr>
            <tr>
              <td style="padding: 10px 0 10px 16px; color: #555;">Class:</td>
              <td style="padding: 10px 16px 10px 0;"><b>${data.studentClass || ''}</b></td>
            </tr>
            <tr>
              <td style="padding: 10px 0 10px 16px; color: #555;">Location:</td>
              <td style="padding: 10px 16px 10px 0;">
                <b>Discovery Room, Tower A, 2nd Floor</b><br>
                <span style="color:#bfa600; font-size:0.98em;">(Take the elevator, avoid the minotaurs, and if you see a robot, you’re close!)</span>
              </td>
            </tr>
          </table>
          <p style="margin: 0 0 18px 0;">We look forward to seeing you in the <b>Discovery Room</b> at <span style="color:#2563eb; font-weight:bold;">BINUS School Simprug</span>!</p>
          <div style="margin: 24px 0 0 0; padding: 16px; background: #fef9c3; border-radius: 8px; color: #bfa600; font-size: 1em;">
            If you have questions, just reply to this email.<br>See you soon! 🚀
          </div>
          <div style="margin: 32px 0 0 0; text-align:center;">
            <a href="${googleCalUrl}" style="display:inline-block; margin: 0 8px 8px 0; padding: 10px 18px; background:#2563eb; color:#fff; border-radius:6px; text-decoration:none; font-weight:bold; font-size:1em;">Add to Google Calendar</a>
            <a href="${outlookCalUrl}" style="display:inline-block; margin: 0 0 8px 8px; padding: 10px 18px; background:#bfa600; color:#800000; border-radius:6px; text-decoration:none; font-weight:bold; font-size:1em;">Add to Outlook Calendar</a>
          </div>
          <hr style="margin: 32px 0 16px 0; border: none; border-top: 1px solid #eee;">
          <div style="font-size: 12px; color: #888; text-align:center;">This is an automated message from EdTech Booking.<br>Created by Mr. Albert</div>
        </div>
      </body>
    </html>
    `;

    const sendSmtpEmail = {
        to: [{ email: to }],
        sender: { email: senderEmail, name: 'Mr. Albert (EdTech Booking)' },
        subject: subject,
        textContent: text,
        htmlContent: htmlContent
    };
    try {
        await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('Brevo email sent to', to);
    } catch (err) {
        console.error('Brevo Email Error:', err);
    }
};
