import { Platform } from 'react-native';

/** useNativeDriver breaks opacity animations on web — causes invisible/white UI */
export const USE_NATIVE_DRIVER = Platform.OS !== 'web';

export const fadeInInitial = Platform.OS === 'web' ? 1 : 0;
