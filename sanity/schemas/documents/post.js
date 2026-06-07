/**
 * Journal article (blog post).
 * The frontend adapter (cms/) projects this to a flat shape with category/author
 * dereferenced and image URLs resolved — see cms/sanity.js GROQ and
 * cms/mock-content.js for the exact runtime shape.
 */
export default {
  name: 'post',
  title: 'Journal article',
  type: 'document',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'meta', title: 'Meta' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    { name: 'title', title: 'Title', type: 'string', group: 'content', validation: (Rule) => Rule.required() },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'content',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      group: 'content',
      description: 'Short summary shown on cards and as the fallback meta description.',
      validation: (Rule) => Rule.max(280),
    },
    {
      name: 'featuredImage',
      title: 'Featured image',
      type: 'image',
      group: 'content',
      options: { hotspot: true },
      fields: [
        { name: 'alt', type: 'string', title: 'Alt text' },
        { name: 'caption', type: 'string', title: 'Caption' },
      ],
    },
    { name: 'body', title: 'Body', type: 'blockContent', group: 'content' },

    {
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'category' }],
      group: 'meta',
    },
    {
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{ type: 'author' }],
      group: 'meta',
    },
    {
      name: 'publishedAt',
      title: 'Published date',
      type: 'datetime',
      group: 'meta',
      initialValue: () => new Date().toISOString(),
    },
    {
      name: 'readingTime',
      title: 'Reading time',
      type: 'string',
      group: 'meta',
      description: 'e.g. "8 min read". Optional — can be computed from body later.',
    },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      group: 'meta',
      options: {
        list: [
          { title: 'Published', value: 'published' },
          { title: 'Upcoming / teaser', value: 'upcoming' },
          { title: 'Draft', value: 'draft' },
        ],
        layout: 'radio',
      },
      initialValue: 'published',
    },
    {
      name: 'featured',
      title: 'Featured (hero on the Journal)',
      type: 'boolean',
      group: 'meta',
      initialValue: false,
    },
    { name: 'seo', title: 'SEO & social', type: 'seo', group: 'seo' },
  ],
  orderings: [
    {
      title: 'Published date, newest',
      name: 'publishedDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
  ],
  preview: {
    select: { title: 'title', subtitle: 'category.title', media: 'featuredImage', status: 'status' },
    prepare({ title, subtitle, media, status }) {
      const tag = status && status !== 'published' ? ` · ${status}` : ''
      return { title, subtitle: (subtitle || 'Uncategorised') + tag, media }
    },
  },
}
