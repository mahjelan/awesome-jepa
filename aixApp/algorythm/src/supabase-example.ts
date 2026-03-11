// Alternative: Supabase Setup Example
// To use Supabase instead of Firebase:
// 1. Install: npm install @supabase/supabase-js
// 2. Get your project URL and anon key from supabase.com
// 3. Uncomment and configure below:

/*
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Example usage:
export const saveVideo = async (videoData: any) => {
  const { data, error } = await supabase
    .from('videos')
    .insert([videoData])
    .select();
  
  if (error) throw error;
  return data;
};

export const getVideos = async () => {
  const { data, error } = await supabase
    .from('videos')
    .select('*');
  
  if (error) throw error;
  return data;
};
*/

