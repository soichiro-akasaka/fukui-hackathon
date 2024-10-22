import { NextRequest, NextResponse } from 'next/server';
import { KintoneRestAPIClient } from '@kintone/rest-api-client';

const kintoneClient = new KintoneRestAPIClient({
  baseUrl: 'https://hug-luma.cybozu.com',
  auth: {
    username: process.env.NEXT_PUBLIC_KINTONE_USERNAME,
    password: process.env.NEXT_PUBLIC_KINTONE_PASSWORD,
  },
});

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const name = formData.get('name') as string;
  const title = formData.get('title') as string;
  const comment = formData.get('comment') as string;
  const latitude = formData.get('latitude') as string;
  const longitude = formData.get('longitude') as string;
  const fileKey = formData.get('fileKey') as string;

  try {
    const response = await kintoneClient.record.addRecord({
      app: process.env.NEXT_PUBLIC_KINTONE_APP_ID as string,
      record: {
        name: { value: name },
        title: { value: title },
        comment: { value: comment },
        latitude: { value: latitude },
        longitude: { value: longitude },
        photo: { value: [{ fileKey }] },
      }
    });
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ error: "レコードの作成に失敗：" + String(error) }, { status: 500 });
  }
}