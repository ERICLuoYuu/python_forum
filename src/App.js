import React, { useState } from 'react';
import { Search, Tag, MessageSquare, ThumbsUp } from 'lucide-react';

// Predefined categories
const CATEGORIES = [
  "JavaScript", "Python", "Java", "React", "Database", "Algorithms", 
  "Web Development", "Mobile Development", "Data Structures"
];

function App() {
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

  // Function to syntax highlight code
  const formatCode = (code) => {
    // Basic syntax highlighting
    return code.replace(
      /(const|let|var|function|return|if|else|for|while|class|import|export|default|from|=|\{|\}|=>)/g,
      '<span class="text-blue-600">$1</span>'
    ).replace(
      /(["'`])(?:(?=(\\?))\2.)*?\1/g,
      '<span class="text-green-600">$&</span>'
    );
  };

  const handleSubmitQuestion = (e) => {
    e.preventDefault();
    if (newQuestion.title && (newQuestion.content || newQuestion.code)) {
      const question = {
        id: Date.now(),
        ...newQuestion,
        timestamp: new Date().toLocaleString(),
        answers: [],
        votes: 0
      };
      setQuestions([question, ...questions]);
      setNewQuestion({ title: '', content: '', code: '', categories: [] });
      setShowNewQuestion(false);
    }
  };

  const handleSubmitAnswer = (questionId, answerContent, answerCode) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        return {
          ...q,
          answers: [...q.answers, {
            id: Date.now(),
            content: answerContent,
            code: answerCode,
            timestamp: new Date().toLocaleString(),
            votes: 0
          }]
        };
      }
      return q;
    }));
  };

  const handleVote = (questionId, answerId = null, isUpvote = true) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        if (answerId === null) {
          // Voting on question
          return { ...q, votes: q.votes + (isUpvote ? 1 : -1) };
        } else {
          // Voting on answer
          return {
            ...q,
            answers: q.answers.map(a => 
              a.id === answerId 
                ? { ...a, votes: a.votes + (isUpvote ? 1 : -1) }
                : a
            )
          };
        }
      }
      return q;
    }));
  };

  // Filter questions based on search and category
  const filteredQuestions = questions.filter(q => {
    const matchesSearch = 
      q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === 'all' || 
      q.categories.includes(selectedCategory);

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Student Q&A Forum
        </h1>

        {/* Search and Filter Bar */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
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
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Ask a Question
          </button>
        </div>

        {/* New Question Form */}
        {showNewQuestion && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Ask a Question</h2>
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
                {searchTerm || selectedCategory !== 'all'
                  ? 'No questions found matching your criteria.'
                  : 'Welcome to the Student Q&A Forum. Ask your first question!'}
              </p>
            </div>
          ) : (
            filteredQuestions.map(question => (
              <div key={question.id} className="bg-white shadow rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold mb-2">{question.title}</h2>
                    <div className="text-sm text-gray-500 mb-2">
                      Posted on {question.timestamp}
                    </div>
                    <div className="flex gap-2 mb-4">
                      {question.categories.map(cat => (
                        <span key={cat} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <Tag className="w-3 h-3 mr-1" />
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleVote(question.id, null, true)}
                      className="text-gray-500 hover:text-blue-500"
                    >
                      <ThumbsUp className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-medium">{question.votes}</span>
                  </div>
                </div>
                
                {question.content && (
                  <p className="text-gray-700 mb-4">{question.content}</p>
                )}
                {question.code && (
                  <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
                    <code 
                      className="text-sm"
                      dangerouslySetInnerHTML={{ __html: formatCode(question.code) }}
                    />
                  </pre>
                )}

                {/* Answers */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">
                    {question.answers.length} Answers
                  </h3>
                  <div className="space-y-4">
                    {question.answers.map(answer => (
                      <div key={answer.id} className="pl-4 border-l-2 border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="text-sm text-gray-500 mb-2">
                              Answered on {answer.timestamp}
                            </div>
                            <p className="text-gray-700 mb-2">{answer.content}</p>
                            {answer.code && (
                              <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-2">
                                <code 
                                  className="text-sm"
                                  dangerouslySetInnerHTML={{ __html: formatCode(answer.code) }}
                                />
                              </pre>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleVote(question.id, answer.id, true)}
                              className="text-gray-500 hover:text-blue-500"
                            >
                              <ThumbsUp className="w-5 h-5" />
                            </button>
                            <span className="text-sm font-medium">{answer.votes}</span>
                          </div>
                        </div>
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
