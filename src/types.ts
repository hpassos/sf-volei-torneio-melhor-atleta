export interface Athlete {
  id: string;
  nome: string;
}

export interface Team {
  id: number;
  atleta1: string;
  atleta2: string;
  grupo: string;
}

export interface Match {
  id: string;
  rodada: string;
  dupla1: string;
  dupla2: string;
  placar: {
    dupla1: number;
    dupla2: number;
  };
}

export interface Vote {
  votante: string;
  voto: string;
}

export interface RoundVotes {
  [key: string]: Vote[];
}

export interface Database {
  atletas: Athlete[];
  duplas: Team[];
  confrontos: Match[];
  votacoes: RoundVotes;
  grupos: Group[];
}

export const initialData: Database = {
  atletas: [],
  duplas: [],
  confrontos: [],
  votacoes: {},
  grupos: [],
};

export interface MatchAnalysis {
  id: string;
  rodada: string;
  totalPoints: number;
}

export interface IndividualStats {
  name: string;
  wins: number;
  votesReceived: number;
}