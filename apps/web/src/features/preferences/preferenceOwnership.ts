export function preferencesBelongToAccount(
  ownerId: string | null,
  userId: string,
) {
  return ownerId === null || ownerId === userId;
}

export function preferencesAreAnonymous(ownerId: string | null) {
  return ownerId === null;
}
