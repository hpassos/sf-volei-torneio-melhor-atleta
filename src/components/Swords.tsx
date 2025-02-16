import React, { useState } from 'react';
import type { Match, Team } from '../types';

interface Props {
  teams: Team[];
  matches?: Match[];
  onUpdate: (matches: Match[]) => void;
}

export default function SwordsC({ teams, matches = [], onUpdate }: Props) {
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

  // Agrupa os times pelo atributo "grupo"
  const getGroups = () => {
    const groupsObj = teams.reduce((acc: { [key: string]: Team[] }, team) => {
      const groupName = team.grupo || 'Sem Grupo';
      if (!acc[groupName]) acc[groupName] = [];
      acc[groupName].push(team);
      return acc;
    }, {});
    return Object.entries(groupsObj).map(([name, teams]) => ({
      id: name,
      name,
      teams
    }));
  };

  // Gera os confrontos da fase de grupos
  const generateGroupMatches = () => {
    const groups = getGroups();
    const existingMatches = new Set(
      matches.map(m => `${m.rodada}|${m.dupla1}|${m.dupla2}`)
    );
    const newMatches: Match[] = [];
    groups.forEach(group => {
      group.teams.forEach((team1, i) => {
        for (let j = i + 1; j < group.teams.length; j++) {
          const team2 = group.teams[j];
          const dupla1 = `${team1.atleta1}/${team1.atleta2}`;
          const dupla2 = `${team2.atleta1}/${team2.atleta2}`;
          const matchKey = `${group.name}|${dupla1}|${dupla2}`;
          if (!existingMatches.has(matchKey)) {
            newMatches.push({
              id: crypto.randomUUID(),
              rodada: group.name,
              dupla1,
              dupla2,
              placar: { dupla1: 0, dupla2: 0 }
            });
          }
        }
      });
    });
    onUpdate([...matches, ...newMatches]);
  };

  // Calcula a classificação de cada grupo com base nos resultados
  const calculateStandings = (group: { id: string; name: string; teams: Team[] }) => {
    if (!group?.teams) return [];
    const standings: {
      [key: string]: { wins: number; pointsFor: number; pointsAgainst: number }
    } = {};
    group.teams.forEach(team => {
      const teamName = `${team.atleta1}/${team.atleta2}`;
      standings[teamName] = { wins: 0, pointsFor: 0, pointsAgainst: 0 };
    });
    matches.filter(m => m.rodada === group.name).forEach(match => {
      const { dupla1, dupla2 } = match.placar;
      if (standings[match.dupla1] && standings[match.dupla2]) {
        standings[match.dupla1].pointsFor += dupla1;
        standings[match.dupla1].pointsAgainst += dupla2;
        standings[match.dupla2].pointsFor += dupla2;
        standings[match.dupla2].pointsAgainst += dupla1;
        if (isValidScore(dupla1, dupla2)) {
          if (dupla1 > dupla2) {
            standings[match.dupla1].wins += 1;
          } else {
            standings[match.dupla2].wins += 1;
          }
        }
      }
    });
    return Object.entries(standings)
      .map(([team, stats]) => ({
        team,
        wins: stats.wins,
        saldo: stats.pointsFor - stats.pointsAgainst,
        pa: stats.pointsAgainst > 0
          ? (stats.pointsFor / stats.pointsAgainst).toFixed(2)
          : '∞'
      }))
      .sort((a, b) => b.wins - a.wins || b.saldo - a.saldo || parseFloat(b.pa) - parseFloat(a.pa));
  };

  // Verifica se todos os confrontos dos grupos foram concluídos (placar válido)
  const allGroupMatchesCompleted = (groups: { id: string; name: string; teams: Team[] }[]) => {
    return groups.every(group => {
      const groupMatches = matches.filter(m => m.rodada === group.name);
      return groupMatches.every(m => isValidScore(m.placar.dupla1, m.placar.dupla2));
    });
  };

  // Gera as semifinais com base nos melhores de cada grupo
  const generateSemifinals = () => {
    const groups = getGroups();
    if (!allGroupMatchesCompleted(groups)) {
      alert('Complete todos os jogos da fase de grupos primeiro!');
      return;
    }
    const validGroups = groups.filter(group => calculateStandings(group).length >= 2);
    if (validGroups.length < 2) {
      alert('É necessário pelo menos 2 grupos com 2 times cada para gerar as semifinais!');
      return;
    }
    if (matches.some(m => m.rodada === 'Semifinal')) {
      alert('As semifinais já foram geradas!');
      return;
    }
    const allStandings = validGroups.map(group => ({
      group: group.name,
      first: calculateStandings(group)[0]?.team,
      second: calculateStandings(group)[1]?.team
    }));
    const newMatches: Match[] = [];
    for (let i = 0; i < validGroups.length; i += 2) {
      const currentGroup = allStandings[i];
      const nextGroup = allStandings[i + 1];
      if (nextGroup) {
        if (currentGroup.first && nextGroup.second) {
          newMatches.push({
            id: crypto.randomUUID(),
            rodada: 'Semifinal',
            dupla1: currentGroup.first,
            dupla2: nextGroup.second,
            placar: { dupla1: 0, dupla2: 0 }
          });
        }
        if (nextGroup.first && currentGroup.second) {
          newMatches.push({
            id: crypto.randomUUID(),
            rodada: 'Semifinal',
            dupla1: nextGroup.first,
            dupla2: currentGroup.second,
            placar: { dupla1: 0, dupla2: 0 }
          });
        }
      }
    }
    onUpdate([...matches, ...newMatches]);
  };

  // Gera a Final e o confronto para o 3º lugar a partir dos resultados das semifinais
  const generateFinalMatches = () => {
    const semifinals = matches.filter(m => m.rodada === 'Semifinal');
    if (semifinals.some(m => !isValidScore(m.placar.dupla1, m.placar.dupla2))) {
      alert('Complete todas as semifinais primeiro!');
      return;
    }
    if (matches.some(m => m.rodada === 'Final') && matches.some(m => m.rodada === 'Terceiro Lugar')) {
      alert('A final e o terceiro lugar já foram gerados!');
      return;
    }
    const winners: string[] = [];
    const losers: string[] = [];
    semifinals.forEach(match => {
      if (match.placar.dupla1 > match.placar.dupla2) {
        winners.push(match.dupla1);
        losers.push(match.dupla2);
      } else {
        winners.push(match.dupla2);
        losers.push(match.dupla1);
      }
    });
    const newMatches: Match[] = [];
    if (!matches.some(m => m.rodada === 'Final')) {
      newMatches.push({
        id: crypto.randomUUID(),
        rodada: 'Final',
        dupla1: winners[0],
        dupla2: winners[1],
        placar: { dupla1: 0, dupla2: 0 }
      });
    }
    if (!matches.some(m => m.rodada === 'Terceiro Lugar')) {
      newMatches.push({
        id: crypto.randomUUID(),
        rodada: 'Terceiro Lugar',
        dupla1: losers[0],
        dupla2: losers[1],
        placar: { dupla1: 0, dupla2: 0 }
      });
    }
    onUpdate([...matches, ...newMatches]);
  };

  return (
    <div className="p-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        {/* Seção com os botões de "Gerar" */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={generateGroupMatches}
            className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-xs sm:text-base"
          >
            Gerar Confrontos dos Grupos
          </button>
          <button
            onClick={generateSemifinais}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs sm:text-base"
          >
            Gerar Semifinais
          </button>
          <button
            onClick={generateFinalMatches}
            className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-xs sm:text-base"
          >
            Gerar Final e 3º Lugar
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Partidas dos Grupos */}
          <div>
            <h3 className="text-lg font-bold mb-4">Partidas dos Grupos</h3>
            {[...new Set(matches?.map(m => m.rodada))].map(group => (
              <div key={group} className="mb-6">
                <h4 className="font-medium mb-2">{group}</h4>
                {(matches || []).filter(m => m.rodada === group).map(match => (
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
                {(matches || []).filter(m => m.rodada === stage).map(match => (
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
