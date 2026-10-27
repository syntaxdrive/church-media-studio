# Church Media Studio

> **An open source offline production suite engineered for Sunday church media teams.**  
> *Built with dedication by Phosters Ministries.*

Church Media Studio is a lightweight, zero dependency, client side software suite built to solve the high pressure workflow church creative teams face every Sunday afternoon. It replaces heavy, expensive creative software subscriptions with fast tools that run completely offline on laptop battery power.

---

## The Sunday Reality & Why This Exists

In many churches across the world (particularly in resource constrained environments or regions with limited internet bandwidth):
1. **The Generator Countdown:** Church generators are often shut down thirty minutes after benediction concludes. Media teams cannot wait on cloud queues or slow online web converters.
2. **Congested Church WiFi:** With hundreds of attendees using phone data, church internet connections are frequently overloaded post service.
3. **Heavy Raw Media:** Photographers produce hundreds of twenty megabyte camera shots, while sound desks output five hundred megabyte uncompressed audio recordings.
4. **Volunteer Teams:** Media departments rely on volunteers and students who need fast, foolproof tools that require zero graphic design training.

Church Media Studio processes everything **one hundred percent client side** in the browser or via a standalone desktop executable. No server uploads. No monthly fees. No internet connection required.

---

## The Three Production Engines

### 1. Batch Photo Watermark & Fast Social Sizer
* Drop in fifty to two hundred high resolution camera photos directly from memory cards.
* Automatic resize to 2048px (the optimal upload standard for WhatsApp, Facebook, and Instagram).
* Intelligent face protection that automatically flips your watermark away from detected subject faces.
* Instant offline ZIP archive creation via pure JavaScript.
* Speed review keyboard shortcuts to cull, rotate, and verify one hundred photos in sixty seconds.

### 2. Sermon Quote Studio
* Instant creation of 9:16 WhatsApp Status and 1:1 / 4:5 Instagram feed sermon quote cards.
* Support for transparent preacher cutouts with precise positioning, scaling, and horizontal flip controls.
* Custom church series background image uploads stored locally in the browser.
* Auto fitting typography engine that dynamically adjusts font sizes to prevent text overflow.

### 3. Sermon Audio Packager
* Ingests heavy sound desk recordings (WAV, MP3, M4A, AAC).
* Interactive visual waveform scrubber with start and end trim markers.
* Vocal peak speech normalization for consistent volume on mobile phone speakers.
* Pure JavaScript 64kbps CBR MP3 compression (reducing a 500MB sound recording down to approximately 25MB for Telegram channels).
* Embedded ID3v2 metadata with church title, preacher attribution, and album cover artwork.

---

## Architectural Principles

Every contribution to this codebase must adhere to these foundational principles:

1. **One Hundred Percent Client Side:** All image processing, audio encoding, and ZIP generation happens directly on the user computer. Zero external cloud APIs, zero server side dependencies.
2. **Zero CDN or External Network Calls:** The app must run completely offline in an airplane cabin or in a church basement with no cellular signal.
3. **Zero Framework Bloat:** Built with vanilla modern JavaScript, HTML5 Canvas, and the Web Audio API. No heavy frontend frameworks, no massive node_modules dependencies at runtime.
4. **Professional Aesthetics:** Clean, functional typography and vector SVG iconography. Zero cartoon emojis anywhere in the code or interface.

---

## Repository Structure

```
church-media-studio/
├── index.html                  # Main 3-module production suite application
├── landing.html                # Product landing page with live mockups
├── manifest.json               # Progressive Web App (PWA) manifest
├── sw.js                       # Offline Service Worker caching engine
├── server.js                   # Lightweight zero-dependency local HTTP server
├── build.js                    # Inlines CSS and JS into standalone single HTML
├── Launcher.cs                 # C# .NET 4.0 Edge App Mode desktop launcher
├── ChurchMediaStudio.exe       # Standalone Windows executable (385 KB)
├── app.ico                     # Multi-resolution Windows application icon
├── css/
│   └── style.css               # Unified theme, layout, and mobile drawer styles
├── js/
│   ├── app.js                  # Batch watermark queue manager and shortcuts
│   ├── renderer.js             # Canvas watermark rendering engine
│   ├── state.js                # Shared state and default church vector emblems
│   ├── zip.js                  # Pure JS CRC-32 and store ZIP packager
│   ├── quotes.js               # Quote canvas renderer and text auto-fit engine
│   ├── quotes-ui.js            # Quote studio UI event bindings and downloads
│   ├── lame.min.js             # Pure JS LAME MP3 compression engine
│   ├── audio-tagger.js         # Pure JS ID3v2.3 tagger and APIC art embedder
│   ├── audio-engine.js         # Web Audio decoding, speech normalizer, encoder
│   └── audio-studio.js         # Audio UI, waveform scrubber, and export logic
└── assets/                     # Vector SVGs, icons, and logo assets
```

---

## Getting Started Locally

Because the project uses pure web standards, no complex build tools or compilers are required to get started.

### Running with Node.js
```bash
# Clone the repository
git clone https://github.com/syntaxdrive/church-media-studio.git
cd church-media-studio

# Start the local development server
node server.js
```
Open `http://localhost:8080/` in your browser.

### Building the Single File Standalone Distribution
To bundle the entire codebase into a self contained, zero network HTML file:
```bash
node build.js
```
This generates `Church Media Batch Watermark Studio (4).html` which can be opened on any computer without a server.

