# Self-hosted fonts

The three Google Fonts the site uses, served from this folder so the in-person
demo works with no network.

| Family | Role | File(s) | Axes |
|---|---|---|---|
| Bodoni Moda | display | `bodoni-moda-latin.woff2`, `bodoni-moda-latin-ext.woff2` | wght 400–900, opsz 6–96 |
| Karla | body | `karla-latin.woff2`, `karla-latin-ext.woff2` | wght 200–800 |
| Mrs Saint Delafield | script | `mrs-saint-delafield-latin.woff2`, `mrs-saint-delafield-latin-ext.woff2` | static 400 |

All three are under the SIL Open Font License 1.1. The licence text for each
family sits beside the files and must ship with them.

## Wiring it in

Remove the three Google Fonts tags from the document head:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda...">
```

and replace them with the local stylesheet, plus a preload for the two faces
that paint above the fold:

```html
<link rel="preload" href="/fonts/bodoni-moda-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/karla-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/fonts/fonts.css">
```

`fonts.css` uses relative URLs, so the folder can live anywhere that is served
as static files (`public/` for Vite and Astro, `static/` for SvelteKit) as long
as the stylesheet link points at it. The `font-family` names match the Google
Fonts names, so the existing `--display`, `--body` and `--script` variables
need no change.

## Refreshing the files

Fetch the Google Fonts CSS with a modern browser User-Agent so it returns
WOFF2 variable files, then download the `latin` and `latin-ext` URLs:

```
https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400..900&family=Karla:wght@200..800&family=Mrs+Saint+Delafield&display=swap
```
