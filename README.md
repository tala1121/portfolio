# A Life in Nine Chapters

**Live:** https://tala1121.github.io/portfolio/

This is not a portfolio template. It is a scroll-driven film: one continuous 3D camera shot that flies through nine chapters of my life, from the 3D studio I founded at 12 to my AI security research. Every scene is hand-coded Three.js. My face on the first page is ~40,000 particles sampled live from a photograph.

I built it in roughly a day, by directing Claude (Fable 5) inside Claude Code. I wrote none of the code by hand.

Below is the exact playbook, so you can make your own.

---

## The Playbook: How to prompt your way to a product like this

### Step 1. Give it your life, not a spec

I did not open with "build me a website with a hero section and a projects grid." I uploaded my resume and then wrote a long, messy brain dump. Voice-note energy. The timeline of my life, what each place felt like, and the emotion I wanted at every stop.

> *"I want a mind-blowing portfolio website, not the generic 99% websites AI already makes. I'll upload my resume. When I scroll through the website it should follow my timeline: my design studio should feel like 3D design, my school should feel like the school, my university should have a computer science feel... it should be my life movie while scrolling. Christopher Nolan level. Piece of art."*

The AI knows how to build. What it cannot invent is your story. Give it the raw narrative and the feeling, and let it figure out the medium.

### Step 2. Set the taste bar and then grant liberty

Two sentences did a lot of heavy lifting:

> *"Remember I'm a design freak, picky on classy minimal modern Apple-like UI. But if you have a better idea, do it. You have full liberty."*

Name your references (Nolan, Apple, Luma). References compress a thousand design decisions into a few words. Then explicitly hand over creative freedom. Constraint plus liberty is the combination that gets you something opinionated instead of something safe.

### Step 3. React like a director, not a client

The first version was polished but flat. I did not say "hmm, could we explore alternatives?" I said:

> *"This is just a shitty PPT slideshow. No animations. A baby can make this. DO REAL 3D ANIMATIONS, ZOOM INS OUTS, B-ROLL, 3D MOVEMENTS."*

That one message caused the whole visual engine to be thrown away and rebuilt on WebGL: a real camera on a dolly track, sets it flies between, fog, film grain, speed ramps. Be brutal and be specific about what is missing. "Make it better" gets you 10% better. "I want the camera to dive into a corporate tower" gets you a new product.

### Step 4. Feed it real assets, and say the magic word: integrate

Generic AI sites feel generic because everything in them is invented. I pasted my actual materials mid-conversation: my photo, my university's logo, my startup's koala mark, a screenshot of the product I helped build, a photo of my campus gate.

> *"Integrate all these with the design theme you already made. Not the image itself, a better version of the building structure. Smudged with the main theme."*

"Integrate, don't paste" is the instruction that matters. My campus gate became dark-clay 3D brickwork that constructs itself as you arrive. The real seal got mounted on its crown. The product screenshot became a floating tilted 3D panel. Real assets, translated into the film's language.

### Step 5. Describe moments, not features

The best parts of the site came from me describing a shot the way you would describe a movie scene:

> *"For the first page: text in center first, when zoomed to my image the text moves down to show the portrait. Or if you have a better idea, do that."*
>
> *"Optimize it so if the text overlaps my image it turns to border-only outline, revealing the image."*

That became the hero: my name solid over a particle portrait, and as you scroll the camera pushes into my face while the letters drain to pure outlines. I never said "implement a scroll-linked CSS custom property." I described the moment. It picked the technique.

### Step 6. Make it verify itself

Do not trust screenshots of enthusiasm. Ask the AI to prove things work. Mine spun up a local server, drove a real Chrome browser, and screenshotted every chapter like film dailies, then fixed what looked wrong in its own screenshots (a seal cropped out of frame, streaks that looked like hyperspace soup, a broken mask) before I ever saw it.

If your tool can run code and take screenshots, the prompt is simple: **"verify every chapter visually before you tell me it's done."**

### Step 7. Never accept the current ceiling

At one point I sent exactly this:

> *"If this current stage is a 6/10, I need a 10/10."*

No new requirements. Just a raised bar. It responded with a punch list I had not thought to ask for: aspect-aware camera framing, brick coursing on the masonry, midtone lifts on the portrait, debris fields between chapters. State the score you want and make the AI find the gap.

### Step 8. Delegate the boring parts completely

Shipping is where most side projects die. I typed:

> *"I have no hosting at all, are there any free alternatives? DO IT ALL FOR ME."*

It authenticated GitHub through a device code (I typed one 8-character code in my browser), created the repo, pushed, enabled GitHub Pages, waited for the build, and curl-verified every asset returned 200. Then: *"make sure mobile is as lovely as desktop"* got a full mobile pass, verified with phone-viewport screenshots of the live site.

---

## The cheat sheet

| Instead of... | Say... |
|---|---|
| "Build me a portfolio" | "Here's my resume and my story. Make my life a film." |
| "Make it look nice" | "Classy, minimal, Apple-like. Nolan-level. You have full liberty." |
| "Can we improve the animations?" | "This looks like a PPT. I want zoom-ins, B-roll, real 3D movement." |
| "Add my logo" | "Integrate it, smudged into the theme. Not pasted, translated." |
| "Add a cool hero" | "Text center first. Scroll zooms into my face. Text drains to outline." |
| "Is it done?" | "Screenshot every section and fix what looks wrong before telling me." |
| "Looks good I guess" | "This is a 6/10. I need a 10/10." |
| "How do I deploy?" | "Do it all for me." |

## The stack it chose

- **Three.js** (vendored, no build step) for the ten 3D sets and the dolly-track camera
- **Vanilla JS + CSS** for the scroll direction, HUD, film grain, letterboxing, reveals
- **Canvas-painted textures** for every logo and the Cirkles site panel (self-contained, no external requests)
- **Live photo sampling** for the particle portrait (luminance to dots, tonal edges to ink strokes)
- **GitHub Pages** for free hosting

## The one-sentence version

Bring the story, the taste, and the standards. Let the AI bring the hands.

---

*Written, produced and lived by Muhammad Talha Iqbal. Directed with Claude Fable 5 in Claude Code.*
