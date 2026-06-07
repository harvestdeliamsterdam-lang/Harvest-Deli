/**
 * About page story content — a singleton document holding the editorial
 * narrative for about.html (hero + ordered story chapters + pull quote).
 * Editors manage the story; the frontend can hydrate it later. Additive.
 */
export default {
  name: 'aboutStory',
  title: 'About page story',
  type: 'document',
  // Treated as a singleton in the Studio (one document, id "aboutStory").
  fields: [
    { name: 'eyebrow', title: 'Hero eyebrow', type: 'string' },
    { name: 'heroTitle', title: 'Hero title', type: 'string' },
    { name: 'heroIntro', title: 'Hero intro', type: 'text', rows: 3 },
    {
      name: 'heroImage',
      title: 'Hero image',
      type: 'image',
      options: { hotspot: true },
      fields: [{ name: 'alt', type: 'string', title: 'Alt text' }],
    },
    {
      name: 'chapters',
      title: 'Story chapters',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'eyebrow', type: 'string', title: 'Eyebrow' },
            { name: 'title', type: 'string', title: 'Title' },
            { name: 'body', type: 'blockContent', title: 'Body' },
            {
              name: 'image',
              type: 'image',
              title: 'Image',
              options: { hotspot: true },
              fields: [{ name: 'alt', type: 'string', title: 'Alt text' }],
            },
          ],
          preview: { select: { title: 'title', subtitle: 'eyebrow', media: 'image' } },
        },
      ],
    },
    {
      name: 'pullQuote',
      title: 'Pull quote',
      type: 'object',
      fields: [
        { name: 'text', type: 'text', rows: 2, title: 'Quote' },
        { name: 'attribution', type: 'string', title: 'Attribution' },
      ],
    },
    { name: 'seo', title: 'SEO & social', type: 'seo' },
  ],
  preview: { prepare: () => ({ title: 'About page story' }) },
}
