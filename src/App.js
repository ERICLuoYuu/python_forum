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

// Create headers with authentication
const createHeaders = () => {
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };

    const token = process.env.REACT_APP_GH_TOKEN;
    if (token) {
      headers['Authorization'] = `token ${token}`;
    } else {
      console.warn('GitHub token is not set!');
    }

    return headers;
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
      setError(null); // Clear any previous errors
      
      // First check if the repo exists and issues are enabled
      const repoResponse = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`,
        {
          headers: createHeaders()
        }
      );

      if (!repoResponse.ok) {
        throw new Error('Repository not found or access denied');
      }

      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues?state=open`,
        {
          headers: createHeaders()
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        if (response.status === 404) {
          throw new Error('Issues feature might be disabled. Please check repository settings.');
        } else if (response.status === 401) {
          throw new Error('Authentication failed. Please check your GitHub token.');
        } else {
          throw new Error(`GitHub API error: ${errorData.message || response.statusText}`);
        }
      }

      const issues = await response.json();
      
      // Fetch comments for each issue
      const questionsWithAnswers = await Promise.all(issues.map(async (issue) => {
        const commentsResponse = await fetch(
          `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${issue.number}/comments`,
          {
            headers: createHeaders()
          }
        );
        
        if (!commentsResponse.ok) {
          console.warn(`Failed to fetch comments for issue ${issue.number}`);
          return {
            id: issue.number,
            title: issue.title,
            ...parseIssueBody(issue.body),
            timestamp: new Date(issue.created_at).toLocaleString(),
            answers: []
          };
        }
        
        const comments = await commentsResponse.json();
        return {
          id: issue.number,
          title: issue.title,
          ...parseIssueBody(issue.body),
          timestamp: new Date(issue.created_at).toLocaleString(),
          answers: comments.map(comment => ({
            id: comment.id,
            ...parseIssueBody(comment.body),
            timestamp: new Date(comment.created_at).toLocaleString()
          }))
        };
      }));
      
      setQuestions(questionsWithAnswers);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(`Failed to load questions: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle question submission
  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.title.trim() || !newQuestion.content.trim()) {
      alert('Title and description are required!');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Submitting question:', {
        title: newQuestion.title,
        body: formatIssueBody(newQuestion.content, newQuestion.code)
      });

      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`,
        {
          method: 'POST',
          headers: createHeaders(),
          body: JSON.stringify({
            title: newQuestion.title,
            body: formatIssueBody(newQuestion.content, newQuestion.code),
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create question');
      }

      const newIssue = await response.json();
      console.log('New issue created:', newIssue);

      // Add the new question to the state immediately
      const newQuestionData = {
        id: newIssue.number,
        title: newIssue.title,
        content: newQuestion.content,
        code: newQuestion.code,
        timestamp: new Date(newIssue.created_at).toLocaleString(),
        answers: []
      };

      setQuestions(prevQuestions => [newQuestionData, ...prevQuestions]);
      setNewQuestion({ title: '', content: '', code: '' });
      setShowNewQuestion(false);
      alert('Question posted successfully!');

      // Refresh the questions list to ensure everything is in sync
      await fetchQuestions();
    } catch (err) {
      console.error('Error posting question:', err);
      setError('Failed to post question: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle answer submission
  const handleSubmitAnswer = async (questionId, answerContent, answerCode) => {
    if (!answerContent.trim()) {
      alert('Answer content cannot be empty');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${questionId}/comments`,
        {
          method: 'POST',
          headers: createHeaders(),
          body: JSON.stringify({
            body: formatIssueBody(answerContent, answerCode),
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to post answer');
      }

      await fetchQuestions();
      alert('Answer posted successfully!');
    } catch (err) {
      setError('Failed to post answer: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle question deletion
  const handleDeleteQuestion = async (questionId) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        setLoading(true);
        setError(null);

        // First, delete all comments of the issue
        const commentsResponse = await fetch(
          `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${questionId}/comments`,
          { headers: createHeaders() }
        );

        if (commentsResponse.ok) {
          const comments = await commentsResponse.json();
          // Delete each comment
          for (const comment of comments) {
            await fetch(
              `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/comments/${comment.id}`,
              {
                method: 'DELETE',
                headers: createHeaders()
              }
            );
          }
        }

        // Then close the issue
        const response = await fetch(
          `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${questionId}`,
          {
            method: 'PATCH',
            headers: createHeaders(),
            body: JSON.stringify({
              state: 'closed'
            })
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete question');
        }

        // Update local state
        setQuestions(prevQuestions => 
          prevQuestions.filter(q => q.id !== questionId)
        );

        // Wait a bit to ensure GitHub API has processed everything
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Refresh the questions list
        await fetchQuestions();
        
        alert('Question deleted successfully!');
      } catch (err) {
        console.error('Error deleting question:', err);
        setError('Failed to delete question: ' + err.message);
        // Refresh questions to ensure UI is in sync
        await fetchQuestions();
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle answer deletion
  const handleDeleteAnswer = async (questionId, answerId) => {
    if (window.confirm('Are you sure you want to delete this answer?')) {
      try {
        setLoading(true);
        setError(null);

        console.log('Deleting answer:', answerId);

        const response = await fetch(
          `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/comments/${answerId}`,
          {
            method: 'DELETE',
            headers: createHeaders()
          }
        );

        if (!response.ok && response.status !== 404) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to delete answer');
        }

        // Update local state
        setQuestions(prevQuestions => 
          prevQuestions.map(q => {
            if (q.id === questionId) {
              return {
                ...q,
                answers: q.answers.filter(a => a.id !== answerId)
              };
            }
            return q;
          })
        );

        // Wait a bit to ensure GitHub API has processed the deletion
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Refresh the questions list
        await fetchQuestions();
        
        alert('Answer deleted successfully!');
      } catch (err) {
        console.error('Error deleting answer:', err);
        setError('Failed to delete answer: ' + err.message);
        // Refresh questions to ensure UI is in sync
        await fetchQuestions();
      } finally {
        setLoading(false);
      }
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
