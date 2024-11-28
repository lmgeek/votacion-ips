import React, { useState, useEffect } from 'react';
import { ref, push, update, onValue, remove } from 'firebase/database';
import { database } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { PlusCircle, Edit2, Trash2, Lock, Unlock } from 'lucide-react';
import toast from 'react-hot-toast';

interface Question {
  id: string;
  text: string;
  options: string[];
  isActive: boolean;
}

export default function AdminPanel() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState({ text: '', options: ['', ''] });
  const [editingId, setEditingId] = useState<string | null>(null);
  const { isAdmin } = useAuth();

  useEffect(() => {
    if (!isAdmin) return;

    const questionsRef = ref(database, 'questions');
    const unsubscribe = onValue(questionsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const questionsList = Object.entries(data).map(([id, value]: [string, any]) => ({
          id,
          ...value,
        }));
        setQuestions(questionsList);
      } else {
        setQuestions([]);
      }
    });

    return () => unsubscribe();
  }, [isAdmin]);

  const handleAddOption = () => {
    setNewQuestion(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const handleOptionChange = (index: number, value: string) => {
    const updatedOptions = [...newQuestion.options];
    updatedOptions[index] = value;
    setNewQuestion(prev => ({
      ...prev,
      options: updatedOptions
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    try {
      if (editingId) {
        await update(ref(database, `questions/${editingId}`), {
          text: newQuestion.text,
          options: newQuestion.options,
        });
        toast.success('Pregunta actualizada correctamente!');
      } else {
        await push(ref(database, 'questions'), {
          text: newQuestion.text,
          options: newQuestion.options,
          isActive: false,
          votes: newQuestion.options.reduce((acc, curr) => ({ ...acc, [curr]: 0 }), {})
        });
        toast.success('Pregunta agregada correctamente!');
      }
      setNewQuestion({ text: '', options: ['', ''] });
      setEditingId(null);
    } catch (error) {
      toast.error('Falló el guardar la pregunta');
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    try {
      await remove(ref(database, `questions/${id}`));
      toast.success('Pregunta eliminada correctamente!');
    } catch (error) {
      toast.error('Falló el eliminar pregunta');
    }
  };

  const toggleQuestionStatus = async (id: string, currentStatus: boolean) => {
    if (!isAdmin) return;
    try {
      await update(ref(database, `questions/${id}`), {
        isActive: !currentStatus
      });
      toast.success(`Pregunta ${currentStatus ? 'desactivada' : 'activada'} correctamente!`);
    } catch (error) {
      toast.error('Falló el actualizar el status de la pregunta');
    }
  };

  if (!isAdmin) {
    return <div>Acceso denegado</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Panel</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Editar Pregunta' : 'Agregar Nueva Pregunta'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titulo de la Pregunta
              </label>
              <input
                type="text"
                value={newQuestion.text}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, text: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Opciones</label>
              {newQuestion.options.map((option, index) => (
                <input
                  key={index}
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              ))}
              <button
                type="button"
                onClick={handleAddOption}
                className="flex items-center text-indigo-600 hover:text-indigo-700"
              >
                <PlusCircle className="w-4 h-4 mr-1" />
                Agregar Opción
              </button>
            </div>
            
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
            >
              {editingId ? 'Update Question' : 'Agregar'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Lista de Preguntas</h2>
          <div className="space-y-4">
            {questions.map((question) => (
              <div key={question.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-medium">{question.text}</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => toggleQuestionStatus(question.id, question.isActive)}
                      className={`p-2 rounded-full ${
                        question.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {question.isActive ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(question.id);
                        setNewQuestion({
                          text: question.text,
                          options: question.options
                        });
                      }}
                      className="p-2 rounded-full bg-blue-100 text-blue-600"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(question.id)}
                      className="p-2 rounded-full bg-red-100 text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="pl-4">
                  {question.options.map((option, index) => (
                    <div key={index} className="text-gray-600">
                      • {option}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}