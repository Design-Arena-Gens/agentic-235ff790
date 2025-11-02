import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { generateCaption } from '../../../lib/caption';
import { processImageToInstagramSquare } from '../../../lib/image';
import { publishToInstagram } from '../../../lib/instagram';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getEnv(name: string): string | undefined {
  const v = process.env[name];
  return (v && v.trim()) || undefined;
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const imageFile = form.get('image');
    if (!imageFile || !(imageFile instanceof File)) {
      return NextResponse.json({ error: 'Missing image' }, { status: 400 });
    }

    const style = (form.get('style') as string) || '';
    const brandColor = (form.get('brandColor') as string) || undefined;
    const watermarkText = (form.get('watermarkText') as string) || undefined;
    const postToInstagram = ((form.get('postToInstagram') as string) || 'false') === 'true';
    const logoFile = form.get('logo');

    const igUserId = (form.get('igUserId') as string) || getEnv('IG_USER_ID') || '';
    const igAccessToken = (form.get('igAccessToken') as string) || getEnv('IG_ACCESS_TOKEN') || '';

    const imageArray = new Uint8Array(await imageFile.arrayBuffer());
    const imageBuffer = Buffer.from(imageArray);

    const logoBuffer = logoFile && logoFile instanceof File ? Buffer.from(new Uint8Array(await (logoFile as File).arrayBuffer())) : null;

    // Process image for Instagram
    const processedBuffer = await processImageToInstagramSquare(imageBuffer, {
      brandColorHex: brandColor,
      styleInstructions: style,
      watermarkText,
      logoBuffer,
    });

    // Upload to Vercel Blob for public URL
    const imageKey = `processed/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
    const blobToken = getEnv('BLOB_READ_WRITE_TOKEN');
    if (!blobToken) {
      return NextResponse.json({ error: 'Missing BLOB_READ_WRITE_TOKEN' }, { status: 500 });
    }

    const uploaded = await put(imageKey, processedBuffer, { access: 'public', contentType: 'image/jpeg', token: blobToken });
    const publicUrl = uploaded.url;

    // Generate caption
    const caption = generateCaption({ styleInstructions: style, brandColorHex: brandColor, watermarkText });

    let instagram:
      | { success: true; id: string; permalink?: string }
      | { success: false; error: string }
      | undefined = undefined;

    if (postToInstagram) {
      if (!igUserId || !igAccessToken) {
        instagram = { success: false, error: 'Missing IG_USER_ID or IG_ACCESS_TOKEN' };
      } else {
        instagram = await publishToInstagram({ imageUrl: publicUrl, caption, igUserId, accessToken: igAccessToken });
      }
    }

    return NextResponse.json({ imageUrl: publicUrl, caption, instagram });
  } catch (err: any) {
    const message = err?.message || 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
