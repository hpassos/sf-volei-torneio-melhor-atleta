import React, { useState } from 'react';
import type { Athlete, Match, RoundVotes } from '../types';

interface Props {
  athletes: Athlete[];
  matches: Match[];
  votes: RoundVotes;
  onUpdate: (votes: RoundVotes) => void;
}

export default function VotingSystem({ athletes, matches, votes, onUpdate }: Props) {
  const [selectedRound, setSelectedRound] = useState('');
  const [voter, setVoter] = useState('');
  const [votedFor, setVotedFor] = useState('');

  const rounds = [...new Set(matches.map((match) => match.rodada))];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRound || !voter || !votedFor) return;

    const roundKey = selectedRound.toLowerCase().replace(/\s+/g, '-');
    const roundVotes = votes[roundKey] || [];
    const newVote = { votante: voter, voto: votedFor };

    onUpdate({
      ...votes,
      [roundKey]: [...roundVotes, newVote],
    });

    setVoter('');
    setVotedFor('');
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Sistema de Votação</h2>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rodada
            </label>
            <select
              value={selectedRound}
              onChange={(e) => setSelectedRound(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Selecione uma rodada</option>
              {rounds.map((round) => (
                <option key={round} value={round}>
                  {round}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Votante
            </label>
            <select
              value={voter}
              onChange={(e) => setVoter(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Selecione o votante</option>
              {athletes.map((athlete) => (
                <option key={athlete.id} value={athlete.nome}>
                  {athlete.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Voto para Melhor Atleta
            </label>
            <select
              value={votedFor}
              onChange={(e) => setVotedFor(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Selecione o atleta</option>
              {athletes
                .filter((athlete) => athlete.nome !== voter)
                .map((athlete) => (
                  <option key={athlete.id} value={athlete.nome} disabled={athlete.nome === voter}>
                    {athlete.nome} {athlete.nome === voter ? '(Você)' : ''}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="mt-4 w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Registrar Voto
        </button>
      </form>

      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Votos Registrados</h3>
        {Object.keys(votes).length === 0 ? (
          <p className="text-gray-500">Nenhum voto registrado</p>
        ) : (
          <div className="space-y-6">
            {Object.entries(votes).map(([round, roundVotes]) => (
              <div key={round} className="bg-white p-4 rounded-md shadow-sm">
                <h4 className="font-medium mb-3">{round.replace(/-/g, ' ')}</h4>
                <ul className="space-y-2">
                  {roundVotes.map((vote, index) => (
                    <li
                      key={`${round}-${index}`}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="text-gray-600">{vote.votante}</span>
                      <span className="font-medium">votou em</span>
                      <span className="text-indigo-600">{vote.voto}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}