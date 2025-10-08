# 🎬 Sora Video Generator

A beautiful, simple web interface for generating AI videos with OpenAI's Sora API.

[![GitHub](https://img.shields.io/badge/GitHub-KemenyStudio/sora--video--generator-black?style=flat&logo=github)](https://github.com/KemenyStudio/sora-video-generator)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)
![License](https://img.shields.io/badge/license-MIT-green?style=flat)

**[🔗 View on GitHub](https://github.com/KemenyStudio/sora-video-generator)** • **[⭐ Star this repo](https://github.com/KemenyStudio/sora-video-generator)** • **[🍴 Fork it](https://github.com/KemenyStudio/sora-video-generator/fork)**

## ✨ Features

- 🎥 **Video Generation** - Sora 2 (fast) and Sora 2 Pro (quality) models
- 📋 **Queue System** - Batch multiple jobs, process automatically one at a time
- 🖼️ **Reference Input** - Upload images to guide generation as first frame
- 🎬 **Frame Extraction** - Extract last frame from videos for perfect continuity
- 📺 **All Sora Resolutions** - 6 dimensions (horizontal & vertical)
- ⏱️ **Progress Tracking** - Real-time countdown and visual progress bar
- 💰 **Spending Counter** - Track your API costs automatically
- 🎬 **Integrated Player** - Watch generated videos in-browser with controls
- 📥 **Easy Download** - Save videos as MP4 with one click
- 📜 **Video History** - See your past generations with thumbnails
- 🗑️ **Delete Videos** - Remove videos from your OpenAI account with one click
- 🔒 **Privacy First** - API keys stored locally, never on servers
- 🎨 **Clean UI** - Shadcn-inspired black & white design
- ⚖️ **Legal Protection** - Comprehensive terms and disclaimers

---

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📱 How to Use

1. **Get API Key** → https://platform.openai.com/api-keys
2. **Enter API Key** → Paste in the app (stored locally)
3. **Write Prompt** → "A sunset over the ocean, cinematic wide shot"
4. **Upload Reference (Optional)** → Add image or video to guide the style
5. **Choose Orientation** → Horizontal (16:9) or Vertical (9:16)
6. **Select Resolution** → 720p, 1080p, or Cinematic
7. **Pick Model & Duration** → Sora 2 (fast) or Pro (quality)
8. **Generate** → See cost estimate, click button
9. **Watch Progress** → Countdown timer shows time remaining
10. **View Video** → Auto-plays when complete, download as MP4

---

## 📺 Supported Resolutions

### Horizontal (16:9) - Landscape
- **720p**: 1280x720 - YouTube, web videos
- **1080p**: 1920x1080 - HD content
- **Cinematic**: 1792x1024 - Widescreen

### Vertical (9:16) - Portrait
- **720p**: 720x1280 - TikTok, Instagram Reels
- **1080p**: 1080x1920 - High-quality mobile
- **Cinematic**: 1024x1792 - Vertical cinematic

**All 6 resolutions supported!**

---

## 📋 Queue System - Batch Video Generation

Generate multiple videos without waiting! The queue processes jobs automatically one at a time.

### How to Use

1. **Add Jobs to Queue**:
   - Fill out your prompt, settings, and optional reference
   - Click **"Add to Queue"** (form clears for next job)
   - Repeat to add multiple jobs

2. **Automatic Processing**:
   - Queue starts processing automatically
   - Jobs process one at a time (prevents API rate limits)
   - Watch progress in real-time

3. **Manage Queue**:
   - **Reorder**: Move jobs up/down with arrow buttons
   - **Remove**: Delete unwanted jobs (X button)
   - **Clear Completed**: Remove finished jobs to clean up

### Queue Features

- **Status Tracking**: See pending, processing, completed, failed states
- **Persistent**: Queue survives page refresh (saved in localStorage)
- **Visual Feedback**: Progress spinners, status badges, numbered items
- **Cost Preview**: See estimated cost for each queued job
- **Reference Support**: Each job can have its own reference image

### Example Workflow

```
1. Add to Queue: "A sunrise over mountains"
2. Add to Queue: "A sunset over the ocean"
3. Add to Queue: "Stars in the night sky"
→ All three process automatically, one after another!
```

### When to Use Queue vs Generate Now

- **Use Queue**: When you have multiple videos to create
- **Generate Now**: When you need just one video immediately

---

## 🖼️ Reference Image Support

Upload reference images to use as the first frame of your video:

### Supported Formats
- **Images Only**: JPEG, PNG, WebP (max 10MB)
- **Important**: Video references are not supported by OpenAI's Sora API

### How It Works
1. Upload a reference image (optional)
2. The image becomes the **first frame** of your generated video
3. Your prompt describes what happens after that first frame
4. The AI maintains visual consistency from your reference

### Use Cases
- Start with a specific scene or composition
- Maintain consistent character appearance
- Use brand assets or specific environments
- Control the exact starting point of your video
- Ensure specific framing and composition

### Important Notes
- **Images are automatically resized** to match your selected resolution
- The image sets the visual style, colors, and composition
- Your prompt controls the action and camera movement
- High-quality resizing maintains image quality

### ⚠️ Content Policy Requirements
**OpenAI strictly prohibits reference images containing:**
- Identifiable faces or people
- Images where faces are clearly visible
- Personal photos of individuals

**Allowed reference images:**
- Landscapes and environments
- Objects and products
- Animals and nature
- Abstract patterns and textures
- Architectural elements
- Scenes with people where faces are not visible or identifiable

**Violation consequences:**
- Your generation will fail with a content policy error
- Repeated violations may result in API access restrictions
- Always review OpenAI's usage policies before uploading references

---

## 🎬 Video Continuity & Long-Form Content

Create longer videos by extracting frames and chaining generations:

### How It Works
1. Generate your first video (e.g., "A person walking into a room")
2. Click **"🖼️ Use Last Frame"** on the video thumbnail
3. The last frame is extracted and loaded as an image reference
4. Write what happens next (e.g., "The person sits down at the table")
5. Generate - the new video starts where the last one ended

### Frame Extraction
- Automatically extracts the last frame (0.1s before end)
- Converts to JPEG at original video resolution
- Uses as reference image for next generation
- Maintains perfect visual continuity

### ⚠️ Important: People in Frames
**Do not extract frames containing identifiable faces.** OpenAI's content policy prohibits using images of people's faces as references. Only extract and use frames that:
- Show environments, landscapes, or objects
- Contain people where faces are not visible (back views, silhouettes, distant shots)
- Focus on non-human subjects

Frames with visible faces will cause your next generation to fail with a content policy violation error.

### Continuity Prompting Tips
- **Start with action**: "The person turns around and smiles"
- **Don't use "continue"**: The frame already provides continuity
- Maintain consistent time of day and lighting
- Chain multiple videos to create 30s, 60s, or longer sequences

### Example Workflow
1. **Video 1 (8s)**: "A detective enters a dimly lit office, golden hour"
2. **Extract last frame** → Use as reference
3. **Video 2 (8s)**: "The detective walks to the desk and opens a drawer"
4. **Extract last frame** → Use as reference
5. **Video 3 (8s)**: "The detective pulls out an old photograph and examines it"
6. **Result**: 24-second continuous narrative with perfect visual consistency!

---

## 💰 Pricing

Users pay OpenAI directly (no markup):

| Model | Resolution | Price |
|-------|------------|-------|
| Sora 2 | Any | $0.10/min |
| Sora 2 Pro | 720p | $0.30/min |
| Sora 2 Pro | 1080p+ | $0.50/min |

**Example**: 8-second horizontal video @ Sora 2 = ~$0.013

---

## 🔒 Privacy & Security

### Your API Key:
- ✅ Stored in browser localStorage only
- ✅ Never sent to our servers
- ✅ Never logged or monitored
- ✅ You control it completely

### What We Don't Collect:
- ❌ API keys
- ❌ Generated videos
- ❌ Prompts or content
- ❌ Personal information
- ❌ Usage patterns

### Your Responsibility:
- Your API key security
- Your OpenAI account costs
- Compliance with OpenAI's terms
- Content you generate

See `/terms` for full legal disclaimer.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **API**: OpenAI Sora
- **Deployment**: Vercel-ready

---

## 📊 Features in Detail

### Progress Tracking
- Live countdown timer (minutes:seconds remaining)
- Visual progress bar (0-100%)
- Status updates (queued, in_progress, completed)
- Estimated time based on model (Sora 2: ~2min, Pro: ~3min)

### Spending Counter
- Real-time cost tracking
- Running total displayed prominently
- Video count tracker
- Reset option with confirmation
- Persists across sessions

### Video History
- Last 5 generated videos
- Shows prompt, video ID, and cost
- Stored in localStorage
- Helps track spending patterns

---

## 🎨 UI Design

Clean, professional interface inspired by shadcn/ui:
- **Background**: Zinc-950 (near black)
- **Cards**: Zinc-900 with subtle borders
- **Text**: White to gray hierarchy
- **Accents**: Minimal status colors
- **Responsive**: Works on all screen sizes

---

## 🚀 Deployment

This app is **deployment-ready** with:
- ✅ Zero environment variables required
- ✅ Vercel-optimized configuration
- ✅ Production build tested
- ✅ All dependencies included

Simply push to GitHub and deploy to Vercel or any Next.js hosting platform.

---

## 📖 Documentation

### User-Facing:
- **Main App**: `/` - Video generation interface
- **Terms**: `/terms` - Legal disclaimers and privacy policy

### Developer:
- **This README**: Project overview
- **Code Comments**: Inline documentation

---

## ⚖️ Legal

- Comprehensive terms of use at `/terms`
- Clear disclaimers throughout UI
- User responsibility for API usage
- No warranties or liabilities
- Privacy-focused design

---

## 🎯 Perfect For

- Personal video generation playground
- Testing Sora API capabilities
- Creating content for social media
- Prototyping video ideas
- Learning Sora API integration

---

## 🔧 Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type check
npm run type-check

# Lint
npm run lint
```

---

## 📚 Learn More

- [Sora API Documentation](https://platform.openai.com/docs/api-reference/videos)
- [Sora Prompting Guide](https://cookbook.openai.com/examples/sora/sora2_prompting_guide)
- [Next.js Documentation](https://nextjs.org/docs)
- [OpenAI Platform](https://platform.openai.com)

---

## 📄 License

MIT License - see LICENSE file for details.

---

## 🆘 Support

For issues or questions:
1. Check the app's Terms page (`/terms`)
2. Review OpenAI's Sora documentation
3. Verify your API key has Sora access
4. Check OpenAI account has available credits

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
- 🐛 Report bugs or issues
- 💡 Suggest new features
- 🔧 Submit pull requests
- ⭐ Star the repository
- 🍴 Fork and customize

**[View on GitHub →](https://github.com/KemenyStudio/sora-video-generator)**

---

## 🙏 Credits

Built with:
- [Next.js](https://nextjs.org)
- [Tailwind CSS](https://tailwindcss.com)
- [OpenAI Sora API](https://platform.openai.com)

Created by [Kemeny Studio](https://www.kemenystudio.com/) • [GitHub](https://github.com/KemenyStudio)

---

**Generate stunning AI videos in seconds!** 🎬✨

**[⭐ Star on GitHub](https://github.com/KemenyStudio/sora-video-generator)** • **[🍴 Fork it](https://github.com/KemenyStudio/sora-video-generator/fork)**