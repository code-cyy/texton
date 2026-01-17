import { cn } from '@/lib/utils'

interface FileIconProps {
  filename: string
  className?: string
}

// 文件类型配置：图标 SVG 路径和颜色
const FILE_ICONS: Record<string, { icon: string; color: string }> = {
  // JavaScript / TypeScript
  js: { icon: 'js', color: '#f7df1e' },
  jsx: { icon: 'react', color: '#61dafb' },
  ts: { icon: 'ts', color: '#3178c6' },
  tsx: { icon: 'react', color: '#61dafb' },
  mjs: { icon: 'js', color: '#f7df1e' },
  cjs: { icon: 'js', color: '#f7df1e' },
  
  // Web
  html: { icon: 'html', color: '#e34f26' },
  htm: { icon: 'html', color: '#e34f26' },
  css: { icon: 'css', color: '#1572b6' },
  scss: { icon: 'sass', color: '#cc6699' },
  sass: { icon: 'sass', color: '#cc6699' },
  less: { icon: 'less', color: '#1d365d' },
  vue: { icon: 'vue', color: '#42b883' },
  svelte: { icon: 'svelte', color: '#ff3e00' },
  
  // Data
  json: { icon: 'json', color: '#cbcb41' },
  yaml: { icon: 'yaml', color: '#cb171e' },
  yml: { icon: 'yaml', color: '#cb171e' },
  xml: { icon: 'xml', color: '#e37933' },
  csv: { icon: 'csv', color: '#89d185' },
  
  // Python
  py: { icon: 'python', color: '#3776ab' },
  pyw: { icon: 'python', color: '#3776ab' },
  pyx: { icon: 'python', color: '#3776ab' },
  ipynb: { icon: 'jupyter', color: '#f37626' },
  
  // Other Languages
  go: { icon: 'go', color: '#00add8' },
  rs: { icon: 'rust', color: '#dea584' },
  rb: { icon: 'ruby', color: '#cc342d' },
  php: { icon: 'php', color: '#777bb4' },
  java: { icon: 'java', color: '#007396' },
  kt: { icon: 'kotlin', color: '#7f52ff' },
  swift: { icon: 'swift', color: '#f05138' },
  c: { icon: 'c', color: '#a8b9cc' },
  h: { icon: 'c', color: '#a8b9cc' },
  cpp: { icon: 'cpp', color: '#00599c' },
  hpp: { icon: 'cpp', color: '#00599c' },
  cs: { icon: 'csharp', color: '#512bd4' },
  
  // Shell
  sh: { icon: 'shell', color: '#89e051' },
  bash: { icon: 'shell', color: '#89e051' },
  zsh: { icon: 'shell', color: '#89e051' },
  fish: { icon: 'shell', color: '#89e051' },
  ps1: { icon: 'powershell', color: '#5391fe' },
  bat: { icon: 'shell', color: '#c1f12e' },
  cmd: { icon: 'shell', color: '#c1f12e' },
  
  // Config
  env: { icon: 'env', color: '#ecd53f' },
  gitignore: { icon: 'git', color: '#f05032' },
  dockerignore: { icon: 'docker', color: '#2496ed' },
  dockerfile: { icon: 'docker', color: '#2496ed' },
  
  // Documents
  md: { icon: 'markdown', color: '#519aba' },
  mdx: { icon: 'markdown', color: '#519aba' },
  txt: { icon: 'text', color: '#89898a' },
  pdf: { icon: 'pdf', color: '#ff0000' },
  doc: { icon: 'word', color: '#2b579a' },
  docx: { icon: 'word', color: '#2b579a' },
  
  // Database
  sql: { icon: 'database', color: '#dad8d8' },
  db: { icon: 'database', color: '#dad8d8' },
  sqlite: { icon: 'database', color: '#003b57' },
  
  // Images
  svg: { icon: 'svg', color: '#ffb13b' },
  png: { icon: 'image', color: '#a074c4' },
  jpg: { icon: 'image', color: '#a074c4' },
  jpeg: { icon: 'image', color: '#a074c4' },
  gif: { icon: 'image', color: '#a074c4' },
  ico: { icon: 'image', color: '#a074c4' },
  webp: { icon: 'image', color: '#a074c4' },
  
  // Package
  'package.json': { icon: 'npm', color: '#cb3837' },
  'package-lock.json': { icon: 'npm', color: '#cb3837' },
  'yarn.lock': { icon: 'yarn', color: '#2c8ebb' },
  'pnpm-lock.yaml': { icon: 'pnpm', color: '#f69220' },
  'tsconfig.json': { icon: 'ts', color: '#3178c6' },
  'vite.config.ts': { icon: 'vite', color: '#646cff' },
  'vite.config.js': { icon: 'vite', color: '#646cff' },
  'webpack.config.js': { icon: 'webpack', color: '#8dd6f9' },
  'tailwind.config.js': { icon: 'tailwind', color: '#38bdf8' },
  'tailwind.config.ts': { icon: 'tailwind', color: '#38bdf8' },
  '.eslintrc': { icon: 'eslint', color: '#4b32c3' },
  '.prettierrc': { icon: 'prettier', color: '#56b3b4' },
  'requirements.txt': { icon: 'python', color: '#3776ab' },
  'Cargo.toml': { icon: 'rust', color: '#dea584' },
  'go.mod': { icon: 'go', color: '#00add8' },
  'Gemfile': { icon: 'ruby', color: '#cc342d' },
  'Makefile': { icon: 'makefile', color: '#6d8086' },
  'CMakeLists.txt': { icon: 'cmake', color: '#064f8c' },
  
  // Default
  default: { icon: 'file', color: '#89898a' },
}

