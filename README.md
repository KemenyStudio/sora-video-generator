# 🎬 Sora Video Generator

A beautiful, simple web interface for generating AI videos with OpenAI's Sora API.

[![GitHub](https://img.shields.io/badge/GitHub-KemenyStudio/sora--video--generator-black?style=flat&logo=github)](https://github.com/KemenyStudio/sora-video-generator)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)
![License](https://img.shields.io/badge/license-MIT-green?style=flat)

**[🔗 View on GitHub](https://github.com/KemenyStudio/sora-video-generator)** • **[⭐ Star this repo](https://github.com/KemenyStudio/sora-video-generator)** • **[🍴 Fork it](https://github.com/KemenyStudio/sora-video-generator/fork)**

## ✨ Features

- 🎥 **Video Generation** - Sora 2 (fast) and Sora 2 Pro (quality) models
- 📺 **All Sora Resolutions** - 6 dimensions (horizontal & vertical)
- ⏱️ **Progress Tracking** - Real-time countdown and visual progress bar
- 💰 **Spending Counter** - Track your API costs automatically
- 🎬 **Integrated Player** - Watch generated videos in-browser with controls
- 📥 **Easy Download** - Save videos as MP4 with one click
- 📜 **Video History** - See your last 5 generations with costs
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
4. **Choose Orientation** → Horizontal (16:9) or Vertical (9:16)
5. **Select Resolution** → 720p, 1080p, or Cinematic
6. **Pick Model & Duration** → Sora 2 (fast) or Pro (quality)
7. **Generate** → See cost estimate, click button
8. **Watch Progress** → Countdown timer shows time remaining
9. **View Video** → Auto-plays when complete, download as MP4

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