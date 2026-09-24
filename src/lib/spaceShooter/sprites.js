/** Loads and decodes every sprite so nothing pops in mid-game. */
export async function loadSprites(paths) {
  const entries = await Promise.all(
    Object.entries(paths).map(async ([key, src]) => {
      const image = new Image();
      image.src = src;
      await image.decode();
      return [key, image];
    })
  );
  return Object.fromEntries(entries);
}
