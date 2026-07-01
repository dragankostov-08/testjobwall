import { formatDistanceToNow } from "date-fns";
import { mk } from "date-fns/locale";
import { ExternalLink, Newspaper } from "lucide-react";
import Link from "next/link";

export interface NewsArticle {
  id: string;
  title: string;
  summary: string | null;
  original_url: string;
  image_url: string | null;
  source_name: string;
  published_at: string;
  category: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  hiring: "Вработување",
  salary: "Плати",
  remote: "Далечински",
  market: "Пазар",
  tech: "Технологија",
  general: "Општо",
};

export default function NewsCard({ article }: { article: NewsArticle }) {
  return (
    <div className="group relative block bg-card hover:bg-accent border border-border rounded-lg p-4 transition-colors">
      <Link href={`/api/news/${article.id}`} target="_blank" className="absolute inset-0 z-10">
        <span className="sr-only">Прочитај: {article.title}</span>
      </Link>

      <div className="flex gap-4">
        {/* Thumbnail */}
        <div className="w-20 h-20 rounded-md overflow-hidden shrink-0 bg-secondary flex items-center justify-center border border-border">
          {article.image_url ? (
            <img
              src={article.image_url}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <Newspaper className="w-8 h-8 text-muted-foreground/50" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-foreground group-hover:underline line-clamp-2">
            {article.title}
          </h3>

          {article.summary && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {article.summary}
            </p>
          )}

          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{article.source_name}</span>
            <span>•</span>
            <time dateTime={article.published_at}>
              {formatDistanceToNow(new Date(article.published_at), { addSuffix: true, locale: mk })}
            </time>
            {article.category && article.category !== "general" && (
              <>
                <span>•</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground border border-border">
                  {CATEGORY_LABELS[article.category] || article.category}
                </span>
              </>
            )}
          </div>
        </div>

        {/* External link indicator */}
        <div className="shrink-0 flex items-start pt-1">
          <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </div>
  );
}
