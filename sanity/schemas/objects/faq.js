/**
 * FAQ item, a question/answer pair. An array of these on an article powers
 * an on-page accordion AND a FAQPage JSON-LD block (rich-result eligible).
 * The frontend serialises these into schema.org FAQPage markup for SEO.
 */
export default {
  name: 'faq',
  title: 'FAQ item',
  type: 'object',
  fields: [
    { name: 'question', title: 'Question', type: 'string', validation: (Rule) => Rule.required() },
    { name: 'answer', title: 'Answer', type: 'text', rows: 3, validation: (Rule) => Rule.required() },
  ],
  preview: {
    select: { title: 'question', subtitle: 'answer' },
  },
}
