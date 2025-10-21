const mongoose = require('mongoose');

const surveyResponseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  answers: {
    type: Map,
    of: String,
    required: true
  },
  classification: {
    type: String,
    required: true
  },
  score: {
    type: Object,
    default: {}
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SurveyResponse', surveyResponseSchema);
