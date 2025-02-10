import React, { useState } from 'react';
import type { Team, Match } from '../types';

interface Props {
  teams: Team[];
  matches: Match[];
  onUpdateMatches: (matches: Match[]) => void;
}

export default function GroupStage({ teams, matches, onUpdateMatches }: Props) {
  const [groups, setGroups] = useState<Team[][]>([]);
  const [newMatch, setNewMatch] = useState<Match | null>(null);

  // Função para dividir as duplas em grupos
  const createGroups = () => {
    const shuffledTeams = [...teams].sort(() => Math.random() - 0.5); // Embaralha as duplas
    const groupSize = 4; // Tamanho de cada grupo
    const newGroups = [];

    for (let i = 0; i < shuffledTeams.length; i += groupSize) {
      newGroups.push(shuffledTeams.slice(i, i + groupSize));
    }

    setGroups(newGroups);
  };

  // Função para adicionar placar e atualizar o confronto
  const handleAddScore = (matchId: number, score1: number, score2: number) => {
    const updatedMatches = matches.map((match) =>
      match.id === matchId
        ? { ...match, placar: { dupla1: score1, dupla2: score2 } }
        : match
    );
    onUpdateMatches(updatedMatches);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Fase de Grupos e Confrontos</h2>

      <button
        onClick={createGroups}
        className="mb-6 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
      >
        Criar Grupos
      </button>

      {groups.length > 0 && (
        <div className="space-y-8">
          {groups.map((group, groupIndex) => (
            <div key={groupIndex} className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Grupo {groupIndex + 1}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.map((team, teamIndex) => (
                  <div
                    key={team.id}
                    className="p-4 bg-gray-50 rounded-md shadow-sm"
                  >
                    <p className="font-medium">{team.atleta1} / {team.atleta2}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-4">Confrontos</h4>
                {group.slice(0, group.length - 1).map((team1, index) =>
                  group.slice(index + 1).map((team2) => {
                    const match = matches.find(
                      (m) =>
                        (m.dupla1 === `${team1.atleta1} / ${team1.atleta2}` &&
                          m.dupla2 === `${team2.atleta1} / ${team2.atleta2}`) ||
                        (m.dupla1 === `${team2.atleta1} / ${team2.atleta2}` &&
                          m.dupla2 === `${team1.atleta1} / ${team1.atleta2}`)
                    );

                    return (
                      <div
                        key={`${team1.id}-${team2.id}`}
                        className="mb-4 p-4 bg-gray-50 rounded-md shadow-sm"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span>{team1.atleta1} / {team1.atleta2}</span>
                          <span className="font-bold">vs</span>
                          <span>{team2.atleta1} / {team2.atleta2}</span>
                        </div>
                        {match ? (
                          <div className="flex justify-between items-center">
                            <input
                              type="number"
                              value={match.placar.dupla1}
                              onChange={(e) =>
                                handleAddScore(match.id, parseInt(e.target.value), match.placar.dupla2)
                              }
                              className="w-16 px-2 py-1 border rounded-md"
                            />
                            <span className="font-bold">x</span>
                            <input
                              type="number"
                              value={match.placar.dupla2}
                              onChange={(e) =>
                                handleAddScore(match.id, match.placar.dupla1, parseInt(e.target.value))
                              }
                              className="w-16 px-2 py-1 border rounded-md"
                            />
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              const newMatch: Match = {
                                id: matches.length + 1,
                                rodada: `Grupo ${groupIndex + 1}`,
                                dupla1: `${team1.atleta1} / ${team1.atleta2}`,
                                dupla2: `${team2.atleta1} / ${team2.atleta2}`,
                                placar: { dupla1: 0, dupla2: 0 },
                              };
                              onUpdateMatches([...matches, newMatch]);
                            }}
                            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                          >
                            Criar Confronto
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
