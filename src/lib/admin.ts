const ADMIN_USERNAMES = ["spacemonkey"];

export function isAdmin(username: string | undefined): boolean {
  return !!username && ADMIN_USERNAMES.includes(username);
}
