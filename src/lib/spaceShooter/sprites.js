/**
 * Starts loading each image in `paths` ({ name: url }) and returns
 * { name: Image } straight away; whoever draws them checks they have arrived.
 */
export function loadSprites(paths) {
  return Object.fromEntries(
    Object.entries(paths).map(([name, src]) => [name, Object.assign(new Image(), { src })])
  );
}
