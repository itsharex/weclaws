import QRCode from 'qrcode';
import { z } from 'zod';

const querySchema = z.object({
  value: z.string().trim().min(1).max(4096),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    value: url.searchParams.get('value') ?? '',
  });

  if (!parsed.success) {
    return new Response('Invalid qrcode value.', {
      status: 400,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
      },
    });
  }

  const svg = await QRCode.toString(parsed.data.value, {
    margin: 1,
    type: 'svg',
    width: 280,
  });

  return new Response(svg, {
    status: 200,
    headers: {
      'cache-control': 'no-store',
      'content-type': 'image/svg+xml; charset=utf-8',
    },
  });
}
