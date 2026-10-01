export interface TeamData {
    id: string;
    name: string;
    color: string;
    logo: string;
    group: number;
}

export const F1_TEAMS: TeamData[] = [
    { id: 'a3426c97-c9c2-42bb-978f-ebee9e2dbf04', name: 'McLaren', color: '#FF8700', logo: 'MCL', group: 1 },
    { id: '8f46a381-a085-4d8c-92a2-81794fb17a2a', name: 'Mercedes', color: '#00D2BE', logo: 'MER', group: 1 },
    { id: '71318fd6-b774-49c5-b32d-9d5aeba33466', name: 'Williams', color: '#005AFF', logo: 'WIL', group: 1 },
    { id: 'e579d45e-2bd1-4b48-be2f-e60ffbf9de78', name: 'Aston Martin', color: '#229971', logo: 'AST', group: 1 },
    { id: '559aaff5-63f9-43bf-8630-285281485c41', name: 'Alpine', color: '#0090FF', logo: 'ALP', group: 1 },

    { id: 'e59f0b0a-b8c3-4416-b90c-6f26bf8fc888', name: 'Ferrari', color: '#FF2800', logo: 'FER', group: 2 },
    { id: 'e32b7324-b24c-4b21-8c44-1226904cf6de', name: 'Haas', color: '#B6BABD', logo: 'HAA', group: 2 },
    { id: '30fb07ad-e056-4f4f-be71-6a9d533a9cca', name: 'Audi', color: '#F50537', logo: 'AUD', group: 2 },
    { id: 'b105e3bf-0658-4903-8609-60d1a3976506', name: 'Cadillac', color: '#1B2021', logo: 'CAD', group: 2 },

    { id: '584882ea-2a8f-43e6-8943-9c213692738c', name: 'Red Bull Racing', color: '#0600EF', logo: 'RBR', group: 3 },
    { id: '9130511e-ca0e-465f-bcb3-7b9197983949', name: 'RB', color: '#6692FF', logo: 'RBA', group: 3 },
];
