import { generateCircularIcon } from '@/lib/generateCircularIcon';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default async function Icon() {
  return generateCircularIcon(32);
}
