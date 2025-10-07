import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { toFile, type Uploadable } from 'openai/uploads';

// Supported file types - ONLY IMAGES (per OpenAI Sora API documentation)
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let prompt: string;
    let model: string;
    let size: string;
    let seconds: string | number;
    let apiKey: string;
    let referenceFile: File | null = null;

    // Handle both JSON and FormData
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      prompt = formData.get('prompt') as string;
      model = formData.get('model') as string;
      size = formData.get('size') as string;
      seconds = formData.get('seconds') as string;
      apiKey = formData.get('apiKey') as string;
      referenceFile = formData.get('referenceFile') as File | null;

      // Validate reference file if present
      if (referenceFile && referenceFile.size > 0) {
        const fileType = referenceFile.type;
        const fileSize = referenceFile.size;

        // Check file type - only images are supported
        const isImage = SUPPORTED_IMAGE_TYPES.includes(fileType);

        if (!isImage) {
          return NextResponse.json(
            { error: `Unsupported file type: ${fileType}. Only image references are supported: JPEG, PNG, WebP` },
            { status: 400 }
          );
        }

        // Check file size
        if (fileSize > MAX_IMAGE_SIZE) {
          const maxSizeMB = MAX_IMAGE_SIZE / (1024 * 1024);
          return NextResponse.json(
            { error: `File too large. Maximum size for images is ${maxSizeMB}MB` },
            { status: 400 }
          );
        }
      }
    } else {
      // Handle JSON request (backward compatibility)
      const body = await request.json();
      prompt = body.prompt;
      model = body.model;
      size = body.size;
      seconds = body.seconds;
      apiKey = body.apiKey;
    }
    
    // Validate inputs
    if (!prompt || !model || !size || !seconds || !apiKey) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Validate API key format
    if (!apiKey.startsWith('sk-')) {
      return NextResponse.json({ error: 'Invalid API key format' }, { status: 400 });
    }
    
    // Create OpenAI client with user's API key
    const openai = new OpenAI({ apiKey });
    
    // Prepare video generation parameters
    const videoParams: {
      model: string;
      prompt: string;
      size: string;
      seconds: string;
      input_reference?: Uploadable;
    } = {
      model,
      prompt,
      size,
      seconds: seconds.toString(),
    };

    // Add reference file if present
    if (referenceFile && referenceFile.size > 0) {
      // Convert File to OpenAI-compatible format
      const buffer = await referenceFile.arrayBuffer();
      const file = await toFile(Buffer.from(buffer), referenceFile.name, {
        type: referenceFile.type,
      });
      videoParams.input_reference = file;
    }
    
    // Generate video
    const video = await openai.videos.create(videoParams as Parameters<typeof openai.videos.create>[0]);
    
    return NextResponse.json({
      videoId: video.id,
      status: video.status,
    });
  } catch (error) {
    console.error('Generation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate video';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}