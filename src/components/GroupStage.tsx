import React, { useState } from 'react';
import type { Team, Match } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  teams: Team[];
  matches: Match[];
  onUpdateMatches: (matches: Match[]) => void;
}

interface Group {
  id: string;
  name: string;
  teams: Team[];
}

export default function GroupStage({ teams, matches, onUpdateMatches }: Props) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<Team[]>([]);
  const [tempScores, setTempScores] = useState<{ [matchId: string]: { dupla1: number; dupla2: number } }>({});

  // Função para adicionar ou remover uma dupla do grupo
  const toggleTeamSelection = (team: Team) => {
    if (selectedTeams.includes(team)) {
      setSelectedTeams(selectedTeams.filter((t) => t !== team));
    } else {
      setSelectedTeams([...selectedTeams, team]);
    }
  };

  // Função para criar um grupo com as duplas selecionadas
  const createGroup = () => {
    if (selectedTeams.length < 2) {
      alert('Selecione pelo menos 2 duplas para formar um grupo!');
      return;
    }

    const existingTeams = groups.flatMap(g => g.teams);
    const hasDuplicates = selectedTeams.some(team =>
      existingTeams.some(t => t.id === team.id)
    );

    if (hasDuplicates) {
      alert('Uma ou mais duplas já estão em outro grupo!');
      return;
    }

    const newGroup: Group = {
      id: uuidv4(),
      name: `Grupo ${groups.length + 1}`,
      teams: selectedTeams
    };

    setGroups([...groups, newGroup]);
    setSelectedTeams([]);
  };

  // Função para deletar um grupo
  const deleteGroup = (groupId: string) => {
    setGroups(groups.filter(group => group.id !== groupId));
  };

  // Função para criar confrontos dentro de um grupo
  const createMatchesInGroup = (group: Group) => {
    const newMatches: Match[] = [];

    for (let i = 0; i < group.teams.length; i++) {
      for (let j = i + 1; j < group.teams.length; j++) {
        const team1 = group.teams[i];
        const team2 = group.teams[j];

        const team1Str = `${team1.atleta1} / ${team1.atleta2}`;
        const team2Str = `${team2.atleta1} / ${team2.atleta2}`;

        const matchExists = matches.some(match =>
          (match.dupla1 === team1Str && match.dupla2 === team2Str && match.rodada === group.name) ||
          (match.dupla1 === team2Str && match.dupla2 === team1Str && match.rodada === group.name)
        );

        if (!matchExists) {
          newMatches.push({
            id: uuidv4(),
            rodada: group.name,
            dupla1: team1Str,
            dupla2: team2Str,
            placar: { dupla1: 0, dupla2: 0 },
          });
        }
      }
    }

    if (newMatches.length > 0) {
      onUpdateMatches([...matches, ...newMatches]);
    }
  };

  // Função para calcular a classificação do grupo
  const calculateStandings = (group: Group) => {
    const standings: { [key: string]: { points: number; wins: number } } = {};

    group.teams.forEach(team => {
      const teamName = `${team.atleta1} / ${team.atleta2}`;
      standings[teamName] = { points: 0, wins: 0 };
    });

    matches
      .filter(match => match.rodada === group.name)
      .forEach(match => {
        if (match.placar.dupla1 > match.placar.dupla2) {
          standings[match.dupla1].points += 3;
          standings[match.dupla1].wins += 1;
        } else if (match.placar.dupla2 > match.placar.dupla1) {
          standings[match.dupla2].points += 3;
          standings[match.dupla2].wins += 1;
        } else {
          standings[match.dupla1].points += 1;
          standings[match.dupla2].points += 1;
        }
      });

    return Object.entries(standings)
      .sort((a, b) => b[1].points - a[1].points)
      .map(([team, { points, wins }]) => ({ team, points, wins }));
  };

  // Função para atualizar os placares temporariamente
  const handleTempScoreChange = (matchId: string, field: 'dupla1' | 'dupla2', value: number) => {
    setTempScores(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [field]: value,
      },
    }));
  };

  // Função para salvar os placares
  const saveScores = () => {
    const hasNegative = Object.values(tempScores).some(score =>
      score.dupla1 < 0 || score.dupla2 < 0
    );

    if (hasNegative) {
      alert('Placar não pode ser negativo!');
      return;
    }

    const updatedMatches = matches.map(match => {
      if (tempScores[match.id]) {
        return {
          ...match,
          placar: {
            ...match.placar,
            ...tempScores[match.id],
          },
        };
      }
      return match;
    });

    onUpdateMatches(updatedMatches);
    setTempScores({});
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Fase de Grupos e Confrontos</h2>

      {/* Seleção de Duplas para o Grupo */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Selecionar Duplas para o Grupo</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {teams.map(team => {
            const isGrouped = groups.some(group =>
              group.teams.some(t => t.id === team.id)
            );

            return (
              <div
                key={team.id}
                onClick={() => !isGrouped && toggleTeamSelection(team)}
                className={`p-4 rounded-md cursor-pointer ${isGrouped ? 'bg-gray-300 cursor-not-allowed' :
                  selectedTeams.includes(team) ?
                    'bg-indigo-600 text-white' :
                    'bg-gray-100 hover:bg-gray-200'
                  }`}
              >
                <p>{team.atleta1} / {team.atleta2}</p>
              </div>
            );
          })}
        </div>
        <button
          onClick={createGroup}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Criar Grupo com Duplas Selecionadas
        </button>
      </div>

      {/* Grupos Criados */}
      {groups.length > 0 && (
        <div className="space-y-8">
          {groups.map(group => (
            <div key={group.id} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">{group.name}</h3>
                <button
                  onClick={() => deleteGroup(group.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Remover Grupo
                </button>
              </div>

              {/* Tabela de Classificação */}
              <div className="mb-6">
                <h4 className="text-lg font-medium mb-3">Classificação</h4>
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 text-left">Dupla</th>
                      <th className="p-2">Pontos</th>
                      <th className="p-2">Vitórias</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculateStandings(group).map((standing, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{standing.team}</td>
                        <td className="p-2 text-center">{standing.points}</td>
                        <td className="p-2 text-center">{standing.wins}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={() => createMatchesInGroup(group)}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Criar Confrontos no {group.name}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Confrontos e Placar */}
      {matches.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Confrontos</h3>
          {matches.map(match => (
            <div key={match.id} className="mb-4 p-4 bg-gray-50 rounded-md shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span>{match.dupla1}</span>
                <span className="font-bold">x</span>
                <span>{match.dupla2}</span>
              </div>
              <div className="flex justify-between items-center">
                <input
                  type="number"
                  min="0"
                  value={tempScores[match.id]?.dupla1 ?? match.placar.dupla1}
                  onChange={(e) =>
                    handleTempScoreChange(match.id, 'dupla1', parseInt(e.target.value))
                  }
                  className="w-16 px-2 py-1 border rounded-md"
                />
                <span className="font-bold">x</span>
                <input
                  type="number"
                  min="0"
                  value={tempScores[match.id]?.dupla2 ?? match.placar.dupla2}
                  onChange={(e) =>
                    handleTempScoreChange(match.id, 'dupla2', parseInt(e.target.value))
                  }
                  className="w-16 px-2 py-1 border rounded-md"
                />
              </div>
            </div>
          ))}
          <button
            onClick={saveScores}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Atualizar Placar
          </button>
        </div>
      )}
    </div>
  );
}