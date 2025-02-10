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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!athlete1 || !athlete2) return;

    const newTeam: Team = {
      id: teams.length + 1,
      atleta1: athlete1,
      atleta2: athlete2,
    };

    onUpdate([...teams, newTeam]);
    setAthlete1('');
    setAthlete2('');
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
        </div>

        <button
          type="submit"
          className="mt-4 w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Formar Dupla
        </button>
      </form>

      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Duplas Formadas</h3>
        {teams.length === 0 ? (
          <p className="text-gray-500">Nenhuma dupla formada</p>
        ) : (
          <ul className="space-y-2">
            {teams.map((team) => (
              <li
                key={team.id}
                className="flex items-center justify-between bg-white p-3 rounded-md shadow-sm"
              >
                <span>
                  {team.atleta1} / {team.atleta2}
                </span>
                <span className="text-gray-500">Dupla #{team.id}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}