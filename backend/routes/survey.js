const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');

const prisma = new PrismaClient();

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  }
});

// Function to send personality report email
const sendPersonalityReportEmail = async (userEmail, userName, personalityData) => {
  const emailContent = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 5px; }
          .content { background: white; padding: 30px; border-radius: 5px; margin-top: 20px; }
          .personality-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .profile-item { margin: 15px 0; padding: 10px; background: #f0f0f0; border-left: 4px solid #667eea; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Your Personality Assessment Results</h1>
          </div>
          
          <div class="content">
            <p>Hi ${userName},</p>
            <p>Thank you for completing the Personality Discovery Assessment! Here are your results:</p>
            
            <div class="personality-card">
              <h2>${personalityData.profile?.animal} - ${personalityData.profile?.name}</h2>
              <p>${personalityData.profile?.description}</p>
            </div>
            
            <h3>Your Profile</h3>
            <div class="profile-item">
              <strong>Personality Type:</strong> ${personalityData.classification}
            </div>
            <div class="profile-item">
              <strong>Classification Strength:</strong> ${personalityData.rating || 'N/A'}
            </div>
            
            ${personalityData.profile?.traits ? `
            <div class="profile-item">
              <strong>Key Traits:</strong><br/>
              ${personalityData.profile.traits.map(t => `• ${t}`).join('<br/>')}
            </div>
            ` : ''}
            
            ${personalityData.profile?.strengths ? `
            <div class="profile-item">
              <strong>Strengths:</strong><br/>
              ${personalityData.profile.strengths.map(s => `• ${s}`).join('<br/>')}
            </div>
            ` : ''}
            
            ${personalityData.profile?.weaknesses ? `
            <div class="profile-item">
              <strong>Areas for Development:</strong><br/>
              ${personalityData.profile.weaknesses.map(w => `• ${w}`).join('<br/>')}
            </div>
            ` : ''}
            
            ${personalityData.profile?.careerFit ? `
            <div class="profile-item">
              <strong>Suitable Career Paths:</strong><br/>
              ${personalityData.profile.careerFit.map(c => `• ${c}`).join('<br/>')}
            </div>
            ` : ''}
            
            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              Best regards,<br/>
              <strong>Personality Discovery Assessment Team</strong>
            </p>
          </div>
          
          <div class="footer">
            <p>© 2025 Personality Discovery Assessment. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'noreply@personalityassessment.com',
      to: userEmail,
      subject: `Your Personality Assessment Results: ${personalityData.classification}`,
      html: emailContent
    });
    console.log('✅ Email sent successfully to:', userEmail);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
};

// Create user and save initial info
router.post('/user', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('age').isInt({ min: 5, max: 100 }).withMessage('Age must be between 5 and 100'),
  body('profession').isIn(['student', 'working']).withMessage('Profession must be student or working'),
  body('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('❌ Validation errors:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    console.log('📝 Creating user with email:', req.body.email);
    const user = await prisma.user.create({
      data: {
        name: req.body.name,
        age: req.body.age,
        profession: req.body.profession,
        email: req.body.email.toLowerCase()
      }
    });

    console.log('✅ User created successfully:', user.id);
    res.json({ success: true, userId: user.id });
  } catch (error) {
    console.error('❌ Error saving user:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      fullError: error
    });
    
    if (error.code === 'P2002') {
      console.error('⚠️  Unique constraint violation on:', error.meta?.target);
      const field = error.meta?.target?.[0] || 'email';
      res.status(400).json({ 
        error: `This ${field} is already registered. Please use a different ${field}.`,
        code: 'DUPLICATE_EMAIL'
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to save user information. Please try again.',
        details: error.message,
        code: 'USER_CREATE_ERROR'
      });
    }
  }
});

// Submit survey answers
router.post('/submit', async (req, res) => {
  const { userId, answers, classification, score, answerCounts, answerBreakdown, profile, rating } = req.body;

  if (!userId || !answers || !classification) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Create the survey response
    const response = await prisma.surveyResponse.create({
      data: {
        userId,
        answers: typeof answers === 'string' ? answers : JSON.stringify(answers),
        classification,
        score: score || 0,
        answerCounts: typeof answerCounts === 'string' ? answerCounts : JSON.stringify(answerCounts || {}),
        answerBreakdown: typeof answerBreakdown === 'string' ? answerBreakdown : JSON.stringify(answerBreakdown || {})
      }
    });

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (user) {
      // Send email with personality report
      const personalityData = {
        classification,
        profile,
        rating,
        answerCounts: typeof answerCounts === 'string' ? JSON.parse(answerCounts) : answerCounts
      };
      
      await sendPersonalityReportEmail(user.email, user.name, personalityData);
    }

    res.json({ success: true, responseId: response.id });
  } catch (error) {
    console.error('Error saving survey response:', error);
    res.status(500).json({ error: 'Failed to save survey response' });
  }
});

// Get user data
router.get('/user/:userId', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.userId },
      include: { surveyResponses: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Get survey response
router.get('/response/:responseId', async (req, res) => {
  try {
    const response = await prisma.surveyResponse.findUnique({
      where: { id: req.params.responseId },
      include: { user: true }
    });

    if (!response) {
      return res.status(404).json({ error: 'Response not found' });
    }
    res.json(response);
  } catch (error) {
    console.error('Error fetching response:', error);
    res.status(500).json({ error: 'Failed to fetch response' });
  }
});

// Get all responses for analysis
router.get('/responses', async (req, res) => {
  try {
    const responses = await prisma.surveyResponse.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json(responses);
  } catch (error) {
    console.error('Error fetching responses:', error);
    res.status(500).json({ error: 'Failed to fetch responses' });
  }
});

// TEMPORARY: Clear all users and survey responses (admin only)
router.post('/admin/clear', async (req, res) => {
  try {
    await prisma.surveyResponse.deleteMany({});
    await prisma.user.deleteMany({});
    res.json({ success: true, message: 'All data cleared.' });
  } catch (error) {
    console.error('Error clearing data:', error);
    res.status(500).json({ error: 'Failed to clear data.' });
  }
});

module.exports = router;
