import './../workers/env';
import { supabaseClient } from '../lib/supabase/client';

const sources = [
  { name: 'Kariera.mk', base_url: 'https://kariera.mk/' },
  { name: 'Vrabotuvanje.com.mk', base_url: 'https://www.vrabotuvanje.com.mk/' },
  { name: 'Apliciraj.mk', base_url: 'https://apliciraj.mk/' },
  { name: 'Najdirabota.com.mk', base_url: 'https://www.najdirabota.com.mk/' },
  { name: 'Vraboti.se', base_url: 'https://vraboti.se/' },
  { name: 'Jobs.com.mk', base_url: 'https://jobs.com.mk/' },
  { name: 'Oglasizarabota.mk', base_url: 'https://www.oglasizarabota.mk/' },
  { name: 'App.thrivity.mk', base_url: 'https://app.thrivity.mk/job-posts' },
  { name: 'Honorarec.mk', base_url: 'https://honorarec.mk/' },
  { name: 'Imashchoek.mk', base_url: 'https://imashchoek.mk/find-a-job' },
  { name: 'Manpower.mk', base_url: 'https://manpower.mk/mk/mozhnosti-za-rabota' }
];

async function seed() {
  console.log('Seeding sources into Supabase...');
  
  for (const source of sources) {
    const { error } = await supabaseClient
      .from('sources')
      .upsert({ name: source.name, base_url: source.base_url }, { onConflict: 'name' });
      
    if (error) {
      console.error(`Failed to insert ${source.name}:`, error.message);
    } else {
      console.log(`Inserted/Updated: ${source.name}`);
    }
  }
  
  console.log('Seeding complete!');
  process.exit(0);
}

seed();