### Compiling the Windows Executable
To recompile the native Windows `.exe` wrapper using the included Microsoft .NET Framework compiler:
```powershell
& "$env:SystemRoot\Microsoft.NET\Framework\v4.0.30319\csc.exe" `
  /target:winexe `
  /out:ChurchMediaStudio.exe `
  /win32icon:app.ico `
  "/resource:Church Media Batch Watermark Studio (4).html,StudioHtml" `
  /optimize+ `
  Launcher.cs
```

### Deploying to Netlify

Church Media Suite is 100% static client side code, making it instantly deployable on Netlify with zero server costs:

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/syntaxdrive/church-media-studio)

#### Automated Setup in 3 Steps:
1. Log in to [Netlify](https://app.netlify.com/).
2. Click **Add new site** > **Import an existing project** > **GitHub**.
3. Select `syntaxdrive/church-media-studio`. Netlify will automatically detect `netlify.toml` and deploy the entire suite with continuous deployment on every git push.

---

## Upcoming Engines Roadmap (Open for Contribution)

Church Media Studio is built as a modular engine platform. While the initial release focuses on photos, quotes, and audio, we have architected the suite so developers and church media creators can build and plug in new dedicated production engines:

### Engine 4: Lower Thirds & Broadcast Graphics (Wanted)
* Generate transparent broadcast lower thirds (preacher name, sermon title, Scripture passages).
* Export as transparent PNG sequences or alpha channel web formats ready for OBS Studio, vMix, and Blackmagic ATEM switchers.
* Offline series style templates with custom church logos and color schemes.

### Engine 5: Announcement & Church Slide Creator (Wanted)
* Fast generator for 16:9 sanctuary projector and LED wall slides.
* Templates for weekly church activities, tithe and offering bank details, and guest welcome slides.
* Instant batch export of all slides for ProPresenter, EasyWorship, and PowerPoint.

### Engine 6: Service Rundown & Production Cue Sheet (Wanted)
* Visual timeline schedule for church service directors, worship leaders, and sound engineers.
* Auto calculating countdown times (e.g. Opening Prayer, Praise & Worship, Announcements, Sermon, Benediction).
* Printable single page PDF sheet and mobile browser view with synchronized local clock.

### Engine 7: Short Sermon Video Reel Snipper (Wanted)
* Client side HTML5 video trimmer to cut thirty to sixty second video excerpts directly from church camera MP4 files.
* Vertical 9:16 cropping with embedded sermon subtitles and church watermark.
* Exported locally for fast upload to WhatsApp Status, YouTube Shorts, and Instagram Reels.

Have an idea for another church production engine? Open a GitHub Issue to discuss your proposal with Phosters Ministries and the community!

---

## Modular Engine Architecture: How to Build a New Engine

Adding a new engine to Church Media Studio takes only four steps:

### Step 1: Create Your Workspace View in `index.html`
Add your workspace container inside `index.html`:
```html
<div id="moduleYourEngineView" class="workspace">
  <!-- Left controls sidebar -->
  <!-- Center stage / preview area -->
</div>
```

### Step 2: Add Navigation Switchers
Add your engine button to `.suite-switcher` in the desktop header and inside the mobile drawer:
```html
<button type="button" id="navModuleYourEngine" class="suite-nav-btn">
  <!-- Inline SVG Icon -->
  <span>Your Engine Name</span>
</button>
```

### Step 3: Implement Your Logic in `js/`
Create `js/your-engine.js` using standard Web APIs (Canvas, Web Audio, SVG, File API). Export an initialization function that registers event listeners and coordinates rendering.

### Step 4: Register in Bundler & Service Worker
* In `index.html`: Add `<script src="js/your-engine.js"></script>`.
* In `build.js`: Add `'js/your-engine.js'` to the bundle list so it compiles into the single file offline HTML.
* In `sw.js`: Add `'./js/your-engine.js'` to `STATIC_ASSETS` for 100% offline caching.

---

## Ways to Contribute

We welcome contributions from church media volunteers, audio engineers, graphic designers, and software developers worldwide:

1. **Build a New Engine:** Claim one of the engines listed in the Roadmap above or propose a new workflow tool.
2. **New Quote Templates:** Design and contribute new typography layouts, scripture badges, and aesthetic color palettes for Module 2.
3. **Audio Enhancements:** Help implement background noise reduction filters, multiple segment silence skipping, or chapter markers for sermon recordings.
4. **Cross Platform Desktop Launchers:** Create lightweight native launchers for macOS (Swift / WebKit) and Linux (GTK / WebKit).
5. **Localization & Translations:** Help translate the interface into French, Spanish, Portuguese, Swahili, and other languages spoken by church communities globally.
6. **Documentation & Video Walkthroughs:** Write tutorials and produce volunteer onboarding guides.

---

## Contribution Guidelines

1. Fork the repository and create your branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Keep dependencies at zero. If a feature can be accomplished with standard Web APIs (Canvas, Web Audio, SVG), prefer that over importing large third party npm packages.
3. Test offline capability. Verify that your changes work when your device is completely disconnected from the internet.
4. Ensure code cleanliness. Follow existing naming conventions and preserve documentation comments.
5. Submit a descriptive Pull Request detailing the problem solved and testing performed.

---

## License

This project is licensed under the **MIT License** — feel free to use, modify, distribute, and deploy it for your church or organization without restriction.

---

## Community & Attribution

Developed and maintained by **Phosters Ministries**.  
If this software blesses your church media workflow on Sunday, please share it with other media teams and contribute your improvements back to the community.
