/** Paylaşılabilir gönderi URL’si. */
export function getPostShareUrl(postId: string, origin = "https://orbly.social") {
  return `${origin.replace(/\/$/, "")}/post/${postId}`;
}
