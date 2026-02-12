import { createClient } from '@supabase/supabase-js';

// Using existing Supabase project
const supabaseUrl = 'https://qyisjxfugogimgzhualw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5aXNqeGZ1Z29naW1nemh1YWx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NzIzNjIsImV4cCI6MjA4MTA0ODM2Mn0.gPFhYFYhGoI_3IAc65XuJc-xMY2MS3kS65Fg16GX45U';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
