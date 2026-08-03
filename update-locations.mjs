import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Updating locations...');
  
  const { error: err1 } = await supabase
    .from('locations')
    .update({ nama_lokasi: 'Perumahan Benteng Mutiara Mas' })
    .eq('nama_lokasi', 'Lansena Residence');
    
  if (err1) console.error('Error updating Lansena Residence:', err1);
  else console.log('Successfully updated Lansena Residence to Perumahan Benteng Mutiara Mas');

  const { error: err2 } = await supabase
    .from('locations')
    .update({ kode_lokasi: 'BMM' })
    .eq('nama_lokasi', 'Perumahan Benteng Mutiara Mas');
    
  if (err2) console.error('Error updating kode_lokasi to BMM:', err2);
  else console.log('Successfully updated kode_lokasi to BMM');
  
  console.log('Done!');
}

run();
