"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { FileCheck, ChevronLeft, Upload, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

const ATS_KEYWORDS = [
  "искуство", "образование", "вештини", "проект", "одговорност",
  "тим", "менаџмент", "комуникација", "резултат", "достигнување",
  "experience", "education", "skills", "project", "responsibility",
  "team", "management", "communication", "result", "achievement",
  "leadership", "problem-solving", "analytical", "microsoft", "excel",
];

const REQUIRED_SECTIONS = [
  { key: "contact", labels: ["контакт", "телефон", "email", "e-mail", "адреса", "phone", "contact", "address"] },
  { key: "education", labels: ["образование", "education", "факултет", "универзитет", "university", "degree"] },
  { key: "experience", labels: ["искуство", "experience", "работа", "work", "employment", "позиција", "position"] },
  { key: "skills", labels: ["вештини", "skills", "компетенции", "competencies", "знаења"] },
];

function analyzeCV(text: string) {
  const lower = text.toLowerCase();
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  // Check ATS keywords
  const foundKeywords = ATS_KEYWORDS.filter(kw => lower.includes(kw.toLowerCase()));
  const missingKeywords = ATS_KEYWORDS.filter(kw => !lower.includes(kw.toLowerCase())).slice(0, 8);

  // Check sections
  const foundSections = REQUIRED_SECTIONS.filter(sec =>
    sec.labels.some(label => lower.includes(label))
  );
  const missingSections = REQUIRED_SECTIONS.filter(sec =>
    !sec.labels.some(label => lower.includes(label))
  );

  // Formatting checks
  const issues: string[] = [];
  const suggestions: string[] = [];

  if (wordCount < 150) {
    issues.push("CV-то е премногу кратко");
    suggestions.push("Додадете повеќе детали за вашето искуство и вештини.");
  }
  if (wordCount > 1000) {
    issues.push("CV-то е предолго");
    suggestions.push("Скратете го CV-то на максимум 2 страници.");
  }
  if (!lower.includes("@")) {
    issues.push("Не е пронајдена e-mail адреса");
    suggestions.push("Додадете валидна e-mail адреса за контакт.");
  }
  if (missingSections.length > 0) {
    issues.push(`Недостасуваат секции: ${missingSections.map(s => s.key).join(", ")}`);
    suggestions.push("Додадете ги сите стандардни секции: контакт, образование, искуство, вештини.");
  }
  if (foundKeywords.length < 5) {
    suggestions.push("Додадете повеќе релевантни клучни зборови за подобра ATS компатибилност.");
  }

  // Calculate score
  const keywordScore = Math.min(40, (foundKeywords.length / ATS_KEYWORDS.length) * 40);
  const sectionScore = (foundSections.length / REQUIRED_SECTIONS.length) * 30;
  const lengthScore = wordCount >= 200 && wordCount <= 800 ? 20 : wordCount >= 150 ? 15 : 5;
  const formatScore = lower.includes("@") ? 10 : 0;

  const totalScore = Math.round(keywordScore + sectionScore + lengthScore + formatScore);

  return {
    score: Math.min(100, totalScore),
    wordCount,
    foundKeywords: foundKeywords.length,
    missingKeywords,
    foundSections: foundSections.map(s => s.key),
    missingSections: missingSections.map(s => s.key),
    issues,
    suggestions,
  };
}

export default function CVCheckerPage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<ReturnType<typeof analyzeCV> | null>(null);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      const content = await file.text();
      setText(content);
    } else {
      // For PDF/DOCX, extract text via FileReader as fallback
      const reader = new FileReader();
      reader.onload = () => {
        const content = reader.result as string;
        // Basic text extraction from binary — works for simple PDFs
        const extracted = content.replace(/[^\x20-\x7E\u0400-\u04FF\s]/g, " ").replace(/\s+/g, " ").trim();
        setText(extracted || "Не може да се извлече текст. Обидете се со TXT формат.");
      };
      reader.readAsText(file);
    }
  };

  const handleAnalyze = () => {
    if (!text.trim()) return;
    setResult(analyzeCV(text));
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-emerald-500";
    if (score >= 40) return "text-amber-400";
    return "text-red-400";
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Link href="/tools" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4 mr-1" />
        Назад кон алатки
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <FileCheck className="w-6 h-6 text-emerald-500" />
        <h1 className="text-2xl font-bold text-foreground tracking-tight">ATS Проверка на CV</h1>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        {/* File upload */}
        <div
          className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground transition-colors mb-4"
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-foreground font-medium">
            {fileName || "Прикачете CV (PDF, DOCX, TXT)"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">или залепете текст подолу</p>
          <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,.doc" onChange={handleFile} className="hidden" />
        </div>

        {/* Text input */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Или залепете го текстот од CV-то тука..."
          rows={6}
          className="w-full px-4 py-3 rounded-md bg-input border border-transparent focus:border-ring focus:ring-1 focus:ring-ring text-sm text-foreground placeholder-muted-foreground outline-none transition-all resize-none mb-4"
        />

        <button
          onClick={handleAnalyze}
          disabled={!text.trim()}
          className="w-full h-11 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          Анализирај
        </button>
      </div>

      {result && (
        <div className="bg-card border border-border rounded-lg p-6">
          {/* Score */}
          <div className="text-center mb-6">
            <p className={`text-5xl font-bold ${getScoreColor(result.score)}`}>{result.score}</p>
            <p className="text-sm text-muted-foreground mt-1">ATS Score од 100</p>
          </div>

          {/* Sections found */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">Секции</h3>
            <div className="space-y-1">
              {REQUIRED_SECTIONS.map(sec => (
                <div key={sec.key} className="flex items-center gap-2 text-sm">
                  {result.foundSections.includes(sec.key)
                    ? <CheckCircle className="w-4 h-4 text-emerald-500" />
                    : <XCircle className="w-4 h-4 text-red-400" />
                  }
                  <span className="text-foreground capitalize">{sec.key}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Issues */}
          {result.issues.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">Проблеми</h3>
              {result.issues.map((issue, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-red-400 mb-1">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  {issue}
                </div>
              ))}
            </div>
          )}

          {/* Missing keywords */}
          {result.missingKeywords.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">Клучни зборови за додавање</h3>
              <div className="flex flex-wrap gap-2">
                {result.missingKeywords.map(kw => (
                  <span key={kw} className="px-2 py-1 rounded text-xs bg-secondary text-secondary-foreground border border-border">{kw}</span>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {result.suggestions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Предлози</h3>
              <ul className="space-y-1">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="text-sm text-muted-foreground">• {s}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-between text-xs text-muted-foreground mt-4 pt-3 border-t border-border">
            <span>{result.wordCount} зборови</span>
            <span>{result.foundKeywords} клучни зборови пронајдени</span>
          </div>
        </div>
      )}
    </div>
  );
}
