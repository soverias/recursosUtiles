import { Tool } from '../models/tool.model';

export const TOOLS: Tool[] = [
  {
    id: 'bang-game',
    name: 'Bang! Game',
    description: 'Juego de cartas Bang! para partidas online con amigos.',
    category: 'games',
    icon: '🎯',
    url: '/bang-game/',
    color: '#b91c1c',
  },
  {
    id: 'secret-friend',
    name: 'Secret Friend',
    description: 'Sortea amigos invisibles y gestiona grupos de forma rápida.',
    category: 'utilities',
    icon: '🎁',
    url: '/secret-friend/',
    color: '#6366f1',
  },
  {
    id: 'calculator',
    name: 'Calculadora',
    description: 'Calculadora con conversor de unidades integrado: datos, peso, volumen, longitud y temperatura.',
    category: 'utilities',
    icon: '🧮',
    url: '/calculator/',
    color: '#0d9488',
  },
];
