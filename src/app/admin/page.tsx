import { supabaseClient } from '@/lib/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ScrapeButton from "@/components/admin/ScrapeButton";
import { Toaster } from 'sonner';

export default async function AdminPage() {
  const { data: sources } = await supabaseClient.from('sources').select('*').order('name');

  return (
    <div className="max-w-6xl mx-auto py-10 px-6">
      <Toaster theme="dark" />
      <h1 className="text-3xl font-bold mb-8">Админ Панел - Извори</h1>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Име</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Последно Скрејпувано</TableHead>
              <TableHead className="text-right">Акции</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sources?.map((source) => (
              <TableRow key={source.id}>
                <TableCell className="font-medium text-foreground">{source.name}</TableCell>
                <TableCell className="text-muted-foreground">{source.base_url}</TableCell>
                <TableCell>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${source.active ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                    {source.active ? 'Активен' : 'Неактивен'}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {source.last_scraped ? new Date(source.last_scraped).toLocaleString('mk-MK') : 'Никогаш'}
                </TableCell>
                <TableCell className="text-right">
                   <ScrapeButton sourceId={source.id} sourceName={source.name} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
