import { createClient } from '@supabase/supabase-js';

// Self-hosted: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY at build time
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qyisjxfugogimgzhualw.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5aXNqeGZ1Z29naW1nemh1YWx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NzIzNjIsImV4cCI6MjA4MTA0ODM2Mn0.gPFhYFYhGoI_3IAc65XuJc-xMY2MS3kS65Fg16GX45U';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
