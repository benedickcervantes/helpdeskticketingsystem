import { ImageResponse } from 'next/og';
import { readFile } from 'fs/promises';
import path from 'path';

async function getLogoDataUrl(): Promise<string> {
  const logoPath = path.join(process.cwd(), 'public', 'FCDC LOGO.png');
  const logoData = await readFile(logoPath);
  return `data:image/png;base64,${logoData.toString('base64')}`;
}

export async function generateCircularIcon(size: number) {
  const logoSrc = await getLogoDataUrl();
  const padding = Math.max(2, Math.round(size * 0.1));
  const imageSize = size - padding * 2;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          borderRadius: '50%',
          overflow: 'hidden',
          padding,
        }}
      >
        <img
          src={logoSrc}
          width={imageSize}
          height={imageSize}
          style={{ objectFit: 'contain' }}
        />
      </div>
    ),
    {
      width: size,
      height: size,
    },
  );
}
