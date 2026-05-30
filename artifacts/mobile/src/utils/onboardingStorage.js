import AsyncStorage from '@react-native-async-storage/async-storage';

export const ONBOARDING_DONE_KEY = '@orderme_onboarding_done';

export async function isOnboardingDone() {
  const value = await AsyncStorage.getItem(ONBOARDING_DONE_KEY);
  return value === 'true';
}

export async function setOnboardingDone() {
  await AsyncStorage.setItem(ONBOARDING_DONE_KEY, 'true');
}
