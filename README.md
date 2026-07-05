# A Life in Nine Chapters

**Live:** https://tala1121.github.io/portfolio/

This is not a portfolio template. It is a scroll-driven film: one continuous 3D camera shot that flies through nine chapters of my life, from the 3D studio I founded at 12 to my AI security research. Every scene is hand-coded Three.js. My face on the first page is ~40,000 particles sampled live from a photograph.

I built it in roughly a day, by directing Claude (Fable 5) inside Claude Code. I wrote none of the code by hand.

Below is the exact playbook, so you can make your own.

---

## The Playbook: How to prompt your way to a product like this

### Step 1. Give it your life, not a spec

I did not open with "build me a website with a hero section and a projects grid." I uploaded my resume and then wrote a long, messy brain dump. Voice-note energy. The timeline of my life, what each place felt like, and the emotion I wanted at every stop.

> *"I want a mind-blowing portfolio website, not the generic 99% websites AI already makes i need that 1% . I'll upload my resume. When I scroll through the website it should follow my timeline:....."*

The AI knows how to build. What it cannot invent is your story. Give it the raw narrative and the feeling, and let it figure out the medium.

### Step 2. Set the taste bar and then grant liberty

Two sentences did a lot of heavy lifting:

> *"Remember I'm a design freak, picky on classy minimal modern Apple-like UI. But if you have a better idea, do it. You have full liberty."*

Name your references (Nolan, Apple, Luma). References compress a thousand design decisions into a few words. Then explicitly hand over creative freedom. Constraint plus liberty is the combination that gets you something opinionated instead of something safe.

### Step 3. React like a director, not a client

The first version was polished but flat. I did not say "hmm, could we explore alternatives?" I said:

> *" This is BS! DO REAL 3D ANIMATIONS, ZOOM INS OUTS, B-ROLL, 3D MOVEMENTS i need ..."*

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

---

## The technical vocabulary: what separates average from cinematic

Average results come from average nouns. "Animations", "3D", "nice colors" are average nouns. The AI fills vague words with the most statistically common thing it knows, and that is exactly the generic look you are trying to escape. The fix is to prompt with the vocabulary of the craft. You do not need to code any of this. You need to *name* it.

### Motion: speak camera, not "animation"

There is a grammar for how cameras move, and the AI knows it fluently. Use it.

- **Dolly** — camera physically travels forward/back. *"The camera dollies through the whole site like one continuous shot."*
- **Crane** — rises or descends. *"Crane up from the steps to reveal the whole building."*
- **Fly-through** — passes through geometry. *"The dolly exits the chapter straight through the arch."*
- **Speed ramp / FOV kick** — a zoom punch mid-move. *"Widen the field of view mid-flight so transitions feel like a speed ramp."*
- **Banking roll** — slight tilt during motion, like an aircraft. Ask for it "subtle, 1–2 degrees."
- **Hold vs travel** — tell it scroll should *hold* on each scene while you read, then *travel* to the next. This one sentence gave my site its entire structure.

For element animation, the words that matter are **easing** and **choreography**:

- *"Nothing linear. Ease everything in and out, slow-fast-slow."*
- *"The building constructs itself: parts rise from the ground bottom-anchored, staggered by 100ms each."*
- *"The knot draws itself on as I arrive."* (draw-on)
- *"The portrait assembles from scattered dust on load and dissolves back to dust on scroll."* (assemble/dissolve)
- *"Everything idle should still breathe: slow bob, pulse, drift. A frame with zero motion is a dead frame."*

### 3D scenes: describe them like an architect

"Add a 3D building" gets you a grey box. Describe mass, proportion, material treatment, and what the camera does with it:

> *"Twin brick towers with a portal between them wide enough for the camera to fly through. Dark clay faces, bright warm line-work on the edges, drawn brick coursing so it reads as masonry without textures. Steps in front, low garden walls flanking, the university seal mounted on the crown. It rises out of the lawn as you arrive."*

Every phrase in that prompt is a decision the AI would otherwise make blandly on your behalf. Other structure words that pay off: **wireframe vs solid**, **edge highlighting**, **extrusion**, **silhouette**, **depth layers** (foreground debris, midground subject, background fog), **particle fields**, **isometric grids**.

And always give the scene a *relationship* to the camera: not "a ring of circles" but *"a ring of eight circles the camera threads through the middle of."*

### Color: pick a system, not "a palette"

Average AI color is a purple-to-blue gradient on white. Escape it by specifying a system:

- **One ground, many accents.** *"Near-black warm ground (#07070a). Every chapter gets its own accent: burnt orange for the studio, blueprint blue for school, terminal green for university, violet, corporate blue, pure white, teal, crimson, gold for the finale."* Naming hex values is not overkill, it is control.
- **Dark faces, bright lines.** The "submerged" look that holds this whole site together: *"Surfaces are near-black; all detail lives in glowing edge line-work."* This single rule makes wildly different scenes feel like one film.
- **Additive glow.** *"Lights, particles and accents should bloom additively, like long-exposure photography."*
- **Grade it like film.** *"Add fine animated grain at low opacity, a soft vignette, and lift the midtones on the portrait so faces read."* Words like *midtones*, *gamma*, *contrast ratio* are understood literally and applied correctly.
- **Type is part of color.** *"Warm off-white ink (#f4f1ea), never pure white. Muted mono for HUD labels with wide letter-spacing."*

### The detail ladder

The same request at three levels of detail. This is the whole lesson in one table:

| Level | Prompt | What you get |
|---|---|---|
| Average | "Add an animation to the intro" | A fade-in |
| Good | "Zoom into my portrait as I scroll" | A scale transform |
| Cinematic | "The camera starts pulled back, dollies into my face as I scroll, the name drains from solid fill to outline so the portrait shows through the letters, and past halfway the face dissolves into dust that streams past the camera into the next chapter" | The actual hero of this site |

### Numbers the AI respects

Sprinkle real budgets and thresholds into your prompts and the output stops being fragile:

- *"Cap device pixel ratio at 1.75 on desktop, 1.4 on mobile."*
- *"~40k particles desktop, ~18k mobile. It must hold 60fps on a mid-range phone."*
- *"Sub-100ms interaction response. No layout jumps when the mobile URL bar collapses."*
- *"Verify with real-browser screenshots at 1600×900 and 390×844 before calling it done."*

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
| "Add animations" | "Dolly through the scenes, crane up the building, ease everything, idle elements still breathe." |
| "Make the colors nice" | "Near-black ground, one accent per chapter, dark faces with glowing edge line-work, film grain on top." |
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
