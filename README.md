# Instagram Automation Agent

Web app to upload an image, apply brand/style enhancements, generate an optimized Instagram caption, and optionally post to Instagram via the Graph API using `/media` and `/media_publish`.

## Environment

- `BLOB_READ_WRITE_TOKEN`: Required for Vercel Blob uploads
- `IG_USER_ID`: Optional default IG Business user ID
- `IG_ACCESS_TOKEN`: Optional default long-lived access token with `instagram_basic`, `instagram_content_publish` permissions

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy

```bash
vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-235ff790
```

## Notes
- Images are processed transiently and uploaded as public blobs solely to satisfy Instagram Graph API requirements.
- If faces are present, edits preserve natural appearance and refrain from manipulative distortion.
- Images are cropped/resized to Instagram-friendly square (1080x1080) with brand background fill.
