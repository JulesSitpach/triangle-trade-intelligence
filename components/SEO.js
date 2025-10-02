import Head from 'next/head';

/**
 * SEO Component - Reusable meta tags for all pages
 * Includes Open Graph and Twitter Card support
 *
 * @param {string} title - Page title
 * @param {string} description - Page description
 * @param {string} image - Social media preview image
 * @param {string} url - Canonical URL
 * @param {string} type - Open Graph type (website, article, etc.)
 */
export default function SEO({
  title = 'Triangle Intelligence - USMCA Compliance Platform',
  description = 'Professional USMCA compliance analysis and certificate generation platform for North American importers and exporters.',
  image = '/og-image.png',
  url = 'https://triangleintelligence.com',
  type = 'website'
}) {
  const fullTitle = title.includes('Triangle Intelligence')
    ? title
    : `${title} | Triangle Intelligence`;

  const fullUrl = url.startsWith('http')
    ? url
    : `https://triangleintelligence.com${url}`;

  const fullImage = image.startsWith('http')
    ? image
    : `https://triangleintelligence.com${image}`;

  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="icon" href="/favicon.ico" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:site_name" content="Triangle Intelligence" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={fullUrl} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={fullImage} />

      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />

      {/* Additional SEO */}
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      <meta name="author" content="Triangle Intelligence" />
    </Head>
  );
}
