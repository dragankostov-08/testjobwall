import type { Metadata } from "next";
import CompaniesPageClient from "@/components/companies/CompaniesPageClient";

export const metadata: Metadata = {
  title: "Компании - JOBWALL",
  description: "Преглед на сите компании со активни огласи за работа во Македонија.",
};

export default function CompaniesPage() {
  return <CompaniesPageClient />;
}
