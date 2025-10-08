# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **Content Policy Disclaimers**: Clear warnings about OpenAI's prohibition on using images with identifiable faces as references
- Amber warning boxes in reference upload section and continuity tips
- Updated button tooltips with policy reminders
- Comprehensive policy guidelines in README
- Main disclaimer updated with content policy notice
- **Enhanced Error Reporting**: Display detailed error messages from OpenAI API including error codes, types, and specific failure reasons
- Error details panel in Video Status section shows error code and type
- Comprehensive console logging for debugging video generation failures
- **Video Deletion**: Delete videos directly from past generations grid with confirmation dialog
- Delete button on each past video thumbnail (🗑️ Delete)
- DELETE API endpoint for removing videos from OpenAI account
- Auto-removes deleted videos from UI and clears video player if currently shown
- **Queue System**: Batch multiple video generation jobs and process them automatically one at a time
- Queue panel with status tracking (pending, processing, completed, failed)
- "Add to Queue" and "Generate Now" buttons for flexible workflow
- Queue management: reorder (move up/down), remove items, clear completed
- Auto-show queue when items are added
- Persistent queue storage in localStorage (survives page refresh)
- Visual queue indicators: numbered items, status badges, progress spinners
- Queue statistics: pending count, processing count
- Automatic queue processor processes one job at a time
- Form clears automatically when adding to queue for quick batching
- **Reference Image Support**: Upload reference images to use as the first frame of videos using OpenAI's `input_reference` parameter
- **Automatic Image Resizing**: Reference images automatically resized to match selected video resolution (fixes dimension mismatch errors)
- **Video Frame Extraction**: Extract last frame from past videos to maintain continuity between generations
- "🖼️ Use Last Frame" button on each past video thumbnail
- Automatic video download, frame extraction, and conversion to JPEG reference
- Canvas-based frame extraction and high-quality image resizing
- Visual indicator when using extracted frame as reference (blue highlight)
- Shows target resolution in reference preview (e.g., "will auto-resize to 1280x720")
- Dynamic continuity tips that appear when using extracted frames
- Drag-and-drop file upload interface for images with visual feedback
- Preview component for uploaded reference images
- File type validation (JPEG, PNG, WebP only - per OpenAI API requirements)
- File size validation (10MB max for images)
- FormData support in backend API for multipart file uploads
- Clear/remove button for reference files
- Updated prompting tips to include guidance about reference images and continuity
- Support for both JSON and FormData request formats for backward compatibility
- Smooth scroll to form when selecting video frame as reference

### Fixed
- **CRITICAL: Fixed pricing structure** - Prices are per second ($0.10, $0.30, $0.50), not per minute as previously displayed
- Updated cost calculation to multiply seconds directly instead of converting to minutes
- Fixed displayed pricing units from "/min" to "/sec" throughout the UI
- Removed unnecessary markup multiplier since this is a direct API passthrough
- Removed erroneous division by 2 in cost tracking and display
- Removed `--turbopack` flag from production build script (was causing 404 on Vercel)
- Removed `vercel.json` to allow Vercel auto-detection of Next.js configuration

### Added
- **Past Generations Grid**: Fetch and display all completed videos from OpenAI API in a responsive grid layout
- New API endpoint `/api/videos` to list videos from OpenAI with pagination support
- **Real Video Thumbnails**: Automatically fetch and display actual thumbnails for each video using OpenAI's thumbnail variant
- Auto-fetch past videos when API key is entered
- Click on any past video to re-download and watch it in the player
- Displays video metadata: model, duration, creation date, and prompt
- Refresh button to manually reload past videos
- Responsive compact grid: 2 columns on mobile, 3 on tablet, 4 on desktop, 6 on large screens
- Hover effects with play icon overlay and darkened background on video thumbnails
- Loading state with spinner while fetching past videos
- Empty state when no videos are found

### Changed
- Videos now persist beyond local browser storage by fetching from OpenAI API
- Enhanced video history tracking with full OpenAI API integration
- Grid positioned directly below video player for more intuitive UX
- Download API endpoint now supports `variant` parameter (video, thumbnail, spritesheet)
- Optimized card layout with smaller text and compact spacing for better density

## [Initial Release]

### Features
- Video generation with Sora 2 and Sora 2 Pro models
- Support for all Sora resolutions (horizontal & vertical)
- Real-time progress tracking with countdown timer
- Spending counter to track API costs
- Integrated video player with download functionality
- Local video history (last 5 generations)
- Privacy-first: API keys stored locally only
- Clean dark UI inspired by Cursor IDE
- Comprehensive terms and disclaimers
