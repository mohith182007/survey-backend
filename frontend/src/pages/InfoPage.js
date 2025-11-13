import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitUserInfo } from '../utils/api';
import './InfoPage.css';

function InfoPage({ onUserCreated }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    profession: '',
    email: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.age || formData.age < 5 || formData.age > 100) newErrors.age = 'Age must be between 5 and 100';
    if (!formData.profession) newErrors.profession = 'Please select your employment status';
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) newErrors.email = 'Valid email is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    const payload = {
      ...formData,
      age: Number(formData.age)
    };
    try {
      console.log('📤 Submitting form with payload:', payload);
      const result = await submitUserInfo(payload);
      console.log('✅ Form submission successful:', result);
      
      if (!result.userId) {
        console.error('❌ No userId in response:', result);
        setErrors({ submit: 'Server error: No user ID returned' });
        setLoading(false);
        return;
      }
      
      onUserCreated(result.userId);
      navigate('/questions');
    } catch (error) {
      console.error('❌ Form submission error:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      
      let errorMessage = 'Failed to submit form';
      
      // Check for backend error response
      if (error.response?.data) {
        console.log('Backend error data:', error.response.data);
        
        if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
          errorMessage = error.response.data.errors[0]?.msg || 'Validation error occurred';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.log('🎯 Final error message:', errorMessage);
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="info-page">
      <div className="hero-section">
        <div className="hero-content">
          <h1>Discover Your Personality</h1>
          <p className="hero-subtitle">Understand yourself better through our interactive personality assessment</p>
        </div>
      </div>

      <div className="container">
        <div className="main-content">
          {/* Left Side - 3 Cards */}
          <div className="personality-showcase">
            <div className="personality-card">
              <div className="card-icon">🦉</div>
              <h3>The Silent Sentinel</h3>
              <p>Solitary observer, handles challenges independently</p>
            </div>
            <div className="personality-card">
              <div className="card-icon">🦊</div>
              <h3>The Watchful Gardener</h3>
              <p>Intelligent and cautious, wisely selective</p>
            </div>
            <div className="personality-card">
              <div className="card-icon">🐬</div>
              <h3>The Empathic Anchor</h3>
              <p>Thrives in connection and cooperation</p>
            </div>
          </div>

          {/* Middle - Form */}
          <div className="form-wrapper">
            <h2>Let's Get Started</h2>
            <p className="form-subtitle">Tell us about yourself</p>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                />
                {errors.name && <div className="error">{errors.name}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="age">Age *</label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  placeholder="Enter your age"
                  min="5"
                  max="100"
                />
                {errors.age && <div className="error">{errors.age}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="profession">Status *</label>
                <select
                  id="profession"
                  name="profession"
                  value={formData.profession}
                  onChange={handleInputChange}
                >
                  <option value="">Select an option</option>
                  <option value="student">Student</option>
                  <option value="employed">Employed</option>
                  <option value="unemployed">Unemployed</option>
                </select>
                {errors.profession && <div className="error">{errors.profession}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="example@email.com"
                />
                {errors.email && <div className="error">{errors.email}</div>}
              </div>

              {errors.submit && <div className="error" style={{ marginBottom: '20px' }}>{errors.submit}</div>}

              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? 'Submitting...' : 'Start Assessment'}
              </button>
            </form>
          </div>

          {/* Right Side - 3 Cards */}
          <div className="personality-showcase">
            <div className="personality-card">
              <div className="card-icon">🦎</div>
              <h3>The Masked Jester</h3>
              <p>Masks feelings with humor, adapts expression</p>
            </div>
            <div className="personality-card">
              <div className="card-icon">🔥</div>
              <h3>Adaptive Hybrid</h3>
              <p>Flexible blend of openness and caution</p>
            </div>
            <div className="personality-card">
              <div className="card-icon">🦋</div>
              <h3>Ambivalent Type</h3>
              <p>Craves closeness yet fears rejection</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InfoPage;
