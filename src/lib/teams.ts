export interface TeamData {
    id: string;
    name: string;
    color: string;
    logo: string;
    group: number;
}

// Simulando dados que no futuro virão de uma API (Supabase ou externa)
export const F1_TEAMS: TeamData[] = [
    { id: 'mclaren', name: 'McLaren', color: '#FF8000', logo: 'MCL', group: 1 },
    { id: 'ferrari', name: 'Ferrari', color: '#E8002D', logo: 'FER', group: 1 },
    
    { id: 'redbull', name: 'Red Bull Racing', color: '#0600EF', logo: 'RBR', group: 2 },
    { id: 'mercedes', name: 'Mercedes', color: '#00D2BE', logo: 'MER', group: 2 },
    
    { id: 'aston', name: 'Aston Martin', color: '#229971', logo: 'AMR', group: 3 },
    { id: 'alpine', name: 'Alpine', color: '#0090FF', logo: 'ALP', group: 3 },
    
    { id: 'williams', name: 'Williams', color: '#005AFF', logo: 'WIL', group: 4 },
    { id: 'vcarb', name: 'RB', color: '#6692FF', logo: 'VCARB', group: 4 },
    
    { id: 'sauber', name: 'Kick Sauber', color: '#52E252', logo: 'KICK', group: 5 },
    { id: 'haas', name: 'Haas', color: '#B6BABD', logo: 'HAAS', group: 5 },
];
