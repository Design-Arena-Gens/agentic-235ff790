export type CaptionInput = {
  styleInstructions: string;
  brandColorHex?: string;
  watermarkText?: string;
};

function extractKeywords(text: string): string[] {
  const base = text.toLowerCase();
  const words = base.match(/[a-z0-9#@]+/g) || [];
  const stop = new Set(['the','and','with','for','this','that','from','into','your','our','of','to','a','an']);
  const filtered = words.filter(w => !stop.has(w) && w.length > 2);
  return Array.from(new Set(filtered)).slice(0, 12);
}

function pickEmojis(style: string): string[] {
  const s = style.toLowerCase();
  const list: string[] = [];
  if (/summer|sun|warm|golden|sunset/.test(s)) list.push('??','?');
  if (/cool|teal|aqua|fresh/.test(s)) list.push('??','??');
  if (/retro|vintage|film|grain/.test(s)) list.push('??','???');
  if (/lux|premium|elegant|minimal/.test(s)) list.push('??','??');
  if (/product|launch|drop|shop|store/.test(s)) list.push('???','?');
  if (list.length === 0) list.push('?','??');
  return Array.from(new Set(list)).slice(0, 4);
}

function makeHashtags(keywords: string[]): string[] {
  const base = keywords
    .map(k => k.replace(/[^a-z0-9]/g, ''))
    .filter(Boolean)
    .slice(0, 8)
    .map(k => `#${k}`);
  const evergreen = ['#instagood','#contentcreation','#branding','#socialmedia','#marketing'];
  const merged = Array.from(new Set([...base, ...evergreen]));
  return merged.slice(0, 15);
}

export function generateCaption(input: CaptionInput): string {
  const { styleInstructions, brandColorHex, watermarkText } = input;
  const keywords = extractKeywords(styleInstructions);
  const emojis = pickEmojis(styleInstructions);
  const tags = makeHashtags(keywords);
  const brandTone = brandColorHex ? ` in ${brandColorHex}` : '';

  const headline = `${emojis[0] || '?'} Fresh visual drop${brandTone}!`;
  const body = styleInstructions.trim() ? styleInstructions.trim() : 'Elevate your brand with standout visuals and consistent style.';
  const cta = 'Tap the link in bio to learn more.';
  const credit = watermarkText ? ` ${watermarkText}` : '';

  return [
    headline,
    '',
    body,
    '',
    `${emojis.join(' ')} ${cta}${credit}`,
    '',
    tags.join(' '),
  ].join('\n');
}
