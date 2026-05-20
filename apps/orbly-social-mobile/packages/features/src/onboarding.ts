export const ONBOARDING_MIN_ORBITS = 3;

/** Mevcut orbit sayısına göre zorunlu seçim adedi (0 = atlanabilir). */
export function requiredOrbitSelections(availableCount: number): number {
  if (availableCount <= 0) return 0;
  return Math.min(ONBOARDING_MIN_ORBITS, availableCount);
}

export function canCompleteOnboarding(
  selectedCount: number,
  availableCount: number,
): boolean {
  return selectedCount >= requiredOrbitSelections(availableCount);
}

export function onboardingHint(availableCount: number): string {
  const required = requiredOrbitSelections(availableCount);
  if (availableCount === 0) {
    return "İlgi alanlarını şimdi seçebilir veya atlayıp ana sayfaya geçebilirsin.";
  }
  if (required === 1) {
    return "En az 1 orbit seçebilir veya atlayabilirsin.";
  }
  if (required === 2) {
    return "En az 2 orbit seçebilir veya atlayabilirsin.";
  }
  return "En az 3 orbit seçebilir veya atlayabilirsin.";
}
