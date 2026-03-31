/**
 * Default hero art: royalty-free Unsplash (warehouse / logistics).
 * Login uses the first URL; signup uses the second.
 * Override with VITE_AUTH_HERO_IMAGE_URL and VITE_AUTH_HERO_IMAGE_URL_2 (URL or /file-in-public.jpg).
 *
 * @see https://unsplash.com/license
 */
export const AUTH_HERO_DEFAULT =
  'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1600&q=85'

export const AUTH_HERO_ALT =
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&q=85'

export function authHeroUrls(): [string, string] {
  const primary = String(import.meta.env.VITE_AUTH_HERO_IMAGE_URL || '').trim()
  const secondary = String(
    import.meta.env.VITE_AUTH_HERO_IMAGE_URL_2 || '',
  ).trim()
  return [
    primary || AUTH_HERO_DEFAULT,
    secondary || AUTH_HERO_ALT,
  ]
}
