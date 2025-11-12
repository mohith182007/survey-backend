import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitSurveyResponse } from '../utils/api';
import { calculatePersonality } from '../utils/personalityCalculator';
import './QuestionPage.css';

// Question data with answer options - 10 practical questions with real-life examples
const QUESTIONS = [
  {
    id: 1,
    text: "Your team makes a mistake in a project. What's your first instinct?",
    scenario: "Example: Missing deadline or miscommunication",
    options: [
      { label: "A", text: "Handle it privately without involving others" },
      { label: "B", text: "Think it through before discussing with them" },
      { label: "C", text: "Talk to them immediately to solve it together" },
      { label: "D", text: "Blame them and distance yourself" }
    ],
    scores: { A: -2, B: -1, C: 2, D: -2 }
  },
  {
    id: 2,
    text: "A friend is going through a tough time and reaches out to you. You:",
    scenario: "Example: Career crisis, breakup, or family issue",
    options: [
      { label: "A", text: "Feel uncomfortable and avoid the topic" },
      { label: "B", text: "Listen but keep things surface-level" },
      { label: "C", text: "Listen deeply and offer genuine support" },
      { label: "D", text: "Change the subject to something lighter" }
    ],
    scores: { A: -2, B: -1, C: 2, D: -2 }
  },
  {
    id: 3,
    text: "At a social gathering, you feel anxious. You:",
    scenario: "Example: Work party, family reunion, or new friend group",
    options: [
      { label: "A", text: "Leave early or stay isolated in corners" },
      { label: "B", text: "Stick with familiar people, observe from distance" },
      { label: "C", text: "Engage openly, start conversations naturally" },
      { label: "D", text: "Make sarcastic comments or act uninterested" }
    ],
    scores: { A: -2, B: -1, C: 2, D: -1 }
  },
  {
    id: 4,
    text: "Someone gives you critical feedback about your work. You:",
    scenario: "Example: Boss or peer points out improvement area",
    options: [
      { label: "A", text: "Feel hurt and don't want to engage further" },
      { label: "B", text: "Accept it cautiously and think about it later" },
      { label: "C", text: "Ask questions and see how you can improve" },
      { label: "D", text: "Dismiss it or get defensive" }
    ],
    scores: { A: -1, B: 0, C: 2, D: -2 }
  },
  {
    id: 5,
    text: "You're feeling stressed or sad at work. Your colleague notices. You:",
    scenario: "Example: Bad day, personal issue affecting focus",
    options: [
      { label: "A", text: "Hide it and say everything's fine" },
      { label: "B", text: "Mention something vague to avoid detailed conversation" },
      { label: "C", text: "Open up and share what's troubling you" },
      { label: "D", text: "Joke about it or get irritable" }
    ],
    scores: { A: -2, B: -1, C: 2, D: -1 }
  },
  {
    id: 6,
    text: "A close friend hasn't reached out in weeks. You:",
    scenario: "Example: Friendship seems strained or fading",
    options: [
      { label: "A", text: "Assume they don't want contact and disappear" },
      { label: "B", text: "Wait for them to make the first move" },
      { label: "C", text: "Reach out genuinely to reconnect" },
      { label: "D", text: "Feel hurt and act cold toward them" }
    ],
    scores: { A: -2, B: -1, C: 2, D: -1 }
  },
  {
    id: 7,
    text: "You need help with something you're struggling with. You:",
    scenario: "Example: Technical skills, emotional support, or advice",
    options: [
      { label: "A", text: "Try to figure it out alone, never ask" },
      { label: "B", text: "Only ask close people when absolutely necessary" },
      { label: "C", text: "Ask openly and aren't embarrassed about needing help" },
      { label: "D", text: "Feel too pride-hurt to ask anyone" }
    ],
    scores: { A: -2, B: -1, C: 2, D: -2 }
  },
  {
    id: 8,
    text: "Your partner/friend misunderstands your intentions. You:",
    scenario: "Example: They think you were rude when you were joking",
    options: [
      { label: "A", text: "Let it slide and avoid clarifying" },
      { label: "B", text: "Explain later when emotions settle" },
      { label: "C", text: "Address it right away with care" },
      { label: "D", text: "Get defensive or distance yourself" }
    ],
    scores: { A: -1, B: 0, C: 2, D: -1 }
  },
  {
    id: 9,
    text: "You see a colleague struggling with their workload. You:",
    scenario: "Example: They seem overwhelmed or stressed",
    options: [
      { label: "A", text: "Mind your own business—not your problem" },
      { label: "B", text: "Offer surface-level support if they ask" },
      { label: "C", text: "Proactively check in and offer help" },
      { label: "D", text: "Wait for them to explicitly ask for help" }
    ],
    scores: { A: -2, B: 0, C: 2, D: 0 }
  },
  {
    id: 10,
    text: "When building relationships, you naturally:",
    scenario: "Example: New colleague, neighbor, or acquaintance",
    options: [
      { label: "A", text: "Keep everyone at a safe distance emotionally" },
      { label: "B", text: "Share gradually and carefully monitor reactions" },
      { label: "C", text: "Build connections through genuine, open communication" },
      { label: "D", text: "Maintain friendliness but avoid real emotional depth" }
    ],
    scores: { A: -2, B: -1, C: 2, D: -1 }
  }
];

