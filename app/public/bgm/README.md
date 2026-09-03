# BGM catalog mirror

Dev: Vite proxies `/bgm/SoundHelix-Song-*.mp3` → soundhelix.com (no files needed here).

Prod (lenovo-static): run once before deploy:

```bash
node Tool/P0021-AutoVideo-Studio/scripts/sync-bgm-catalog.mjs
```

Catalog SSOT: `app/src/lib/bgm-options.ts`
