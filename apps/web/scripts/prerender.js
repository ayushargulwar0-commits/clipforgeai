import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const distDir = path.resolve(rootDir, 'dist')
const distSsrDir = path.resolve(rootDir, 'dist-ssr')

const SITE_URL = (process.env.SITE_URL || 'https://clipforgeai.online').replace(/\/$/, '')
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'ayushargulwar77@gmail.com'

const ROUTES = ['/', '/pricing', '/privacy', '/terms', '/contact', '/about']

async function prerender() {
  const templatePath = path.resolve(distDir, 'index.html')
  if (!fs.existsSync(templatePath)) {
    console.error(`Base template not found at ${templatePath}. Run "vite build" first.`)
    process.exit(1)
  }

  const ssrBundlePath = path.resolve(distSsrDir, 'prerender.js')
  if (!fs.existsSync(ssrBundlePath)) {
    console.error(`SSR bundle not found at ${ssrBundlePath}. Run "vite build --ssr" first.`)
    process.exit(1)
  }

  const baseHtml = fs.readFileSync(templatePath, 'utf-8')
  const ssrModule = await import(pathToFileURL(ssrBundlePath).href)
  const { renderRoute } = ssrModule

  console.log(`Prerendering static marketing routes for host: ${SITE_URL}...`)

  for (const route of ROUTES) {
    const { html, title, description } = renderRoute(route)
    const canonicalUrl = route === '/' ? `${SITE_URL}/` : `${SITE_URL}${route}`

    let pageHtml = baseHtml

    // Replace Title
    pageHtml = pageHtml.replace(/<title>.*?<\/title>/i, `<title>${title}</title>`)

    // Replace or insert meta title
    if (pageHtml.includes('<meta name="title"')) {
      pageHtml = pageHtml.replace(/<meta name="title" content=".*?" \/>/i, `<meta name="title" content="${title}" />`)
    }

    // Replace or insert meta description
    if (pageHtml.includes('<meta name="description"')) {
      pageHtml = pageHtml.replace(/<meta name="description" content=".*?" \/>/i, `<meta name="description" content="${description}" />`)
    }

    // Replace canonical URL
    if (pageHtml.includes('<link rel="canonical"')) {
      pageHtml = pageHtml.replace(/<link rel="canonical" href=".*?" \/>/i, `<link rel="canonical" href="${canonicalUrl}" />`)
    } else {
      pageHtml = pageHtml.replace('</head>', `  <link rel="canonical" href="${canonicalUrl}" />\n</head>`)
    }

    // Replace Open Graph Tags
    pageHtml = pageHtml.replace(/<meta property="og:title" content=".*?" \/>/i, `<meta property="og:title" content="${title}" />`)
    pageHtml = pageHtml.replace(/<meta property="og:description" content=".*?" \/>/i, `<meta property="og:description" content="${description}" />`)
    pageHtml = pageHtml.replace(/<meta property="og:url" content=".*?" \/>/i, `<meta property="og:url" content="${canonicalUrl}" />`)
    pageHtml = pageHtml.replace(/<meta property="og:image" content=".*?" \/>/i, `<meta property="og:image" content="${SITE_URL}/og-image.png" />`)

    // Replace Twitter Tags
    pageHtml = pageHtml.replace(/<meta property="twitter:title" content=".*?" \/>/i, `<meta property="twitter:title" content="${title}" />`)
    pageHtml = pageHtml.replace(/<meta property="twitter:description" content=".*?" \/>/i, `<meta property="twitter:description" content="${description}" />`)
    pageHtml = pageHtml.replace(/<meta property="twitter:url" content=".*?" \/>/i, `<meta property="twitter:url" content="${canonicalUrl}" />`)
    pageHtml = pageHtml.replace(/<meta property="twitter:image" content=".*?" \/>/i, `<meta property="twitter:image" content="${SITE_URL}/og-image.png" />`)

    // Inject prerendered content into root
    pageHtml = pageHtml.replace('<div id="root"></div>', `<div id="root">${html}</div>`)

    if (route === '/') {
      fs.writeFileSync(path.resolve(distDir, 'index.html'), pageHtml, 'utf-8')
      console.log(`  ✓ Prerendered: / -> dist/index.html`)
    } else {
      const routeDir = path.resolve(distDir, route.slice(1))
      fs.mkdirSync(routeDir, { recursive: true })
      fs.writeFileSync(path.resolve(routeDir, 'index.html'), pageHtml, 'utf-8')
      // Also write dist/<route>.html for web servers using cleanUrls
      fs.writeFileSync(path.resolve(distDir, `${route.slice(1)}.html`), pageHtml, 'utf-8')
      console.log(`  ✓ Prerendered: ${route} -> dist/${route.slice(1)}/index.html & dist/${route.slice(1)}.html`)
    }
  }

  // Generate / update robots.txt with SITE_URL
  const robotsTxt = `User-agent: *
Allow: /
Disallow: /dashboard/
Disallow: /api/

Sitemap: ${SITE_URL}/sitemap.xml
`
  fs.writeFileSync(path.resolve(distDir, 'robots.txt'), robotsTxt, 'utf-8')

  // Generate / update sitemap.xml with SITE_URL
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}/pricing</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${SITE_URL}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${SITE_URL}/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${SITE_URL}/privacy</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${SITE_URL}/terms</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>
`
  fs.writeFileSync(path.resolve(distDir, 'sitemap.xml'), sitemapXml, 'utf-8')
  console.log(`  ✓ Written: dist/robots.txt and dist/sitemap.xml`)

  // Clean up dist-ssr
  fs.rmSync(distSsrDir, { recursive: true, force: true })
  console.log('Static prerendering completed successfully.')
}

prerender().catch((err) => {
  console.error('Prerendering failed:', err)
  process.exit(1)
})
