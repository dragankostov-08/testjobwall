import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Briefcase } from "lucide-react";

export interface CompanyInfo {
  name: string;
  slug: string;
  logo: string | null;
  location: string;
  jobCount: number;
  industry: string;
}

export default function CompanyCard({ company }: { company: CompanyInfo }) {
  return (
    <Link
      href={`/companies/${company.slug}`}
      className="group block bg-card hover:bg-accent border border-border rounded-lg p-4 transition-colors"
    >
      <div className="flex gap-4 items-center">
        {/* Logo */}
        <Avatar className="w-14 h-14 border border-border rounded-md shrink-0 bg-background">
          {company.logo && (
            <AvatarImage
              src={company.logo}
              alt={company.name}
              className="object-contain p-1 bg-white"
            />
          )}
          <AvatarFallback className="rounded-md bg-secondary text-secondary-foreground font-semibold text-lg">
            {company.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-foreground group-hover:underline truncate">
            {company.name}
          </h3>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {company.location}
            </span>
            <span className="flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5" />
              {company.jobCount} {company.jobCount === 1 ? 'оглас' : 'огласи'}
            </span>
          </div>
        </div>

        {/* Industry badge */}
        <span className="hidden sm:inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-secondary text-secondary-foreground border border-border shrink-0">
          {company.industry}
        </span>
      </div>
    </Link>
  );
}
