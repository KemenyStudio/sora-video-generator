# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

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
