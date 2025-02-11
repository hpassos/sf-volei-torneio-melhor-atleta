import React, { useState, useEffect } from 'react';
import type { Team, Match, Group } from '../types';
import { fetchData } from '../services/jsonbin';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 9);
};

interface Props {
  teams: Team[];
  matches: Match[];
  onUpdateMatches: (matches: Match[]) => void;
}

export default function GroupStage({ teams, matches, onUpdateMatches }: Props) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [tempScore, setTempScore] = useState({ dupla1: 0, dupla2: 0 });
  const [draggedTeam, setDraggedTeam] = useState<Team | null>(null);

  // Carregar dados ao montar o componente
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchData();
        if (data.grupos) {
          setGroups(data.grupos); // Inicializa os grupos com os dados do JSONBin
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };

    loadData();
  }, []);

  // Funções de Drag and Drop
  const handleDragStart = (e: React.DragEvent, team: Team) => {
    setDraggedTeam(team);
    e.dataTransfer.setData('text/plain', team.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, groupIndex: number) => {
    e.preventDefault();
    if (draggedTeam) {
      const updatedGroups = [...groups];
      updatedGroups[groupIndex].teams.push(draggedTeam);
      setGroups(updatedGroups);
      setDraggedTeam(null);
    }
  };

  // Criação e Gerenciamento de Grupos
  const createNewGroup = () => {
    const newGroup: Group = {
      id: generateId(),
      name: `Grupo ${groups.length + 1}`,
      teams: []
    };
    setGroups([...groups, newGroup]);
  };

  const deleteGroup = (groupId: string) => {
    setGroups(groups.filter(group => group.id !== groupId));
  };

  // Geração de Confrontos
  const generateMatches = (group: Group) => {
    const newMatches: Match[] = [];

    for (let i = 0; i < group.teams.length; i++) {
      for (let j = i + 1; j < group.teams.length; j++) {
        const team1 = group.teams[i];
        const team2 = group.teams[j];

        const matchExists = matches.some(match =>
        (match.dupla1 === `${team1.atleta1} / ${team1.atleta2}` &&
          match.dupla2 === `${team2.atleta1} / ${team2.atleta2}`
        );

        if (!matchExists) {
          newMatches.push({
            id: generateId(),
            rodada: group.name,
            dupla1: `${team1.atleta1} / ${team1.atleta2}`,
            dupla2: `${team2.atleta1} / ${team2.atleta2}`,
            placar: { dupla1: 0, dupla2: 0 }
          });
        }
      }
    }

    if (newMatches.length > 0) {
      onUpdateMatches([...matches, ...newMatches]);
    }
  };

  // Controle de Placar
  const selectMatch = (match: Match) => {
    setSelectedMatch(match);
    setTempScore({
      dupla1: match.placar.dupla1,
      dupla2: match.placar.dupla2
    });
  };

  const handleScoreChange = (field: 'dupla1' | 'dupla2', value: string) => {
    setTempScore(prev => ({
      ...prev,
      [field]: parseInt(value) || 0
    }));
  };

  const saveScore = () => {
    if (selectedMatch) {
      const updatedMatches = matches.map(match =>
        match.id === selectedMatch.id ? {
          ...match,
          placar: tempScore
        } : match
      );
      onUpdateMatches(updatedMatches);
      setSelectedMatch(null);
    }
  };

  // Cálculo de Classificação
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6">
      {/* Coluna 1 - Formação de Grupos */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">🏗️ Formação de Grupos</h2>
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="font-medium mb-2">Duplas Disponíveis</h3>
            <div className="grid grid-cols-1 gap-2">
              {teams.map(team => (
                <div
                  key={team.id}
                  className="p-2 border rounded-md cursor-move hover:bg-indigo-50"
                  draggable
                  onDragStart={(e) => handleDragStart(e, team)}
                >
                  {team.atleta1} / {team.atleta2}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="font-medium mb-2">Grupos Criados</h3>
            {groups.map((group, index) => (
              <div
                key={group.id}
                className="p-4 mb-2 border rounded-md bg-white"
                onDrop={(e) => handleDrop(e, index)}
                onDragOver={handleDragOver}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Grupo {index + 1}</span>
                  <button
                    onClick={() => deleteGroup(group.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>
                {group.teams.map(team => (
                  <div
                    key={team.id}
                    className="p-1 text-sm border rounded-sm mb-1 bg-gray-50"
                  >
                    {team.atleta1} / {team.atleta2}
                  </div>
                ))}
              </div>
            ))}
            <button
              onClick={createNewGroup}
              className="w-full mt-2 py-2 bg-indigo-100 text-indigo-600 rounded-md hover:bg-indigo-200"
            >
              + Novo Grupo
            </button>
          </div>
        </div>
      </div>

      {/* Coluna 2 - Confrontos do Grupo */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">⚔️ Confrontos Agendados</h2>
        <div className="space-y-4">
          {groups.map(group => (
            <div key={group.id} className="border rounded-md p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">{group.name}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => generateMatches(group)}
                    className="px-3 py-1 bg-green-100 text-green-600 rounded-md text-sm"
                  >
                    Gerar Confrontos
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {matches
                  .filter(match => match.rodada === group.name)
                  .map(match => (
                    <div
                      key={match.id}
                      className={`p-3 rounded-md cursor-pointer ${match.placar.dupla1 + match.placar.dupla2 > 0
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 hover:bg-gray-100'}`}
                      onClick={() => selectMatch(match)}
                    >
                      <div className="flex justify-between items-center">
                        <span>{match.dupla1}</span>
                        <span className="mx-2">vs</span>
                        <span>{match.dupla2}</span>
                      </div>
                      {match.placar.dupla1 + match.placar.dupla2 > 0 && (
                        <div className="text-center mt-1 text-sm text-gray-600">
                          {match.placar.dupla1} - {match.placar.dupla2}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Coluna 3 - Controle de Placar */}
      {selectedMatch && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">📊 Controle de Partida</h2>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-4">Placar da Partida</h3>
              <div className="flex items-center justify-center gap-4">
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

                <div className="text-2xl font-bold">x</div>

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

              <button
                onClick={saveScore}
                className="w-full mt-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Salvar Placar
              </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">Classificação do Grupo</h3>
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-600">
                    <th className="pb-2">Posição</th>
                    <th className="pb-2">Dupla</th>
                    <th className="pb-2">Pontos</th>
                    <th className="pb-2">Vitórias</th>
                  </tr>
                </thead>
                <tbody>
                  {calculateStandings(groups.find(g => g.name === selectedMatch.rodada)!).map((standing, index) => (
                    <tr key={index} className="border-t">
                      <td className="py-2">{index + 1}</td>
                      <td className="py-2">{standing.team}</td>
                      <td className="py-2">{standing.points}</td>
                      <td className="py-2">{standing.wins}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}