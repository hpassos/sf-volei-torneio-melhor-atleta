import React, { useState, useEffect } from 'react';
import { Trophy, Users, Swords, Vote, BarChart3 } from 'lucide-react';
import AthleteRegistration from './components/AthleteRegistration';
import TeamFormation from './components/TeamFormation';
import MatchRegistration from './components/MatchRegistration';
import VotingSystem from './components/VotingSystem';
import Dashboard from './components/Dashboard';
import { fetchData, updateData } from './services/jsonbin';
import type { Database } from './types';

const initialData: Database = {
  atletas: [],
  duplas: [],
  confrontos: [],
  votacoes: {},
};

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState<Database>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const fetchedData = await fetchData();
      setData(fetchedData);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar dados. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDataUpdate = async (newData: Database) => {
    try {
      setLoading(true);
      await updateData(newData);
      setData(newData);
      setError(null);
    } catch (err) {
      setError('Erro ao salvar dados. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'athletes', label: 'Cadastro de Atletas', icon: Users },
    { id: 'teams', label: 'Formação de Duplas', icon: Trophy },
    { id: 'matches', label: 'Cadastro de Confrontos', icon: Swords },
    { id: 'voting', label: 'Votação', icon: Vote },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-indigo-600 text-white py-6 shadow-lg">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold">Sistema de Votação Entre Atletas</h1>
        </div>
      </header>

      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center space-x-2 px-4 py-3 font-medium transition-colors ${
                  activeTab === id
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-gray-600 hover:text-indigo-600'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          {activeTab === 'dashboard' && <Dashboard data={data} />}
          {activeTab === 'athletes' && (
            <AthleteRegistration
              athletes={data.atletas}
              onUpdate={(athletes) => handleDataUpdate({ ...data, atletas: athletes })}
            />
          )}
          {activeTab === 'teams' && (
            <TeamFormation
              athletes={data.atletas}
              teams={data.duplas}
              onUpdate={(teams) => handleDataUpdate({ ...data, duplas: teams })}
            />
          )}
          {activeTab === 'matches' && (
            <MatchRegistration
              teams={data.duplas}
              matches={data.confrontos}
              onUpdate={(matches) => handleDataUpdate({ ...data, confrontos: matches })}
            />
          )}
          {activeTab === 'voting' && (
            <VotingSystem
              athletes={data.atletas}
              matches={data.confrontos}
              votes={data.votacoes}
              onUpdate={(votes) => handleDataUpdate({ ...data, votacoes: votes })}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;