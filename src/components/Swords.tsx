import React, { useState } from 'react';
import type { Match, Team } from '../types';

interface Props {
  teams: Team[];
  matches: Match[];
  onUpdate: (matches: Match[]) => void;
}

export default function Swords({ matches, onUpdate }: Props) {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [tempScore, setTempScore] = useState({ dupla1: 0, dupla2: 0 });

  const isValidScore = (score1: number, score2: number) => {
    const maxScore = Math.max(score1, score2);
    const minScore = Math.min(score1, score2);
    return (maxScore === 21 && minScore < 20) || (maxScore >= 20 && (maxScore - minScore === 2));
  };

  const handleScoreChange = (field: 'dupla1' | 'dupla2', value: string) => {
    setTempScore(prev => ({ ...prev, [field]: parseInt(value) || 0 }));
  };

  const saveScore = () => {
    if (selectedMatch && isValidScore(tempScore.dupla1, tempScore.dupla2)) {
      const updated = matches.map(m =>
        m.id === selectedMatch.id ? { ...m, placar: tempScore } : m
      );
      onUpdate(updated);
      setSelectedMatch(null);
    }
  };

  return (
    <div className="p-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Grupos */}
          <div>
            <h3 className="text-lg font-bold mb-4">Partidas dos Grupos</h3>
            {[...new Set(matches?.map(m => m.rodada))].map(group => (
              <div key={group} className="mb-6">
                <h4 className="font-medium mb-2">{group}</h4>
                {matches.filter(m => m.rodada === group).map(match => (
                  <div
                    key={match.id}
                    className="bg-gray-50 p-3 rounded-md mb-2 cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      setSelectedMatch(match);
                      setTempScore(match.placar);
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <span className="flex-1 text-right">{match.dupla1}</span>
                      <span className="mx-3 font-bold">vs</span>
                      <span className="flex-1 text-left">{match.dupla2}</span>
                    </div>
                    {match.placar.dupla1 + match.placar.dupla2 > 0 && (
                      <div className={`text-center mt-2 font-medium ${isValidScore(match.placar.dupla1, match.placar.dupla2)
                        ? 'text-green-600'
                        : 'text-red-600'
                        }`}>
                        {match.placar.dupla1} - {match.placar.dupla2}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Fases Eliminatórias */}
          <div>
            <h3 className="text-lg font-bold mb-4">Fases Eliminatórias</h3>
            {['Semifinal', 'Terceiro Lugar', 'Final'].map(stage => (
              <div key={stage} className="mb-6">
                <h4 className="font-medium mb-2">{stage}</h4>
                {matches.filter(m => m.rodada === stage).map(match => (
                  <div
                    key={match.id}
                    className="bg-gray-50 p-3 rounded-md mb-2 cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      setSelectedMatch(match);
                      setTempScore(match.placar);
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <span>{match.dupla1}</span>
                      <span className="mx-2">vs</span>
                      <span>{match.dupla2}</span>
                    </div>
                    {match.placar.dupla1 + match.placar.dupla2 > 0 && (
                      <div className={`text-center mt-2 font-medium ${isValidScore(match.placar.dupla1, match.placar.dupla2)
                        ? 'text-green-600'
                        : 'text-red-600'
                        }`}>
                        {match.placar.dupla1} - {match.placar.dupla2}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Modal de Edição */}
        {selectedMatch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
              <h2 className="text-xl font-bold mb-4">Editar Placar</h2>
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="text-center">
                  <input
                    type="number"
                    value={tempScore.dupla1}
                    onChange={(e) => handleScoreChange('dupla1', e.target.value)}
                    className="w-20 text-center text-xl p-2 border rounded-md"
                    min="0"
                  />
                  <div className="mt-2 text-sm text-gray-600">{selectedMatch.dupla1}</div>
                </div>
                <span className="text-2xl font-bold">x</span>
                <div className="text-center">
                  <input
                    type="number"
                    value={tempScore.dupla2}
                    onChange={(e) => handleScoreChange('dupla2', e.target.value)}
                    className="w-20 text-center text-xl p-2 border rounded-md"
                    min="0"
                  />
                  <div className="mt-2 text-sm text-gray-600">{selectedMatch.dupla2}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveScore}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Salvar
                </button>
                <button
                  onClick={() => setSelectedMatch(null)}
                  className="flex-1 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}