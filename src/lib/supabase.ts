import { createClient } from '@supabase/supabase-js';

// Remplacer ces valeurs par vos vraies clés Supabase depuis le tableau de bord
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://votre-projet.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'votre-clé-anon-publique';

export const supabase = createClient(supabaseUrl, supabaseKey);
