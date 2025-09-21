// src/components/assessments/AssessmentQuestions.jsx
import { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  Circle, 
  Code, 
  FileText,
  Clock,
  AlertCircle
} from 'lucide-react';

export default function AssessmentQuestions({ questions, answers, onAnswerChange, timeLimit }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);

  const handleAnswer = (questionId, answer) => {
    onAnswerChange(questionId, answer);
  };

  const navigateToQuestion = (index) => {
    setIsNavigating(true);
    setTimeout(() => {
      setCurrentQuestion(index);
      setIsNavigating(false);
    }, 150);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setIsNavigating(true);
      setTimeout(() => {
        setCurrentQuestion(prev => prev + 1);
        setIsNavigating(false);
      }, 150);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setIsNavigating(true);
      setTimeout(() => {
        setCurrentQuestion(prev => prev - 1);
        setIsNavigating(false);
      }, 150);
    }
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-center text-gray-600 py-8">
          <AlertCircle size={20} className="mr-2" />
          No questions available.
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];

  const getQuestionIcon = (type) => {
    switch (type) {
      case 'coding':
        return <Code size={18} className="text-gray-600" />;
      case 'text':
        return <FileText size={18} className="text-gray-600" />;
      default:
        return <FileText size={18} className="text-gray-600" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 transition-all duration-300">
      {/* Header with progress and timer */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
        <div className="flex items-center">
          <div className="p-2 bg-gray-100 rounded-lg mr-3">
            {getQuestionIcon(question.type)}
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-500">Question {currentQuestion + 1} of {questions.length}</h2>
            <p className="text-xs text-gray-400">{question.type.replace('_', ' ').toUpperCase()}</p>
          </div>
        </div>
        
        {timeLimit && (
          <div className="flex items-center px-3 py-2 bg-gray-100 rounded-lg">
            <Clock size={16} className="text-gray-600 mr-2" />
            <span className="text-sm font-medium text-gray-800">{timeLimit} min</span>
          </div>
        )}
      </div>

      {/* Question content with smooth transition */}
      <div className={`mb-6 transition-opacity duration-200 ${isNavigating ? 'opacity-0' : 'opacity-100'}`}>
        <h3 className="text-lg font-medium text-gray-900 mb-4 leading-relaxed">{question.question}</h3>
        
        {question.type === 'multiple_choice' && (
          <div className="space-y-2">
            {question.options.map((option, index) => (
              <label 
                key={index} 
                className="flex items-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-all duration-200"
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={index}
                  checked={answers[question.id] === index.toString()}
                  onChange={() => handleAnswer(question.id, index.toString())}
                  className="hidden"
                />
                <div className={`flex items-center justify-center w-5 h-5 rounded-full border mr-3 transition-all duration-200 ${
                  answers[question.id] === index.toString() 
                    ? 'border-black bg-black' 
                    : 'border-gray-300'
                }`}>
                  {answers[question.id] === index.toString() && (
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  )}
                </div>
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        )}

        {question.type === 'text' && (
          <div className="border border-gray-200 rounded-xl overflow-hidden transition-all duration-200 focus-within:border-black">
            <textarea
              value={answers[question.id] || ''}
              onChange={(e) => handleAnswer(question.id, e.target.value)}
              className="w-full h-40 p-4 focus:outline-none resize-none"
              placeholder="Type your answer here..."
            />
          </div>
        )}

        {question.type === 'coding' && (
          <div>
            <div className="border border-gray-200 rounded-xl overflow-hidden mb-4 transition-all duration-200 focus-within:border-black">
              <textarea
                value={answers[question.id] || question.codeTemplate || ''}
                onChange={(e) => handleAnswer(question.id, e.target.value)}
                className="w-full h-60 font-mono text-sm p-4 focus:outline-none resize-none"
                placeholder="Write your code here..."
              />
            </div>
            {question.testCases && (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <h4 className="font-medium text-gray-900 mb-2 text-sm">Test Cases:</h4>
                <pre className="text-sm text-gray-600 overflow-auto">
                  {JSON.stringify(question.testCases, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-100">
        <button
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className="flex items-center px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:bg-gray-200"
        >
          <ChevronLeft size={18} className="mr-1" />
          Previous
        </button>
        
        <div className="flex flex-wrap justify-center gap-2 mx-4">
          {questions.map((q, index) => (
            <button
              key={index}
              onClick={() => navigateToQuestion(index)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                currentQuestion === index
                  ? 'bg-black text-white'
                  : answers[q.id]
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={currentQuestion === questions.length - 1}
          className="flex items-center px-4 py-2.5 bg-black text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:bg-gray-800"
        >
          Next
          <ChevronRight size={18} className="ml-1" />
        </button>
      </div>

      {/* Answered questions indicator */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-center text-sm text-gray-500">
          <span className="flex items-center mr-4">
            <div className="w-3 h-3 rounded-full bg-gray-800 mr-1"></div>
            Answered: {Object.keys(answers).length}
          </span>
          <span className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-gray-100 border border-gray-300 mr-1"></div>
            Unanswered: {questions.length - Object.keys(answers).length}
          </span>
        </div>
      </div>
    </div>
  );
}