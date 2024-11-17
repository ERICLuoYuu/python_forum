import React, { useState } from 'react';
import { Search, PlusCircle, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ForumApp = () => {
  const [questions, setQuestions] = useState([
    {
      id: 1,
      title: 'How to use array map in Python?',
      code: 'numbers = [1, 2, 3, 4]\n# How do I square each number?',
      answers: [
        {
          id: 1,
          content: 'You can use list comprehension or map function:',
          code: '# Using list comprehension\nsquared = [x**2 for x in numbers]\n\n# Using map\nsquared = list(map(lambda x: x**2, numbers))',
          author: 'Tutor'
        }
      ],
      author: 'Student1',
      timestamp: '2024-03-15'
    }
  ]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewQuestion, setShowNewQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ title: '', code: '' });

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredQuestions = questions.filter(question =>
    question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmitQuestion = () => {
    if (newQuestion.title && newQuestion.code) {
      const question = {
        id: questions.length + 1,
        ...newQuestion,
        answers: [],
        author: 'Student',
        timestamp: new Date().toISOString().split('T')[0]
      };
      setQuestions([...questions, question]);
      setNewQuestion({ title: '', code: '' });
      setShowNewQuestion(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Student Q&A Forum</h1>
        
        {/* Search and New Question Controls */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <button
            onClick={() => setShowNewQuestion(true)}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            <PlusCircle className="h-5 w-5" />
            Ask Question
          </button>
        </div>

        {/* New Question Form */}
        {showNewQuestion && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>New Question</CardTitle>
            </CardHeader>
            <CardContent>
              <input
                type="text"
                placeholder="Question title"
                value={newQuestion.title}
                onChange={(e) => setNewQuestion({...newQuestion, title: e.target.value})}
                className="w-full mb-4 p-2 border rounded"
              />
              <textarea
                placeholder="Your code here..."
                value={newQuestion.code}
                onChange={(e) => setNewQuestion({...newQuestion, code: e.target.value})}
                className="w-full h-32 mb-4 p-2 border rounded font-mono"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSubmitQuestion}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Submit
                </button>
                <button
                  onClick={() => setShowNewQuestion(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Questions List */}
        <div className="space-y-4">
          {filteredQuestions.map(question => (
            <Card key={question.id}>
              <CardHeader>
                <CardTitle>{question.title}</CardTitle>
                <div className="text-sm text-gray-500">
                  Asked by {question.author} on {question.timestamp}
                </div>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded-lg mb-4 overflow-x-auto">
                  <code>{question.code}</code>
                </pre>
                
                {/* Answers */}
                <div className="mt-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Answers ({question.answers.length})
                  </h3>
                  {question.answers.map(answer => (
                    <div key={answer.id} className="mt-4 pl-4 border-l-2 border-gray-200">
                      <div className="text-sm text-gray-500 mb-2">
                        Answered by {answer.author}
                      </div>
                      <p className="mb-2">{answer.content}</p>
                      {answer.code && (
                        <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
                          <code>{answer.code}</code>
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredQuestions.length === 0 && (
          <Alert>
            <AlertDescription>
              No questions found. Try adjusting your search or ask a new question!
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default ForumApp;
