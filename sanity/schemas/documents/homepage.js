/**
 * Homepage CMS, a single editable document for the marketing surface of the
 * homepage (hero, featured collection, trust badges, CTA, testimonials).
 *
 * Editor-managed copy/media ONLY. Featured products are referenced by their
 * Shopify handle (plain strings), pricing, stock and checkout stay 100% in
 * Shopify. This is a singleton (one document, id "homepage").
 */
export default {
  name: 'homepage',
  title: 'Homepage',
  type: 'document',
  groups: [
    { name: 'hero', title: 'Hero', default: true },
    { name: 'featured', title: 'Featured' },
    { name: 'trust', title: 'Trust' },
    { name: 'cta', title: 'CTA' },
    { name: 'social', title: 'Testimonials' },
  ],
  fields: [
    /* ---- Hero ---- */
    {
      name: 'heroVideo',
      title: 'Hero video',
      type: 'file',
      group: 'hero',
      options: { accept: 'video/*' },
      description: 'Looping background video (mp4/webm). Poster image below.',
    },
    {
      name: 'heroPoster',
      title: 'Hero poster image',
      type: 'image',
      group: 'hero',
      options: { hotspot: true },
      fields: [{ name: 'alt', type: 'string', title: 'Alt text' }],
    },
    { name: 'heroEyebrow', title: 'Hero eyebrow', type: 'string', group: 'hero' },
    { name: 'heroTitle', title: 'Hero title', type: 'string', group: 'hero' },
    { name: 'heroIntro', title: 'Hero intro', type: 'text', rows: 3, group: 'hero' },

    /* ---- Featured collection ---- */
    {
      name: 'featuredCollectionTitle',
      title: 'Featured collection title',
      type: 'string',
      group: 'featured',
    },
    {
      name: 'featuredProducts',
      title: 'Featured products',
      type: 'array',
      group: 'featured',
      of: [{ type: 'string' }],
      description:
        'Shopify product handles in display order, e.g. "chestnut", "thyme". Resolved against the live Shopify catalogue at render time.',
      options: { layout: 'tags' },
    },

    /* ---- Trust badges ---- */
    {
      name: 'trustBadges',
      title: 'Trust badges',
      type: 'array',
      group: 'trust',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'label', type: 'string', title: 'Label' },
            { name: 'detail', type: 'string', title: 'Detail' },
            {
              name: 'icon',
              type: 'string',
              title: 'Icon key',
              description: 'Maps to an SVG icon in the frontend (e.g. "shield", "leaf", "truck").',
            },
          ],
          preview: { select: { title: 'label', subtitle: 'detail' } },
        },
      ],
    },

    /* ---- CTA section ---- */
    {
      name: 'ctaSection',
      title: 'CTA section',
      type: 'object',
      group: 'cta',
      fields: [
        { name: 'eyebrow', type: 'string', title: 'Eyebrow' },
        { name: 'title', type: 'string', title: 'Title' },
        { name: 'body', type: 'text', rows: 2, title: 'Body' },
        { name: 'ctaLabel', type: 'string', title: 'Button label' },
        { name: 'ctaHref', type: 'string', title: 'Button link' },
        {
          name: 'image',
          type: 'image',
          title: 'Background / accent image',
          options: { hotspot: true },
          fields: [{ name: 'alt', type: 'string', title: 'Alt text' }],
        },
      ],
    },

    /* ---- Testimonials ---- */
    {
      name: 'testimonials',
      title: 'Testimonial section',
      type: 'array',
      group: 'social',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'quote', type: 'text', rows: 3, title: 'Quote' },
            { name: 'author', type: 'string', title: 'Author' },
            { name: 'detail', type: 'string', title: 'Author detail / location' },
            { name: 'rating', type: 'number', title: 'Rating (1–5)', validation: (Rule) => Rule.min(1).max(5) },
          ],
          preview: { select: { title: 'author', subtitle: 'quote' } },
        },
      ],
    },
  ],
  preview: {
    prepare() {
      return { title: 'Homepage', subtitle: 'Hero, featured, trust, CTA, testimonials' }
    },
  },
}
