export function getAuthErrorMessage(error) {
  const code = error?.code || '';
  const messages = {
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/email-already-in-use': 'An account already exists with this email.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/operation-not-allowed': 'Sign-in method not enabled. Enable it in Firebase Console → Authentication.',
    'auth/account-exists-with-different-credential': 'This email is already registered with another sign-in method.',
    'auth/popup-closed-by-user': 'Sign-in window was closed.',
    'auth/cancelled-popup-request': 'Sign-in was cancelled.',
  };
  return messages[code] || error?.message || 'Something went wrong. Please try again.';
}
