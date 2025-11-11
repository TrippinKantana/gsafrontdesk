import { NextRequest, NextResponse } from 'next/server';
import { UTApi } from 'uploadthing/server';

const utapi = new UTApi();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Upload to UploadThing using UTApi
    // Read the file buffer and create a proper File object
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Create a File object that UploadThing expects
    const fileForUpload = new File([buffer], file.name, {
      type: file.type,
      lastModified: file.lastModified || Date.now(),
    });

    const uploadResult = await utapi.uploadFiles(fileForUpload);

    if (!uploadResult || !uploadResult.url) {
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    return NextResponse.json({ url: uploadResult.url });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload photo' },
      { status: 500 }
    );
  }
}
