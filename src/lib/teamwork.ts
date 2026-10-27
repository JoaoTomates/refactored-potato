import { supabase } from '@/utils/supabase';
import { formatMls } from './mls';

export interface SquadMember {
    id: string;
    userId: string;
    name: string;
    slug: string | null;
    nationality: string | null;
    teamId: string | null;
    mlsBalance: number;
    joinedAt: string;
    isCaptain: boolean;
}

export interface TeamworkSquad {
    id: string;
    name: string;
    inviteCode: string;
    captainId: string;
    createdAt: string;
    members: SquadMember[];
    memberCount: number;
    maxMembers: number;
    averageMls: number;
    formattedAverage: string;
}

/**
 * Busca o esquadrão de Teamwork de um estrategista e calcula a média oficial
 */
export async function getStrategistSquad(userId: string): Promise<TeamworkSquad | null> {
    try {
        // 1. Descobre se o estrategista é membro de algum squad
        const { data: memberRecord, error: memErr } = await supabase
            .from('teamwork_members')
            .select('squad_id')
            .eq('user_id', userId)
            .maybeSingle();

        if (memErr || !memberRecord?.squad_id) return null;

        const squadId = memberRecord.squad_id;

        // 2. Busca informações do squad
        const { data: squadData, error: squadErr } = await supabase
            .from('teamwork_squads')
            .select('*')
            .eq('id', squadId)
            .single();

        if (squadErr || !squadData) return null;

        // 3. Busca todos os membros do squad junto com dados de perfil e contrato
        const { data: allMembers, error: allErr } = await supabase
            .from('teamwork_members')
            .select(`
                id,
                user_id,
                joined_at,
                profiles:user_id (
                    id,
                    first_name,
                    last_name,
                    slug,
                    nationality,
                    mls_balance
                )
            `)
            .eq('squad_id', squadId);

        if (allErr || !allMembers) return null;

        // Busca contratos para descobrir escuderia/bloco dos membros
        const userIds = allMembers.map((m: any) => m.user_id);
        const { data: contracts } = await supabase
            .from('contracts')
            .select('user_id, team_id')
            .in('user_id', userIds);

        const contractMap = new Map<string, string>();
        (contracts || []).forEach((c: any) => {
            contractMap.set(c.user_id, c.team_id);
        });

        let sumMls = 0;
        const membersList: SquadMember[] = allMembers.map((m: any) => {
            const prof = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
            const bal = prof?.mls_balance ?? 100;
            sumMls += bal;

            const name = prof?.first_name 
                ? `${prof.first_name.charAt(0).toUpperCase()}.${(prof.last_name || '').trim().toUpperCase()}`
                : (prof?.slug ? prof.slug.replace('@', '').toUpperCase() : 'ESTRATEGISTA');

            return {
                id: m.id,
                userId: m.user_id,
                name: name,
                slug: prof?.slug || null,
                nationality: prof?.nationality || null,
                teamId: contractMap.get(m.user_id) || null,
                mlsBalance: bal,
                joinedAt: m.joined_at,
                isCaptain: m.user_id === squadData.captain_id,
            };
        });

        const count = membersList.length || 1;
        const avg = sumMls / count;

        return {
            id: squadData.id,
            name: squadData.name,
            inviteCode: squadData.invite_code,
            captainId: squadData.captain_id,
            createdAt: squadData.created_at,
            members: membersList,
            memberCount: membersList.length,
            maxMembers: 20,
            averageMls: avg,
            formattedAverage: formatMls(avg),
        };
    } catch (err) {
        console.error('Erro ao buscar squad Teamwork:', err);
        return null;
    }
}

/**
 * Cria um novo esquadrão com o capitão
 */
export async function createTeamworkSquad(captainId: string, squadName: string): Promise<{ success: boolean; squad?: TeamworkSquad; error?: string }> {
    try {
        const cleanName = squadName.trim().toUpperCase();
        if (!cleanName || cleanName.length < 3) {
            return { success: false, error: 'O nome do esquadrão deve conter no mínimo 3 caracteres.' };
        }

        // Verifica se o usuário já tem time
        const { data: existing } = await supabase
            .from('teamwork_members')
            .select('id')
            .eq('user_id', captainId)
            .maybeSingle();

        if (existing) {
            return { success: false, error: 'Você já faz parte de um esquadrão Teamwork ativo.' };
        }

        // Gera código de convite de 6 caracteres (ex: BF-9X42)
        const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
        const code = `BF-${rand.substring(0, 4)}`;

        const { data: newSquad, error: squadErr } = await supabase
            .from('teamwork_squads')
            .insert({
                name: cleanName,
                invite_code: code,
                captain_id: captainId,
            })
            .select()
            .single();

        if (squadErr || !newSquad) {
            return { success: false, error: squadErr?.message || 'Falha ao criar esquadrão.' };
        }

        // Adiciona capitão como membro #1
        const { error: memErr } = await supabase
            .from('teamwork_members')
            .insert({
                squad_id: newSquad.id,
                user_id: captainId,
            });

        if (memErr) {
            return { success: false, error: memErr.message };
        }

        const fullSquad = await getStrategistSquad(captainId);
        return { success: true, squad: fullSquad || undefined };
    } catch (err: any) {
        return { success: false, error: err.message || 'Erro inesperado ao criar time.' };
    }
}

/**
 * Ingressa em um esquadrão existente através do código de convite (máx 20)
 */
export async function joinTeamworkSquad(userId: string, inviteCode: string): Promise<{ success: boolean; squad?: TeamworkSquad; error?: string }> {
    try {
        const cleanCode = inviteCode.trim().toUpperCase();
        if (!cleanCode) {
            return { success: false, error: 'Insira um código de convite válido.' };
        }

        // Busca o time pelo código
        const { data: squad, error: squadErr } = await supabase
            .from('teamwork_squads')
            .select('id, name')
            .eq('invite_code', cleanCode)
            .maybeSingle();

        if (squadErr || !squad) {
            return { success: false, error: 'Nenhum esquadrão localizado com este código de convite.' };
        }

        // Verifica capacidade máxima (20)
        const { count, error: countErr } = await supabase
            .from('teamwork_members')
            .select('*', { count: 'exact', head: true })
            .eq('squad_id', squad.id);

        if (countErr) {
            return { success: false, error: 'Erro ao validar capacidade do time.' };
        }

        if ((count || 0) >= 20) {
            return { success: false, error: 'Este esquadrão já atingiu o limite máximo de 20 estrategistas.' };
        }

        // Adiciona membro
        const { error: insertErr } = await supabase
            .from('teamwork_members')
            .insert({
                squad_id: squad.id,
                user_id: userId,
            });

        if (insertErr) {
            if (insertErr.code === '23505') {
                return { success: false, error: 'Você já faz parte de um esquadrão Teamwork ativo.' };
            }
            return { success: false, error: insertErr.message };
        }

        const fullSquad = await getStrategistSquad(userId);
        return { success: true, squad: fullSquad || undefined };
    } catch (err: any) {
        return { success: false, error: err.message || 'Erro inesperado ao entrar no time.' };
    }
}

/**
 * Sai do esquadrão atual
 */
export async function leaveTeamworkSquad(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('teamwork_members')
            .delete()
            .eq('user_id', userId);

        if (error) return { success: false, error: error.message };
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message || 'Erro ao desvincular do time.' };
    }
}
