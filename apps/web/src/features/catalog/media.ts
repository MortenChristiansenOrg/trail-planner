export function responsiveImageUrl(url: string, width: number) {
  const hashIndex = url.indexOf("#");
  const baseUrl = hashIndex === -1 ? url : url.slice(0, hashIndex);
  const fragment = hashIndex === -1 ? "" : url.slice(hashIndex);
  return `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}width=${width}${fragment}`;
}
