"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { FileText, ChevronLeft, Upload } from "lucide-react";

export default function ResumeReadingTimePage() {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<{ readingTime: number; wordCount: number; pages: number; suggestion: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      const content = await file.text();
      setText(content);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        const content = reader.result as string;
        const extracted = content.replace(/[^\x20-\x7E\u0400-\u04FF\s]/g, " ").replace(/\s+/g, " ").trim();
        setText(extracted || "Не може да се извлече текст. Обидете се со TXT формат.");
      };
      reader.readAsText(file);
    }
  };

  const handleAnalyze = () => {
    if (!text.trim()) return;

    const words = text.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    const readingTime = Math.ceil(wordCount / 200); // ~200 wpm average
    const pages = Math.ceil(wordCount / 300); // ~300 words per page

    let suggestion = "";
    if (wordCount < 150) {
      suggestion = "CV-то е премногу кратко. Додадете повеќе содржина за да направите подобар впечаток.";
    } else if (wordCount > 700) {
      suggestion = "CV-то е предолго. Препорачуваме максимум 2 страници (400-600 зборови).";
    } else if (wordCount > 500) {
      suggestion = "CV-то е со добра должина, но размислете дали може да се скрати за побрзо читање.";
    } else {
      suggestion = "CV-то е со оптимална должина за брзо прегледување од рекрутери.";
    }

    setResult({ readingTime, wordCount, pages, suggestion });
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Link href="/tools" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4 mr-1" />
        Назад кон алатки
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-6 h-6 text-teal-500" />
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Време за Читање на CV</h1>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <div
          className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground transition-colors mb-4"
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-foreground font-medium">{fileName || "Прикачете CV (PDF, DOCX, TXT)"}</p>
          <p className="text-xs text-muted-foreground mt-1">или залепете текст подолу</p>
          <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,.doc" onChange={handleFile} className="hidden" />
        </div>

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
          <div className="grid grid-cols-3 gap-4 text-center mb-6">
            <div>
              <p className="text-3xl font-bold text-foreground">{result.readingTime}</p>
              <p className="text-xs text-muted-foreground mt-1">Минути читање</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">{result.wordCount.toLocaleString("mk-MK")}</p>
              <p className="text-xs text-muted-foreground mt-1">Зборови</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">{result.pages}</p>
              <p className="text-xs text-muted-foreground mt-1">Страници</p>
            </div>
          </div>
          <div className="bg-secondary/30 rounded-md p-4">
            <p className="text-sm text-foreground">{result.suggestion}</p>
          </div>
        </div>
      )}
    </div>
  );
}
