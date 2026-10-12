# Brand files that are not served by the panel

`veritas-social-preview-1280x640.jpg` is GitHub's **social preview**: the card
other sites draw when this repository's link is pasted. It is not referenced by
any code, because GitHub does not read it from the tree — upload it under
*Settings → General → Social preview* once, and GitHub keeps it.

Rendered from `frontend/public/brand/veritas-discord-server-1920x1080.png`,
cropped to 2:1:

```bash
ffmpeg -i frontend/public/brand/veritas-discord-server-1920x1080.png \
  -vf "crop=1920:960:0:60,scale=1280:640:flags=lanczos" -q:v 2 \
  docs/brand/veritas-social-preview-1280x640.jpg
```

The panel's own link preview is a different file,
`frontend/public/brand/veritas-og-1200x630.jpg`, which *is* served and is named
by the Open Graph tags in `frontend/index.html`.
