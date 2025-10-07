import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const variant = url.searchParams.get('variant') || 'video';
    const { apiKey } = await request.json();
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 400 });
    }
    
    // Create OpenAI client with user's API key
    const openai = new OpenAI({ apiKey });
    
    // Download video content with variant support
    const content = await openai.videos.downloadContent(id, { 
      variant: variant as 'video' | 'thumbnail' | 'spritesheet'
    });
    
    // Convert to buffer
    const arrayBuffer = await content.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Determine content type based on variant
    const contentType = variant === 'thumbnail' ? 'image/webp' : 
                       variant === 'spritesheet' ? 'image/jpeg' : 
                       'video/mp4';
    
    // Return content as binary with proper headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Video download error:', error);
    const message = error instanceof Error ? error.message : 'Failed to download video';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}