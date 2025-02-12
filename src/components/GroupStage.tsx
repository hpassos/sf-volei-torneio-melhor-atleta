import React, { useState, useEffect } from 'react';
import type { Team, Match, Group } from '../types';

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

  // Agrupa times automaticamente pelo campo grupo
  useEffect(() => {
    const grouped = teams.reduce((acc: { [key: string]: Team[] }, team) => {
      const groupName = team.grupo || 'Sem Grupo';
      if (!acc[groupName]) acc[groupName] = [];
      acc[groupName].push(team);
      return acc;
    }, {});

    const formattedGroups = Object.entries(grouped).map(([name, teams]) => ({
      id: name,
      name,
      teams
    }));

    setGroups(formattedGroups);
  }, [teams]);

  // Gera confrontos da fase de grupos
  const generateGroupMatches = () => {
    const newMatches: Match[] = [];

    groups.forEach(group => {
      group.teams.forEach((team1, i) => {
        group.teams.slice(i + 1).forEach(team2 => {
          const exists = matches.some(m =>
            (m.dupla1 === `${team1.atleta1}/${team1.atleta2}` &&
              m.dupla2 === `${team2.atleta1}/${team2.atleta2}`) ||
            (m.dupla1 === `${team2.atleta1}/${team2.atleta2}` &&
              m.dupla2 === `${team1.atleta1}/${team1.atleta2}`)
          );

          if (!exists) {
            newMatches.push({
              id: generateId(),
              rodada: `Grupo ${group.name}`,
              dupla1: `${team1.atleta1}/${team1.atleta2}`,
              dupla2: `${team2.atleta1}/${team2.atleta2}`,
              placar: { dupla1: 0, dupla2: 0 }
            });
          }
        });
      });
    });

    if (newMatches.length > 0) {
      onUpdateMatches([...matches, ...newMatches]);
    }
  };

  // Gera fases eliminatórias
  const generateKnockoutMatches = (stage: string, team1: string, team2: string) => {
    const exists = matches.some(m =>
      m.rodada === stage && (
        (m.dupla1 === team1 && m.dupla2 === team2) ||
        (m.dupla1 === team2 && m.dupla2 === team1)
      )
    );

    if (!exists) {
      onUpdateMatches([...matches, {
        id: generateId(),
        rodada: stage,
        dupla1: team1,
        dupla2: team2,
        placar: { dupla1: 0, dupla2: 0 }
      }]);
    }
  };

  // Calcula classificação
  const calculateStandings = (group: Group) => {
    const standings: { [key: string]: { points: number; wins: number; goals: number } } = {};

    group.teams.forEach(team => {
      const teamName = `${team.atleta1}/${team.atleta2}`;
      standings[teamName] = { points: 0, wins: 0, goals: 0 };
    });

    matches
      .filter(match => match.rodada === `Grupo ${group.name}`)
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
        standings[match.dupla1].goals += match.placar.dupla1;
        standings[match.dupla2].goals += match.placar.dupla2;
      });

    return Object.entries(standings)
      .sort((a, b) =>
        b[1].points - a[1].points ||
        b[1].wins - a[1].wins ||
        b[1].goals - a[1].goals
      );
  };

  // Gera todas as fases eliminatórias
  const generateAllKnockoutStages = () => {
    const groupStandings = groups.map(group => ({
      name: group.name,
      standings: calculateStandings(group)
    }));

    if (groupStandings.length >= 2) {
      const [groupA, groupB] = groupStandings;
      const semi1 = [groupA.standings[0][0], groupB.standings[1][0]];
      const semi2 = [groupB.standings[0][0], groupA.standings[1][0]];

      // Semifinais
      generateKnockoutMatches('Semifinal 1', semi1[0], semi1[1]);
      generateKnockoutMatches('Semifinal 2', semi2[0], semi2[1]);

      // Gera finais após as semifinais serem jogadas
      const semifinals = matches.filter(m => m.rodada.startsWith('Semifinal'));
      if (semifinals.every(m => m.placar.dupla1 + m.placar.dupla2 > 0)) {
        const thirdPlaceTeams = semifinals
          .filter(m => m.placar.dupla1 < m.placar.dupla2)
          .map(m => m.dupla1);

        const finalTeams = semifinals
          .filter(m => m.placar.dupla1 > m.placar.dupla2)
          .map(m => m.dupla1);

        if (thirdPlaceTeams.length === 2) {
          generateKnockoutMatches('Terceiro Lugar', thirdPlaceTeams[0], thirdPlaceTeams[1]);
        }
        if (finalTeams.length === 2) {
          generateKnockoutMatches('Final', finalTeams[0], finalTeams[1]);
        }
      }
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6">
      {/* Coluna 1 - Grupos e Classificação */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">🏆 Fase de Grupos</h2>
        <button
          onClick={generateGroupMatches}
          className="w-full mb-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Gerar Confrontos dos Grupos
        </button>

        {groups.map(group => (
          <div key={group.id} className="mb-6">
            <h3 className="font-bold mb-2">Grupo {group.name}</h3>
            <div className="bg-gray-50 p-4 rounded-md">
              {calculateStandings(group).map(([team, stats], index) => (
                <div key={team} className="flex justify-between items-center mb-2">
                  <div>
                    <span className="font-medium">{index + 1}º</span> {team}
                  </div>
                  <div className="text-sm text-gray-600">
                    {stats.points} pts | {stats.wins} V | {stats.goals} G
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Coluna 2 - Confrontos */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">⚔️ Confrontos</h2>
        <button
          onClick={generateAllKnockoutStages}
          className="w-full mb-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Gerar Fases Eliminatórias
        </button>

        {['Grupo', 'Semifinal', 'Terceiro Lugar', 'Final'].map(stage => (
          <div key={stage} className="mb-6">
            <h3 className="font-bold mb-2">{stage}s</h3>
            {matches
              .filter(m => m.rodada.startsWith(stage))
              .map(match => (
                <div key={match.id} className="bg-gray-50 p-4 rounded-md mb-2 cursor-pointer"
                  onClick={() => selectMatch(match)}>
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
        ))}
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
          </div>
        </div>
      )}
    </div>
  );
}