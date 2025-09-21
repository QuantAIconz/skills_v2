// src/services/groqApi.js
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Single function declaration for generateFallbackAssessment
function generateFallbackAssessment(formData) {
  const { jobRole, type, difficulty, numberOfQuestions } = formData;

  const questions = [];
  for (let i = 1; i <= numberOfQuestions; i++) {
    questions.push({
      id: `q${i}`,
      question: `Sample question ${i} about ${jobRole} (${difficulty} difficulty)`,
      type: type,
      options: ["Option 1", "Option 2", "Option 3", "Option 4"],
      correctAnswer: "0",
      codeTemplate: type === 'coding' ? '// Write your code here' : '',
      testCases: []
    });
  }

  return {
    title: `${jobRole} Assessment`,
    description: `This is a ${difficulty} level assessment for ${jobRole} position`,
    jobRole,
    type,
    difficulty,
    questions,
    timeLimit: 30,
    passingScore: 70
  };
}

export async function generateAssessmentWithAI(formData) {
  try {
    console.log("Sending request to backend:", formData);
    
    // const response = await fetch('http://localhost:5001/generate-assessment', {
    const response = await fetch('https://skills-v2.onrender.com/generate-assessment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server error:', response.status, errorText);
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Backend response:", data);
    
    if (data.error) {
      console.warn('AI generation failed, using fallback:', data.error);
      return generateFallbackAssessment(formData);
    }
    
    return data;
  } catch (error) {
    console.error('Error generating assessment with AI, using fallback:', error);
    return generateFallbackAssessment(formData);
  }
}

// Test function to check backend connection
export async function testBackendConnection() {
  try {
    // const response = await fetch('http://localhost:5001/health');
    const response = await fetch('https://skills-v2.onrender.com/health');
    if (response.ok) {
      const data = await response.json();
      console.log('Backend health check:', data);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Backend connection test failed:', error);
    return false;
  }
}