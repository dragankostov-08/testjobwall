const fs = require('fs');
const path = require('path');

const files = [
  'src/app/page.tsx',
  'src/app/remote/page.tsx',
  'src/app/news/page.tsx',
  'src/app/internships/page.tsx',
  'src/app/latest/page.tsx',
  'src/app/category/[slug]/page.tsx',
  'src/app/companies/[slug]/page.tsx'
];

files.forEach(file => {
  const fullPath = path.join('e:\\jb.mk\\testjobwall', file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Remove headers import
    content = content.replace(/import\s+{\s*headers\s*}\s+from\s+["']next\/headers["'];\n?/g, '');
    
    // Remove force-dynamic
    content = content.replace(/export\s+const\s+dynamic\s*=\s*["']force-dynamic["'];\n?/g, '');
    
    // Replace const host = (await headers()).get("host");
    content = content.replace(/const\s+host\s*=\s*\(await\s+headers\(\)\)\.get\(["']host["']\);/g, 'const host = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_SITE_URL || "localhost:3000";');
    
    fs.writeFileSync(fullPath, content);
    console.log(`Updated ${file}`);
  }
});
