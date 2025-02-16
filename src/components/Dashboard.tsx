import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

import type { Database } from '../types';

interface Props {
  data: Database;
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function Dashboard({ data }: Props) {
  const voteStats = useMemo(() => {
    const stats: Record<string, number> = {};

    Object.values(data.votacoes).forEach(roundVotes => {
      roundVotes.forEach(vote => {
        stats[vote.voto] = (stats[vote.voto] || 0) + 1;
      });
    });

    return Object.entries(stats)
      .map(([name, votes]) => ({ name, votes }))
      .sort((a, b) => b.votes - a.votes); // Ordena do mais votado para o menos
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
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Atletas Mais Votados</h3>
          <div className="flex justify-center">
            <BarChart
              width={500}
              height={300}
              data={voteStats}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                interval={0}
                height={70}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="votes"
                name="Votos"
                fill="#4F46E5"
                barSize={20}
              />
            </BarChart>
          </div>


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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Votos por Atleta</h3>
            <div className="flex justify-center">
              <PieChart width={400} height={300}>
                <Pie
                  data={voteStats}
                  dataKey="votes"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {voteStats.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </div>
          </div>

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

          <div className="bg-white p-6 rounded-lg shadow-md md:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Estatísticas Gerais</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-indigo-50 p-4 rounded-lg">
                <p className="text-sm text-indigo-600 mb-1">Total de Atletas</p>
                <p className="text-2xl font-bold text-indigo-900">{data.atletas.length}</p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-lg">
                <p className="text-sm text-emerald-600 mb-1">Total de Duplas</p>
                <p className="text-2xl font-bold text-emerald-900">{data.duplas.length}</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg">
                <p className="text-sm text-amber-600 mb-1">Partidas Realizadas</p>
                <p className="text-2xl font-bold text-amber-900">{data.confrontos.length}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-600 mb-1">Total de Votos</p>
                <p className="text-2xl font-bold text-purple-900">
                  {Object.values(data.votacoes).flat().reduce((acc, curr) => acc + curr.length, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      );
}