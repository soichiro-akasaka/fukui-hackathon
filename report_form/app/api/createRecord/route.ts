import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const name = formData.get('name') as string;
  const title = formData.get('title') as string;
  const comment = formData.get('comment') as string;
  const latitude = formData.get('latitude') as string;
  const longitude = formData.get('longitude') as string;
  const fileKey = formData.get('fileKey') as string;

  try {
    const response = await fetch('https://hug-luma.cybozu.com/k/v1/record.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.KINTONE_API_KEY && { 'X-Cybozu-API-Token': process.env.KINTONE_API_KEY }),
      },
      body: JSON.stringify({
        app: process.env.KINTONE_APP_ID,
        record: {
          name: { value: name },
          title: { value: title },
          comment: { value: comment },
          latitude: { value: latitude },
          longitude: { value: longitude },
          photo: { value: [{ fileKey }] },
        },
      }),
    });
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ error: "レコードの作成に失敗：" + String(error) }, { status: 500 });
  }
}