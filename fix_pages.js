const fs = require('fs');
const path = require('path');

const jobFiles = [
  'src/app/page.tsx',
  'src/app/remote/page.tsx',
  'src/app/internships/page.tsx',
  'src/app/latest/page.tsx',
  'src/app/category/[slug]/page.tsx'
];

jobFiles.forEach(file => {
  const fullPath = path.join('e:\\jb.mk\\testjobwall', file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Replace fetchJobs definition
    const fetchJobsRegex = /async function fetchJobs\([^)]*\)\s*:\s*Promise<Job\[\]>\s*\{[\s\S]*?(?:return \[\];\s*\}\s*\}|return res\.json\(\);\s*\}\s*catch[^}]+\}\s*\})/m;
    
    if (fetchJobsRegex.test(content)) {
      content = content.replace(fetchJobsRegex, `import { getJobs } from "@/lib/data/jobs";\nexport const revalidate = 60;\n\nasync function fetchJobs(category?: string, remote?: boolean, section?: string, limit?: number, source?: string): Promise<Job[]> {\n  return (await getJobs({ category, remote, section, limit, source })) || [];\n}`);
      fs.writeFileSync(fullPath, content);
      console.log(`Updated ${file}`);
    } else {
      console.log(`Could not find fetchJobs in ${file}`);
    }
  }
});

// Update news
const newsPath = path.join('e:\\jb.mk\\testjobwall', 'src/app/news/page.tsx');
if (fs.existsSync(newsPath)) {
  let content = fs.readFileSync(newsPath, 'utf8');
  const fetchNewsRegex = /async function fetchNews\([^)]*\)\s*:\s*Promise<NewsArticle\[\]>\s*\{[\s\S]*?(?:return \[\];\s*\}\s*\})/m;
  if (fetchNewsRegex.test(content)) {
    content = content.replace(fetchNewsRegex, `import { getNews } from "@/lib/data/news";\nexport const revalidate = 60;\n\nasync function fetchNews(section?: string, limit: number = 15): Promise<NewsArticle[]> {\n  return (await getNews({ section, limit })) || [];\n}`);
    fs.writeFileSync(newsPath, content);
    console.log(`Updated news/page.tsx`);
  } else {
    console.log(`Could not find fetchNews in news/page.tsx`);
  }
}

// Update companies
const compPath = path.join('e:\\jb.mk\\testjobwall', 'src/app/companies/[slug]/page.tsx');
if (fs.existsSync(compPath)) {
  let content = fs.readFileSync(compPath, 'utf8');
  
  const fetchCompRegex = /async function fetchCompany\([^)]*\)\s*:\s*Promise<CompanyData \| null>\s*\{[\s\S]*?(?:return null;\s*\}\s*\})/m;
  const fetchRelatedRegex = /async function fetchRelatedNews\([^)]*\)\s*:\s*Promise<NewsArticle\[\]>\s*\{[\s\S]*?(?:return \[\];\s*\}\s*\})/m;
  
  if (fetchCompRegex.test(content) && fetchRelatedRegex.test(content)) {
    content = content.replace(fetchCompRegex, `import { getCompany } from "@/lib/data/companies";\nimport { getNews } from "@/lib/data/news";\nexport const revalidate = 60;\n\nasync function fetchCompany(slug: string): Promise<CompanyData | null> {\n  return await getCompany(slug);\n}`);
    content = content.replace(fetchRelatedRegex, `async function fetchRelatedNews(companyName: string): Promise<NewsArticle[]> {\n  return (await getNews({ search: companyName, limit: 4 })) || [];\n}`);
    fs.writeFileSync(compPath, content);
    console.log(`Updated companies/[slug]/page.tsx`);
  } else {
    console.log(`Could not find fetchCompany/fetchRelatedNews in companies`);
  }
}
