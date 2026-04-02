const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

export async function searchFoodImage(query: string): Promise<string | null> {
  if (!UNSPLASH_ACCESS_KEY) return null;

  try {
    const params = new URLSearchParams({
      query: `${query} food dish`,
      per_page: '1',
      orientation: 'landscape',
      content_filter: 'high',
    });

    const res = await fetch(
      `https://api.unsplash.com/search/photos?${params}`,
      {
        headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    // Use the "small" size (400px wide) for cards, "regular" (1080px) for detail
    return data.results?.[0]?.urls?.regular ?? null;
  } catch {
    return null;
  }
}
