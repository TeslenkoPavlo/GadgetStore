import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Modal,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  AuthError
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, User } from '@/config/firebaseConfig';
import { saveUser } from '@/services/storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const generateStrongPassword = (): string => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%^&*';

  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  const allChars = lowercase + uppercase + numbers + special;
  for (let i = 0; i < 8; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  return password.split('').sort(() => Math.random() - 0.5).join('');
};

const ALLOWED_EMAIL_DOMAINS = [
  'gmail.com',
  'ukr.net',
  'i.ua',
  'meta.ua',
  'bigmir.net',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
  'proton.me',
  'protonmail.com',
];

const validateName = (name: string, fieldName: string): { isValid: boolean; error?: string } => {
  if (!name.trim()) {
    return { isValid: false, error: `Введіть ${fieldName}` };
  }
  if (name.trim().length < 2) {
    return { isValid: false, error: 'Мінімум 2 літери' };
  }
  if (name.trim().length > 15) {
    return { isValid: false, error: 'Максимум 15 символів' };
  }
  return { isValid: true };
};

const filterNameInput = (text: string): string => {
  return text.replace(/[^a-zA-Zа-яА-ЯіІїЇєЄґҐ']/g, '').slice(0, 15);
};

const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.trim()) {
    return { isValid: false, error: 'Введіть email адресу' };
  }
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, error: 'Невірний формат email адреси' };
  }
  const domain = email.trim().toLowerCase().split('@')[1];
  if (!ALLOWED_EMAIL_DOMAINS.includes(domain)) {
    return {
      isValid: false,
      error: `Підтримуються: Gmail, Ukr.net, I.UA, Meta.ua, Bigmir, Yahoo, Outlook, iCloud`
    };
  }
  return { isValid: true };
};

const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  if (!password.trim()) {
    return { isValid: false, errors: ['Введіть пароль'] };
  }
  if (password.length < 8) {
    errors.push('мінімум 8 символів');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('велика літера');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('маленька літера');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('цифра');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('спецсимвол (!@#$%^&*)');
  }
  return { isValid: errors.length === 0, errors };
};

const getFirebaseErrorMessage = (error: AuthError): { emailError?: string; passwordError?: string } => {
  switch (error.code) {
    case 'auth/email-already-in-use':
      return { emailError: 'Цей email вже зареєстрований' };
    case 'auth/invalid-email':
      return { emailError: 'Невірний формат email' };
    case 'auth/user-disabled':
      return { emailError: 'Акаунт вимкнено' };
    case 'auth/user-not-found':
      return { emailError: 'Користувача не знайдено' };
    case 'auth/wrong-password':
      return { passwordError: 'Невірний пароль' };
    case 'auth/invalid-credential':
      return { passwordError: 'Невірний email або пароль' };
    case 'auth/too-many-requests':
      return { emailError: 'Забагато спроб. Спробуйте пізніше' };
    case 'auth/network-request-failed':
      return { emailError: 'Помилка мережі. Перевірте підключення' };
    case 'auth/weak-password':
      return { passwordError: 'Пароль занадто слабкий' };
    default:
      return { emailError: error.message || 'Помилка автентифікації' };
  }
};

const ErrorHint: React.FC<{ message: string }> = ({ message }) => (
  <View style={errorHintStyles.container}>
    <View style={errorHintStyles.iconContainer}>
      <Ionicons name="information-circle" size={18} color="#6B7280" />
    </View>
    <Text style={errorHintStyles.text}>{message}</Text>
  </View>
);

const errorHintStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
  },
  text: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 8,
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [isLoginMode, setIsLoginMode] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [showUserNotFoundModal, setShowUserNotFoundModal] = useState(false);
  const [showWrongPasswordModal, setShowWrongPasswordModal] = useState(false);
  const [showEmailInUseModal, setShowEmailInUseModal] = useState(false);

  const resetErrors = () => {
    setEmailError('');
    setPasswordError('');
    setFirstNameError('');
    setLastNameError('');
  };

  const switchMode = () => {
    setIsLoginMode(!isLoginMode);
    resetErrors();
  };

  const handleLogin = async () => {
    resetErrors();

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error || 'Невірний email');
      return;
    }

    if (!password.trim()) {
      setPasswordError('Введіть пароль');
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const firebaseUser = userCredential.user;

      let displayName = firebaseUser.displayName || undefined;

      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.firstName || userData.lastName) {
            displayName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
          }
        }
      } catch (firestoreError) {
        console.error('Error fetching user data from Firestore:', firestoreError);
      }

      const user: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || email.trim(),
        displayName: displayName,
        photoURL: firebaseUser.photoURL || undefined,
      };

      await saveUser(user);
      onLoginSuccess(user);
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential') {
        setShowWrongPasswordModal(true);
      } else if (error.code === 'auth/user-not-found') {
        setShowUserNotFoundModal(true);
      } else {
        const errors = getFirebaseErrorMessage(error);
        if (errors.emailError) setEmailError(errors.emailError);
        if (errors.passwordError) setPasswordError(errors.passwordError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    resetErrors();

    const firstNameValidation = validateName(firstName, "ім'я");
    if (!firstNameValidation.isValid) {
      setFirstNameError(firstNameValidation.error || "Невірне ім'я");
      return;
    }

    const lastNameValidation = validateName(lastName, 'прізвище');
    if (!lastNameValidation.isValid) {
      setLastNameError(lastNameValidation.error || 'Невірне прізвище');
      return;
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error || 'Невірний email');
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      if (passwordValidation.errors.length === 1 && passwordValidation.errors[0] === 'Введіть пароль') {
        setPasswordError('Введіть пароль');
      } else {
        setPasswordError(`Потрібно: ${passwordValidation.errors.join(', ')}`);
      }
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const firebaseUser = userCredential.user;
      const fullName = `${firstName.trim()} ${lastName.trim()}`;

      await setDoc(doc(db, 'users', firebaseUser.uid), {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: firebaseUser.email || email.trim(),
      });

      const user: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || email.trim(),
        displayName: fullName,
        photoURL: firebaseUser.photoURL || undefined,
      };

      await saveUser(user);
      onLoginSuccess(user);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setShowEmailInUseModal(true);
      } else {
        const errors = getFirebaseErrorMessage(error);
        if (errors.emailError) setEmailError(errors.emailError);
        if (errors.passwordError) setPasswordError(errors.passwordError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      <KeyboardAvoidingView
        behavior="height"
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.animationContainer}>
            <LottieView
              source={require('@/assets/Mobile UI.json')}
              autoPlay
              loop
              style={styles.animation}
            />
          </View>

          <View style={styles.formContainer}>

            <View style={styles.form}>
              {!isLoginMode && (
                <View style={styles.nameRow}>
                  <View style={styles.nameInputContainer}>
                    <Text style={styles.label}>Ім'я</Text>
                    <TextInput
                      style={[styles.input, firstNameError ? styles.inputError : null]}
                      placeholder="Ваше ім'я"
                      placeholderTextColor="#9CA3AF"
                      value={firstName}
                      onChangeText={(text) => {
                        setFirstName(filterNameInput(text));
                        setFirstNameError('');
                      }}
                      autoCapitalize="words"
                      autoCorrect={false}
                      maxLength={15}
                      editable={!isLoading}
                    />
                    {firstNameError ? <ErrorHint message={firstNameError} /> : null}
                  </View>
                  <View style={styles.nameInputContainer}>
                    <Text style={styles.label}>Прізвище</Text>
                    <TextInput
                      style={[styles.input, lastNameError ? styles.inputError : null]}
                      placeholder="Ваше прізвище"
                      placeholderTextColor="#9CA3AF"
                      value={lastName}
                      onChangeText={(text) => {
                        setLastName(filterNameInput(text));
                        setLastNameError('');
                      }}
                      autoCapitalize="words"
                      autoCorrect={false}
                      maxLength={15}
                      editable={!isLoading}
                    />
                    {lastNameError ? <ErrorHint message={lastNameError} /> : null}
                  </View>
                </View>
              )}

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Пошта</Text>
                <TextInput
                  style={[styles.input, emailError ? styles.inputError : null]}
                  placeholder="Введіть вашу пошту"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setEmailError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  editable={!isLoading}
                />
                {emailError ? <ErrorHint message={emailError} /> : null}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Пароль</Text>
                <View style={[styles.passwordContainer, passwordError ? styles.inputError : null]}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Введіть ваш пароль"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setPasswordError('');
                    }}
                    secureTextEntry={!showPassword}
                    editable={!isLoading}
                  />
                  <View style={styles.passwordActions}>
                    {!isLoginMode && (
                      <>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => {
                            const newPassword = generateStrongPassword();
                            setPassword(newPassword);
                            setPasswordError('');
                            setShowPassword(true);
                          }}
                          disabled={isLoading}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="key-outline" size={20} color="#6B7280" />
                        </TouchableOpacity>
                        <View style={styles.actionDivider} />
                      </>
                    )}
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color="#6B7280"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                {passwordError ? <ErrorHint message={passwordError} /> : null}
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={isLoginMode ? handleLogin : handleRegister}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.buttonText}>{isLoginMode ? 'Увійти' : 'Зареєструватися'}</Text>
                )}
              </TouchableOpacity>

              <View style={styles.switchContainer}>
                <Text style={styles.switchText}>
                  {isLoginMode ? 'Немає акаунту?' : 'Вже є акаунт?'}
                </Text>
                <TouchableOpacity onPress={switchMode} disabled={isLoading}>
                  <Text style={styles.switchLink}>
                    {isLoginMode ? 'Зареєструватися' : 'Увійти'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showUserNotFoundModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUserNotFoundModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="person-remove-outline" size={48} color="#000000" />
            </View>
            <Text style={styles.modalTitle}>Користувача не знайдено</Text>
            <Text style={styles.modalMessage}>
              Користувача з такими даними не існує в системі. Перевірте email та пароль або зареєструйтеся.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setShowUserNotFoundModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonSecondaryText}>Спробувати ще</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={() => {
                  setShowUserNotFoundModal(false);
                  setIsLoginMode(false);
                  resetErrors();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonPrimaryText}>Зареєструватися</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showWrongPasswordModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWrongPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="lock-closed-outline" size={48} color="#F59E0B" />
            </View>
            <Text style={styles.modalTitle}>Невірні дані</Text>
            <Text style={styles.modalMessage}>
              Email або пароль введено невірно. Перевірте правильність введених даних та спробуйте ще раз.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setShowWrongPasswordModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonSecondaryText}>Спробувати ще</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={() => {
                  setShowWrongPasswordModal(false);
                  setPassword('');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonPrimaryText}>Очистити пароль</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showEmailInUseModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEmailInUseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="mail-outline" size={48} color="#000000" />
            </View>
            <Text style={styles.modalTitle}>Пошта вже зареєстрована</Text>
            <Text style={styles.modalMessage}>
              Користувач з цією електронною адресою вже існує. Увійдіть у свій акаунт або використайте інший email.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setShowEmailInUseModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonSecondaryText}>Інший email</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={() => {
                  setShowEmailInUseModal(false);
                  setIsLoginMode(true);
                  setPassword('');
                  resetErrors();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonPrimaryText}>Увійти</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  animationContainer: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.35,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingTop: 40,
  },
  animation: {
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_HEIGHT * 0.32,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 24,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  nameInputContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000000',
  },
  inputError: {
    borderColor: '#000000',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000000',
  },
  passwordActions: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginRight: 8,
    paddingHorizontal: 4,
  },
  actionButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#D1D5DB',
  },
  button: {
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 8,
  },
  switchText: {
    fontSize: 14,
    color: '#6B7280',
  },
  switchLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButtonSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  modalButtonSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalButtonPrimary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#000000',
    alignItems: 'center',
  },
  modalButtonPrimaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
