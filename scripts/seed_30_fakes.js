import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fivzbbqzgvvwgtlhietx.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('ERRO: SUPABASE_SERVICE_ROLE_KEY ausente.');
  console.error('Uso: node --env-file=.env.local scripts/seed_30_fakes.js');
  process.exit(1);
}

const supabase = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const F1_TEAMS = [
    { id: 'a3426c97-c9c2-42bb-978f-ebee9e2dbf04', name: 'McLaren', color: '#FF8700', logo: 'MCL' },
    { id: '8f46a381-a085-4d8c-92a2-81794fb17a2a', name: 'Mercedes', color: '#00D2BE', logo: 'MER' },
    { id: '71318fd6-b774-49c5-b32d-9d5aeba33466', name: 'Williams', color: '#005AFF', logo: 'WIL' },
    { id: 'e579d45e-2bd1-4b48-be2f-e60ffbf9de78', name: 'Aston Martin', color: '#229971', logo: 'AST' },
    { id: '559aaff5-63f9-43bf-8630-285281485c41', name: 'Alpine', color: '#0090FF', logo: 'ALP' },
    { id: 'e59f0b0a-b8c3-4416-b90c-6f26bf8fc888', name: 'Ferrari', color: '#FF2800', logo: 'FER' },
    { id: 'e32b7324-b24c-4b21-8c44-1226904cf6de', name: 'Haas', color: '#B6BABD', logo: 'HAA' },
    { id: '30fb07ad-e056-4f4f-be71-6a9d533a9cca', name: 'Audi', color: '#F50537', logo: 'AUD' },
    { id: 'b105e3bf-0658-4903-8609-60d1a3976506', name: 'Cadillac', color: '#1B2021', logo: 'CAD' },
    { id: '584882ea-2a8f-43e6-8943-9c213692738c', name: 'Red Bull Racing', color: '#0600EF', logo: 'RBR' },
    { id: '9130511e-ca0e-465f-bcb3-7b9197983949', name: 'RB', color: '#6692FF', logo: 'RBA' },
];

const PILOTS_DATA = [
    { first: 'Lucas', last: 'GUSTAVO', num: 88, nat: 'BR', email: 'lgustavo88@ts1.com' },
    { first: 'James', last: 'HUNTLEY', num: 11, nat: 'GB', email: 'jhuntley11@ts1.com' },
    { first: 'Matteo', last: 'ROSSI', num: 46, nat: 'IT', email: 'mrossi46@ts1.com' },
    { first: 'Sebastian', last: 'WEBER', num: 5, nat: 'DE', email: 'sweber5@ts1.com' },
    { first: 'Pierre', last: 'MOREAU', num: 10, nat: 'FR', email: 'pmoreau10@ts1.com' },
    { first: 'Carlos', last: 'NAVARRO', num: 55, nat: 'ES', email: 'cnavarro55@ts1.com' },
    { first: 'Lars', last: 'VANDIJK', num: 33, nat: 'NL', email: 'lvandijk33@ts1.com' },
    { first: 'Kenji', last: 'SATO', num: 22, nat: 'JP', email: 'ksato22@ts1.com' },
    { first: 'Alexander', last: 'MILLER', num: 2, nat: 'US', email: 'amiller2@ts1.com' },
    { first: 'Charles', last: 'GRIMALDI', num: 16, nat: 'MC', email: 'cgrimaldi16@ts1.com' },
    { first: 'Mateo', last: 'HERRERA', num: 14, nat: 'MX', email: 'mherrera14@ts1.com' },
    { first: 'Franco', last: 'FONTANA', num: 43, nat: 'AR', email: 'ffontana43@ts1.com' },
    { first: 'Jack', last: 'BRABSON', num: 81, nat: 'AU', email: 'jbrabson81@ts1.com' },
    { first: 'Nicholas', last: 'TREMBLAY', num: 18, nat: 'CA', email: 'ntremblay18@ts1.com' },
    { first: 'Maximilian', last: 'BERGER', num: 28, nat: 'AT', email: 'mberger28@ts1.com' },
    { first: 'Marc', last: 'SURER', num: 9, nat: 'CH', email: 'msurer9@ts1.com' },
    { first: 'Mika', last: 'HAKKILA', num: 77, nat: 'FI', email: 'mhakkila77@ts1.com' },
    { first: 'Thierry', last: 'BOUTSEN', num: 20, nat: 'BE', email: 'tboutsen20@ts1.com' },
    { first: 'Tiago', last: 'MONTEIRO', num: 19, nat: 'PT', email: 'tmonteiro19@ts1.com' },
    { first: 'Stefan', last: 'JOHANSSON', num: 26, nat: 'SE', email: 'sjohansson26@ts1.com' },
    { first: 'Jan', last: 'MAGNUSSEN', num: 24, nat: 'DK', email: 'jmagnussen24@ts1.com' },
    { first: 'Liam', last: 'AMONSON', num: 30, nat: 'NZ', email: 'lamonson30@ts1.com' },
    { first: 'Gabriel', last: 'BORTOLETO', num: 8, nat: 'BR', email: 'gbortoleto8@ts1.com' },
    { first: 'Oliver', last: 'BEAR', num: 87, nat: 'GB', email: 'obear87@ts1.com' },
    { first: 'Andrea', last: 'KIMI', num: 12, nat: 'IT', email: 'akimi12@ts1.com' },
    { first: 'Felix', last: 'ROSEN', num: 23, nat: 'SE', email: 'frosen23@ts1.com' },
    { first: 'Esteban', last: 'GUERRIERI', num: 31, nat: 'AR', email: 'eguerrieri31@ts1.com' },
    { first: 'Nyck', last: 'DEVRIES', num: 21, nat: 'NL', email: 'ndevries21@ts1.com' },
    { first: 'Arvid', last: 'LINDBLAD', num: 41, nat: 'GB', email: 'alindblad41@ts1.com' },
    { first: 'Guanyu', last: 'ZHOU', num: 24, nat: 'CN', email: 'gzhou24@ts1.com' },
];

