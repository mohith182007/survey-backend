                  import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

console.log('🔗 API Base URL:', API_BASE_URL);

export const submitUserInfo = async (userData) => {
  try {
    console.log('📡 Calling API:', `${API_BASE_URL}/survey/user`);
    const response = await axios.post(`${API_BASE_URL}/survey/user`, userData);
    console.log('📨 API Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('🚨 API Error Details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    
    // Enhanced error handling
    const errorData = error.response?.data;
    
    if (errorData) {
      // Return the error response from backend
      console.log('Throwing backend error:', errorData);
      throw error; // Throw the full error object so caller can access response.data
    } else {
      // Network or parsing error
      const fallbackError = new Error(error.message);
      fallbackError.response = {
        data: {
          error: error.message || 'Network error occurred'
        }
      };
      console.log('Throwing fallback error:', fallbackError);
      throw fallbackError;
    }
  }
};

export const submitSurveyResponse = async (surveyData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/survey/submit`, surveyData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getUserData = async (userId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/survey/user/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getSurveyResponse = async (responseId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/survey/response/${responseId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
