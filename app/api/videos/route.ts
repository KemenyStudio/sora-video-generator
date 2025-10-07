import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { apiKey, limit, after } = await request.json();
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 400 });
    }
    
    // Create OpenAI client with user's API key
    const openai = new OpenAI({ apiKey });
    
    // List videos with pagination
    const response = await openai.videos.list({
      limit: limit || 20,
      ...(after && { after }),
    });
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Video list error:', error);
    const message = error instanceof Error ? error.message : 'Failed to list videos';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
