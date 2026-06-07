export default {
  name: 'author',
  title: 'Author',
  type: 'document',
  fields: [
    { name: 'name', title: 'Name', type: 'string', validation: (Rule) => Rule.required() },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    },
    { name: 'role', title: 'Role / title', type: 'string', description: 'e.g. "Cellar master", "Field editor".' },
    { name: 'bio', title: 'Short bio', type: 'text', rows: 3 },
    { name: 'image', title: 'Portrait', type: 'image', options: { hotspot: true } },
  ],
  preview: {
    select: { title: 'name', subtitle: 'role', media: 'image' },
  },
}
