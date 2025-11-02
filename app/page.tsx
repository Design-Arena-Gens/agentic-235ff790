"use client";
import { useState } from 'react';

export default function Page() {
  const [file, setFile] = useState<File | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [style, setStyle] = useState("");
  const [brandColor, setBrandColor] = useState("#5dd2ff");
  const [watermarkText, setWatermarkText] = useState("");
  const [postToInstagram, setPostToInstagram] = useState(true);
  const [igUserId, setIgUserId] = useState("");
  const [igAccessToken, setIgAccessToken] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setStatus("Please select an image to upload."); return; }
    setLoading(true);
    setStatus("Processing...");

    const form = new FormData();
    form.set('image', file);
    if (logo) form.set('logo', logo);
    form.set('style', style);
    form.set('brandColor', brandColor);
    form.set('watermarkText', watermarkText);
    form.set('postToInstagram', postToInstagram ? 'true' : 'false');
    if (igUserId) form.set('igUserId', igUserId);
    if (igAccessToken) form.set('igAccessToken', igAccessToken);

    try {
      const res = await fetch('/api/process', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setResult(data);
      setStatus("Done");
    } catch (err: any) {
      setStatus(err.message || 'Something went wrong');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <h1>Instagram Automation Agent</h1>
      <p className="help">Upload an image, describe your style, and optionally auto-post to Instagram.</p>

      <form onSubmit={onSubmit} className="card" encType="multipart/form-data">
        <section className="row">
          <div>
            <label>Upload Image</label>
            <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} required />
            <div className="help">Images are processed transiently and not stored long-term.</div>
          </div>
          <div>
            <label>Brand Logo (optional)</label>
            <input type="file" accept="image/*" onChange={e => setLogo(e.target.files?.[0] || null)} />
            <div className="help">Overlay as watermark in a corner.</div>
          </div>
        </section>

        <section className="row">
          <div>
            <label>Style Instructions</label>
            <textarea value={style} onChange={e => setStyle(e.target.value)} placeholder="e.g., cool teal tone, product focus, soft vignette, subtle grain" rows={4}></textarea>
          </div>
          <div>
            <label>Brand Color</label>
            <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} />
            <label>Watermark Text (optional)</label>
            <input value={watermarkText} onChange={e => setWatermarkText(e.target.value)} placeholder="@yourbrand" />
          </div>
        </section>

        <section>
          <label><input type="checkbox" checked={postToInstagram} onChange={e => setPostToInstagram(e.target.checked)} /> Post to Instagram</label>
          <div className="row">
            <div>
              <label>Instagram Business User ID (optional override)</label>
              <input value={igUserId} onChange={e => setIgUserId(e.target.value)} placeholder="1784..." />
            </div>
            <div>
              <label>Instagram Access Token (optional override)</label>
              <input value={igAccessToken} onChange={e => setIgAccessToken(e.target.value)} placeholder="EAAG..." />
            </div>
          </div>
          <div className="help">Uses Graph API /media then /media_publish. Ensure token has permissions and account is Business.</div>
        </section>

        <section style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button className="primary" disabled={loading}>{loading ? 'Working...' : 'Generate & (Optional) Post'}</button>
          {status && <span className={status === 'Done' ? 'success' : status.includes('Fail') || status.includes('wrong') ? 'error' : 'badge'}>{status}</span>}
        </section>
      </form>

      {result && (
        <section className="row" style={{ marginTop: 20 }}>
          <div className="card">
            <h3>Preview</h3>
            <div className="preview">
              <img src={result.imageUrl} alt="Processed" style={{ maxWidth: '100%', borderRadius: 8 }} />
            </div>
            <div style={{ marginTop: 8 }}>
              <a className="badge" href={result.imageUrl} target="_blank" rel="noreferrer">Open original image URL</a>
            </div>
          </div>
          <div className="card">
            <h3>Caption</h3>
            <textarea value={result.caption} readOnly rows={12} />
            {result.instagram && (
              <div style={{ marginTop: 8 }}>
                {result.instagram.success ? (
                  <div>
                    <div className="success">Posted to Instagram successfully.</div>
                    {result.instagram.permalink && (
                      <a className="badge" href={result.instagram.permalink} target="_blank" rel="noreferrer">View Instagram Post</a>
                    )}
                  </div>
                ) : (
                  <div className="error">Instagram post failed: {result.instagram.error}</div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      <hr />
      <p className="help">We respect privacy: faces are preserved naturally and no personal data is stored beyond transient processing needed to fulfill your request.</p>
    </div>
  );
}
