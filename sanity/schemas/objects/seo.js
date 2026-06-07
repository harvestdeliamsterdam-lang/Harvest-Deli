/**
 * SEO object — reused by post, homeSection, aboutStory and any page document.
 * Keep this the single source of truth for meta fields so every content type
 * exposes the same SEO shape to the frontend adapter (cms/*).
 */
export default {
  name: 'seo',
  title: 'SEO & social',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    {
      name: 'title',
      title: 'SEO title',
      type: 'string',
      description: 'Overrides the <title> tag. ~50–60 chars. Falls back to the document title.',
      validation: (Rule) => Rule.max(70).warning('Keep under ~60 characters for search results.'),
    },
    {
      name: 'description',
      title: 'SEO description',
      type: 'text',
      rows: 3,
      description: 'Meta description. ~150–160 chars.',
      validation: (Rule) => Rule.max(180).warning('Keep under ~160 characters.'),
    },
    {
      name: 'ogImage',
      title: 'OG / social image',
      type: 'image',
      description: 'Open Graph + Twitter card image. 1200×630 recommended. Falls back to the featured image.',
      options: { hotspot: true },
    },
    {
      name: 'noIndex',
      title: 'Hide from search engines',
      type: 'boolean',
      initialValue: false,
    },
  ],
}
