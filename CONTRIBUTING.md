# Contributing to Church Media Studio

Thank you for your interest in contributing to Church Media Studio!  
This project is an open source initiative by **Phosters Ministries** dedicated to empowering church media volunteers, production directors, and creative departments worldwide with fast, offline, and subscription free tools.

Whether you want to build a whole new engine, design sermon quote graphics templates, improve audio algorithms, or translate the app into another language, your contribution makes a direct difference on Sunday morning.

---

## The Four Golden Rules for All Code Contributions

To maintain the reliability and speed church teams depend on under pressure, every pull request must honor these four principles:

1. **One Hundred Percent Client Side:**
   Every feature must execute entirely in the user browser or desktop app. Never introduce server side processing, paid cloud APIs, or external backend requirements.

2. **Zero External CDN Dependencies:**
   All scripts, vector emblems, and stylesheets must be self contained. A church team must be able to use your new feature on a laptop disconnected from the internet.

3. **Zero Framework Bloat:**
   Rely on vanilla modern JavaScript, HTML5 Canvas, the Web Audio API, and standard CSS. Avoid adding heavy libraries that increase bundle size or memory usage on budget church laptops.

4. **Professional Aesthetics (Zero Cartoon Emojis):**
   Use clean typography and vector inline SVGs. Do not use cartoon emojis in user interfaces, buttons, or dialogs.

---

## Proposing and Building a New Engine

We actively encourage developers to expand the suite with new engines. Examples of requested engines:
* **Lower Thirds & Broadcast Graphics Engine** (for OBS, vMix, and ATEM switchers)
* **Announcement & Slide Creator** (16:9 projection slides for LED walls)
* **Service Rundown & Cue Sheet Tracker** (auto calculating schedule manager)
* **Short Video Reel Cutter** (quick 9:16 video trimmer for sermon snippets)

### Process for Creating a New Engine
1. **Open an Issue:** Submit a feature proposal on GitHub outlining the user workflow and user interface layout.
2. **Follow the Modular Blueprint:**
   * Create your workspace markup in `index.html` inside `<div id="moduleYourEngineView" class="workspace">`.
   * Add the desktop switcher button and mobile drawer navigation item.
   * Write your modular logic in `js/your-engine.js`.
   * Register your script in `build.js` and `sw.js` to support single file bundling and offline PWA caching.
3. **Test Responsive Design:** Ensure your engine works comfortably on small laptops (1366x768) and mobile devices.

---

## Pull Request Checklist

Before submitting your pull request, please verify:
* The app runs completely offline without network access.
* Running `node build.js` succeeds and updates the standalone distribution.
* The user interface renders crisply in both light and dark themes.
* Mobile drawer navigation functions properly on small screens.
* Code comments and documentation are preserved.

Thank you for serving church media departments around the globe!
