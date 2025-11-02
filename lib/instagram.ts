type PublishResult = { success: true; id: string; permalink?: string } | { success: false; error: string };

async function fetchJson(url: string, options?: RequestInit) {
  const res = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data && (data.error?.message || data.error?.error_user_msg)) || `HTTP ${res.status}`;
    throw new Error(message);
  }
  return data;
}

export async function publishToInstagram(params: {
  imageUrl: string;
  caption: string;
  igUserId: string;
  accessToken: string;
}): Promise<PublishResult> {
  try {
    // Step 1: Create media container
    const createUrl = new URL(`https://graph.facebook.com/v21.0/${params.igUserId}/media`);
    createUrl.searchParams.set('image_url', params.imageUrl);
    createUrl.searchParams.set('caption', params.caption);
    createUrl.searchParams.set('access_token', params.accessToken);
    const create = await fetchJson(createUrl.toString(), { method: 'POST' });

    const creationId = create.id as string;
    if (!creationId) throw new Error('Missing creation_id from Graph API');

    // Step 2: Publish
    const publishUrl = new URL(`https://graph.facebook.com/v21.0/${params.igUserId}/media_publish`);
    publishUrl.searchParams.set('creation_id', creationId);
    publishUrl.searchParams.set('access_token', params.accessToken);
    const publish = await fetchJson(publishUrl.toString(), { method: 'POST' });

    const publishedId = publish.id as string;
    let permalink: string | undefined;
    if (publishedId) {
      const mediaInfoUrl = new URL(`https://graph.facebook.com/v21.0/${publishedId}`);
      mediaInfoUrl.searchParams.set('fields', 'permalink');
      mediaInfoUrl.searchParams.set('access_token', params.accessToken);
      const info = await fetchJson(mediaInfoUrl.toString());
      permalink = info.permalink as string | undefined;
    }

    return { success: true, id: publishedId || creationId, permalink };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Graph API error' };
  }
}
