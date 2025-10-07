'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { calculateCost, VALID_DURATIONS, type ModelType, type Duration } from '@/lib/pricing';

// Queue item type
interface QueueItem {
  id: string;
  prompt: string;
  model: ModelType;
  size: string;
  duration: Duration;
  referenceFile: File | null;
  referenceVideoId: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoId?: string;
  error?: string;
  addedAt: number;
  completedAt?: number;
  cost: number;
}

export default function Home() {
  // API Key
  const [apiKey, setApiKey] = useState('');
  
  // Video generation form
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<ModelType>('sora-2');
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [size, setSize] = useState('1280x720');
  const [duration, setDuration] = useState<Duration>(8);
  
  // Reference file upload
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referencePreview, setReferencePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [referenceVideoId, setReferenceVideoId] = useState<string | null>(null);
  const [loadingReference, setLoadingReference] = useState(false);
  
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
  const [videoStatus, setVideoStatus] = useState<{ 
    id: string; 
    status: string; 
    progress?: number;
    error?: {
      code?: string;
      message?: string;
      type?: string;
    };
  } | null>(null);
  const [error, setError] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [estimatedDuration, setEstimatedDuration] = useState<number>(120); // Default 2 minutes
  
  // Queue management
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
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
    // Don't fetch if no API key
    if (!apiKey || !apiKey.startsWith('sk-')) {
      setPastVideos([]); // Clear past videos if no API key
      return;
    }
    
    setLoadingPastVideos(true);
    try {
      const res = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, limit: 50 }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('Failed to fetch videos:', errorData);
        // Silently fail - don't show error to user for optional feature
        setLoadingPastVideos(false);
        return;
      }
      
      const data = await res.json();
      
      // Log all videos for debugging
      console.log('All videos from API:', data.data?.length || 0);
      console.log('Videos:', data.data?.map((v: { id: string; status: string; prompt?: string }) => ({
        id: v.id.substring(0, 20) + '...',
        status: v.status,
        prompt: v.prompt?.substring(0, 30)
      })));
      
      // Filter only completed videos
      const completedVideos = data.data?.filter((v: { status: string }) => v.status === 'completed') || [];
      console.log('Completed videos:', completedVideos.length);
      
      // Fetch thumbnails for each video (non-blocking)
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
              if (blob && blob.size > 0) {
                const thumbnailUrl = URL.createObjectURL(blob);
                return { ...video, thumbnailUrl };
              } else {
                console.warn(`Empty thumbnail for ${video.id}`);
              }
            } else {
              const errorData = await thumbRes.json().catch(() => ({}));
              console.warn(`Thumbnail fetch failed for ${video.id}:`, thumbRes.status, errorData);
            }
          } catch (error) {
            console.error(`Failed to fetch thumbnail for ${video.id}:`, error);
          }
          // Return video without thumbnail if fetch fails
          return video;
        })
      );
      
      console.log('Videos with thumbnails:', videosWithThumbnails.length);
      setPastVideos(videosWithThumbnails);
    } catch (error) {
      console.error('Error fetching past videos:', error);
      // Silently fail - past videos is an optional feature
      setPastVideos([]); // Clear videos on error
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
    
    // Load queue (but don't load File objects - those can't be serialized)
    const queueData = localStorage.getItem('video_queue');
    if (queueData) {
      try {
        const loadedQueue: QueueItem[] = JSON.parse(queueData);
        // Filter out processing items (reset to pending) and remove reference files
        const cleanedQueue = loadedQueue
          .filter(item => item.status !== 'processing')
          .map(item => ({
            ...item,
            referenceFile: null, // Can't persist File objects
            status: item.status === 'processing' ? 'pending' as const : item.status,
          }));
        setQueue(cleanedQueue);
      } catch (e) {
        console.error('Failed to load queue:', e);
      }
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
  
  // Auto-save queue on change
  useEffect(() => {
    if (queue.length > 0) {
      // Save queue without File objects (they can't be serialized)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const serializableQueue = queue.map(({ referenceFile, ...item }) => item);
      localStorage.setItem('video_queue', JSON.stringify(serializableQueue));
    } else {
      localStorage.removeItem('video_queue');
    }
  }, [queue]);
  
  // Handle reference file upload
  const handleFileUpload = useCallback((file: File) => {
    // Validate file type - ONLY IMAGES ARE SUPPORTED
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (!imageTypes.includes(file.type)) {
      setError('Only image references are supported. Please upload JPEG, PNG, or WebP files.');
      return;
    }
    
    // Validate file size (10MB for images)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File too large. Maximum size is 10MB for images.');
      return;
    }
    
    setError('');
    setReferenceFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setReferencePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const clearReferenceFile = () => {
    setReferenceFile(null);
    setReferencePreview(null);
    setReferenceVideoId(null);
    setError('');
  };

  // Extract last frame from video as image reference
  const useVideoFrameAsReference = useCallback(async (videoId: string) => {
    setLoadingReference(true);
    setError('');
    
    try {
      // Download the video
      const res = await fetch(`/api/download/${videoId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to load video');
      }
      
      const blob = await res.blob();
      const videoUrl = URL.createObjectURL(blob);
      
      // Create video element to extract frame
      const video = document.createElement('video');
      video.src = videoUrl;
      video.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        video.onloadeddata = resolve;
        video.onerror = reject;
      });
      
      // Seek to last frame
      video.currentTime = video.duration - 0.1;
      
      await new Promise((resolve) => {
        video.onseeked = resolve;
      });
      
      // Extract frame to canvas
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');
      
      ctx.drawImage(video, 0, 0);
      
      // Convert to blob
      const imageBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.95);
      });
      
      // Convert to File
      const file = new File([imageBlob], `reference-frame-${videoId}.jpg`, { type: 'image/jpeg' });
      
      // Set as reference
      setReferenceFile(file);
      setReferenceVideoId(videoId);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(imageBlob);
      setReferencePreview(previewUrl);
      
      // Cleanup
      URL.revokeObjectURL(videoUrl);
      
      // Scroll to form
      document.querySelector('form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
    } catch (error) {
      console.error('Error extracting video frame:', error);
      setError('Failed to extract frame from video. Please try again.');
    } finally {
      setLoadingReference(false);
    }
  }, [apiKey]);

  // Add item to queue
  const addToQueue = useCallback(() => {
    if (!prompt) {
      setError('Please enter a prompt');
      return;
    }
    
    const queueItem: QueueItem = {
      id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      prompt,
      model,
      size,
      duration,
      referenceFile,
      referenceVideoId,
      status: 'pending',
      addedAt: Date.now(),
      cost: calculateCost(model, size === '1280x720' || size === '720x1280' ? '720p' : size === '1920x1080' || size === '1080x1920' ? '1080p' : '1792p', duration),
    };
    
    setQueue(prev => [...prev, queueItem]);
    setShowQueue(true); // Auto-show queue when adding items
    
    // Clear form
    setPrompt('');
    clearReferenceFile();
    
    // Start processing if not already
    if (!isProcessingQueue) {
      setIsProcessingQueue(true);
    }
  }, [prompt, model, size, duration, referenceFile, referenceVideoId, isProcessingQueue]);
  
  // Remove item from queue
  const removeFromQueue = useCallback((id: string) => {
    setQueue(prev => prev.filter(item => item.id !== id));
  }, []);
  
  // Move item in queue
  const moveQueueItem = useCallback((id: string, direction: 'up' | 'down') => {
    setQueue(prev => {
      const index = prev.findIndex(item => item.id === id);
      if (index === -1) return prev;
      
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      
      const newQueue = [...prev];
      [newQueue[index], newQueue[newIndex]] = [newQueue[newIndex], newQueue[index]];
      return newQueue;
    });
  }, []);
  
  // Clear completed items from queue
  const clearCompletedQueue = useCallback(() => {
    setQueue(prev => prev.filter(item => item.status !== 'completed' && item.status !== 'failed'));
  }, []);

  // Resize image to match target resolution
  const resizeImageToResolution = async (file: File, targetSize: string): Promise<File> => {
    const [targetWidth, targetHeight] = targetSize.split('x').map(Number);
    
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      img.onload = () => {
        // Set canvas to target dimensions
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        // Draw image scaled to canvas
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        
        // Convert to blob
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }
          
          const resizedFile = new File([blob], file.name, { type: 'image/jpeg' });
          resolve(resizedFile);
        }, 'image/jpeg', 0.95);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  // Process a single queue item
  const processQueueItem = useCallback(async (item: QueueItem) => {
    setGenerating(true);
    setStartTime(Date.now());
    
    // Estimate duration based on model
    const estimate = item.model === 'sora-2' ? 120 : 180;
    setEstimatedDuration(estimate);
    
    // Update item status to processing
    setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'processing' as const } : q));
    
    try {
      let res;
      
      // Use FormData if reference file is present
      if (item.referenceFile) {
        // Resize reference image
        let finalReferenceFile = item.referenceFile;
        try {
          finalReferenceFile = await resizeImageToResolution(item.referenceFile, item.size);
        } catch {
          throw new Error('Failed to resize reference image');
        }
        
        const formData = new FormData();
        formData.append('prompt', item.prompt);
        formData.append('model', item.model);
        formData.append('size', item.size);
        formData.append('seconds', item.duration.toString());
        formData.append('apiKey', apiKey);
        formData.append('referenceFile', finalReferenceFile);
        
        res = await fetch('/api/generate', {
          method: 'POST',
          body: formData,
        });
      } else {
        res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            prompt: item.prompt,
            model: item.model,
            size: item.size,
            seconds: item.duration,
            apiKey 
          }),
        });
      }
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Generation failed');
      }
      
      // Update queue item with video ID
      setQueue(prev => prev.map(q => q.id === item.id ? { ...q, videoId: data.videoId } : q));
      setVideoStatus({ id: data.videoId, status: data.status });
      
      // Track cost
      const newTotal = totalSpent + item.cost;
      setTotalSpent(newTotal);
      localStorage.setItem('total_spent', newTotal.toString());
      
      // Add to history
      const newHistory = [
        ...videoHistory,
        {
          id: data.videoId,
          prompt: item.prompt.substring(0, 50) + (item.prompt.length > 50 ? '...' : ''),
          cost: item.cost,
          timestamp: new Date().toISOString(),
        },
      ];
      setVideoHistory(newHistory);
      localStorage.setItem('video_history', JSON.stringify(newHistory));
      
      // Poll for video status with queue item reference
      await pollVideoStatus(data.videoId, item.id);
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate video';
      setQueue(prev => prev.map(q => q.id === item.id ? { 
        ...q, 
        status: 'failed' as const, 
        error: message,
        completedAt: Date.now(),
      } : q));
      setGenerating(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, totalSpent, videoHistory, resizeImageToResolution]);
  
  // Queue processor - processes one item at a time
  useEffect(() => {
    if (!isProcessingQueue || generating) return;
    
    const nextItem = queue.find(item => item.status === 'pending');
    if (nextItem) {
      processQueueItem(nextItem);
    } else {
      // No more items to process
      setIsProcessingQueue(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProcessingQueue, queue, generating]);

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
      let res;
      
      // Use FormData if reference file is present
      if (referenceFile) {
        // Resize reference image to match selected resolution
        let finalReferenceFile = referenceFile;
        try {
          finalReferenceFile = await resizeImageToResolution(referenceFile, size);
        } catch (resizeError) {
          console.error('Failed to resize image:', resizeError);
          setError('Failed to resize reference image. Please try again.');
          setGenerating(false);
          return;
        }
        
        const formData = new FormData();
        formData.append('prompt', prompt);
        formData.append('model', model);
        formData.append('size', size);
        formData.append('seconds', duration.toString());
        formData.append('apiKey', apiKey);
        formData.append('referenceFile', finalReferenceFile);
        
        res = await fetch('/api/generate', {
          method: 'POST',
          body: formData,
        });
      } else {
        // Use JSON for backward compatibility
        res = await fetch('/api/generate', {
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
      }
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Generation failed');
      }
      
      setVideoStatus({ id: data.videoId, status: data.status });
      
      // Track cost
      const actualCost = estimatedCost; // Direct OpenAI API cost
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
  
  async function pollVideoStatus(videoId: string, queueItemId?: string) {
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
          
          // Extract detailed error info if available
          let errorMessage = 'Video generation failed';
          if (data.error) {
            // OpenAI API returns error object with code and message
            const errorDetails = [];
            if (data.error.code) errorDetails.push(`Code: ${data.error.code}`);
            if (data.error.type) errorDetails.push(`Type: ${data.error.type}`);
            if (data.error.message) {
              errorMessage = data.error.message;
              if (errorDetails.length > 0) {
                errorMessage += ` (${errorDetails.join(', ')})`;
              }
            } else if (errorDetails.length > 0) {
              errorMessage = `Video generation failed - ${errorDetails.join(', ')}`;
            }
            console.error('Video generation error details:', {
              videoId,
              error: data.error,
              status: data.status,
            });
          }
          
          // Update queue item if it exists
          if (queueItemId) {
            setQueue(prev => prev.map(q => q.id === queueItemId ? {
              ...q,
              status: data.status === 'completed' ? 'completed' as const : 'failed' as const,
              completedAt: Date.now(),
              error: data.status === 'failed' ? errorMessage : undefined,
            } : q));
          }
          
          if (data.status === 'completed') {
            setError('');
            // Play completion sound
            if (audio) {
              audio.play().catch(err => console.log('Audio play failed:', err));
            }
            // Automatically download and show video (only for non-queue items or first in queue)
            if (!queueItemId || queue.length === 1) {
              downloadVideo(videoId);
            }
          } else {
            setError(errorMessage);
          }
        }
      } catch {
        clearInterval(interval);
        setGenerating(false);
        if (queueItemId) {
          setQueue(prev => prev.map(q => q.id === queueItemId ? {
            ...q,
            status: 'failed' as const,
            completedAt: Date.now(),
            error: 'Failed to check video status',
          } : q));
        }
        setError('Failed to check video status');
      }
    }, 3000);
  }
  
  async function downloadVideo(videoId: string) {
    setDownloading(true);
    setError(''); // Clear previous errors
    try {
      const res = await fetch(`/api/download/${videoId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Download failed:', errorData);
        throw new Error(errorData.error || `Failed to download video (${res.status})`);
      }
      
      const blob = await res.blob();
      
      // Check if we got a valid blob
      if (!blob || blob.size === 0) {
        throw new Error('Received empty video file');
      }
      
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      setVideoStatus({ id: videoId, status: 'completed' });
    } catch (error) {
      console.error('Download error for video', videoId, ':', error);
      const message = error instanceof Error ? error.message : 'Failed to download video';
      setError(`Failed to download video for preview: ${message}`);
    } finally {
      setDownloading(false);
    }
  }
  
  async function loadPastVideo(video: typeof pastVideos[0]) {
    console.log('Loading past video:', {
      id: video.id,
      status: video.status,
      hasPrompt: !!video.prompt,
      model: video.model
    });
    setVideoStatus({ id: video.id, status: video.status });
    setVideoUrl(null); // Clear previous video
    await downloadVideo(video.id);
  }
  
  // Delete video from OpenAI
  const deleteVideo = useCallback(async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video? This cannot be undone.')) {
      return;
    }
    
    try {
      const res = await fetch(`/api/video/${videoId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to delete video');
      }
      
      // Remove from past videos list
      setPastVideos(prev => prev.filter(v => v.id !== videoId));
      
      // Clear video player if this video is currently shown
      if (videoStatus?.id === videoId) {
        setVideoUrl(null);
        setVideoStatus(null);
      }
      
      console.log('Video deleted successfully:', videoId);
    } catch (error) {
      console.error('Delete error:', error);
      const message = error instanceof Error ? error.message : 'Failed to delete video';
      setError(`Failed to delete video: ${message}`);
    }
  }, [apiKey, videoStatus]);
  
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
        
        {/* Queue Panel */}
        {queue.length > 0 && (
          <div className="mb-8 bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-zinc-100">Generation Queue</h2>
                <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded">
                  {queue.filter(q => q.status === 'pending').length} pending
                </span>
                {queue.filter(q => q.status === 'processing').length > 0 && (
                  <span className="text-xs bg-blue-950 text-blue-300 px-2 py-1 rounded border border-blue-900">
                    {queue.filter(q => q.status === 'processing').length} processing
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={clearCompletedQueue}
                  className="text-xs text-zinc-500 hover:text-zinc-300 underline"
                >
                  Clear Completed
                </button>
                <button
                  onClick={() => setShowQueue(!showQueue)}
                  className="text-xs text-zinc-400 hover:text-zinc-200"
                >
                  {showQueue ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            
            {showQueue && (
              <div className="max-h-96 overflow-y-auto">
                {queue.map((item, index) => (
                  <div
                    key={item.id}
                    className={`p-4 border-b border-zinc-800 last:border-b-0 ${
                      item.status === 'processing' ? 'bg-zinc-950' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Queue Number */}
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-medium text-zinc-300">
                        {index + 1}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-200 mb-1 line-clamp-2">{item.prompt}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                          <span className="font-mono">{item.model}</span>
                          <span>•</span>
                          <span>{item.size}</span>
                          <span>•</span>
                          <span>{item.duration}s</span>
                          <span>•</span>
                          <span className="font-mono">${item.cost.toFixed(4)}</span>
                          {item.referenceVideoId && (
                            <>
                              <span>•</span>
                              <span className="text-blue-400">🖼️ Reference</span>
                            </>
                          )}
                        </div>
                        {item.error && (
                          <p className="text-xs text-red-400 mt-1">Error: {item.error}</p>
                        )}
                      </div>
                      
                      {/* Status Badge */}
                      <div className="flex-shrink-0">
                        {item.status === 'pending' && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-zinc-800 text-zinc-400 border border-zinc-700">
                            Pending
                          </span>
                        )}
                        {item.status === 'processing' && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-950 text-blue-300 border border-blue-900">
                            <div className="animate-spin h-3 w-3 border border-blue-400 border-t-transparent rounded-full mr-1.5"></div>
                            Processing
                          </span>
                        )}
                        {item.status === 'completed' && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-950 text-green-300 border border-green-900">
                            ✓ Completed
                          </span>
                        )}
                        {item.status === 'failed' && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-red-950 text-red-300 border border-red-900">
                            ✗ Failed
                          </span>
                        )}
                      </div>
                      
                      {/* Actions */}
                      {item.status === 'pending' && (
                        <div className="flex-shrink-0 flex gap-1">
                          <button
                            onClick={() => moveQueueItem(item.id, 'up')}
                            disabled={index === 0}
                            className="p-1 text-zinc-500 hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move up"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => moveQueueItem(item.id, 'down')}
                            disabled={index === queue.length - 1}
                            className="p-1 text-zinc-500 hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move down"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => removeFromQueue(item.id)}
                            className="p-1 text-zinc-500 hover:text-red-400"
                            title="Remove"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
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
            ) : loadingPastVideos ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
                <div className="animate-spin h-6 w-6 border-2 border-zinc-600 border-t-zinc-300 rounded-full mx-auto mb-3"></div>
                <p className="text-sm text-zinc-400">Refreshing videos...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {pastVideos.map((video) => (
                  <div
                    key={video.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden transition-all group"
                  >
                    {/* Video Thumbnail */}
                    <button
                      onClick={() => loadPastVideo(video)}
                      className="aspect-video bg-zinc-950 relative overflow-hidden border-b border-zinc-800 group-hover:border-zinc-700 w-full"
                    >
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
                    </button>
                    
                    {/* Video Info */}
                    <div className="p-2.5 space-y-2">
                      {video.prompt && (
                        <p className="text-xs text-zinc-300 line-clamp-2 leading-snug">
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
                      
                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-1.5">
                        {/* Use Last Frame as Reference Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // eslint-disable-next-line react-hooks/rules-of-hooks
                            useVideoFrameAsReference(video.id);
                          }}
                          disabled={loadingReference}
                          className="bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 text-zinc-300 hover:text-zinc-100 disabled:text-zinc-600 text-[10px] font-medium py-1.5 px-2 rounded transition-colors"
                          title="Extract last frame as image reference for continuity"
                        >
                          {loadingReference ? '...' : '🖼️ Frame'}
                        </button>
                        
                        {/* Delete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteVideo(video.id);
                          }}
                          className="bg-zinc-800 hover:bg-red-900 text-zinc-400 hover:text-red-300 text-[10px] font-medium py-1.5 px-2 rounded transition-colors"
                          title="Delete this video permanently"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
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
                
                {/* Reference Image/Video Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-200">
                    Reference Image <span className="text-zinc-500 font-normal">(Optional)</span>
                  </label>
                  
                  {!referencePreview ? (
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      className={`relative border-2 border-dashed rounded-md p-6 text-center transition-colors ${
                        isDragging
                          ? 'border-zinc-500 bg-zinc-900'
                          : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleFileInputChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={generating}
                      />
                      <div className="pointer-events-none">
                        <svg
                          className="mx-auto h-10 w-10 text-zinc-600 mb-3"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                          aria-hidden="true"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <p className="text-sm text-zinc-400 mb-1">
                          <span className="font-medium text-zinc-300">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-zinc-600">
                          JPEG, PNG, or WebP (max 10MB)
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">
                          Image will be used as the first frame of your video
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative bg-zinc-950 border border-zinc-800 rounded-md p-4">
                      <div className="flex items-start gap-4">
                        {/* Preview */}
                        <div className="flex-shrink-0">
                          <Image
                            src={referencePreview}
                            alt="Reference preview"
                            width={120}
                            height={120}
                            className="rounded object-cover"
                            unoptimized
                          />
                        </div>
                        
                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-zinc-300 font-medium truncate">
                            {referenceFile?.name}
                          </p>
                          <p className="text-xs text-zinc-500 mt-1">
                            {referenceFile && (referenceFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          {referenceVideoId ? (
                            <p className="text-xs text-blue-400 mt-1">
                              ✓ Using last frame from video (will auto-resize to {size})
                            </p>
                          ) : (
                            <p className="text-xs text-zinc-600 mt-1">
                              Will be resized to {size} and used as first frame
                            </p>
                          )}
                        </div>
                        
                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={clearReferenceFile}
                          className="flex-shrink-0 text-zinc-500 hover:text-zinc-300 transition-colors"
                          disabled={generating}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-zinc-500 mt-2">
                    Upload an image to use as the first frame of your video. Image will be automatically resized to match your selected resolution.
                  </p>
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
                    <span className="font-mono font-semibold text-zinc-100">${estimatedCost.toFixed(4)}</span>
                  </div>
                </div>
                
                {/* Submit Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={addToQueue}
                    disabled={!prompt || !apiKey}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 disabled:text-zinc-600 disabled:cursor-not-allowed text-zinc-100 font-semibold py-3 px-6 rounded-md transition-colors text-sm border border-zinc-700"
                  >
                    Add to Queue
                  </button>
                  <button
                    type="submit"
                    disabled={generating || !prompt || !apiKey}
                    className="w-full bg-zinc-50 hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-zinc-950 font-semibold py-3 px-6 rounded-md transition-colors text-sm"
                  >
                    {generating ? 'Generating...' : 'Generate Now'}
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          {/* Right Column - Status & Info */}
          <div className="space-y-6">
            {/* Error */}
            {error && (
              <div className="bg-red-950 border border-red-900 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className="text-red-200 text-sm">{error}</p>
                  </div>
                  {error.includes('Failed to download video') && videoStatus?.id && (
                    <button
                      onClick={() => downloadVideo(videoStatus.id)}
                      className="flex-shrink-0 text-xs text-red-300 hover:text-red-100 underline"
                    >
                      Retry
                    </button>
                  )}
                </div>
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
                  
                  {videoStatus.status === 'failed' && videoStatus.error && (
                    <div>
                      <div className="text-xs text-zinc-500 mb-2">Error Details</div>
                      <div className="bg-red-950 border border-red-900 rounded-md p-3">
                        <p className="text-xs text-red-200 mb-2">
                          {videoStatus.error.message || 'Video generation failed'}
                        </p>
                        {(videoStatus.error.code || videoStatus.error.type) && (
                          <div className="flex gap-2 text-[10px] text-red-400">
                            {videoStatus.error.code && (
                              <span className="bg-red-900/50 px-2 py-0.5 rounded">
                                Code: {videoStatus.error.code}
                              </span>
                            )}
                            {videoStatus.error.type && (
                              <span className="bg-red-900/50 px-2 py-0.5 rounded">
                                Type: {videoStatus.error.type}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
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
                  <span className="font-mono text-zinc-100">$0.10/sec</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Sora 2 Pro (720p)</span>
                  <span className="font-mono text-zinc-100">$0.30/sec</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Sora 2 Pro (1080p+)</span>
                  <span className="font-mono text-zinc-100">$0.50/sec</span>
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
                <li className="flex items-start gap-2">
                  <span className="text-zinc-600">•</span>
                  <span>Use reference images as the first frame of your video</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">🖼️</span>
                  <span className="text-blue-400">Extract last frame from videos to maintain continuity</span>
                </li>
              </ul>
              
              {referenceVideoId && (
                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <p className="text-xs font-semibold text-zinc-200 mb-2">Continuity Tips:</p>
                  <ul className="space-y-1.5 text-xs text-zinc-500">
                    <li>• Start your prompt with what happens next</li>
                    <li>• Example: &quot;The person turns around and walks forward&quot;</li>
                    <li>• Maintain consistent time of day and lighting</li>
                    <li>• The last frame becomes your first frame</li>
                  </ul>
                </div>
              )}
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