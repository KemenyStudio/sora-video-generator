import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { apiKey } = await request.json();
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 400 });
    }
    
    // Create OpenAI client with user's API key
    const openai = new OpenAI({ apiKey });
    
    // Get video status
    const video = await openai.videos.retrieve(id);
    
    return NextResponse.json({
      id: video.id,
      status: video.status,
      progress: (video as { progress?: number }).progress || 0,
    });
  } catch (error) {
    console.error('Video status error:', error);
    const message = error instanceof Error ? error.message : 'Failed to get video status';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}