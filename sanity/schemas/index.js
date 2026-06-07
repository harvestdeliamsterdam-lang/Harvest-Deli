// Schema registry — import every type here and feed it to the Studio config.
import seo from './objects/seo'
import blockContent from './objects/blockContent'

import author from './documents/author'
import category from './documents/category'
import post from './documents/post'
import homeSection from './documents/homeSection'
import aboutStory from './documents/aboutStory'

export const schemaTypes = [
  // objects
  seo,
  blockContent,
  // documents
  post,
  category,
  author,
  homeSection,
  aboutStory,
]
