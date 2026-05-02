const express    = require('express');
const router     = express.Router();
const nodemailer = require('nodemailer');

router.post('/', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({
      message: 'All fields are required.'
    });
  }

  try {
    // ── Create transporter ─────────────────────────
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // ── Mail options ───────────────────────────────
    const mailOptions = {
      from:    `"LearnHub Contact" <${process.env.EMAIL_USER}>`,
      to:      process.env.EMAIL_TO,
      subject: `New Contact Message from LearnHub`,
      text: `
New contact form submission from LearnHub:

Name:    ${name}
Email:   ${email}
Message: ${message}

---
Sent from LearnHub Contact Form
      `.trim(),
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      message: 'Email sent successfully.'
    });

  } catch (error) {
    console.error('Email send error:', error.message);
    return res.status(500).json({
      message: 'Failed to send email. Please try again.'
    });
  }
});

module.exports = router;