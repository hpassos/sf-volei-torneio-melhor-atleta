import React, { useState } from 'react';
import type { Team, Match } from '../types';

interface Props {
  teams: Team[];
  matches: Match[];
  onUpdate: (matches: Match[]) => void;
}

export default function MatchRegistration({ teams, matches, onUpdate }: Props) {
  const [round, setRound] = useState('');
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');
  const [score1, setScore1] = useState('');
  const [score2, setScore2] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!round || !team1 || !team2 || !score1 || !score2) return;

    const newMatch: Match = {
      id: matches.length + 1,
      rodada: round,
      dupla1: team1,
      dupla2: team2,
      placar: {
        dupla1: parseInt(score1),
        dupla2: parseInt(score2),
      },
    };

    onUpdate([...matches, newMatch]);
    setRound('');
    setTeam1('');
    setTeam2('');
    setScore1('');
    setScore2('');
  };

  const formatTeamName = (team: Team) => `${team.atleta1} / ${team.atleta2}`;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Cadastro de Confrontos</h2>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rodada
            </label>
            <input
              type="text"
              value={round}
              onChange={(e) => setRound(e.target.value)}
              placeholder="Ex: Rodada 1"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dupla 1
              </label>
              <select
                value={team1}
                onChange={(e) => setTeam1(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">Selecione uma dupla</option>
                {teams.map((team) => (
                  <option key={team.id} value={formatTeamName(team)}>
                    {formatTeamName(team)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dupla 2
              </label>
              <select
                value={team2}
                onChange={(e) => setTeam2(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">Selecione uma dupla</option>
                {teams
                  .filter((team) => formatTeamName(team) !== team1)
                  .map((team) => (
                    <option key={team.id} value={formatTeamName(team)}>
                      {formatTeamName(team)}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Placar Dupla 1
              </label>
              <input
                type="number"
                value={score1}
                onChange={(e) => setScore1(e.target.value)}
                min="0"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Placar Dupla 2
              </label>
              <input
                type="number"
                value={score2}
                onChange={(e) => setScore2(e.target.value)}
                min="0"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="mt-4 w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Registrar Confronto
        </button>
      </form>

      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Confrontos Registrados</h3>
        {matches.length === 0 ? (
          <p className="text-gray-500">Nenhum confronto registrado</p>
        ) : (
          <ul className="space-y-2">
            {matches.map((match) => (
              <li
                key={match.id}
                className="bg-white p-3 rounded-md shadow-sm"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{match.rodada}</span>
                  <span className="text-gray-500">#{match.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>{match.dupla1}</span>
                  <span className="font-bold">
                    {match.placar.dupla1} x {match.placar.dupla2}
                  </span>
                  <span>{match.dupla2}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}