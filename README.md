# Wedding website

A wedding website studio and invitation template, built for GitHub Pages with plain HTML, CSS and JavaScript.

- `/wedding-websites` is the bilingual English / Nepali registration and design selection experience. The studio presents five featured designs.
- Couples choose groom-first or bride-first name order. The app makes a matching `name-weds-name` page route and expires that invitation four days after its wedding date.
- New registrations are currently stored in the visitor's browser `localStorage`. They are a front-end prototype and are not available to other visitors or devices.
- A production service that creates public subdomains and expires pages for everyone needs a backend to save registrations, check slug availability, provision DNS or wildcard routing, and enforce expiry server-side. GitHub Pages alone cannot create those pages per user; the existing `/slug` sample routes are static files.

- One JSON file per wedding, so the same site can host your own wedding and weddings you make for clients.
- Clean links such as `/aarav-weds-riya`, like a hosted wedding platform.
- Sections: hero with countdown, couple and story timeline, events with directions and **Add to calendar** (.ics), photos with lightbox, FAQ, and RSVP.
- RSVP goes to a form endpoint (Formspree or Google Sheets), WhatsApp or email. You choose which.
- A design switcher, plus a `/designs` page that shows the five featured designs side by side.
- Responsive down to phone size, keyboard accessible, and respects reduced motion.

## The five featured designs

| `theme` | Look |
| --- | --- |
| `himalaya` | Prayer flags over a snowy range. Cool and airy. |
| `dhaka` | Red, black and mustard dhaka topi textile. Bold and Nepali. |
| `sayapatri` | Marigold toran on deep leaf green. Festive. |
| `sindoor` | Vermilion and gold with शुभ विवाह. Ceremonial. |
| `botanical` | Sage and blush with an arched garden window. Romantic. |

You can preview any design on any wedding by adding `?theme=<name>`, for example `/aarav-weds-riya?theme=botanical`.

## Make it yours

1. Copy `data/weddings/aarav-weds-riya.json` to `data/weddings/<your-slug>.json`, for example `bipul-weds-<name>.json`.
2. Edit names, dates, events, story, FAQ and RSVP settings. Write dates with the Nepal offset, for example `2027-02-13T10:00:00+05:45`.
3. Set `"theme"` to one of the five names.
4. In `data/site.json`, set `defaultWedding` to your slug so it opens at the root of your domain.
5. Put photos in `assets/photos/` and reference them as `"src": "assets/photos/01.jpg"`. Gallery items with an empty `src` show a patterned placeholder. `heroImage` and each person's `photo` work the same way.
6. When you go live, set `"allowThemeSwitch": false` in `data/site.json` to hide the design switcher from guests.

### More weddings (official / client use)

Each extra JSON file in `data/weddings/` becomes its own page at `https://<domain>/<slug>`. `/designs` is the showroom page you can send to clients.

### RSVP options

In each wedding file, `rsvp` takes the first option that is set:

- `endpoint`: a URL that accepts a JSON POST. [Formspree](https://formspree.io) works directly. For Google Sheets, deploy a Google Apps Script web app that appends `e.postData.contents` to a sheet, and paste its `/exec` URL here.
- `whatsapp`: a number in international format without `+`, for example `97798XXXXXXXX`. Opens WhatsApp with the RSVP filled in.
- `email`: opens the guest's email app with the RSVP filled in.

## Run locally

Any static server works. To test clean URLs, use one that falls back to `404.html`, as GitHub Pages does:

```bash
npx serve -s .
```

## Deploy on GitHub Pages

1. On GitHub, open **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**, then branch `main` and folder `/ (root)`.
3. The site goes live at `https://bipulmgr.github.io/wedding/`. The app detects the `/wedding/` prefix on its own.

## Custom domain

Choose one domain and point it at GitHub Pages.

**sammentech.com** (or a subdomain such as `wedding.sammentech.com`)

- Apex domain: add `A` records for `@` pointing to `185.199.108.153`, `185.199.109.153`, `185.199.110.153` and `185.199.111.153`, and a `CNAME` for `www` pointing to `bipulmgr.github.io`.
- Subdomain: add one `CNAME` record pointing to `bipulmgr.github.io`.

**bipul.com.np**

- `.np` domains are registered free at register.com.np, but DNS is hosted elsewhere. Set the nameservers to a DNS host such as Cloudflare, then add the same `A` / `CNAME` records as above.

Then on GitHub, open **Settings → Pages → Custom domain**, enter the domain, save, and turn on **Enforce HTTPS** once the certificate is ready. GitHub adds a `CNAME` file to the repo for you. Links keep working because the app serves from `/` on a custom domain.

## Files

```
index.html            app shell
404.html              forwards clean URLs (/slug) to the app on GitHub Pages
data/site.json        default wedding and switcher setting
data/weddings/*.json  one file per wedding
assets/css/base.css   shared layout
assets/css/themes.css the five featured designs
assets/css/designs.css the /designs showroom
assets/js/themes.js   design list (names, fonts, swatches)
assets/js/art.js      SVG artwork drawn in code (flags, toran, diyas, branch, mountains)
assets/js/app.js      router, rendering, countdown, calendar, RSVP
```
