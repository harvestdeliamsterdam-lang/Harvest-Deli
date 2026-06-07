import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemas'

/**
 * Sanity Studio config for Harvest Deli editorial content.
 *
 * Fill in projectId + dataset (see .env.example), then:
 *   cd sanity && npm install && npm run dev
 *
 * This Studio is standalone tooling for editors. It does NOT run on the
 * static site — the site reads published content through the HTTP API via
 * /cms/sanity.js. Keep this decoupled from commerce (Shopify).
 */
export default defineConfig({
  name: 'harvest-deli',
  title: 'Harvest Deli — Journal & Editorial',

  projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'REPLACE_WITH_PROJECT_ID',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.listItem()
              .title('Journal articles')
              .schemaType('post')
              .child(S.documentTypeList('post').title('Journal articles')),
            S.listItem().title('Categories').schemaType('category').child(S.documentTypeList('category')),
            S.listItem().title('Authors').schemaType('author').child(S.documentTypeList('author')),
            S.divider(),
            S.listItem().title('Homepage sections').schemaType('homeSection').child(S.documentTypeList('homeSection')),
            // About story as a singleton
            S.listItem()
              .title('About page story')
              .child(S.document().schemaType('aboutStory').documentId('aboutStory')),
          ]),
    }),
    visionTool(),
  ],

  schema: { types: schemaTypes },
})
