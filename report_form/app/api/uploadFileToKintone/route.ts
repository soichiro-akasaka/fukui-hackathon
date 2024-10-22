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
  const file = formData.get('file') as File;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const response = await kintoneClient.file.uploadFile({
      file: {
        name: file.name,
        data: Buffer.from(arrayBuffer),
      }
    });
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ error: "画像のアップロードに失敗：" + String(error) }, { status: 500 });
  }
}