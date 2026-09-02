# plan-render

`node tools/plan-render/render.mjs <floorplan.json> [out.svg] [--scale 22] [--level L1] [--no-fonts]`

Zero dependencies; imports `src/plan/npr.js` directly. Output is an SVG sheet: paper, grid, washes, poché walls, openings, labels, dimension strings, north arrow, scale bar, title block.

PNG: open the SVG in a browser and export, or use Playwright:
```
python3 -c "import asyncio;from playwright.async_api import async_playwright as P
async def m():
  async with P() as p:
    b=await p.chromium.launch();pg=await b.new_page(device_scale_factor=2)
    await pg.set_content(open('out/sample-apt.svg').read());await pg.wait_for_timeout(1500)
    await (await pg.query_selector('svg')).screenshot(path='out/sample-apt.png');await b.close()
asyncio.run(m())"
```
