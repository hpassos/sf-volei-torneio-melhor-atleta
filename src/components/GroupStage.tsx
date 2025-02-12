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
  const [activeTab, setActiveTab] = useState('groups');

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
              rodada: group.name,
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

  // Verifica se o placar é válido conforme as regras
  const isValidScore = (score1: number, score2: number) => {
    const maxScore = Math.max(score1, score2);
    const minScore = Math.min(score1, score2);

    // Vitória normal
    if (maxScore === 21 && minScore < 20) return true;

    // Empate em 20-20 precisa de diferença de 2 pontos
    if (maxScore >= 20 && minScore >= 20) {
      return maxScore - minScore === 2;
    }

    return false;
  };

  // Atualiza classificação
  const calculateStandings = (group: Group) => {
    const standings: {
      [key: string]: {
        wins: number;
        pointsFor: number;
        pointsAgainst: number;
      }
    } = {};

    group.teams.forEach(team => {
      const teamName = `${team.atleta1}/${team.atleta2}`;
      standings[teamName] = { wins: 0, pointsFor: 0, pointsAgainst: 0 };
    });

    matches
      .filter(match => match.rodada === group.name)
      .forEach(match => {
        const score1 = match.placar.dupla1;
        const score2 = match.placar.dupla2;

        // Atualiza pontos marcados e sofridos
        standings[match.dupla1].pointsFor += score1;
        standings[match.dupla1].pointsAgainst += score2;

        standings[match.dupla2].pointsFor += score2;
        standings[match.dupla2].pointsAgainst += score2;

        // Verifica vitória válida
        if (isValidScore(score1, score2)) {
          if (score1 > score2) {
            standings[match.dupla1].wins += 1;
          } else {
            standings[match.dupla2].wins += 1;
          }
        }
      });

    return Object.entries(standings)
      .map(([team, stats]) => {
        const saldo = stats.pointsFor - stats.pointsAgainst;
        const pa = stats.pointsAgainst > 0
          ? (stats.pointsFor / stats.pointsAgainst).toFixed(2)
          : '∞';

        return {
          team,
          wins: stats.wins,
          saldo,
          pa
        };
      })
      .sort((a, b) =>
        b.wins - a.wins ||
        b.saldo - a.saldo ||
        parseFloat(b.pa) - parseFloat(a.pa)
      );
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
      if (!isValidScore(tempScore.dupla1, tempScore.dupla2)) {
        alert('Placar inválido! O jogo deve terminar em 21 pontos com diferença de 2 pontos a partir dos 20 pontos.');
        return;
      }

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
    <div className="p-6">
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('groups')}
          className={`px-4 py-2 ${activeTab === 'groups' ? 'border-b-2 border-indigo-600' : ''}`}
        >
          🏆 Fase de Grupos
        </button>
        <button
          onClick={() => setActiveTab('matches')}
          className={`px-4 py-2 ${activeTab === 'matches' ? 'border-b-2 border-indigo-600' : ''}`}
        >
          ⚔️ Confrontos
        </button>
      </div>

      {activeTab === 'groups' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <button
            onClick={generateGroupMatches}
            className="w-full mb-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Gerar Confrontos dos Grupos
          </button>

          {groups.map(group => (
            <div key={group.id} className="mb-6">
              <h3 className="font-bold mb-2 text-lg">Grupo {group.name}</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                {calculateStandings(group).map(({ team, wins, saldo, pa }, index) => (
                  <div key={team} className="flex justify-between items-center mb-2 p-2 bg-white rounded shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="font-medium w-8">{index + 1}º</span>
                      <span className="font-semibold">{team}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="bg-green-100 px-2 py-1 rounded">{wins} V</span>
                      <span className="mx-2">|</span>
                      <span className="bg-blue-100 px-2 py-1 rounded">{saldo} SP</span>
                      <span className="mx-2">|</span>
                      <span className="bg-purple-100 px-2 py-1 rounded">{pa} PA</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'matches' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-bold mb-4">Partidas dos Grupos</h3>
              {groups.map(group => (
                <div key={group.id} className="mb-6">
                  <h4 className="font-medium mb-2">Grupo {group.name}</h4>
                  {matches
                    .filter(m => m.rodada === group.name)
                    .map(match => (
                      <div key={match.id} className="bg-gray-50 p-3 rounded-md mb-2 cursor-pointer hover:bg-gray-100"
                        onClick={() => selectMatch(match)}>
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
                            {!isValidScore(match.placar.dupla1, match.placar.dupla2) &&
                              ' (Jogo não finalizado)'}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              ))}
            </div>

            <div>
              <h3 className="text-lg font-bold mb-4">Fases Eliminatórias</h3>
              {['Semifinal', 'Terceiro Lugar', 'Final'].map(stage => (
                <div key={stage} className="mb-6">
                  <h4 className="font-medium mb-2">{stage}</h4>
                  {matches
                    .filter(m => m.rodada.startsWith(stage))
                    .map(match => (
                      <div key={match.id} className="bg-gray-50 p-3 rounded-md mb-2 cursor-pointer hover:bg-gray-100"
                        onClick={() => selectMatch(match)}>
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
                            {!isValidScore(match.placar.dupla1, match.placar.dupla2) &&
                              ' (Jogo não finalizado)'}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
  );
}