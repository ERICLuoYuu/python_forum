import React, { useState } from 'react';

// Simple SVG Icons
const Icons = {
  Search: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  Tag: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
    </svg>
  )
};

// Categories for questions
const CATEGORIES = [
  "JavaScript", "Python", "Java", "React", "Database", 
  "Algorithms", "Web Development", "Data Structures"
];

function App() {
  // State management
  const [questions, setQuestions] = useState([]);
  const [showNewQuestion, setShowNewQuestion] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [newQuestion, setNewQuestion] = useState({
    title: '',
    content: '',
    code: '',
    categories: []
  });

  // Handle question submission
  const handleSubmitQuestion = (e) => {
    e.preventDefault();
    if (newQuestion.title && (newQuestion.content || newQuestion.code)) {
      const question = {
        id: Date.now(),
        ...newQuestion,
        timestamp: new Date().toLocaleString(),
        answers: []
      };
      setQuestions([question, ...questions]);
      setNewQuestion({ title: '', content: '', code: '', categories: [] });
      setShowNewQuestion(false);
    }
  };

  // Handle answer submission
  const handleSubmitAnswer = (questionId, answerContent, answerCode) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        return {
          ...q,
          answers: [...q.answers, {
            id: Date.now(),
            content: answerContent,
            code: answerCode,
            timestamp: new Date().toLocaleString()
          }]
        };
      }
      return q;
    }));
  };

  // Filter questions based on search and category
  const filteredQuestions = questions.filter(q => {
    const matchesSearch = 
      q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === 'all' || 
      q.categories.includes(selectedCategory);

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Student Q&A Forum
        </h1>

        {/* Search and Filter Bar */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-3 text-gray-400">
              <Icons.Search />
            </span>
            <input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button
            onClick={() => setShowNewQuestion(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            Ask a Question
          </button>
        </div>

        {/* New Question Form */}
        {showNewQuestion && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Ask a Question</h2>
            <form onSubmit={handleSubmitQuestion}>
              {/* Title Input */}
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

              {/* Categories Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categories
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <label key={cat} className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={newQuestion.categories.includes(cat)}
                        onChange={(e) => {
                          const updated = e.target.checked
                            ? [...newQuestion.categories, cat]
                            : newQuestion.categories.filter(c => c !== cat);
                          setNewQuestion({...newQuestion, categories: updated});
                        }}
                        className="mr-1"
                      />
                      {cat}
                    </label>
                  ))}
                </div>
              </div>

              {/* Question Content */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newQuestion.content}
                  onChange={(e) => setNewQuestion({...newQuestion, content: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                  rows="3"
                />
              </div>

              {/* Code Input */}
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

              {/* Form Buttons */}
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
                {searchTerm || selectedCategory !== 'all'
                  ? 'No questions found matching your criteria.'
                  : 'Welcome to the Student Q&A Forum. Ask your first question!'}
              </p>
            </div>
          ) : (
            filteredQuestions.map(question => (
              <div key={question.id} className="bg-white shadow rounded-lg p-6">
                {/* Question Header */}
                <h2 className="text-xl font-semibold mb-2">{question.title}</h2>
                <div className="text-sm text-gray-500 mb-2">
                  Posted on {question.timestamp}
                </div>

                {/* Question Categories */}
                <div className="flex gap-2 mb-4">
                  {question.categories.map(cat => (
                    <span key={cat} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <Icons.Tag />
                      <span className="ml-1">{cat}</span>
                    </span>
                  ))}
                </div>

                {/* Question Content */}
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
                    {question.answers.length} Answers
                  </h3>
                  
                  {/* Answers List */}
                  <div className="space-y-4">
                    {question.answers.map(answer => (
                      <div key={answer.id} className="pl-4 border-l-2 border-gray-200">
                        <div className="text-sm text-gray-500 mb-2">
                          Answered on {answer.timestamp}
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
                      placeholder="Add code (optional)..."
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
      </div>
    </div>
  );
}

export default App;
