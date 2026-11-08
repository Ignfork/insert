# Insert ($INSERT)

Pump.fun entry toolkit. Static site, flat file structure, no build step. Drop it on Vercel or GitHub Pages as is.

## Before you deploy
Open `app.js` and edit the `CONFIG` block at the top:

```js
const CONFIG = {
  CA: "",                       // paste the $INSERT mint after launch
  X_URL: "https://x.com/UseInsertSol",
  PUMP_URL: "https://pump.fun",
  TICKER: "$INSERT",
};
```

X is set to https://x.com/UseInsertSol. Leave `CA` empty until launch. The site then shows "CA will be posted on X · @UseInsertSol", linked to the X account. Once you set it, the CA box gets a copy button and every Buy button links to `pump.fun/coin/<CA>`.

## Files
- `index.html`, `style.css`, `app.js`, `scene.js`: the site (`scene.js` draws the animated pixel arcade hero)
- `insert-pixel.woff`: the custom Insert pixel font. `inter-*.woff` and `mono-*.woff` are self-hosted UI fonts, so there are no external font requests
- `logo.svg` / `favicon.svg` / `favicon-32.png`: site icons
- `logo.png`: 1024×1024 pixel-art logo for the pump.fun create form
- `banner.png`: 1500×500 X header and pump.fun banner
- `og.png`: 1200×630 link-preview card

## Tools
1. **Entry Scanner**: live DexScreener data turned into an 8-factor Insert Score, plus bonding-curve progress for pump.fun coins
2. **Bonding Curve Calculator**: pump.fun's constant-product curve math (tokens out, price impact, entry MC, value at graduation)
3. **Exit Planner**: take-profit ladder, breakeven level, stop-loss
4. **Launch Kit**: name/ticker/image/dev-buy checks and a pump.fun card preview
5. **Pre-Insert Checklist**: weighted research checklist with research links for the scanned coin
6. **Watchlist**: saved in the browser, re-scan to compare scores

The site has no backend and no wallet connect, and it shows no simulated market data.
