import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Question } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { PlusCircle, Edit2, Trash2, Lock, Unlock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const { user } = useAuth();
  const [editingQuestion, setEditingQuestion] = useState<Partial<Question> | null>(null);

  useEffect(() => {
    if (!user?.isAdmin) return;

    const q = query(collection(db, 'questions'), orderBy('order'));
    return onSnapshot(q, (snapshot) => {
      const questionsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Question[];
      setQuestions(questionsList);
    });
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion?.text || !editingQuestion.options?.length) return;

    try {
      if (editingQuestion.id) {
        await updateDoc(doc(db, 'questions', editingQuestion.id), {
          text: editingQuestion.text,
          options: editingQuestion.options,
        });
      } else {
        await addDoc(collection(db, 'questions'), {
          text: editingQuestion.text,
          options: editingQuestion.options,
          isActive: false,
          order: questions.length,
          votes: editingQuestion.options.reduce((acc, curr) => ({ ...acc, [curr]: 0 }), {})
        });
      }
      setEditingQuestion(null);
      toast.success(editingQuestion.id ? 'Pregunta Actualizada!' : 'Pregunta Agregada!');
    } catch (error) {
      toast.error('Failed to save question');
    }
  };

  const toggleQuestion = async (questionId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'questions', questionId), {
        isActive: !currentStatus
      });
      toast.success(`Pregunta ${currentStatus ? 'desactivada' : 'activada'}`);
    } catch (error) {
      toast.error('Failed to update question status');
    }
  };

  const deleteQuestion = async (questionId: string) => {
    try {
      await deleteDoc(doc(db, 'questions', questionId));
      toast.success('Question deleted');
    } catch (error) {
      toast.error('Failed to delete question');
    }
  };

  if (!user?.isAdmin) return <div>Acceso denegado</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">
          {editingQuestion?.id ? 'Editar Pregunta' : 'Agregar Nueva Pregunta'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Titulo de la Pregunta</label>
            <input
              type="text"
              value={editingQuestion?.text || ''}
              onChange={e => setEditingQuestion(prev => ({ ...prev, text: e.target.value }))}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Opciones a Evaluar</label>
            {editingQuestion?.options?.map((option, index) => (
              <input
                key={index}
                type="text"
                value={option}
                onChange={e => {
                  const newOptions = [...(editingQuestion.options || [])];
                  newOptions[index] = e.target.value;
                  setEditingQuestion(prev => ({ ...prev, options: newOptions }));
                }}
                className="w-full p-2 border rounded mb-2"
                required
              />
            ))}
            <button
              type="button"
              onClick={() => setEditingQuestion(prev => ({
                ...prev,
                options: [...(prev?.options || []), '']
              }))}
              className="text-blue-600 hover:text-blue-800 flex items-center"
            >
              <PlusCircle className="w-4 h-4 mr-1" />
              Agregar Opción
            </button>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setEditingQuestion(null)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:text-gray-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {editingQuestion?.id ? 'Actualizar' : 'Agregar'} Pregunta
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Lista de Preguntas</h2>
        <div className="space-y-4">
          {questions.map((question) => (
            <div key={question.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium">{question.text}</h3>
                  <div className="mt-2 space-y-1">
                    {question.options.map((option, index) => (
                      <div key={index} className="text-gray-600">• {option}</div>
                    ))}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => toggleQuestion(question.id, question.isActive)}
                    className={`p-2 rounded ${
                      question.isActive ? 'text-green-600' : 'text-gray-600'
                    }`}
                  >
                    {question.isActive ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => setEditingQuestion(question)}
                    className="p-2 rounded text-blue-600"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => deleteQuestion(question.id)}
                    className="p-2 rounded text-red-600"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}