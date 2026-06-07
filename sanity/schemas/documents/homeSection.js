/**
 * Homepage editorial section — lets editors manage the copy/imagery of the
 * homepage's editorial chapters (origin, process, altitude, olive oil, etc.)
 * without touching markup. The frontend can later hydrate matching sections by
 * their `key`. Purely additive: unused until the homepage opts a section in.
 */
export default {
  name: 'homeSection',
  title: 'Homepage section',
  type: 'document',
  fields: [
    {
      name: 'key',
      title: 'Section key',
      type: 'string',
      description: 'Stable id the frontend targets, e.g. "origin", "process", "altitude", "olive-oil", "tasting".',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'order',
      title: 'Order',
      type: 'number',
      initialValue: 0,
    },
    { name: 'eyebrow', title: 'Eyebrow', type: 'string' },
    { name: 'title', title: 'Title', type: 'string' },
    { name: 'body', title: 'Body', type: 'text', rows: 4 },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
      fields: [{ name: 'alt', type: 'string', title: 'Alt text' }],
    },
    {
      name: 'cta',
      title: 'Call to action',
      type: 'object',
      options: { collapsible: true, collapsed: true },
      fields: [
        { name: 'label', type: 'string', title: 'Label' },
        { name: 'href', type: 'string', title: 'Link' },
      ],
    },
    {
      name: 'enabled',
      title: 'Enabled',
      type: 'boolean',
      description: 'When off, the frontend keeps its built-in static copy for this section.',
      initialValue: false,
    },
  ],
  orderings: [{ title: 'Order', name: 'order', by: [{ field: 'order', direction: 'asc' }] }],
  preview: { select: { title: 'title', subtitle: 'key' } },
}
