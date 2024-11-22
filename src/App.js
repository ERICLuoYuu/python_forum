import React, { useState, useEffect } from 'react';

// Replace these with your GitHub repository details
const GITHUB_OWNER = 'ERICLuoYuu';
const GITHUB_REPO = 'student-qa-forum';

// Modified createHeaders to work without token
const createHeaders = () => {
  return {
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'If-None-Match': ''
  };
};

// Rest of the utility functions remain the same
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

// Modified apiCall to handle public API rate limits
const apiCall = async (endpoint, options = {}) => {
  const baseUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;
  const timestamp = new Date().getTime();
  const defaultHeaders = createHeaders();
  
  try {
    const response = await fetch(`${baseUrl}${endpoint}${endpoint.includes('?') ? '&' : '?'}t=${timestamp}`, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    });

    // Handle rate limiting
    const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
    const rateLimitReset = response.headers.get('X-RateLimit-Reset');
    
    console.log('Rate limit remaining:', rateLimitRemaining);

    if (rateLimitRemaining === '0') {
      const resetDate = new Date(rateLimitReset * 1000);
      throw new Error(`API rate limit exceeded. Resets at ${resetDate.toLocaleString()}`);
    }

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

// Icons remain the same
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

// Define fetchQuestions placeholder
let fetchQuestions = async () => {};

// Helper function to wait for GitHub updates
const waitForGitHubUpdate = async () => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  return fetchQuestions();
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

  // Redefine fetchQuestions within the component
  const fetchQuestions = async () => {
  try {
    setLoading(true);
    setError(null);

    // Log the URL we're trying to access
    const repoUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;
    console.log('Attempting to access:', repoUrl);

    // Test repository access first
    const testResponse = await fetch(repoUrl);
    console.log('Repository access response:', {
      status: testResponse.status,
      ok: testResponse.ok,
      headers: Object.fromEntries(testResponse.headers.entries())
    });

    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      console.error('Repository access failed:', errorText);
      throw new Error(`Repository access failed: ${testResponse.status} ${testResponse.statusText}`);
    }

    // If repository access is successful, fetch issues
    const issuesUrl = `${repoUrl}/issues?state=open&sort=created&direction=desc`;
    console.log('Fetching issues from:', issuesUrl);

    const issuesResponse = await fetch(issuesUrl);
    console.log('Issues response:', {
      status: issuesResponse.status,
      ok: issuesResponse.ok,
      headers: Object.fromEntries(issuesResponse.headers.entries())
    });

    if (!issuesResponse.ok) {
      const errorText = await issuesResponse.text();
      console.error('Issues fetch failed:', errorText);
      throw new Error(`Failed to fetch issues: ${issuesResponse.status} ${issuesResponse.statusText}`);
    }

    const issues = await issuesResponse.json();
    console.log('Fetched issues:', issues);

    // Process issues and set state as before...
    const questionsWithAnswers = await Promise.all(
      issues.map(async issue => {
        try {
          const commentsUrl = `${repoUrl}/issues/${issue.number}/comments`;
          console.log(`Fetching comments for issue ${issue.number} from:`, commentsUrl);
          
          const commentsResponse = await fetch(commentsUrl);
          
          let comments = [];
          if (commentsResponse.ok) {
            comments = await commentsResponse.json();
          } else {
            console.warn(`Failed to fetch comments for issue ${issue.number}:`, 
              await commentsResponse.text()
            );
          }

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
    console.error('Fetch error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    setError(`Failed to load questions: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

  // Question submission handler with modified error handling
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

    setQuestions(prev => [optimisticQuestion, ...prev]);
    setNewQuestion({ title: '', content: '', code: '' });
    setShowNewQuestion(false);

    try {
      const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`, {
        method: 'POST',
        headers: createHeaders(),
        body: JSON.stringify({
          title: newQuestion.title,
          body: formatIssueBody(newQuestion.content, newQuestion.code),
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create issue: ${response.status} ${response.statusText}`);
      }

      // Wait and refresh
      await waitForGitHubUpdate();

    } catch (error) {
      console.error('Failed to submit question:', error);
      setQuestions(prev => prev.filter(q => q.id !== optimisticQuestion.id));
      setError(`Failed to post question: ${error.message}. Please try again later or contact the administrator.`);
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
      // First, try to verify access
      const checkResponse = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${questionId}`,
        { headers: createHeaders() }
      );

      if (!checkResponse.ok) {
        throw new Error('Cannot verify question access. You may not have permission to delete.');
      }

      // Delete comments first
      const commentsResponse = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${questionId}/comments`,
        { headers: createHeaders() }
      );

      if (commentsResponse.ok) {
        const comments = await commentsResponse.json();
        await Promise.all(
          comments.map(comment =>
            fetch(
              `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/comments/${comment.id}`,
              {
                method: 'DELETE',
                headers: createHeaders()
              }
            ).catch(error => console.warn(`Failed to delete comment ${comment.id}:`, error))
          )
        );
      }

      // Close the issue
      const closeResponse = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${questionId}`,
        {
          method: 'PATCH',
          headers: createHeaders(),
          body: JSON.stringify({ state: 'closed' })
        }
      );

      if (!closeResponse.ok) {
        throw new Error('Failed to close the question. You may not have permission.');
      }

      // Wait and refresh
      await waitForGitHubUpdate();

    } catch (error) {
      console.error('Delete operation failed:', error);
      setQuestions(prev => [...prev, questionToDelete]);
      setError(`Failed to delete question: ${error.message}`);
    }
  };

  // Handle answer submission
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

    // Clear input fields immediately
    const contentElement = document.getElementById(`answer-content-${questionId}`);
    const codeElement = document.getElementById(`answer-code-${questionId}`);
    contentElement.value = '';
    codeElement.value = '';

    // Update UI optimistically
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
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${questionId}/comments`,
        {
          method: 'POST',
          headers: createHeaders(),
          body: JSON.stringify({
            body: formatIssueBody(answerContent, answerCode)
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to post answer: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Update the optimistic answer with real data
      setQuestions(prev =>
        prev.map(q => {
          if (q.id === questionId) {
            return {
              ...q,
              answers: q.answers.map(a =>
                a.id === optimisticAnswer.id
                  ? {
                      id: data.id,
                      content: answerContent,
                      code: answerCode,
                      timestamp: new Date(data.created_at).toLocaleString()
                    }
                  : a
              )
            };
          }
          return q;
        })
      );

      // Wait and refresh to ensure consistency
      await waitForGitHubUpdate();

    } catch (error) {
      console.error('Failed to submit answer:', error);
      // Revert optimistic update
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
    }
  };

  // Handle answer deletion
  const handleDeleteAnswer = async (questionId, answerId) => {
    if (!window.confirm('Are you sure you want to delete this answer?')) {
      return;
    }

    const currentQuestion = questions.find(q => q.id === questionId);
    const answerToDelete = currentQuestion.answers.find(a => a.id === answerId);

    // Optimistic update
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
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/comments/${answerId}`,
        {
          method: 'DELETE',
          headers: createHeaders()
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete answer. You may not have permission.');
      }

      // Wait and refresh
      await waitForGitHubUpdate();

    } catch (error) {
      console.error('Failed to delete answer:', error);
      // Revert optimistic update
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
                <button 
                  onClick={() => setError(null)} 
                  className="mt-2 text-red-600 hover:text-red-800 text-sm"
                >
                  Dismiss
                </button>
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
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowNewQuestion(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300"
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
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center disabled:bg-blue-300"
                  disabled={loading}
                >
                  {loading && <Icons.Loading />}
                  <span className="ml-2">Submit Question</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewQuestion(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors disabled:bg-gray-200"
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
                    className="text-red-500 hover:text-red-700 p-1 transition-colors disabled:text-red-300"
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
                  <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-4 font-mono text-sm">
                    <code>{question.code}</code>
                  </pre>
                )}

                {/* Answers Section */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">
                    {question.answers.length} {question.answers.length === 1 ? 'Answer' : 'Answers'}
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
                            className="text-red-500 hover:text-red-700 p-1 transition-colors disabled:text-red-300"
                            title="Delete answer"
                            disabled={loading}
                          >
                            <Icons.Delete />
                          </button>
                        </div>
                        <p className="text-gray-700 mb-2 whitespace-pre-wrap">{answer.content}</p>
                        {answer.code && (
                          <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-2 font-mono text-sm">
                            <code>{answer.code}</code>
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
                        }
                      }}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center disabled:bg-blue-300"
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
