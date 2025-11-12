const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Create user and save initial info
router.post('/user', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('age').isInt({ min: 5, max: 100 }).withMessage('Age must be between 5 and 100'),
  body('institution').isIn(['school', 'university']).withMessage('Institution must be school or university'),
  body('institutionName').trim().notEmpty().withMessage('Institution name is required'),
  body('gmail').isEmail().withMessage('Valid email is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('❌ Validation errors:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    console.log('📝 Creating user with email:', req.body.gmail);
    const user = await prisma.user.create({
      data: {
        name: req.body.name,
        age: req.body.age,
        institution: req.body.institution,
        institutionName: req.body.institutionName,
        gmail: req.body.gmail
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
  const { userId, answers, classification, score, answerCounts, answerBreakdown } = req.body;

  if (!userId || !answers || !classification) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const response = await prisma.surveyResponse.create({
      data: {
        userId,
        answers,
        classification,
        score: score || 0,
        answerCounts: answerCounts || {},
        answerBreakdown: answerBreakdown || {}
      }
    });

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
