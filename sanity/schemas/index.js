// Schema registry — import every type here and feed it to the Studio config.
import seo from './objects/seo'
import blockContent from './objects/blockContent'
import faq from './objects/faq'

import author from './documents/author'
import category from './documents/category'
import post from './documents/post'
import homeSection from './documents/homeSection'
import homepage from './documents/homepage'
import aboutStory from './documents/aboutStory'
import originStory from './documents/originStory'

export const schemaTypes = [
  // objects
  seo,
  blockContent,
  faq,
  // documents
  post, // Journal / Blog / Educational articles (category, FAQ, CTA, relatedProduct)
  originStory, // Per-product provenance / terroir story
  homepage, // Homepage marketing surface (singleton)
  category,
  author,
  homeSection, // Generic, ordered homepage section blocks (legacy/flexible)
  aboutStory, // About-page narrative (singleton)
]
