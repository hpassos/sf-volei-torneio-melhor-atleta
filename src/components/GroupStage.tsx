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

    group.teams.forEach(team => {
      const teamName = `${team.atleta1}/${team.atleta2}`;
      standings[teamName] = { wins: 0, pointsFor: 0, pointsAgainst: 0 };
    });

    matches.filter(m => m.rodada === group.name).forEach(match => {
      const { dupla1, dupla2 } = match.placar;

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
    });

    return Object.entries(standings).map(([team, stats]) => ({
      team,
      wins: stats.wins,
      saldo: stats.pointsFor - stats.pointsAgainst,
      pa: stats.pointsAgainst > 0
        ? (stats.pointsFor / stats.pointsAgainst).toFixed(2)
        : '∞'
    })).sort((a, b) => b.wins - a.wins || b.saldo - a.saldo || parseFloat(b.pa) - parseFloat(a.pa));
  };

  return (
    <div className="p-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <button
          onClick={() => {
            const newMatches = groups.flatMap(group =>
              group.teams.flatMap((team1, i) =>
                group.teams.slice(i + 1).map(team2 => ({
                  id: crypto.randomUUID(),
                  rodada: group.name,
                  dupla1: `${team1.atleta1}/${team1.atleta2}`,
                  dupla2: `${team2.atleta1}/${team2.atleta2}`,
                  placar: { dupla1: 0, dupla2: 0 }
                }))
              ));
            onUpdateMatches([...matches, ...newMatches]);
          }}
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
    </div>
  );
}