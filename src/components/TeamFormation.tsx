import React, { useState } from 'react';
import type { Athlete, Team } from '../types';

interface Props {
  athletes: Athlete[];
  teams: Team[];
  onUpdate: (teams: Team[]) => void;
}

export default function TeamFormation({ athletes, teams, onUpdate }: Props) {
  const [athlete1, setAthlete1] = useState('');
  const [athlete2, setAthlete2] = useState('');
  const [grupo, setGrupo] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!athlete1 || !athlete2) return;

    const isDuplicate = teams.some(team =>
      (team.atleta1 === athlete1 && team.atleta2 === athlete2) ||
      (team.atleta1 === athlete2 && team.atleta2 === athlete1)
    );

    if (isDuplicate) {
      alert('Dupla já cadastrada!');
      return;
    }

    const newTeam: Team = {
      id: teams.length + 1,
      atleta1: athlete1,
      atleta2: athlete2,
      grupo,
    };

    onUpdate([...teams, newTeam]);
    setAthlete1('');
    setAthlete2('');
    setGrupo('');
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Formação de Duplas</h2>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Atleta 1
            </label>
            <select
              value={athlete1}
              onChange={(e) => setAthlete1(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Selecione um atleta</option>
              {athletes.map((athlete) => (
                <option key={athlete.id} value={athlete.nome}>
                  {athlete.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Atleta 2
            </label>
            <select
              value={athlete2}
              onChange={(e) => setAthlete2(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Selecione um atleta</option>
              {athletes
                .filter((athlete) => athlete.nome !== athlete1)
                .map((athlete) => (
                  <option key={athlete.id} value={athlete.nome}>
                    {athlete.nome}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grupo
            </label>
            <input
              type="text"
              value={grupo}
              onChange={(e) => setGrupo(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Criar Dupla
        </button>
      </form>
    </div>
  );
}