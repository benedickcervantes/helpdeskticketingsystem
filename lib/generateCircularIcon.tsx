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
        }}
      >
        <img
          src={logoSrc}
          width={size}
          height={size}
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
