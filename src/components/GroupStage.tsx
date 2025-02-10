import React, { useState } from 'react';
import type { Team, Match } from '../types';

interface Props {
  teams: Team[];
  matches: Match[];
  onUpdateMatches: (matches: Match[]) => void;
}

export default function GroupStage({ teams, matches, onUpdateMatches }: Props) {
  const [groups, setGroups] = useState<Team[][]>([]);
  const [selectedTeams, setSelectedTeams] = useState<Team[]>([]);
  const [tempScores, setTempScores] = useState<{ [matchId: number]: { dupla1: number; dupla2: number } }>({});

  // Função para adicionar uma dupla ao grupo
  const addTeamToGroup = (team: Team) => {
    if (!selectedTeams.includes(team)) {
      setSelectedTeams([...selectedTeams, team]);
    }
  };

  // Função para criar um grupo com as duplas selecionadas
  const createGroup = () => {
    if (selectedTeams.length > 0) {
      setGroups([...groups, selectedTeams]);
      setSelectedTeams([]); // Limpa a seleção após criar o grupo
    }
  };

  // Função para criar confrontos dentro de um grupo
  const createMatchesInGroup = (group: Team[]) => {
    const newMatches: Match[] = [];

    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const team1 = group[i];
        const team2 = group[j];

        const matchExists = matches.some(
          (match) =>
            (match.dupla1 === `${team1.atleta1} / ${team1.atleta2}` &&
              match.dupla2 === `${team2.atleta1} / ${team2.atleta2}`) ||
            (match.dupla1 === `${team2.atleta1} / ${team2.atleta2}` &&
              match.dupla2 === `${team1.atleta1} / ${team1.atleta2}`)
        );

        if (!matchExists) {
          newMatches.push({
            id: matches.length + newMatches.length + 1,
            rodada: `Grupo ${groups.length + 1}`,
            dupla1: `${team1.atleta1} / ${team1.atleta2}`,
            dupla2: `${team2.atleta1} / ${team2.atleta2}`,
            placar: { dupla1: 0, dupla2: 0 },
          });
        }
      }
    }

    if (newMatches.length > 0) {
      onUpdateMatches([...matches, ...newMatches]);
    }
  };

  // Função para atualizar os placares temporariamente
  const handleTempScoreChange = (matchId: number, field: 'dupla1' | 'dupla2', value: number) => {
    setTempScores({
      ...tempScores,
      [matchId]: {
        ...tempScores[matchId],
        [field]: value,
      },
    });
  };

  // Função para salvar os placares
  const saveScores = () => {
    const updatedMatches = matches.map((match) => {
      if (tempScores[match.id]) {
        return {
          ...match,
          placar: tempScores[match.id],
        };
      }
      return match;
    });

    onUpdateMatches(updatedMatches);
    setTempScores({}); // Limpa os placares temporários
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Fase de Grupos e Confrontos</h2>

      {/* Seleção de Duplas para o Grupo */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Selecionar Duplas para o Grupo</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {teams.map((team) => (
            <div
              key={team.id}
              onClick={() => addTeamToGroup(team)}
              className={`p-4 rounded-md cursor-pointer ${
                selectedTeams.includes(team)
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <p>{team.atleta1} / {team.atleta2}</p>
            </div>
          ))}
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
          {groups.map((group, groupIndex) => (
            <div key={groupIndex} className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Grupo {groupIndex + 1}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.map((team) => (
                  <div
                    key={team.id}
                    className="p-4 bg-gray-50 rounded-md shadow-sm"
                  >
                    <p className="font-medium">{team.atleta1} / {team.atleta2}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => createMatchesInGroup(group)}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Criar Confrontos no Grupo {groupIndex + 1}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Confrontos e Placar */}
      {matches.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Confrontos</h3>
          {matches.map((match) => (
            <div key={match.id} className="mb-4 p-4 bg-gray-50 rounded-md shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span>{match.dupla1}</span>
                <span className="font-bold">x</span>
                <span>{match.dupla2}</span>
              </div>
              <div className="flex justify-between items-center">
                <input
                  type="number"
                  value={tempScores[match.id]?.dupla1 || match.placar.dupla1}
                  onChange={(e) =>
                    handleTempScoreChange(match.id, 'dupla1', parseInt(e.target.value))
                  }
                  className="w-16 px-2 py-1 border rounded-md"
                />
                <span className="font-bold">x</span>
                <input
                  type="number"
                  value={tempScores[match.id]?.dupla2 || match.placar.dupla2}
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
