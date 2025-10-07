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
    
    // Extract error details if present
    const videoWithError = video as { 
      id: string; 
      status: string; 
      progress?: number;
      error?: { 
        code?: string; 
        message?: string;
        type?: string;
      };
    };
    
    return NextResponse.json({
      id: videoWithError.id,
      status: videoWithError.status,
      progress: videoWithError.progress || 0,
      error: videoWithError.error || undefined,
    });
  } catch (error) {
    console.error('Video status error:', error);
    const message = error instanceof Error ? error.message : 'Failed to get video status';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
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
    
    // Delete video
    const deletedVideo = await openai.videos.delete(id);
    
    return NextResponse.json({
      id: deletedVideo.id,
      deleted: true,
    });
  } catch (error) {
    console.error('Video delete error:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete video';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}