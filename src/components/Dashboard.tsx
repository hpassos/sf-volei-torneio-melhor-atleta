import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';

import type { Database } from '../types';

interface Props {
  data: Database;
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function Dashboard({ data }: Props) {
  // Estatísticas de atletas mais votados
  const voteStats = useMemo(() => {
    const stats: Record<string, number> = {};

    Object.values(data.votacoes).forEach(roundVotes => {
      roundVotes.forEach(vote => {
        stats[vote.voto] = (stats[vote.voto] || 0) + 1;
      });
    });

    return Object.entries(stats)
      .map(([name, votes]) => ({ name, votes }))
      .sort((a, b) => b.votes - a.votes);
  }, [data.votacoes]);

  // Estatísticas de atletas que mais votaram
  const votersStats = useMemo(() => {
    const stats: Record<string, number> = {};

    Object.values(data.votacoes).forEach(roundVotes => {
      roundVotes.forEach(vote => {
        stats[vote.votante] = (stats[vote.votante] || 0) + 1;
      });
    });

    return Object.entries(stats)
      .map(([name, votes]) => ({ name, votes }))
      .sort((a, b) => b.votes - a.votes);
  }, [data.votacoes]);

  const matchStats = useMemo(() => {
    const stats: Record<string, { wins: number; totalGames: number }> = {};

    data.confrontos.forEach(match => {
      const winner = match.placar.dupla1 > match.placar.dupla2 ? match.dupla1 : match.dupla2;
      const teams = [match.dupla1, match.dupla2];

      teams.forEach(team => {
        if (!stats[team]) {
          stats[team] = { wins: 0, totalGames: 0 };
        }
        stats[team].totalGames++;
        if (team === winner) {
          stats[team].wins++;
        }
      });
    });

    return Object.entries(stats).map(([team, { wins, totalGames }]) => ({
      team,
      winRate: (wins / totalGames) * 100,
    }));
  }, [data.confrontos]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Resultados</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Seção de Atletas Mais Votados */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Atletas + completos</h3>
          <div className="mt-6 space-y-3">
            {voteStats.slice(0, 3).map((athlete, index) => (
              <div
                key={athlete.name}
                className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg"
              >
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-indigo-600">
                    #{index + 1}
                  </span>
                  <span className="font-medium">{athlete.name}</span>
                </div>
                <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm">
                  {athlete.votes} votos
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Nova Seção: Atletas que Mais Votaram */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Atletas que votaram</h3>

          <div className="space-y-3">
            {votersStats.slice(0, 3).map((voter, index) => (
              <div
                key={voter.name}
                className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg"
              >
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-emerald-600">
                    #{index + 1}
                  </span>
                  <span className="font-medium">{voter.name}</span>
                </div>
                <span className="bg-emerald-600 text-white px-3 py-1 rounded-full text-sm">
                  {voter.votes} votos
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Seção de Taxa de Vitória */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Taxa de Vitória por Dupla</h3>
          <div className="flex justify-center">
            <BarChart width={400} height={300} data={matchStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="team" angle={-45} textAnchor="end" height={100} />
              <YAxis label={{ value: 'Taxa de Vitória (%)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Bar dataKey="winRate" fill="#4F46E5" />
            </BarChart>
          </div>


        </div>
      </div>
    </div>
  );
};