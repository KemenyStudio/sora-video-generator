import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { toFile, type Uploadable } from 'openai/uploads';
import { createClient } from '@/lib/supabase/server';
import { calculateCost } from '@/lib/pricing';

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
    
    // Log usage to database if user is signed in
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Determine resolution from size
        const resolution = size === '1280x720' || size === '720x1280' 
          ? '720p' 
          : (size === '1920x1080' || size === '1080x1920' ? '1080p' : '1792p');
        
        // Validate duration (must be 4, 8, or 12)
        const validSeconds = Number(seconds);
        const duration = [4, 8, 12].includes(validSeconds) 
          ? (validSeconds as 4 | 8 | 12)
          : 8; // Default to 8 if invalid
        
        // Calculate cost
        const cost = calculateCost(
          model as 'sora-2' | 'sora-2-pro',
          resolution as '720p' | '1080p' | '1792p',
          duration
        );
        
        // Insert usage event (never store API keys)
        await supabase.from('usage_events').insert({
          user_id: user.id,
          video_id: video.id,
          model,
          resolution,
          seconds: validSeconds,
          cost_usd: cost,
          prompt,
        });
      }
    } catch (dbError) {
      // Log error but don't fail the request
      console.error('Failed to log usage to database:', dbError);
    }
    
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