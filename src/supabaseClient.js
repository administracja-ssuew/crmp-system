import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://epyhdmyafaqnczekrtvs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVweWhkbXlhZmFxbmN6ZWtydHZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MzQ2OTEsImV4cCI6MjA4OTQxMDY5MX0.z3WppaxSmnHveQnYDZy6Ghfgs3HjUg7flxnGNHG5_js';

export const supabase = createClient(supabaseUrl, supabaseKey);