import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { prompt, model, size, seconds, apiKey } = await request.json();
    
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
    
    // Generate video
    const video = await openai.videos.create({
      model,
      prompt,
      size,
      seconds: seconds.toString(),
    });
    
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