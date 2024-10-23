import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Ensure content type is multipart/form-data
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: "Content-Type must be multipart/form-data" }, { status: 400 });
    }

    // Convert request to formData
    const formData = await req.formData();
    const file = formData.get('file') as File;

    // Check if the file exists
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Prepare formData for Kintone
    const kintoneFormData = new FormData();
    kintoneFormData.append('file', file);

    const KINTONE_API_KEY = process.env.KINTONE_API_KEY; // Secure server-side environment variable

    // Check if API token is defined
    if (!KINTONE_API_KEY) {
      throw new Error("KINTONE_API_KEY is not defined");
    }

    // Upload file to Kintone
    const response = await fetch('https://hug-luma.cybozu.com/k/v1/file.json', {
      method: 'POST',
      headers: {
        'X-Cybozu-API-Token': KINTONE_API_KEY
      },
      body: kintoneFormData
    });

    // Check if the response is OK
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: "Failed to upload image to Kintone", details: errorData }, { status: 500 });
    }

    const result = await response.json();

    return NextResponse.json({ fileKey: result.fileKey });

  } catch (error) {
    // Return detailed error message
    return NextResponse.json({ error: "画像のアップロードに失敗：" + String(error) }, { status: 500 });
  }
}
