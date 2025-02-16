import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import type { Database } from '../types';

interface Props {
  data: Database;
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function Dashboard({ data }: Props) {
  // Estatísticas existentes
  const [voteStats, votersStats, matchStats] = useMemo(() => {
    const voteStats: Record<string, number> = {};
    const votersStats: Record<string, number> = {};

    Object.values(data.votacoes).forEach(roundVotes => {
      roundVotes.forEach(vote => {
        voteStats[vote.voto] = (voteStats[vote.voto] || 0) + 1;
        votersStats[vote.votante] = (votersStats[vote.votante] || 0) + 1;
      });
    });

    const matchStats = data.confrontos.reduce((acc, match) => {
      const winner = match.placar.dupla1 > match.placar.dupla2 ? match.dupla1 : match.dupla2;
      [match.dupla1, match.dupla2].forEach(team => {
        acc[team] = acc[team] || { wins: 0, totalGames: 0 };
        acc[team].totalGames++;
        if (team === winner) acc[team].wins++;
      });
      return acc;
    }, {} as Record<string, { wins: number; totalGames: number }>);

    return [
      Object.entries(voteStats).map(([name, votes]) => ({ name, votes })),
      Object.entries(votersStats).map(([name, votes]) => ({ name, votes })),
      Object.entries(matchStats).map(([team, { wins, totalGames }]) => ({
        team,
        winRate: (wins / totalGames) * 100
      }))
    ];
  }, [data]);

  // Novas estatísticas
  const [groupStandings, individualStats, matchAnalysis] = useMemo(() => {
    // Classificação por grupo
    const groupStandings = data.duplas.reduce((acc, dupla) => {
      const groupKey = dupla.grupo;
      const teamName = `${dupla.atleta1}/${dupla.atleta2}`;

      const wins = data.confrontos.filter(c =>
        (c.dupla1 === teamName && c.placar.dupla1 > c.placar.dupla2) ||
        (c.dupla2 === teamName && c.placar.dupla2 > c.placar.dupla1)
      ).length;

      acc[groupKey] = acc[groupKey] || [];
      acc[groupKey].push({
        team: teamName,
        wins,
        points: wins * 3,
        pointsFor: data.confrontos.reduce((sum, c) =>
          sum + (c.dupla1 === teamName ? c.placar.dupla1 : c.dupla2 === teamName ? c.placar.dupla2 : 0), 0
        )
      });
      return acc;
    }, {} as Record<string, Array<{ team: string; wins: number; points: number; pointsFor: number }>>);

    // Estatísticas individuais
    const individualStats = data.atletas.map(athlete => {
      const totalWins = data.confrontos.filter(c =>
        c.dupla1.includes(athlete.nome) && c.placar.dupla1 > c.placar.dupla2 ||
        c.dupla2.includes(athlete.nome) && c.placar.dupla2 > c.placar.dupla1
      ).length;

      return {
        name: athlete.nome,
        wins: totalWins,
        votesReceived: voteStats.find(v => v.name === athlete.nome)?.votes || 0
      };
    });

    // Análise de partidas
    const matchAnalysis = data.confrontos.map(match => ({
      ...match,
      totalPoints: match.placar.dupla1 + match.placar.dupla2
    }));

    return [groupStandings, individualStats, matchAnalysis];
  }, [data, voteStats]);

  // Visualização de votos
  const votingNetwork = useMemo(() => {
    const nodes = data.atletas.map(athlete => ({ id: athlete.nome }));
    const links = Object.values(data.votacoes).flat().map(vote => ({
      source: vote.votante,
      target: vote.voto
    }));
    return { nodes, links };
  }, [data]);

  return (
    <div className="p-6 space-y-8">
      {/* Seção de Grupos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(groupStandings).map(([group, standings]) => (
          <div key={group} className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Grupo {group}</h3>
            <table className="w-full">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-2">Dupla</th>
                  <th className="pb-2">Vitórias</th>
                  <th className="pb-2">Pontos</th>
                </tr>
              </thead>
              <tbody>
                {standings.sort((a, b) => b.points - a.points).map((team) => (
                  <tr key={team.team} className="border-b">
                    <td className="py-2">{team.team}</td>
                    <td className="py-2">{team.wins}</td>
                    <td className="py-2 font-medium">{team.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* Análise de Partidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Performance Ofensiva</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={matchAnalysis}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="rodada" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="totalPoints" fill="#4F46E5" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Relação Vitórias-Votos</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid />
              <XAxis type="number" dataKey="votesReceived" name="Votos Recebidos" />
              <YAxis type="number" dataKey="wins" name="Vitórias" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={individualStats} fill="#10B981" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Linha do Tempo do Torneio */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Progressão do Torneio</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={matchAnalysis}>
            <Line type="monotone" dataKey="totalPoints" stroke="#F59E0B" />
            <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
            <XAxis dataKey="rodada" />
            <YAxis />
            <Tooltip />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Visualização de Votos (Exemplo com gráfico de rede simples) */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Rede de Votos</h3>
        <div className="grid grid-cols-3 gap-4">
          {votingNetwork.links.map((link, index) => (
            <div key={index} className="p-2 bg-gray-50 rounded">
              <span className="text-indigo-600">{link.source}</span> →
              <span className="text-emerald-600">{link.target}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};