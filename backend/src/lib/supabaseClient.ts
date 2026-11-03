import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://hjrlvkbcachzavfahyel.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_aduZcYOXgtVDSLbeuuYKFg_xK-NU0Zy';

export const supabase = createClient(supabaseUrl, supabaseKey);
export default supabase;