// SVG 图标路径
const ICON_PATHS: Record<string, JSX.Element> = {
  js: (
    <text x="2" y="12" fontSize="10" fontWeight="bold" fill="currentColor">JS</text>
  ),
  ts: (
    <text x="2" y="12" fontSize="10" fontWeight="bold" fill="currentColor">TS</text>
  ),
  react: (
    <g fill="currentColor">
      <circle cx="8" cy="8" r="1.5" />
      <ellipse cx="8" cy="8" rx="6" ry="2.5" fill="none" stroke="currentColor" strokeWidth="1" />
      <ellipse cx="8" cy="8" rx="6" ry="2.5" fill="none" stroke="currentColor" strokeWidth="1" transform="rotate(60 8 8)" />
      <ellipse cx="8" cy="8" rx="6" ry="2.5" fill="none" stroke="currentColor" strokeWidth="1" transform="rotate(120 8 8)" />
    </g>
  ),
  html: (
    <text x="0" y="12" fontSize="7" fontWeight="bold" fill="currentColor">HTML</text>
  ),
  css: (
    <text x="1" y="12" fontSize="8" fontWeight="bold" fill="currentColor">CSS</text>
  ),
  sass: (
    <text x="0" y="12" fontSize="7" fontWeight="bold" fill="currentColor">SASS</text>
  ),
  less: (
    <text x="0" y="12" fontSize="7" fontWeight="bold" fill="currentColor">LESS</text>
  ),
  vue: (
    <path d="M8 2L2 14h3l3-6 3 6h3L8 2z" fill="currentColor" />
  ),
  svelte: (
    <path d="M8 1C5 1 3 3 3 5c0 1.5.8 2.8 2 3.5v5c0 1.5 1.5 2.5 3 2.5s3-1 3-2.5v-5c1.2-.7 2-2 2-3.5 0-2-2-4-5-4z" fill="currentColor" />
  ),
  json: (
    <text x="0" y="12" fontSize="7" fontWeight="bold" fill="currentColor">JSON</text>
  ),
  yaml: (
    <text x="0" y="12" fontSize="7" fontWeight="bold" fill="currentColor">YML</text>
  ),
  xml: (
    <text x="0" y="12" fontSize="8" fontWeight="bold" fill="currentColor">XML</text>
  ),
  csv: (
    <text x="1" y="12" fontSize="8" fontWeight="bold" fill="currentColor">CSV</text>
  ),
  python: (
    <g fill="currentColor">
      <path d="M8 1C5.5 1 4 2 4 4v2h4v1H3c-1.5 0-2 1.5-2 3s.5 3 2 3h2v-2c0-1 .5-2 2-2h4c1 0 2-.5 2-2V4c0-2-1.5-3-4-3H8zm-.5 1.5a.75.75 0 110 1.5.75.75 0 010-1.5z" />
      <path d="M8 15c2.5 0 4-1 4-3v-2H8v-1h5c1.5 0 2-1.5 2-3s-.5-3-2-3h-2v2c0 1-.5 2-2 2H5c-1 0-2 .5-2 2v3c0 2 1.5 3 4 3h1zm.5-1.5a.75.75 0 110-1.5.75.75 0 010 1.5z" opacity="0.7" />
    </g>
  ),
  jupyter: (
    <g fill="currentColor">
      <circle cx="8" cy="3" r="2" />
      <circle cx="3" cy="11" r="1.5" />
      <circle cx="13" cy="11" r="1.5" />
      <path d="M4 8c0-2.2 1.8-4 4-4s4 1.8 4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </g>
  ),
  go: (
    <text x="2" y="12" fontSize="10" fontWeight="bold" fill="currentColor">Go</text>
  ),
  rust: (
    <text x="2" y="12" fontSize="10" fontWeight="bold" fill="currentColor">Rs</text>
  ),
  ruby: (
    <path d="M2 14L8 2l6 12H2z" fill="currentColor" />
  ),
  php: (
    <text x="0" y="12" fontSize="8" fontWeight="bold" fill="currentColor">PHP</text>
  ),
  java: (
    <text x="0" y="12" fontSize="7" fontWeight="bold" fill="currentColor">JAVA</text>
  ),
  kotlin: (
    <text x="3" y="12" fontSize="10" fontWeight="bold" fill="currentColor">K</text>
  ),
  swift: (
    <path d="M13 3c-3 2-6 5-8 8 2-1 4-1 6 0-2 1-4 2-7 2 4 1 8 0 10-3 1-2 1-5-1-7z" fill="currentColor" />
  ),
  c: (
    <text x="4" y="12" fontSize="11" fontWeight="bold" fill="currentColor">C</text>
  ),
  cpp: (
    <text x="1" y="12" fontSize="9" fontWeight="bold" fill="currentColor">C++</text>
  ),
  csharp: (
    <text x="2" y="12" fontSize="10" fontWeight="bold" fill="currentColor">C#</text>
  ),
  shell: (
    <g fill="currentColor">
      <path d="M2 4l5 4-5 4V4z" />
      <rect x="8" y="11" width="5" height="1.5" />
    </g>
  ),
  powershell: (
    <text x="2" y="12" fontSize="10" fontWeight="bold" fill="currentColor">PS</text>
  ),
  env: (
    <g fill="currentColor">
      <circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 3v2M8 11v2M3 8h2M11 8h2" stroke="currentColor" strokeWidth="1.5" />
    </g>
  ),
  git: (
    <path d="M14.5 7.3L8.7 1.5c-.4-.4-1-.4-1.4 0L5.8 3l1.8 1.8c.4-.1.9 0 1.2.3.3.3.4.8.3 1.2l1.7 1.7c.4-.1.9 0 1.2.3.5.5.5 1.2 0 1.7s-1.2.5-1.7 0c-.3-.3-.4-.8-.3-1.2L8.3 7.1v4.1c.1.1.2.2.3.3.5.5.5 1.2 0 1.7s-1.2.5-1.7 0-.5-1.2 0-1.7c.1-.1.3-.2.4-.3V6.8c-.1-.1-.3-.2-.4-.3-.3-.3-.4-.8-.3-1.2L4.8 3.5 1.5 6.8c-.4.4-.4 1 0 1.4l5.8 5.8c.4.4 1 .4 1.4 0l5.8-5.8c.4-.4.4-1 0-1.4z" fill="currentColor" />
  ),
  docker: (
    <g fill="currentColor">
      <rect x="1" y="7" width="2" height="2" />
      <rect x="4" y="7" width="2" height="2" />
      <rect x="7" y="7" width="2" height="2" />
      <rect x="4" y="4" width="2" height="2" />
      <rect x="7" y="4" width="2" height="2" />
      <rect x="10" y="7" width="2" height="2" />
      <path d="M15 9c-.5-.3-1.5-.4-2.3-.1-.1-.8-.5-1.5-1.2-2l-.4-.3-.3.4c-.4.5-.5 1.3-.5 1.9.1.5.2.9.5 1.3-1 .6-2.1.7-6.3.7H4c-.1 1.2.2 2.4.8 3.4.7 1 1.8 1.7 3.4 1.7 3.2 0 5.6-1.5 6.7-4.2.4 0 1.3 0 1.8-.9l.1-.2-.3-.2c-.4-.2-1.2-.4-1.5-.5z" />
    </g>
  ),
  markdown: (
    <text x="0" y="12" fontSize="8" fontWeight="bold" fill="currentColor">MD</text>
  ),
  text: (
    <g fill="currentColor">
      <rect x="2" y="3" width="12" height="1" />
      <rect x="2" y="6" width="10" height="1" />
      <rect x="2" y="9" width="12" height="1" />
      <rect x="2" y="12" width="8" height="1" />
    </g>
  ),
  pdf: (
    <text x="0" y="12" fontSize="8" fontWeight="bold" fill="currentColor">PDF</text>
  ),
  word: (
    <text x="3" y="12" fontSize="10" fontWeight="bold" fill="currentColor">W</text>
  ),
  database: (
    <g fill="currentColor">
      <ellipse cx="8" cy="4" rx="5" ry="2" />
      <path d="M3 4v8c0 1.1 2.2 2 5 2s5-.9 5-2V4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 8c0 1.1 2.2 2 5 2s5-.9 5-2" fill="none" stroke="currentColor" strokeWidth="1" />
    </g>
  ),
  svg: (
    <text x="1" y="12" fontSize="8" fontWeight="bold" fill="currentColor">SVG</text>
  ),
  image: (
    <g fill="currentColor">
      <rect x="2" y="3" width="12" height="10" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="5" cy="6" r="1.5" />
      <path d="M2 11l3-3 2 2 4-4 3 3v2H2v-1z" />
    </g>
  ),
  npm: (
    <g fill="currentColor">
      <rect x="1" y="4" width="14" height="8" />
      <rect x="3" y="6" width="2" height="4" fill="var(--background, #fff)" />
      <rect x="6" y="6" width="2" height="4" fill="var(--background, #fff)" />
      <rect x="7" y="6" width="1" height="2" fill="currentColor" />
      <rect x="9" y="6" width="2" height="4" fill="var(--background, #fff)" />
      <rect x="10" y="6" width="1" height="2" fill="currentColor" />
    </g>
  ),
  yarn: (
    <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm2.5 10.5c-.5.3-2 .5-2.5.5s-2-.2-2.5-.5c-.3-.2-.5-.5-.5-1 0-.3.2-.5.5-.5h5c.3 0 .5.2.5.5 0 .5-.2.8-.5 1zM6 8c-.5 0-1-.5-1-1s.5-1 1-1 1 .5 1 1-.5 1-1 1zm4 0c-.5 0-1-.5-1-1s.5-1 1-1 1 .5 1 1-.5 1-1 1z" fill="currentColor" />
  ),
  pnpm: (
    <g fill="currentColor">
      <rect x="1" y="1" width="4" height="4" />
      <rect x="6" y="1" width="4" height="4" />
      <rect x="11" y="1" width="4" height="4" />
      <rect x="6" y="6" width="4" height="4" />
      <rect x="11" y="6" width="4" height="4" />
      <rect x="11" y="11" width="4" height="4" />
    </g>
  ),
  vite: (
    <path d="M14.5 2L8 14 1.5 2h5l1.5 6 1.5-6h5z" fill="currentColor" />
  ),
  webpack: (
    <path d="M8 1L1 5v6l7 4 7-4V5L8 1zm0 2l4.5 2.5L8 8 3.5 5.5 8 3zm-5 4l4 2.3v3.4L3 10.4V7zm10 0v3.4l-4 2.3V9.3l4-2.3z" fill="currentColor" />
  ),
  tailwind: (
    <path d="M8 3c-2.7 0-4.3 1.3-5 4 1-1.3 2.2-1.8 3.5-1.5.7.2 1.3.7 1.8 1.3.9.9 1.9 2 4.2 2 2.7 0 4.3-1.3 5-4-1 1.3-2.2 1.8-3.5 1.5-.7-.2-1.3-.7-1.8-1.3-.9-.9-1.9-2-4.2-2zM3 9c-2.7 0-4.3 1.3-5 4 1-1.3 2.2-1.8 3.5-1.5.7.2 1.3.7 1.8 1.3.9.9 1.9 2 4.2 2 2.7 0 4.3-1.3 5-4-1 1.3-2.2 1.8-3.5 1.5-.7-.2-1.3-.7-1.8-1.3-.9-.9-1.9-2-4.2-2z" fill="currentColor" />
  ),
  eslint: (
    <path d="M8 1L1 5v6l7 4 7-4V5L8 1zm0 3l3.5 2v4L8 12l-3.5-2V6L8 4z" fill="currentColor" />
  ),
  prettier: (
    <g fill="currentColor">
      <rect x="2" y="2" width="4" height="2" rx="0.5" />
      <rect x="2" y="5" width="8" height="2" rx="0.5" />
      <rect x="2" y="8" width="6" height="2" rx="0.5" />
      <rect x="2" y="11" width="10" height="2" rx="0.5" />
    </g>
  ),
  makefile: (
    <text x="3" y="12" fontSize="10" fontWeight="bold" fill="currentColor">M</text>
  ),
  cmake: (
    <path d="M8 1L1 8l7 7 7-7-7-7zm0 3l4 4-4 4-4-4 4-4z" fill="currentColor" />
  ),
  file: (
    <g fill="currentColor">
      <path d="M4 1h5l4 4v9a1 1 0 01-1 1H4a1 1 0 01-1-1V2a1 1 0 011-1z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 1v4h4" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </g>
  ),
}

export function FileIcon({ filename, className }: FileIconProps) {
  const ext = filename.includes('.') ? filename.split('.').pop()?.toLowerCase() || '' : ''
  const lowerFilename = filename.toLowerCase()
  
  // 先检查完整文件名匹配
  let config = FILE_ICONS[lowerFilename]
  
  // 再检查扩展名匹配
  if (!config) {
    config = FILE_ICONS[ext] || FILE_ICONS.default
  }
  
  const iconElement = ICON_PATHS[config.icon] || ICON_PATHS.file
  
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn("h-4 w-4 flex-shrink-0", className)}
      style={{ color: config.color }}
    >
      {iconElement}
    </svg>
  )
}
