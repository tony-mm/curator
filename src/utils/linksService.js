const MAX_ALIAS_ATTEMPTS = 5;

export const generateShortCode = () => Math.random().toString(36).slice(2, 8);

export const createLink = async ({ supabase, userId, url, alias, expiresAt }) => {
  if (!userId) throw new Error('Not authenticated');
  if (!url) throw new Error('URL required');

  const isCustom = Boolean(alias);
  let attempt = 0;
  let shortCode = alias || generateShortCode();

  while (attempt < MAX_ALIAS_ATTEMPTS) {
    const { data, error } = await supabase
      .from('links')
      .insert({
        user_id: userId,
        original_url: url,
        short_code: shortCode,
        expires_at: expiresAt || null,
      })
      .select('id, short_code')
      .single();

    if (!error) {
      return { id: data.id, shortCode: data.short_code };
    }

    if (error.code === '23505' && !isCustom) {
      attempt += 1;
      shortCode = generateShortCode();
      continue;
    }

    if (error.code === '23505' && isCustom) {
      throw new Error('Alias already taken');
    }

    throw new Error(error.message || 'Failed to create link');
  }

  throw new Error('Failed to generate a unique alias');
};

export const buildShortUrl = (shortCode) => {
  const base = import.meta.env.VITE_PUBLIC_SHORT_BASE || window.location.origin;
  return `${base}/s/${shortCode}`;
};
