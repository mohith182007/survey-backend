const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const SurveyResponse = require('../models/SurveyResponse');

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
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = new User({
      name: req.body.name,
      age: req.body.age,
      institution: req.body.institution,
      institutionName: req.body.institutionName,
      gmail: req.body.gmail
    });

    await user.save();
    res.json({ success: true, userId: user._id });
  } catch (error) {
    console.error('Error saving user:', error);
    res.status(500).json({ error: 'Failed to save user information' });
  }
});

// Submit survey answers
router.post('/submit', async (req, res) => {
  const { userId, answers, classification, score } = req.body;

  if (!userId || !answers || !classification) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const response = new SurveyResponse({
      userId,
      answers: new Map(Object.entries(answers)),
      classification,
      score
    });

    await response.save();
    res.json({ success: true, responseId: response._id });
  } catch (error) {
    console.error('Error saving survey response:', error);
    res.status(500).json({ error: 'Failed to save survey response' });
  }
});

// Get user data
router.get('/user/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Get survey response
router.get('/response/:responseId', async (req, res) => {
  try {
    const response = await SurveyResponse.findById(req.params.responseId).populate('userId');
    if (!response) {
      return res.status(404).json({ error: 'Response not found' });
    }
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch response' });
  }
});

// Get all responses for analysis
router.get('/responses', async (req, res) => {
  try {
    const responses = await SurveyResponse.find().populate('userId');
    res.json(responses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch responses' });
  }
});

module.exports = router;
