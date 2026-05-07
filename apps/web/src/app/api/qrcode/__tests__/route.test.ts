import { beforeEach, describe, expect, it, vi } from 'vitest';

const toStringMock = vi.fn();

vi.mock('qrcode', () => ({
  default: {
    toString: toStringMock,
  },
}));

describe('/api/qrcode route', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('returns 400 when value is missing', async () => {
    const { GET } = await import('../route');
    const response = await GET(new Request('http://localhost/api/qrcode'));

    expect(response.status).toBe(400);
    await expect(response.text()).resolves.toBe('Invalid qrcode value.');
  });

  it('returns an svg QR image for a valid value', async () => {
    toStringMock.mockResolvedValue('<svg>qr</svg>');

    const { GET } = await import('../route');
    const response = await GET(
      new Request(
        'http://localhost/api/qrcode?value=https%3A%2F%2Fliteapp.weixin.qq.com%2Fq%2F7GiQu1%3Fqrcode%3Dabc%26bot_type%3D3'
      )
    );

    expect(toStringMock).toHaveBeenCalledWith(
      'https://liteapp.weixin.qq.com/q/7GiQu1?qrcode=abc&bot_type=3',
      expect.objectContaining({
        margin: 1,
        type: 'svg',
        width: 280,
      })
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('image/svg+xml');
    await expect(response.text()).resolves.toBe('<svg>qr</svg>');
  });
});
