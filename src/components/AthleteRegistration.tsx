import React, { useState } from 'react';
import type { Athlete } from '../types';
import { v4 as uuidv4 } from 'uuid';


interface Props {
  athletes: Athlete[];
  onUpdate: (athletes: Athlete[]) => void;
}

export default function AthleteRegistration({ athletes, onUpdate }: Props) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const isDuplicate = athletes.some(athlete => athlete.nome === name.trim());
    if (isDuplicate) {
      alert('Atleta já cadastrado!');
      return;
    }

    const newAthlete: Athlete = {
      id: uuidv4(),
      nome: name.trim(),
    };

    onUpdate([...athletes, newAthlete]);
    setName('');
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Cadastro de Atletas</h2>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do atleta"
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Adicionar Atleta
          </button>
        </div>
      </form>

      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Atletas Cadastrados</h3>
        {athletes.length === 0 ? (
          <p className="text-gray-500">Nenhum atleta cadastrado</p>
        ) : (
          <ul className="space-y-2">
            {athletes.map((athlete) => (
              <li
                key={athlete.id}
                className="flex items-center justify-between bg-white p-3 rounded-md shadow-sm"
              >
                <span>{athlete.nome}</span>
                <span className="text-gray-500">#{athlete.id}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}