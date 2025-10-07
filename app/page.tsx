'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { calculateCost, VALID_DURATIONS, type ModelType, type Duration } from '@/lib/pricing';

export default function Home() {
  // API Key
  const [apiKey, setApiKey] = useState('');
  
  // Video generation form
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<ModelType>('sora-2');
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [size, setSize] = useState('1280x720');
  const [duration, setDuration] = useState<Duration>(8);
  
  // Available resolutions by orientation
  const resolutions = {
    horizontal: [
      { value: '1280x720', label: '720p (1280x720)' },
      { value: '1920x1080', label: '1080p (1920x1080)' },
      { value: '1792x1024', label: 'Cinematic (1792x1024)' },
    ],
    vertical: [
      { value: '720x1280', label: '720p (720x1280)' },
      { value: '1080x1920', label: '1080p (1080x1920)' },
      { value: '1024x1792', label: 'Cinematic (1024x1792)' },
    ],
  };
  
  // Update size when orientation changes
  useEffect(() => {
    if (orientation === 'horizontal') {
      setSize('1280x720');
    } else {
      setSize('720x1280');
    }
  }, [orientation]);
  const [generating, setGenerating] = useState(false);
  const [videoStatus, setVideoStatus] = useState<{ id: string; status: string; progress?: number } | null>(null);
  const [error, setError] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [estimatedDuration, setEstimatedDuration] = useState<number>(120); // Default 2 minutes
  const [totalSpent, setTotalSpent] = useState<number>(0);
  const [videoHistory, setVideoHistory] = useState<Array<{
    id: string;
    prompt: string;
    cost: number;
    timestamp: string;
  }>>([]);
  const [pastVideos, setPastVideos] = useState<Array<{
    id: string;
    status: string;
    created_at: number;
    model: string;
    prompt?: string;
    size?: string;
    seconds?: string;
    thumbnailUrl?: string;
  }>>([]);
  const [loadingPastVideos, setLoadingPastVideos] = useState(false);
  
  // Audio for completion notification
  const [audio] = useState(() => {
    if (typeof window !== 'undefined') {
      const sound = new Audio('/xylo_fx_11-37611.mp3');
      sound.volume = 0.5; // 50% volume
      return sound;
    }
    return null;
  });
  
  // Fetch past videos from OpenAI API
  const fetchPastVideos = useCallback(async () => {
    setLoadingPastVideos(true);
    try {
      const res = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, limit: 50 }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch videos');
      }
      
      const data = await res.json();
      // Filter only completed videos
      const completedVideos = data.data?.filter((v: { status: string }) => v.status === 'completed') || [];
      
      // Fetch thumbnails for each video
      const videosWithThumbnails = await Promise.all(
        completedVideos.map(async (video: typeof pastVideos[0]) => {
          try {
            const thumbRes = await fetch(`/api/download/${video.id}?variant=thumbnail`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ apiKey }),
            });
            
            if (thumbRes.ok) {
              const blob = await thumbRes.blob();
              const thumbnailUrl = URL.createObjectURL(blob);
              return { ...video, thumbnailUrl };
            }
          } catch (error) {
            console.error(`Failed to fetch thumbnail for ${video.id}:`, error);
          }
          return video;
        })
      );
      
      setPastVideos(videosWithThumbnails);
    } catch (error) {
      console.error('Error fetching past videos:', error);
    } finally {
      setLoadingPastVideos(false);
    }
  }, [apiKey]);
  
  // Load API key and spending data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('openai_api_key');
    if (saved) {
      setApiKey(saved);
    }
    
    const spentData = localStorage.getItem('total_spent');
    if (spentData) {
      setTotalSpent(parseFloat(spentData));
    }
    
    const historyData = localStorage.getItem('video_history');
    if (historyData) {
      setVideoHistory(JSON.parse(historyData));
    }
  }, []);
  
  // Fetch past videos from OpenAI when API key is available
  useEffect(() => {
    if (apiKey && apiKey.startsWith('sk-')) {
      fetchPastVideos();
    }
  }, [apiKey, fetchPastVideos]);
  
  // Auto-save API key on change
  useEffect(() => {
    if (apiKey && apiKey.startsWith('sk-')) {
      localStorage.setItem('openai_api_key', apiKey);
    }
  }, [apiKey]);
  
  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    
    if (!apiKey || !apiKey.startsWith('sk-')) {
      setError('Please enter a valid OpenAI API key (starts with "sk-")');
      return;
    }
    
    setGenerating(true);
    setStartTime(Date.now());
    
    // Estimate duration based on model (in seconds)
    const estimate = model === 'sora-2' ? 120 : 180; // 2-3 minutes
    setEstimatedDuration(estimate);
    
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt, 
          model, 
          size, 
          seconds: duration,
          apiKey 
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Generation failed');
      }
      
      setVideoStatus({ id: data.videoId, status: data.status });
      
      // Track cost
      const actualCost = estimatedCost / 2; // Actual OpenAI cost
      const newTotal = totalSpent + actualCost;
      setTotalSpent(newTotal);
      localStorage.setItem('total_spent', newTotal.toString());
      
      // Add to history
      const newHistory = [
        ...videoHistory,
        {
          id: data.videoId,
          prompt: prompt.substring(0, 50) + (prompt.length > 50 ? '...' : ''),
          cost: actualCost,
          timestamp: new Date().toISOString(),
        },
      ];
      setVideoHistory(newHistory);
      localStorage.setItem('video_history', JSON.stringify(newHistory));
      
      // Poll for video status
      pollVideoStatus(data.videoId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate video';
      setError(message);
      setGenerating(false);
    }
  }
  
  async function pollVideoStatus(videoId: string) {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/video/${videoId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey }),
        });
        const data = await res.json();
        
        setVideoStatus(data);
        
        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(interval);
          setGenerating(false);
          setStartTime(null);
          
          if (data.status === 'completed') {
            setError('');
            // Play completion sound
            if (audio) {
              audio.play().catch(err => console.log('Audio play failed:', err));
            }
            // Automatically download and show video
            downloadVideo(videoId);
          } else {
            setError('Video generation failed');
          }
        }
      } catch {
        clearInterval(interval);
        setGenerating(false);
        setError('Failed to check video status');
      }
    }, 3000);
  }
  
  async function downloadVideo(videoId: string) {
    setDownloading(true);
    try {
      const res = await fetch(`/api/download/${videoId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to download video');
      }
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download video for preview');
    } finally {
      setDownloading(false);
    }
  }
  
  async function loadPastVideo(video: typeof pastVideos[0]) {
    setVideoStatus({ id: video.id, status: video.status });
    await downloadVideo(video.id);
  }
  
  const resolution = size === '1280x720' ? '720p' : size === '1920x1080' ? '1080p' : '1792p';
  const estimatedCost = calculateCost(model, resolution, duration);
  
  // Calculate time remaining
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  
  useEffect(() => {
    if (!generating || !startTime) return;
    
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000; // seconds
      const remaining = Math.max(0, estimatedDuration - elapsed);
      
      const minutes = Math.floor(remaining / 60);
      const seconds = Math.floor(remaining % 60);
      
      if (remaining > 0) {
        setTimeRemaining(`~${minutes}:${seconds.toString().padStart(2, '0')} remaining`);
      } else {
        setTimeRemaining('Finalizing...');
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [generating, startTime, estimatedDuration]);
  
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-white">
                Sora Video Generator
              </h1>
              <p className="text-zinc-400">
                Create AI videos with OpenAI&apos;s Sora API • {' '}
                <a href="/terms" className="text-zinc-500 hover:text-zinc-400 underline text-sm">
                  Terms & Disclaimer
                </a>
              </p>
            </div>
            
            {/* Spending Counter */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-6 py-4 text-right">
              <div className="text-xs text-zinc-500 mb-1">Total Spent</div>
              <div className="text-3xl font-bold font-mono text-zinc-50">
                ${totalSpent.toFixed(4)}
              </div>
              <div className="text-xs text-zinc-500 mt-1">
                {videoHistory.length} video{videoHistory.length !== 1 ? 's' : ''}
              </div>
              {totalSpent > 0 && (
                <button
                  onClick={() => {
                    if (confirm('Reset spending counter?')) {
                      setTotalSpent(0);
                      setVideoHistory([]);
                      localStorage.removeItem('total_spent');
                      localStorage.removeItem('video_history');
                    }
                  }}
                  className="mt-2 text-xs text-zinc-600 hover:text-zinc-400 underline"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Progress Bar - Large at top when generating */}
        {generating && (
          <div className="mb-8 bg-zinc-900 border border-zinc-800 rounded-lg p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold mb-2 text-zinc-100">Generating Your Video</h2>
              <p className="text-sm text-zinc-400">{timeRemaining}</p>
            </div>
            
            <div className="space-y-4">
              {/* Progress Bar */}
              <div className="relative">
                <div className="w-full bg-zinc-950 border border-zinc-800 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-zinc-50 h-3 transition-all duration-300 ease-out"
                    style={{ width: `${videoStatus?.progress || 0}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-zinc-500">
                  <span>{videoStatus?.status || 'queued'}</span>
                  <span>{videoStatus?.progress || 0}%</span>
                </div>
              </div>
              
              {/* Video Info */}
              <div className="flex justify-center gap-6 text-sm text-zinc-400">
                <span>Model: <span className="text-zinc-300">{model}</span></span>
                <span>Duration: <span className="text-zinc-300">{duration}s</span></span>
                <span>
                  {orientation === 'horizontal' ? '📺 Horizontal' : '📱 Vertical'}
                </span>
                <span className="text-zinc-300">{size}</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Video Player */}
        {videoUrl && (
          <div className="mb-8 bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-zinc-100">Generated Video</h2>
              <div className="text-xs text-zinc-500 font-mono">{videoStatus?.id}</div>
            </div>
            <video 
              src={videoUrl} 
              controls 
              className={`rounded-lg bg-black border border-zinc-800 ${
                orientation === 'vertical' ? 'max-w-md mx-auto' : 'w-full'
              }`}
              autoPlay
              loop
            />
            <div className="mt-4 flex gap-3">
              <a
                href={videoUrl}
                download={`sora-video-${videoStatus?.id}.mp4`}
                className="flex-1 bg-zinc-50 hover:bg-zinc-200 text-zinc-950 font-semibold py-2.5 px-4 rounded-md transition-colors text-sm text-center"
              >
                Download MP4
              </a>
              <button
                onClick={() => {
                  setVideoUrl(null);
                  setVideoStatus(null);
                }}
                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors text-sm"
              >
                Generate Another
              </button>
            </div>
        </div>
        )}
        
        {/* Past Generations Grid */}
        {apiKey && apiKey.startsWith('sk-') && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-zinc-100">Past Generations</h2>
              <button
                onClick={fetchPastVideos}
                disabled={loadingPastVideos}
                className="text-sm text-zinc-400 hover:text-zinc-300 underline disabled:opacity-50"
              >
                {loadingPastVideos ? 'Loading...' : 'Refresh'}
              </button>
            </div>
            
            {loadingPastVideos && pastVideos.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
                <div className="animate-spin h-6 w-6 border-2 border-zinc-600 border-t-zinc-300 rounded-full mx-auto mb-3"></div>
                <p className="text-sm text-zinc-400">Loading your past videos...</p>
              </div>
            ) : pastVideos.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
                <p className="text-sm text-zinc-400">No past videos found. Generate your first video above!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {pastVideos.map((video) => (
                  <button
                    key={video.id}
                    onClick={() => loadPastVideo(video)}
                    className="bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-lg overflow-hidden text-left transition-all hover:scale-[1.02] group"
                  >
                    {/* Video Thumbnail */}
                    <div className="aspect-video bg-zinc-950 relative overflow-hidden border-b border-zinc-800 group-hover:border-zinc-700">
                      {video.thumbnailUrl ? (
                        <Image 
                          src={video.thumbnailUrl} 
                          alt={video.prompt || 'Video thumbnail'}
                          fill
                          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 16vw"
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg 
                            className="w-8 h-8 text-zinc-700 group-hover:text-zinc-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                          </svg>
                        </div>
                      )}
                      {/* Play overlay on hover */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                        <svg 
                          className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* Video Info */}
                    <div className="p-2.5 space-y-1">
                      {video.prompt && (
                        <p className="text-xs text-zinc-300 line-clamp-2 leading-snug mb-1">
                          {video.prompt}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                        <span className="font-mono">{video.model}</span>
                        {video.seconds && (
                          <>
                            <span>•</span>
                            <span>{video.seconds}s</span>
                          </>
                        )}
                      </div>
                      
                      <div className="text-[10px] text-zinc-600 font-mono">
                        {new Date(video.created_at * 1000).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - API Key & Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* API Key Input */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <label className="block text-sm font-medium mb-2 text-zinc-200">
                OpenAI API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-proj-..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2 text-zinc-50 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-700 text-sm"
              />
              <div className="mt-3 space-y-2 text-xs text-zinc-500">
                <p>
                  Your API key is stored locally in your browser and is never sent to our servers. 
                  We do not store, log, or have access to your API key.{' '}
                  <a 
                    href="https://platform.openai.com/api-keys" 
          target="_blank"
          rel="noopener noreferrer"
                    className="text-zinc-400 hover:text-zinc-300 underline"
                  >
                    Get API key
                  </a>
                </p>
                <p className="text-zinc-600 leading-relaxed">
                  <strong className="text-zinc-500">Disclaimer:</strong> This is a free playground tool. 
                  You are responsible for your own OpenAI API usage and costs. 
                  We provide no warranties and assume no liability for API usage, costs incurred, 
                  or content generated. By using this tool, you agree to OpenAI&apos;s terms of service 
                  and acceptable use policies. All content generation is subject to OpenAI&apos;s content policy.
                </p>
              </div>
            </div>
            
            {/* Video Generation Form */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-6 text-zinc-100">Generate Video</h2>
              
              <form onSubmit={handleGenerate} className="space-y-5">
                {/* Prompt */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-200">Prompt</label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="A serene sunset over calm ocean waters, golden hour lighting, cinematic wide shot"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-4 py-3 text-zinc-50 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-700 text-sm resize-none"
                    rows={3}
                    required
                  />
                </div>
                
                {/* Orientation */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-200">Orientation</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setOrientation('horizontal')}
                      className={`flex flex-col items-center justify-center py-4 px-3 rounded-md border transition-all ${
                        orientation === 'horizontal'
                          ? 'bg-zinc-50 text-zinc-950 border-zinc-50'
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <svg className="w-12 h-7 mb-2" fill="currentColor" viewBox="0 0 24 16">
                        <rect width="24" height="16" rx="2" />
                      </svg>
                      <span className="text-sm font-medium">Horizontal</span>
                      <span className="text-xs opacity-70">16:9 • YouTube, TV</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setOrientation('vertical')}
                      className={`flex flex-col items-center justify-center py-4 px-3 rounded-md border transition-all ${
                        orientation === 'vertical'
                          ? 'bg-zinc-50 text-zinc-950 border-zinc-50'
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <svg className="w-7 h-12 mb-2" fill="currentColor" viewBox="0 0 16 24">
                        <rect width="16" height="24" rx="2" />
                      </svg>
                      <span className="text-sm font-medium">Vertical</span>
                      <span className="text-xs opacity-70">9:16 • TikTok, Reels</span>
                    </button>
                  </div>
                </div>
                
                {/* Resolution */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-200">Resolution</label>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-700 text-sm"
                  >
                    {resolutions[orientation].map(res => (
                      <option key={res.value} value={res.value}>{res.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Model */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-200">Model</label>
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value as ModelType)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-700 text-sm"
                    >
                      <option value="sora-2">Sora 2 (Fast)</option>
                      <option value="sora-2-pro">Sora 2 Pro (Quality)</option>
                    </select>
                  </div>
                  
                  {/* Duration */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-200">Duration</label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value) as Duration)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-700 text-sm"
                    >
                      {VALID_DURATIONS.map(d => (
                        <option key={d} value={d}>{d} seconds</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Cost Estimate */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-md p-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-400">Estimated cost:</span>
                    <span className="font-mono font-semibold text-zinc-100">${(estimatedCost / 2).toFixed(4)}</span>
                  </div>
                </div>
                
                {/* Submit */}
                <button
                  type="submit"
                  disabled={generating || !prompt || !apiKey}
                  className="w-full bg-zinc-50 hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-zinc-950 font-semibold py-3 px-6 rounded-md transition-colors text-sm"
                >
                  {generating ? 'Generating...' : 'Generate Video'}
                </button>
              </form>
            </div>
          </div>
          
          {/* Right Column - Status & Info */}
          <div className="space-y-6">
            {/* Error */}
            {error && (
              <div className="bg-red-950 border border-red-900 rounded-lg p-4 text-red-200 text-sm">
                {error}
              </div>
            )}
            
            {/* Video Status */}
            {videoStatus && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <h3 className="text-sm font-semibold mb-4 text-zinc-100">Video Status</h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">Video ID</div>
                    <div className="font-mono text-xs bg-zinc-950 border border-zinc-800 rounded p-2 break-all text-zinc-300">
                      {videoStatus.id}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-zinc-500 mb-2">Status</div>
                    <div className="text-sm">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                        videoStatus.status === 'completed' ? 'bg-green-950 text-green-300 border border-green-900' :
                        videoStatus.status === 'failed' ? 'bg-red-950 text-red-300 border border-red-900' :
                        videoStatus.status === 'in_progress' ? 'bg-blue-950 text-blue-300 border border-blue-900' :
                        'bg-yellow-950 text-yellow-300 border border-yellow-900'
                      }`}>
                        {videoStatus.status}
                      </span>
                    </div>
                  </div>
                  
                  {videoStatus.progress != null && videoStatus.progress > 0 && videoStatus.status !== 'completed' && (
                    <div>
                      <div className="text-xs text-zinc-500 mb-2">Progress</div>
                      <div className="w-full bg-zinc-950 border border-zinc-800 rounded-full h-2">
                        <div
                          className="bg-zinc-50 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${videoStatus.progress}%` }}
                        />
                      </div>
                      <div className="text-center text-xs text-zinc-400 mt-1">{videoStatus.progress}%</div>
                    </div>
                  )}
                  
                  {videoStatus.status === 'completed' && downloading && (
                    <div className="mt-4 bg-zinc-950 border border-zinc-800 rounded-md p-4">
                      <div className="text-xs text-zinc-400 flex items-center gap-2">
                        <div className="animate-spin h-3 w-3 border border-zinc-600 border-t-zinc-300 rounded-full"></div>
                        Downloading video for preview...
                      </div>
                    </div>
                  )}
                  
                  {videoStatus.status === 'completed' && !downloading && (
                    <div className="mt-4 bg-green-950 border border-green-900 rounded-md p-4">
                      <div className="text-xs font-semibold text-green-300">
                        ✓ Video ready! Scroll up to watch.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Pricing Info */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h3 className="text-sm font-semibold mb-4 text-zinc-100">Pricing</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Sora 2 (720p)</span>
                  <span className="font-mono text-zinc-100">$0.10/min</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Sora 2 Pro (720p)</span>
                  <span className="font-mono text-zinc-100">$0.30/min</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Sora 2 Pro (1080p+)</span>
                  <span className="font-mono text-zinc-100">$0.50/min</span>
                </div>
                <div className="pt-3 mt-3 border-t border-zinc-800 text-xs text-zinc-500">
                  Charged to your OpenAI account
                </div>
              </div>
            </div>
            
            {/* Tips */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h3 className="text-sm font-semibold mb-3 text-zinc-100">Prompting Tips</h3>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li className="flex items-start gap-2">
                  <span className="text-zinc-600">•</span>
                  <span>Include shot type (wide, close-up, aerial)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-zinc-600">•</span>
                  <span>Describe lighting conditions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-zinc-600">•</span>
                  <span>Specify camera movement</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-zinc-600">•</span>
                  <span>Be specific about subject and action</span>
                </li>
              </ul>
            </div>
            
            {/* Video History */}
            {videoHistory.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <h3 className="text-sm font-semibold mb-3 text-zinc-100">Recent Videos</h3>
                <div className="space-y-2">
                  {videoHistory.slice(-5).reverse().map((video, idx) => (
                    <div key={idx} className="bg-zinc-950 border border-zinc-800 rounded-md p-3">
                      <div className="text-xs text-zinc-400 truncate mb-1">{video.prompt}</div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-600 font-mono">{video.id.substring(0, 20)}...</span>
                        <span className="font-mono text-zinc-300">${video.cost.toFixed(4)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer Disclaimer */}
        <div className="mt-12 pt-6 border-t border-zinc-800 text-center text-xs text-zinc-600 space-y-3">
          <p>
            This is an independent tool. Not affiliated with OpenAI. 
            By using this tool, you agree to our{' '}
            <a href="/terms" className="text-zinc-500 hover:text-zinc-400 underline">
              Terms & Disclaimer
            </a>.
          </p>
          <p>
            All API costs are charged directly by OpenAI to your account. 
            We do not store, process, or have access to your API keys or generated content.
          </p>
          <p className="flex items-center justify-center gap-3 flex-wrap">
            <a 
              href="https://www.kemenystudio.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-zinc-400 underline"
            >
              Built by Kemeny Studio
            </a>
            <span className="text-zinc-700">•</span>
            <a 
              href="https://github.com/KemenyStudio/sora-video-generator" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-zinc-400 underline flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </a>
            <span className="text-zinc-700">•</span>
            <a 
              href="https://github.com/KemenyStudio/sora-video-generator/fork" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-zinc-400 underline"
            >
              Fork
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}