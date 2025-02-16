import React, { useState, useEffect } from 'react';
import type { Team, Match, Group } from '../types';

interface Props {
  teams: Team[];
  matches: Match[];
  onUpdateMatches: (matches: Match[]) => void;
}

export default function GroupStage({ teams, matches, onUpdateMatches }: Props) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [tempScore, setTempScore] = useState({ dupla1: 0, dupla2: 0 });

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

  const isValidScore = (score1: number, score2: number) => {
    const maxScore = Math.max(score1, score2);
    const minScore = Math.min(score1, score2);
    return (maxScore === 21 && minScore < 20) || (maxScore >= 20 && (maxScore - minScore === 2));
  };

  const calculateStandings = (group: Group) => {
    if (!group?.teams) return [];

    const standings: {
      [key: string]: { wins: number; pointsFor: number; pointsAgainst: number }
    } = {};

    // Inicializa as estatísticas para todas as duplas do grupo
    group.teams.forEach(team => {
      const teamName = `${team.atleta1}/${team.atleta2}`;
      standings[teamName] = { wins: 0, pointsFor: 0, pointsAgainst: 0 };
    });

    // Processa os confrontos do grupo
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
      } else {
        console.warn(`Confronto com dupla inválida: ${match.dupla1} vs ${match.dupla2}`);
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

  const allGroupMatchesCompleted = () => {
    return groups.every(group => {
      const groupMatches = matches.filter(m => m.rodada === group.name);
      return groupMatches.every(m => isValidScore(m.placar.dupla1, m.placar.dupla2));
    });
  };

  // As funções de geração de semifinais e finais permanecem no código,
  // mas como os botões foram removidos, elas não são acionadas pela interface.
  const generateSemifinals = () => {
    if (!allGroupMatchesCompleted()) {
      alert('Complete todos os jogos da fase de grupos primeiro!');
      return;
    }

    const validGroups = groups.filter(group => {
      const standings = calculateStandings(group);
      return standings.length >= 2;
    });

    if (validGroups.length < 2) {
      alert('É necessário pelo menos 2 grupos com 2 times cada para gerar as semifinais!');
      return;
    }

    const existingSemifinals = matches.filter(m => m.rodada === 'Semifinal');
    if (existingSemifinals.length > 0) {
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

    onUpdateMatches([...matches, ...newMatches]);
  };

  const generateFinalMatches = () => {
    const semifinals = matches.filter(m => m.rodada === 'Semifinal');

    if (semifinals.some(m => !isValidScore(m.placar.dupla1, m.placar.dupla2))) {
      alert('Complete todas as semifinais primeiro!');
      return;
    }

    const existingFinal = matches.some(m => m.rodada === 'Final');
    const existingThirdPlace = matches.some(m => m.rodada === 'Terceiro Lugar');

    if (existingFinal && existingThirdPlace) {
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

    if (!existingFinal) {
      newMatches.push({
        id: crypto.randomUUID(),
        rodada: 'Final',
        dupla1: winners[0],
        dupla2: winners[1],
        placar: { dupla1: 0, dupla2: 0 }
      });
    }

    if (!existingThirdPlace) {
      newMatches.push({
        id: crypto.randomUUID(),
        rodada: 'Terceiro Lugar',
        dupla1: losers[0],
        dupla2: losers[1],
        placar: { dupla1: 0, dupla2: 0 }
      });
    }

    onUpdateMatches([...matches, ...newMatches]);
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
        {groups.map(group => (
          <div key={group.id} className="mb-6">
            <h3 className="font-bold mb-2 text-base sm:text-lg">Grupo {group.name}</h3>
            <div className="bg-gray-50 p-4 rounded-md">
              {calculateStandings(group).map(({ team, wins, saldo, pa }, index) => (
                <div
                  key={team}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 p-2 bg-white rounded shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-1 sm:mb-0">
                    <span className="font-medium w-8">{index + 1}º</span>
                    <span className="font-semibold">{team}</span>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 flex flex-wrap gap-1">
                    <span className="bg-green-100 px-2 py-1 rounded">{wins} V</span>
                    <span>|</span>
                    <span className="bg-blue-100 px-2 py-1 rounded">{saldo} SP</span>
                    <span>|</span>
                    <span className="bg-purple-100 px-2 py-1 rounded">{pa} PA</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
