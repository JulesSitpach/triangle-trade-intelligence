/**
 * Dynamic sitemap.xml generator for Triangle Trade Intelligence Platform
 * Automatically includes all public pages with proper priorities and changefreq
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://triangleintelligence.com';

function generateSiteMap() {
  const staticPages = [
    { url: '', priority: '1.0', changefreq: 'daily' }, // Homepage
    { url: '/pricing', priority: '0.9', changefreq: 'weekly' },
    { url: '/about', priority: '0.8', changefreq: 'weekly' },
    { url: '/usmca-workflow', priority: '0.9', changefreq: 'weekly' },
    { url: '/trade-risk-alternatives', priority: '0.8', changefreq: 'weekly' },
    { url: '/mexico-savings-calculator', priority: '0.7', changefreq: 'weekly' },
    { url: '/secure-supply-chain-mexico', priority: '0.7', changefreq: 'weekly' },
    { url: '/terms-of-service', priority: '0.5', changefreq: 'monthly' },
    { url: '/privacy-policy', priority: '0.5', changefreq: 'monthly' },
    { url: '/login', priority: '0.6', changefreq: 'monthly' },
    { url: '/dashboard', priority: '0.7', changefreq: 'daily' },
  ];

  const lastmod = new Date().toISOString();

  return `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     ${staticPages
       .map((page) => {
         return `
       <url>
         <loc>${BASE_URL}${page.url}</loc>
         <lastmod>${lastmod}</lastmod>
         <changefreq>${page.changefreq}</changefreq>
         <priority>${page.priority}</priority>
       </url>
     `;
       })
       .join('')}
   </urlset>
 `;
}

export async function getServerSideProps({ res }) {
  const sitemap = generateSiteMap();

  res.setHeader('Content-Type', 'text/xml');
  // Cache sitemap for 24 hours
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
}

export default function Sitemap() {
  // getServerSideProps will handle the response
  return null;
}
