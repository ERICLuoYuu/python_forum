import React, { useState, useEffect } from 'react';

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
  Check: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
  )
};

// Mock users for demonstration
const USERS = {
  'tutor@example.com': { role: 'tutor', password: 'tutor123' },
  'student1@example.com': { role: 'student', password: 'student123' },
  'student2@example.com': { role: 'student', password: 'student123' }
};

function App() {
  // Auth state
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('currentUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  // Forum state
  const [questions, setQuestions] = useState(() => {
    const savedQuestions = localStorage.getItem('pythonForumQuestions');
    return savedQuestions ? JSON.parse(savedQuestions) : [];
  });
  
  const [showNewQuestion, setShowNewQuestion] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [newQuestion, setNewQuestion] = useState({
    title: '',
    content: '',
    code: ''
  });

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('pythonForumQuestions', JSON.stringify(questions));
  }, [questions]);

  useEffect(() => {
    localStorage.setItem('currentUser', JSON.stringify(user));
  }, [user]);

  // Handle login
  const handleLogin = (e) => {
    e.preventDefault();
    const userInfo = USERS[loginForm.email];
    
    if (userInfo && userInfo.password === loginForm.password) {
      setUser({
        email: loginForm.email,
        role: userInfo.role
      });
      setShowLogin(false);
      setLoginForm({ email: '', password: '' });
    } else {
      alert('Invalid credentials');
    }
  };

  // Handle logout
  const handleLogout = () => {
    setUser(null);
  };

  // Handle question submission
  const handleSubmitQuestion = (e) => {
    e.preventDefault();
    if (newQuestion.title && newQuestion.content) {
      const question = {
        id: Date.now(),
        ...newQuestion,
        authorEmail: user.email,
        timestamp: new Date().toLocaleString(),
        answers: []
      };
      setQuestions([question, ...questions]);
      setNewQuestion({ title: '', content: '', code: '' });
      setShowNewQuestion(false);
    }
  };

  // Handle question deletion (only by tutor)
  const handleDeleteQuestion = (questionId) => {
    if (user?.role === 'tutor' && window.confirm('Are you sure you want to delete this question?')) {
      setQuestions(questions.filter(q => q.id !== questionId));
    }
  };

  // Handle answer submission
  const handleSubmitAnswer = (questionId, answerContent, answerCode) => {
    if (!answerContent.trim()) {
      alert('Answer content cannot be empty');
      return;
    }
    
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        return {
          ...q,
          answers: [...q.answers, {
            id: Date.now(),
            content: answerContent,
            code: answerCode,
            authorEmail: user.email,
            timestamp: new Date().toLocaleString(),
            isApproved: user.role === 'tutor' // Auto-approve if tutor
          }]
        };
      }
      return q;
    }));
  };

  // Handle answer deletion (by tutor or answer author)
  const handleDeleteAnswer = (questionId, answerId, answerAuthorEmail) => {
    if ((user?.role === 'tutor' || user?.email === answerAuthorEmail) && 
        window.confirm('Are you sure you want to delete this answer?')) {
      setQuestions(questions.map(q => {
        if (q.id === questionId) {
          return {
            ...q,
            answers: q.answers.filter(a => a.id !== answerId)
          };
        }
        return q;
      }));
    }
  };

  // Handle answer approval (only by tutor)
  const handleApproveAnswer = (questionId, answerId) => {
    if (user?.role === 'tutor') {
      setQuestions(questions.map(q => {
        if (q.id === questionId) {
          return {
            ...q,
            answers: q.answers.map(a => 
              a.id === answerId ? { ...a, isApproved: true } : a
            )
          };
        }
        return q;
      }));
    }
  };

  // Filter questions based on search
  const filteredQuestions = questions.filter(q => 
    q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Login form component
  const LoginForm = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Login</h2>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={loginForm.email}
              onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setShowLogin(false)}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {showLogin && <LoginForm />}
      
      <div className="max-w-4xl mx-auto">
        {/* Header with Auth */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Python Q&A Forum
          </h1>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-gray-600">
                  Logged in as {user.email} ({user.role})
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="text-blue-600 hover:text-blue-800"
              >
                Login
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        {user ? (
          <>
            {/* Search and Ask Question */}
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
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
              >
                Ask a Question
              </button>
            </div>

            {/* Question Form */}
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
                      className="w-full px-3 py-2 border rounded-md"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newQuestion.content}
                      onChange={(e) => setNewQuestion({...newQuestion, content: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md"
                      rows="3"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Code (optional)
                    </label>
                    <textarea
                      value={newQuestion.code}
                      onChange={(e) => setNewQuestion({...newQuestion, code: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md font-mono text-sm"
                      rows="5"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                    >
                      Submit Question
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewQuestion(false)}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Questions List */}
            <div className="space-y-4">
              {filteredQuestions.length === 0 ? (
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
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h2 className="text-xl font-semibold">{question.title}</h2>
                        <div className="text-sm text-gray-500">
                          Posted by {question.authorEmail} on {question.timestamp}
                        </div>
                      </div>
                      {user.role === 'tutor' && (
                        <button
                          onClick={() => handleDeleteQuestion(question.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Delete question"
                        >
                          <Icons.Delete />
                        </button>
                      )}
                    </div>

                    {question.content && (
                      <p className="text-gray-700 mb-4">{question.content}</p>
                    )}
                    {question.code && (
                      <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
                        <code className="text-sm">{question.code}</code>
                      </pre>
                    )}

                    {/* Answers Section */}
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-4">
                        {question.answers.filter(a => a.isApproved || user.role === 'tutor').length} Answers
                      </h3>
                      
                      <div className="space-y-4">
                        {question.answers
                          .filter(a => a.isApproved || user.role === 'tutor')
                          .map(answer => (
                          <div key={answer.id} className="pl-4 border-l-2 border-gray-200">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="text-sm text-gray-500 mb-2">
                                  Answered by {answer.authorEmail} on {answer.timestamp}
                                </div>
                                {!answer.isApproved && user.role === 'tutor' && (
                                  <div className="mb-2">
                                    <span className="text-orange-500 text-sm font-medium">
                                      Pending Approval
                                    </span>
                                    <button
                                      onClick={() => handleApproveAnswer(question.id, answer.id)}
                                      className="ml-2 text-green-500 hover:text-green-700"
                                      title="Approve answer"
                                    >
                                      <Icons.Check />
                                    </button>
                                  </div>
                                )}
                                {answer.isApproved && (
                                  <div className="text-green-500 text-sm font-medium mb-2">
                                    ✓ Approved
                                  </div>
                                )}
                              </div>
                              {(user.role === 'tutor' || user.email === answer.authorEmail) && (
                                <button
                                  onClick={() => handleDeleteAnswer(question.id, answer.id, answer.authorEmail)}
                                  className="text-red-500 hover:text-red-700 p-1"
                                  title="Delete answer"
                                >
                                  <Icons.Delete />
                                </button>
                              )}
                            </div>
                            <p className="text-gray-700 mb-2">{answer.content}</p>
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
                          className="w-full px-3 py-2 border rounded-md mb-2"
                          rows="3"
                          id={`answer-content-${question.id}`}
                        />
                        <textarea
                          placeholder="Add Python code (optional)..."
                          className="w-full px-3 py-2 border rounded-md mb-2 font-mono text-sm"
                          rows="3"
                          id={`answer-code-${question.id}`}
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
                          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                        >
                          Submit Answer
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-gray-600 text-center">
              Please login to ask questions and participate in discussions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
                                
