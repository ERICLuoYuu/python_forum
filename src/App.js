import React, { useState, useEffect } from 'react';

// Replace these with your GitHub repository details
const GITHUB_OWNER = 'ERICLuoYuu';
const GITHUB_REPO = 'student-qa-forum';

// Utility functions

const formatIssueBody = (content, code) => {
  return `${content}\n\n${code ? `\`\`\`python\n${code}\n\`\`\`` : ''}`;
};

const parseIssueBody = (body) => {
  if (!body) return { content: '', code: '' };
  
  const codeMatch = body.match(/```python\n([\s\S]*?)```/);
  const code = codeMatch ? codeMatch[1].trim() : '';
  const content = body.replace(/```python\n[\s\S]*?```/, '').trim();
  
  return { content, code };
};


const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const retryOperation = async (operation, maxAttempts = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      await wait(delay * attempt);
    }
  }
};

// Modified createHeaders function
// Modified createHeaders function with proper CORS headers
const createHeaders = () => {
  const token = process.env.REACT_APP_GH_TOKEN;
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Origin': window.location.origin,
    'Access-Control-Request-Method': 'GET, POST, PATCH, DELETE',
    'Access-Control-Request-Headers': 'Content-Type, Authorization'
  };

  return headers;
};

// Modified apiCall function with CORS handling
const apiCall = async (endpoint, options = {}) => {
  const baseUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;
  const defaultHeaders = createHeaders();
  
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      mode: 'cors',
      credentials: 'same-origin',
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API call failed: ${response.status}`);
    }

    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};
// Simple SVG Icons
const Icons = {
  Search: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  Delete: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  Loading: () => (
    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
};
function App() {
  // State management
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewQuestion, setShowNewQuestion] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newQuestion, setNewQuestion] = useState({
    title: '',
    content: '',
    code: ''
  });

  // Fetch questions from GitHub Issues
  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
  try {
    setLoading(true);
    setError(null);

    // Test connection and CORS setup
    const testResponse = await fetch('https://api.github.com', {
      headers: createHeaders(),
      mode: 'cors',
      credentials: 'same-origin'
    });

    if (!testResponse.ok) {
      throw new Error('GitHub API connection failed');
    }

    const issues = await apiCall('/issues?state=open&sort=updated&direction=desc');
    
    const questionsWithAnswers = await Promise.all(
      issues.map(async issue => {
        try {
          const comments = await apiCall(`/issues/${issue.number}/comments`);
          const { content, code } = parseIssueBody(issue.body);
          
          return {
            id: issue.number,
            title: issue.title,
            content,
            code,
            timestamp: new Date(issue.created_at).toLocaleString(),
            answers: comments.map(comment => ({
              id: comment.id,
              ...parseIssueBody(comment.body),
              timestamp: new Date(comment.created_at).toLocaleString()
            }))
          };
        } catch (error) {
          console.error(`Error processing issue ${issue.number}:`, error);
          return null;
        }
      })
    );

    const validQuestions = questionsWithAnswers.filter(q => q !== null);
    setQuestions(validQuestions);
  } catch (error) {
    console.error('Fetch error:', error);
    setError(`Failed to load questions: ${error.message}`);
  } finally {
    setLoading(false);
  }
};
  
  

  // Optimized question posting
  const handleSubmitQuestion = async (e) => {
  e.preventDefault();
  if (!newQuestion.title.trim() || !newQuestion.content.trim()) {
    alert('Title and description are required!');
    return;
  }

  const optimisticQuestion = {
    id: `temp-${Date.now()}`,
    title: newQuestion.title,
    content: newQuestion.content,
    code: newQuestion.code,
    timestamp: new Date().toLocaleString(),
    answers: []
  };

  // Immediate UI update
  setQuestions(prev => [optimisticQuestion, ...prev]);
  setNewQuestion({ title: '', content: '', code: '' });
  setShowNewQuestion(false);

  try {
    const response = await retryOperation(async () => {
      const result = await apiCall('/issues', {
        method: 'POST',
        body: JSON.stringify({
          title: newQuestion.title,
          body: formatIssueBody(newQuestion.content, newQuestion.code),
        })
      });

      // Wait briefly to ensure GitHub API has processed the change
      await wait(1000);
      return result;
    });

    // Fetch the updated question to ensure we have the correct data
    const updatedQuestion = await apiCall(`/issues/${response.number}`);
    const { content, code } = parseIssueBody(updatedQuestion.body);

    // Update with real data
    setQuestions(prev => [
      {
        id: updatedQuestion.number,
        title: updatedQuestion.title,
        content,
        code,
        timestamp: new Date(updatedQuestion.created_at).toLocaleString(),
        answers: []
      },
      ...prev.filter(q => q.id !== optimisticQuestion.id)
    ]);

  } catch (error) {
    setQuestions(prev => prev.filter(q => q.id !== optimisticQuestion.id));
    setError(`Failed to post question: ${error.message}`);
    // Fetch latest questions to ensure consistency
    const questions = await fetchQuestions();
    setQuestions(questions);
  }
};