function QuestionPage({ userId, onResponseCreated }) {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Use mock userId if not provided (for standalone testing)
  const effectiveUserId = userId || 'mock-user-id';

  const handleAnswer = (optionLabel) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion]: optionLabel
    }));
  };

  const handleNext = () => {
    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < QUESTIONS.length) {
      setError('Please answer all questions before submitting');
      return;
    }

    setLoading(true);
    try {
      const result = calculatePersonality(answers, QUESTIONS);
      const surveyData = {
        userId: effectiveUserId,
        answers: Object.fromEntries(
          Object.entries(answers).map(([idx, ans]) => [QUESTIONS[idx].id, ans])
        ),
        classification: result.type,
        answerCounts: result.answerCounts,
        answerBreakdown: result.answerBreakdown
      };

      // Try to submit to backend, but don't fail if it's not running
      try {
        const response = await submitSurveyResponse(surveyData);
        onResponseCreated(response.responseId);
      } catch (apiError) {
        console.log('Backend not available, using local results');
        // Generate a mock response ID for local testing
        onResponseCreated('mock-response-id-' + Date.now());
      }
      
      navigate('/results', { state: { result, surveyData } });
    } catch (err) {
      setError(err.error || 'Failed to submit survey');
    } finally {
      setLoading(false);
    }
  };

  const question = QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;

  return (
    <div className="question-page container">
      <h1>Personality Discovery</h1>
      
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
      </div>
      
      <p className="progress-text">Question {currentQuestion + 1} of {QUESTIONS.length}</p>

      <div className="question-container">
        <h2>{question.text}</h2>
        {question.scenario && <p className="question-scenario">💡 {question.scenario}</p>}
        
        <div className="answer-options">
          {question.options.map((option) => (
            <label 
              key={option.label} 
              className={`option ${answers[currentQuestion] === option.label ? 'selected' : ''}`}
            >
              <input
                type="radio"
                name="answer"
                value={option.label}
                checked={answers[currentQuestion] === option.label}
                onChange={(e) => handleAnswer(e.target.value)}
              />
              <span className="option-label">{option.label}</span>
              <span className="option-text">{option.text}</span>
            </label>
          ))}
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="button-group">
        <button 
          onClick={handlePrevious} 
          disabled={currentQuestion === 0}
          className="secondary"
        >
          Previous
        </button>
        
        {currentQuestion === QUESTIONS.length - 1 ? (
          <button 
            onClick={handleSubmit} 
            disabled={loading}
            className="primary"
          >
            {loading ? 'Submitting...' : 'Submit Assessment'}
          </button>
        ) : (
          <button 
            onClick={handleNext}
            disabled={!answers[currentQuestion]}
            className="primary"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}

export default QuestionPage;
