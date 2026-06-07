export default {
  name: 'category',
  title: 'Category',
  type: 'document',
  fields: [
    { name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required() },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    },
    { name: 'description', title: 'Description', type: 'text', rows: 2 },
    {
      name: 'tone',
      title: 'Visual tone',
      type: 'string',
      description: 'Maps to the editorial placeholder gradient on cards (.tone-*) when no image is set.',
      options: {
        list: [
          { title: 'Honey', value: 'honey' },
          { title: 'Thyme', value: 'thyme' },
          { title: 'Pine', value: 'pine' },
          { title: 'Cellar', value: 'cellar' },
          { title: 'Bee', value: 'bee' },
          { title: 'Jar', value: 'jar' },
        ],
      },
      initialValue: 'honey',
    },
  ],
  preview: { select: { title: 'title', subtitle: 'slug.current' } },
}
