/**
 * Returns the given enum in a prepared form for use in a storybooks control options.
 *
 * @param usedEnum the given enum.
 */
export default function prepareEnum(usedEnum: Record<string, string | number>) {
  return Object.entries(usedEnum)
    .filter(([, value]) => typeof value !== "string")
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
}