const SENIOR_IDS = Array.from({ length: 24 }, (_, i) => `strat-${String(i + 1).padStart(2, '0')}`);

async function seedFakes() {
    console.log("==================================================");
    console.log("INICIANDO CADASTRO DE 30 USUÁRIOS FAKES (TS1)");
    console.log("==================================================\n");

    const createdUsers = [];

    for (let i = 0; i < PILOTS_DATA.length; i++) {
        const p = PILOTS_DATA[i];
        const codeName = `${p.first.charAt(0).toUpperCase()}.${p.last.toUpperCase()}${p.num}`;
        const slug = `@${p.first.charAt(0).toLowerCase()}${p.last.toLowerCase()}${p.num}`;
        const seniorId = SENIOR_IDS[i % SENIOR_IDS.length];

        // 1. Cria usuário no Supabase Auth
        const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
            email: p.email,
            password: 'Password123!',
            email_confirm: true,
            user_metadata: {
                first_name: p.first,
                last_name: p.last,
                driver_number: p.num,
                slug: slug,
            }
        });

        if (authErr) {
            console.error(`Erro ao criar auth para ${p.email}:`, authErr.message);
            continue;
        }

        const userId = authUser.user.id;

        // Determina equipe e grupo (22 pilotos no Grupo 1: 2 pilotos por equipe x 11 equipes)
        const groupId = i < 22 ? 1 : 2;
        const teamIndex = (Math.floor(i / 2)) % F1_TEAMS.length;
        const team = F1_TEAMS[teamIndex];

        // 2. Insere perfil público
        const { error: profErr } = await supabase.from('profiles').upsert({
            id: userId,
            email: p.email,
            first_name: p.first,
            last_name: p.last,
            driver_number: p.num,
            slug: slug,
            nationality: p.nat,
            org_color: team.color,
            senior_strategist_id: seniorId,
            mls_balance: 100, // Bônus oficial 000.100 mls
            setup_completed: true,
        });

        if (profErr) {
            console.error(`Erro ao criar perfil de ${codeName}:`, profErr.message);
            continue;
        }

        // 3. Insere contrato oficial de garagem
        const { error: contErr } = await supabase.from('contracts').insert({
            user_id: userId,
            group_id: groupId,
            team_id: team.id,
            year: 2026,
        });

        if (contErr) {
            console.error(`Erro ao criar contrato de ${codeName}:`, contErr.message);
        }

        createdUsers.push({
            id: userId,
            codeName: codeName,
            slug: slug,
            nat: p.nat,
            team: team.logo,
            group: groupId,
            senior: seniorId,
        });

        console.log(`[${i + 1}/30] ✓ ${codeName.padEnd(16)} | Nat: ${p.nat.padEnd(3)} | Team: ${team.logo} (Grupo ${groupId}) | ${slug}`);
    }

    console.log(`\n✓ ${createdUsers.length} usuários cadastrados com sucesso.`);

    // 4. Criação de Esquadrões Teamwork demonstrativos
    console.log("\n--- CRIANDO ESQUADRÕES DE TEAMWORK ---");
    if (createdUsers.length >= 15) {
        // Squad 1: APEX RACING (Capitão: Lucas GUSTAVO)
        const squad1Members = createdUsers.slice(0, 5);
        const { data: s1, error: s1Err } = await supabase.from('teamwork_squads').insert({
            name: 'APEX RACING',
            invite_code: 'BF-APEX',
            captain_id: squad1Members[0].id,
        }).select().single();

        if (s1 && !s1Err) {
            for (const m of squad1Members) {
                await supabase.from('teamwork_members').insert({
                    squad_id: s1.id,
                    user_id: m.id,
                });
            }
            console.log(`✓ Esquadrão 'APEX RACING' (BF-APEX) criado com 5 membros. Capitão: ${squad1Members[0].codeName}`);
        }

        // Squad 2: VORTEX RACING (Capitão: Carlos NAVARRO)
        const squad2Members = createdUsers.slice(5, 10);
        const { data: s2, error: s2Err } = await supabase.from('teamwork_squads').insert({
            name: 'VORTEX RACING',
            invite_code: 'BF-VRTX',
            captain_id: squad2Members[0].id,
        }).select().single();

        if (s2 && !s2Err) {
            for (const m of squad2Members) {
                await supabase.from('teamwork_members').insert({
                    squad_id: s2.id,
                    user_id: m.id,
                });
            }
            console.log(`✓ Esquadrão 'VORTEX RACING' (BF-VRTX) criado com 5 membros. Capitão: ${squad2Members[0].codeName}`);
        }
    }

    // 5. Gera apostas (predictions) para os primeiros 15 pilotos
    console.log("\n--- HOMOLOGANDO PREVISÕES INICIAIS DE TELEMETRIA ---");
    const sampleDrivers = ['M.VERSTAPPEN', 'L.HAMILTON', 'C.LECLERC', 'L.NORRIS', 'O.PIASTRI', 'G.RUSSELL', 'F.ALONSO', 'C.SAINZ', 'P.GASLY', 'K.ANTONELLI'];
    const poletimes = [
        '1:20.650', '1:20.720', '1:20.812', '1:20.900', '1:21.050',
        '1:21.140', '1:21.220', '1:21.315', '1:21.400', '1:21.550',
        '1:20.950', '1:21.010', '1:20.880', '1:21.110', '1:21.250'
    ];

    for (let i = 0; i < 15; i++) {
        const u = createdUsers[i];
        const pole = poletimes[i];
        const shuffledTop10 = [...sampleDrivers].sort(() => 0.5 - Math.random());
        const shuffledEvo = [...sampleDrivers].sort(() => 0.5 - Math.random()).slice(0, 5);

        await supabase.from('predictions').insert({
            user_id: u.id,
            round: 'current',
            poletime: pole,
            top10: shuffledTop10,
            evo: shuffledEvo,
            h2h: { m1: "04", m2: "44", m3: "63", m4: "06", m5: "14", m6: "10", m7: "31", m8: "41", m9: "11", m10: "55", m11: "27" },
            misc: { stake: "10" }
        });
        console.log(`✓ Previsão registrada para ${u.codeName}: Poletime ${pole}`);
    }

    console.log("\n==================================================");
    console.log("CARGA DE DADOS DE 30 PILOTOS CONCLUÍDA COM ÊXITO!");
    console.log("==================================================");
}

seedFakes();