// Modified handleSubmitAnswer
const handleSubmitAnswer = async (questionId, answerContent, answerCode) => {
  if (!answerContent.trim()) {
    alert('Answer content cannot be empty');
    return;
  }

  const optimisticAnswer = {
    id: `temp-${Date.now()}`,
    content: answerContent,
    code: answerCode,
    timestamp: new Date().toLocaleString()
  };

  const contentElement = document.getElementById(`answer-content-${questionId}`);
  const codeElement = document.getElementById(`answer-code-${questionId}`);
  const content = contentElement.value;
  const code = codeElement.value;
  contentElement.value = '';
  codeElement.value = '';

  setQuestions(prev =>
    prev.map(q => {
      if (q.id === questionId) {
        return {
          ...q,
          answers: [...q.answers, optimisticAnswer]
        };
      }
      return q;
    })
  );

  try {
    const response = await retryOperation(async () => {
      const result = await apiCall(`/issues/${questionId}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          body: formatIssueBody(answerContent, answerCode)
        })
      });

      // Wait briefly to ensure GitHub API has processed the change
      await wait(1000);
      return result;
    });

    // Fetch the updated comments to ensure we have the correct data
    const updatedComments = await apiCall(`/issues/${questionId}/comments`);
    const updatedAnswer = updatedComments.find(c => c.id === response.id);

    if (updatedAnswer) {
      const { content: updatedContent, code: updatedCode } = parseIssueBody(updatedAnswer.body);
      
      setQuestions(prev =>
        prev.map(q => {
          if (q.id === questionId) {
            return {
              ...q,
              answers: q.answers.map(a =>
                a.id === optimisticAnswer.id
                  ? {
                      id: updatedAnswer.id,
                      content: updatedContent,
                      code: updatedCode,
                      timestamp: new Date(updatedAnswer.created_at).toLocaleString()
                    }
                  : a
              )
            };
          }
          return q;
        })
      );
    }

  } catch (error) {
    contentElement.value = content;
    codeElement.value = code;
    
    setQuestions(prev =>
      prev.map(q => {
        if (q.id === questionId) {
          return {
            ...q,
            answers: q.answers.filter(a => a.id !== optimisticAnswer.id)
          };
        }
        return q;
      })
    );
    setError(`Failed to post answer: ${error.message}`);
    // Fetch latest questions to ensure consistency
    const questions = await fetchQuestions();
    setQuestions(questions);
  }
};

  // Handle question deletion
  const handleDeleteQuestion = async (questionId) => {
  if (!window.confirm('Are you sure you want to delete this question?')) {
    return;
  }

  const questionToDelete = questions.find(q => q.id === questionId);
  setQuestions(prev => prev.filter(q => q.id !== questionId));

  try {
    await retryOperation(async () => {
      // Delete comments first
      const comments = await apiCall(`/issues/${questionId}/comments`);
      await Promise.all(
        comments.map(comment =>
          apiCall(`/issues/comments/${comment.id}`, { method: 'DELETE' })
        )
      );

      // Then close the issue
      await apiCall(`/issues/${questionId}`, {
        method: 'PATCH',
        body: JSON.stringify({ state: 'closed' })
      });

      // Wait briefly to ensure GitHub API has processed all changes
      await wait(1000);
    });

  } catch (error) {
    setQuestions(prev => [...prev, questionToDelete]);
    setError(`Failed to delete question: ${error.message}`);
    // Fetch latest questions to ensure consistency
    const questions = await fetchQuestions();
    setQuestions(questions);
  }
};

// Modified handleDeleteAnswer
const handleDeleteAnswer = async (questionId, answerId) => {
  if (!window.confirm('Are you sure you want to delete this answer?')) {
    return;
  }

  const currentQuestion = questions.find(q => q.id === questionId);
  const answerToDelete = currentQuestion.answers.find(a => a.id === answerId);

  setQuestions(prev =>
    prev.map(q => {
      if (q.id === questionId) {
        return {
          ...q,
          answers: q.answers.filter(a => a.id !== answerId)
        };
      }
      return q;
    })
  );

  try {
    await retryOperation(async () => {
      await apiCall(`/issues/comments/${answerId}`, { method: 'DELETE' });
      // Wait briefly to ensure GitHub API has processed the change
      await wait(1000);
    });

  } catch (error) {
    setQuestions(prev =>
      prev.map(q => {
        if (q.id === questionId) {
          return {
            ...q,
            answers: [...q.answers, answerToDelete]
          };
        }
        return q;
      })
    );
    setError(`Failed to delete answer: ${error.message}`);
    // Fetch latest questions to ensure consistency
    const questions = await fetchQuestions();
    setQuestions(questions);
  }
};


  // Filter questions based on search
  const filteredQuestions = questions.filter(q => 
    q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.code.toLowerCase().includes(searchTerm.toLowerCase())
  );
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Python Q&A Forum
        </h1>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar and Ask Question Button */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-3 text-gray-400">
              <Icons.Search />
            </span>
            <input
              type="text"
              placeholder="Search python questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <button
            onClick={() => setShowNewQuestion(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            disabled={loading}
          >
            Ask a Question
          </button>
        </div>

        {/* New Question Form */}
        {showNewQuestion && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Ask a Python Question</h2>
            <form onSubmit={handleSubmitQuestion}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Title
                </label>
                <input
                  type="text"
                  value={newQuestion.title}
                  onChange={(e) => setNewQuestion({...newQuestion, title: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="What's your Python question?"
                  required
                  disabled={loading}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newQuestion.content}
                  onChange={(e) => setNewQuestion({...newQuestion, content: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Describe your question in detail..."
                  required
                  disabled={loading}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code (optional)
                </label>
                <textarea
                  value={newQuestion.code}
                  onChange={(e) => setNewQuestion({...newQuestion, code: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="5"
                  placeholder="Share your Python code here..."
                  disabled={loading}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center"
                  disabled={loading}
                >
                  {loading && <Icons.Loading />}
                  <span className="ml-2">Submit Question</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewQuestion(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Questions List */}
        <div className="space-y-4">
          {loading && !questions.length ? (
            <div className="flex justify-center items-center py-12">
              <Icons.Loading />
              <span className="ml-2">Loading questions...</span>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-6">
              <p className="text-gray-600">
                {searchTerm
                  ? 'No questions found matching your search.'
                  : 'Welcome to the Python Q&A Forum. Ask your first question!'}
              </p>
            </div>
          ) : (
            filteredQuestions.map(question => (
              <div key={question.id} className="bg-white shadow rounded-lg p-6">
                {/* Question Header */}
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-semibold">{question.title}</h2>
                  <button
                    onClick={() => handleDeleteQuestion(question.id)}
                    className="text-red-500 hover:text-red-700 p-1 transition-colors"
                    title="Delete question"
                    disabled={loading}
                  >
                    <Icons.Delete />
                  </button>
                </div>
                <div className="text-sm text-gray-500 mb-4">
                  Posted on {question.timestamp}
                </div>

                {/* Question Content */}
                {question.content && (
                  <p className="text-gray-700 mb-4 whitespace-pre-wrap">{question.content}</p>
                )}
                {question.code && (
                  <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
                    <code className="text-sm">{question.code}</code>
                  </pre>
                )}

                {/* Answers Section */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">
                    {question.answers.length} Answers
                  </h3>
                  
                  {/* Answers List */}
                  <div className="space-y-4">
                    {question.answers.map(answer => (
                      <div key={answer.id} className="pl-4 border-l-2 border-gray-200">
                        <div className="flex justify-between items-start">
                          <div className="text-sm text-gray-500 mb-2">
                            Answered on {answer.timestamp}
                          </div>
                          <button
                            onClick={() => handleDeleteAnswer(question.id, answer.id)}
                            className="text-red-500 hover:text-red-700 p-1 transition-colors"
                            title="Delete answer"
                            disabled={loading}
                          >
                            <Icons.Delete />
                          </button>
                        </div>
                        <p className="text-gray-700 mb-2 whitespace-pre-wrap">{answer.content}</p>
                        {answer.code && (
                          <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-2">
                            <code className="text-sm">{answer.code}</code>
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add Answer Form */}
                  <div className="mt-4">
                    <h4 className="text-md font-semibold mb-2">Add an Answer</h4>
                    <textarea
                      placeholder="Write your answer..."
                      className="w-full px-3 py-2 border rounded-md mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="3"
                      id={`answer-content-${question.id}`}
                      disabled={loading}
                    />
                    <textarea
                      placeholder="Add Python code (optional)..."
                      className="w-full px-3 py-2 border rounded-md mb-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="3"
                      id={`answer-code-${question.id}`}
                      disabled={loading}
                    />
                    <button
                      onClick={() => {
                        const content = document.getElementById(`answer-content-${question.id}`).value;
                        const code = document.getElementById(`answer-code-${question.id}`).value;
                        if (content) {
                          handleSubmitAnswer(question.id, content, code);
                          document.getElementById(`answer-content-${question.id}`).value = '';
                          document.getElementById(`answer-code-${question.id}`).value = '';
                        }
                      }}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center"
                      disabled={loading}
                    >
                      {loading && <Icons.Loading />}
                      <span className="ml-2">Submit Answer</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
