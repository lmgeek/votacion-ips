import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Question } from '../types';
import { CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VotingArea() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [votedQuestions, setVotedQuestions] = useState<Set<string>>(
    new Set(JSON.parse(localStorage.getItem('votedQuestions') || '[]'))
  );

  useEffect(() => {
    const q = query(collection(db, 'questions'), orderBy('order'));
    return onSnapshot(q, (snapshot) => {
      const questionsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Question[];
      setQuestions(questionsList);
    });
  }, []);

  const handleVote = async (questionId: string, option: string) => {
    if (votedQuestions.has(questionId)) {
      toast.error('You have already voted on this question');
      return;
    }

    try {
      const question = questions.find(q => q.id === questionId);
      if (!question) return;

      const newVotes = { ...question.votes };
      newVotes[option] = (newVotes[option] || 0) + 1;

      await updateDoc(doc(db, 'questions', questionId), { votes: newVotes });
      
      const newVotedQuestions = new Set(votedQuestions).add(questionId);
      setVotedQuestions(newVotedQuestions);
      localStorage.setItem('votedQuestions', JSON.stringify([...newVotedQuestions]));
      
      toast.success('Vote recorded successfully!');
    } catch (error) {
      toast.error('Failed to record vote');
    }
  };

  const calculatePercentage = (question: Question, option: string) => {
    const totalVotes = Object.values(question.votes || {}).reduce((a, b) => a + b, 0);
    const optionVotes = question.votes?.[option] || 0;
    return totalVotes === 0 ? 0 : Math.round((optionVotes / totalVotes) * 100);
  };

  const activeQuestion = questions.find(q => q.isActive);

  if (!activeQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Hay Preguntas Activas</h2>
          <p className="text-gray-600">Espere que el Administrador o Moderador active la siguiente Pregunta.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">{activeQuestion.text}</h2>
          <div className="space-y-4">
            {activeQuestion.options.map((option) => {
              const hasVoted = votedQuestions.has(activeQuestion.id);
              const percentage = calculatePercentage(activeQuestion, option);
              const votes = activeQuestion.votes?.[option] || 0;

              return (
                <button
                  key={option}
                  onClick={() => handleVote(activeQuestion.id, option)}
                  disabled={hasVoted}
                  className={`w-full p-4 rounded-lg relative overflow-hidden transition-all
                    ${hasVoted 
                      ? 'bg-gray-50 cursor-default' 
                      : 'bg-white border-2 border-blue-500 hover:bg-blue-50'
                    }`}
                >
                  <div
                    className="absolute inset-0 bg-blue-100 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                  <div className="relative flex justify-between items-center">
                    <span className="font-medium">{option}</span>
                    {hasVoted && (
                      <div className="flex items-center space-x-2">
                        <span className="text-blue-600">{votes} votes ({percentage}%)</span>
                        {votes > 0 && <CheckCircle className="w-5 h-5 text-green-500" />}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}