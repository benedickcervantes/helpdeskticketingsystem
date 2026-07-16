# Canva Upload Guide — FPDC Helpdesk Training Slides

**Your Canva design:** https://www.canva.com/design/DAHOZkMm-Zc/H6z2QKiOfv7RVHatrR_myw/edit

---

## ✅ Ready-to-Upload PNG Slides (Easiest)

**English version — drag and drop directly into Canva:**

```
C:\Users\IT DEPT. 02\Documents\helpdeskticketingsystem\docs\presentation\png-slides-en\
```

| File | Content |
|------|---------|
| `slide-01.png` … `slide-20.png` | Full slides, 1920×1080, English, with live site screenshots on slides 8–10 |

### Upload steps
1. Open your [Canva design](https://www.canva.com/design/DAHOZkMm-Zc/H6z2QKiOfv7RVHatrR_myw/edit)
2. **Uploads** → upload all 20 PNG files from `png-slides-en\`
3. Add one slide per page, drag each PNG to fill the slide
4. Optionally add FPDC logo overlay from `public/fpdc-logo.png`

### Regenerate PNGs anytime
```powershell
cd "C:\Users\IT DEPT. 02\Documents\helpdeskticketingsystem\docs\presentation"
npm run generate
```

---

## Live Site Screenshots (standalone)

```
docs/presentation/screenshots/
├── 01-homepage.png
├── 02-auth-login.png
└── 03-auth-register.png
```

Captured from https://helpdeskticketingsystem.vercel.app/

---

## English HTML Source (editable)

```
docs/presentation/FPDC-Helpdesk-Slides-EN.html
```

Open in browser → Ctrl+P → Save as PDF → upload PDF to Canva if you prefer.

---

## Filipino / Taglish HTML (original)

```
docs/presentation/FPDC-Helpdesk-Slides.html
```

---

## Brand Kit (Apply in Canva)

| Element | Value |
|---------|-------|
| Background | `#0F1419` → `#1A2332` gradient |
| Primary accent | `#10B981` Emerald |
| Secondary accent | `#06B6D4` Cyan |
| Font | Inter or Montserrat |
| Slide size | 16:9 (1920×1080) |

---

## Checklist Before Seminar

- [ ] All 20 PNG slides uploaded to Canva
- [ ] Date, venue, IT contact updated on slides 1 & 20
- [ ] Test Canva present mode fullscreen
- [ ] Download PDF backup from Canva

