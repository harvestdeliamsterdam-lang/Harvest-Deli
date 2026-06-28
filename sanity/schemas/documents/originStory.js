/**
 * Origin Story — the provenance / terroir story behind a single product
 * (a honey varietal, the olive oil, the mountain tea).
 *
 * IMPORTANT: this is editorial content only. The product itself — price,
 * inventory, variants, checkout — lives in Shopify and is NEVER duplicated
 * here. `productHandle` is a plain string that maps to the Shopify product
 * handle so the frontend can cross-link the story to the live product page.
 */
export default {
  name: 'originStory',
  title: 'Origin story',
  type: 'document',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'tasting', title: 'Tasting & craft' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    {
      name: 'productName',
      title: 'Product name',
      type: 'string',
      group: 'content',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'content',
      options: { source: 'productName', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'productHandle',
      title: 'Shopify product handle',
      type: 'string',
      group: 'content',
      description:
        'The Shopify product handle this story belongs to (e.g. "chestnut"). Used to link the story to the live product. Leave empty for a standalone story.',
    },
    {
      name: 'region',
      title: 'Region',
      type: 'string',
      group: 'content',
      description: 'e.g. "Central Greece".',
    },
    {
      name: 'altitude',
      title: 'Altitude',
      type: 'string',
      group: 'content',
      description: 'e.g. "900–1200 m".',
    },
    {
      name: 'harvestSeason',
      title: 'Harvest season',
      type: 'string',
      group: 'content',
      description: 'e.g. "Late summer".',
    },
    {
      name: 'producerStory',
      title: 'Producer story',
      type: 'blockContent',
      group: 'content',
    },
    {
      name: 'galleryImages',
      title: 'Gallery images',
      type: 'array',
      group: 'content',
      of: [
        {
          type: 'image',
          options: { hotspot: true },
          fields: [{ name: 'alt', type: 'string', title: 'Alt text' }],
        },
      ],
      options: { layout: 'grid' },
    },
    {
      name: 'tastingNotes',
      title: 'Tasting notes',
      type: 'array',
      group: 'tasting',
      of: [{ type: 'string' }],
      description: 'Short descriptors, e.g. "Warm wood", "Layered", "Long finish".',
      options: { layout: 'tags' },
    },
    {
      name: 'extractionMethod',
      title: 'Extraction / production method',
      type: 'string',
      group: 'tasting',
      description: 'e.g. "Cold extraction, unfiltered".',
    },
    { name: 'seo', title: 'SEO & social', type: 'seo', group: 'seo' },
  ],
  preview: {
    select: { title: 'productName', subtitle: 'region', media: 'galleryImages.0' },
    prepare({ title, subtitle, media }) {
      return { title, subtitle: subtitle || 'Origin story', media }
    },
  },
}
