import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { MotiView } from 'moti';
import { updateProfile, deleteUser, reauthenticateWithCredential, EmailAuthProvider, updatePassword, updateEmail } from 'firebase/auth';
import { doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebaseConfig';
import { AuthContext } from '@/context/AuthContext';
import { saveUser, removeUser } from '@/services/storage';
import { LoadingSpinner } from '@/components/ui';

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
  'gmail.com', 'ukr.net', 'i.ua', 'meta.ua', 'bigmir.net',
  'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'proton.me', 'protonmail.com',
];

const validateName = (name: string, fieldName: string): { isValid: boolean; error?: string } => {
  if (!name.trim()) {
    return { isValid: false, error: `Введіть ${fieldName}` };
  }
  if (name.trim().length < 2) {
    return { isValid: false, error: 'Мінімум 2 літери' };
  }
  if (name.trim().length > 15) {
    return { isValid: false, error: 'Максимум 15 літер' };
  }
  const nameRegex = /^[a-zA-Zа-яА-ЯіІїЇєЄґҐ']+$/;
  if (!nameRegex.test(name.trim())) {
    return { isValid: false, error: 'Тільки літери' };
  }
  return { isValid: true };
};

const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.trim()) {
    return { isValid: false, error: 'Введіть email адресу' };
  }
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, error: 'Невірний формат email' };
  }
  const domain = email.trim().toLowerCase().split('@')[1];
  if (!ALLOWED_EMAIL_DOMAINS.includes(domain)) {
    return { isValid: false, error: 'Непідтримуваний домен пошти' };
  }
  return { isValid: true };
};

const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  if (!password.trim()) {
    return { isValid: false, errors: ['Введіть пароль'] };
  }
  if (password.length < 8) errors.push('мінімум 8 символів');
  if (!/[A-Z]/.test(password)) errors.push('велика літера');
  if (!/[a-z]/.test(password)) errors.push('маленька літера');
  if (!/[0-9]/.test(password)) errors.push('цифра');
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push('спецсимвол');
  return { isValid: errors.length === 0, errors };
};

const ErrorHint: React.FC<{ message: string }> = ({ message }) => (
  <View style={styles.errorHintContainer}>
    <View style={styles.errorHintIconContainer}>
      <Ionicons name="information-circle" size={18} color="#6B7280" />
    </View>
    <Text style={styles.errorHintText}>{message}</Text>
  </View>
);

export function EditProfileScreen() {
  const navigation = useNavigation();
  const { user, logout, updateUser } = useContext(AuthContext);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [initialFirstName, setInitialFirstName] = useState('');
  const [initialLastName, setInitialLastName] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.uid) {
        setIsLoadingData(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const loadedFirstName = userData.firstName || '';
          const loadedLastName = userData.lastName || '';

          setFirstName(loadedFirstName);
          setLastName(loadedLastName);
          setInitialFirstName(loadedFirstName);
          setInitialLastName(loadedLastName);
        } else {
          const nameParts = (user?.displayName || '').split(' ');
          const fallbackFirstName = nameParts[0] || '';
          const fallbackLastName = nameParts.slice(1).join(' ') || '';

          setFirstName(fallbackFirstName);
          setLastName(fallbackLastName);
          setInitialFirstName(fallbackFirstName);
          setInitialLastName(fallbackLastName);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        const nameParts = (user?.displayName || '').split(' ');
        const fallbackFirstName = nameParts[0] || '';
        const fallbackLastName = nameParts.slice(1).join(' ') || '';

        setFirstName(fallbackFirstName);
        setLastName(fallbackLastName);
        setInitialFirstName(fallbackFirstName);
        setInitialLastName(fallbackLastName);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadUserData();
  }, [user?.uid]);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [showNoChangesModal, setShowNoChangesModal] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPasswordField, setShowPasswordField] = useState(false);

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState('');
  const [newEmailForChange, setNewEmailForChange] = useState('');
  const [emailChangeError, setEmailChangeError] = useState('');
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [showEmailSuccessModal, setShowEmailSuccessModal] = useState(false);
  const [showEmailPasswordInput, setShowEmailPasswordInput] = useState(false);

  const handleSave = async () => {
    setFirstNameError('');
    setLastNameError('');
    setPasswordError('');

    const nameChanged = firstName.trim() !== initialFirstName || lastName.trim() !== initialLastName;
    const passwordChanged = newPassword.trim().length > 0;

    if (!nameChanged && !passwordChanged) {
      setShowNoChangesModal(true);
      return;
    }

    if (nameChanged) {
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
    }

    if (passwordChanged) {
      const validation = validatePassword(newPassword);
      if (!validation.isValid) {
        setPasswordError(`Потрібно: ${validation.errors.join(', ')}`);
        return;
      }
    }

    setIsLoading(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Користувач не авторизований');

      if (nameChanged) {
        const fullName = `${firstName.trim()} ${lastName.trim()}`;

        await updateProfile(currentUser, { displayName: fullName });

        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        });

        const updatedUser = {
          uid: currentUser.uid,
          email: currentUser.email || '',
          displayName: fullName,
        };

        await saveUser(updatedUser);
        updateUser(updatedUser);

        setInitialFirstName(firstName.trim());
        setInitialLastName(lastName.trim());
      }

      if (passwordChanged) {
        await updatePassword(currentUser, newPassword);
        setNewPassword('');
      }

      setSuccessMessage('Зміни успішно збережено');
      setShowSuccessModal(true);
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        setPasswordError('Потрібна повторна авторизація');
      } else if (error.code === 'auth/too-many-requests') {
        setPasswordError('Забагато спроб. Спробуйте пізніше');
      } else {
        setFirstNameError(error.message || 'Не вдалося зберегти зміни');
      }
    } finally {
      setIsLoading(false);
    }
  };


  const startEmailChange = () => {
    setShowEmailModal(true);
    setCurrentPasswordForEmail('');
    setNewEmailForChange('');
    setEmailChangeError('');
    setShowEmailPasswordInput(false);
  };

  const handleEmailChange = async () => {
    setEmailChangeError('');

    if (!currentPasswordForEmail.trim()) {
      setEmailChangeError('Введіть поточний пароль');
      return;
    }

    setIsChangingEmail(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) throw new Error('Користувач не авторизований');

      const credential = EmailAuthProvider.credential(currentUser.email, currentPasswordForEmail);
      await reauthenticateWithCredential(currentUser, credential);

      if (!newEmailForChange.trim()) {
        setIsChangingEmail(false);
        setEmailChangeError('Введіть нову пошту');
        return;
      }

      const validation = validateEmail(newEmailForChange);
      if (!validation.isValid) {
        setIsChangingEmail(false);
        setEmailChangeError(validation.error || 'Невірний email');
        return;
      }

      if (newEmailForChange.trim().toLowerCase() === user?.email?.toLowerCase()) {
        setIsChangingEmail(false);
        setEmailChangeError('Нова пошта співпадає з поточною');
        return;
      }

      await updateEmail(currentUser, newEmailForChange.trim());

      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        email: newEmailForChange.trim(),
      });

      const updatedUser = {
        uid: currentUser.uid,
        email: newEmailForChange.trim(),
        displayName: currentUser.displayName || '',
      };
      await saveUser(updatedUser);
      updateUser(updatedUser);

      setShowEmailModal(false);
      setShowEmailSuccessModal(true);
    } catch (error: any) {
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setEmailChangeError('Невірний пароль');
      } else if (error.code === 'auth/email-already-in-use') {
        setEmailChangeError('Ця пошта вже використовується');
      } else if (error.code === 'auth/too-many-requests') {
        setEmailChangeError('Забагато спроб. Спробуйте пізніше');
      } else if (error.code === 'auth/requires-recent-login') {
        setEmailChangeError('Потрібна повторна авторизація');
      } else {
        setEmailChangeError(error.message || 'Не вдалося змінити пошту');
      }
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeletePasswordError('');

    if (!deletePassword.trim()) {
      setDeletePasswordError('Введіть пароль для підтвердження');
      return;
    }

    setIsDeleting(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) throw new Error('Користувач не авторизований');

      const credential = EmailAuthProvider.credential(currentUser.email, deletePassword);
      await reauthenticateWithCredential(currentUser, credential);

      const userRef = doc(db, 'users', currentUser.uid);
      await deleteDoc(userRef);
      await deleteUser(currentUser);
      await removeUser();

      setShowDeleteModal(false);
      await logout();
    } catch (error: any) {
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setDeletePasswordError('Невірний пароль');
      } else if (error.code === 'auth/too-many-requests') {
        setDeletePasswordError('Забагато спроб. Спробуйте пізніше');
      } else {
        setDeletePasswordError(error.message || 'Не вдалося видалити акаунт');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoadingData) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#000000" />
          </Pressable>
          <Text style={styles.headerTitle}>Редагування профілю</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <LoadingSpinner size={50} color="#1A1A1A" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        behavior="height"
        style={styles.keyboardView}
      >
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          style={styles.header}
        >
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#000000" />
          </Pressable>
          <Text style={styles.headerTitle}>Редагування профілю</Text>
        </MotiView>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <MotiView
            from={{ opacity: 0, translateY: 40, scale: 0.95 }}
            animate={{ opacity: 1, translateY: 0, scale: 1 }}
            transition={{ type: 'timing', duration: 500, delay: 150 }}
            style={styles.card}
          >
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400, delay: 300 }}
            >
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Ім'я</Text>
                <TextInput
                  style={[styles.input, firstNameError ? styles.inputError : null]}
                  placeholder="Ваше ім'я"
                  placeholderTextColor="#9CA3AF"
                  value={firstName}
                  onChangeText={(text) => {
                    setFirstName(text);
                    setFirstNameError('');
                  }}
                  autoCapitalize="words"
                  autoCorrect={false}
                  maxLength={15}
                  editable={!isLoading}
                />
                {firstNameError ? <ErrorHint message={firstNameError} /> : null}
              </View>
            </MotiView>

            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400, delay: 400 }}
            >
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Прізвище</Text>
                <TextInput
                  style={[styles.input, lastNameError ? styles.inputError : null]}
                  placeholder="Ваше прізвище"
                  placeholderTextColor="#9CA3AF"
                  value={lastName}
                  onChangeText={(text) => {
                    setLastName(text);
                    setLastNameError('');
                  }}
                  autoCapitalize="words"
                  autoCorrect={false}
                  maxLength={15}
                  editable={!isLoading}
                />
                {lastNameError ? <ErrorHint message={lastNameError} /> : null}
              </View>
            </MotiView>

            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400, delay: 450 }}
            >
              <Pressable style={styles.inputContainer} onPress={startEmailChange}>
                <Text style={styles.label}>Пошта</Text>
                <View style={styles.readOnlyField}>
                  <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.readOnlyIcon} />
                  <Text style={styles.readOnlyText} numberOfLines={1}>{user?.email || 'email@example.com'}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </View>
              </Pressable>
            </MotiView>

            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400, delay: 500 }}
            >
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Пароль</Text>
                <View style={[styles.passwordInputWrapper, passwordError ? styles.inputError : null]}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Новий пароль"
                    placeholderTextColor="#9CA3AF"
                    value={newPassword}
                    onChangeText={(text) => {
                      setNewPassword(text);
                      setPasswordError('');
                    }}
                    secureTextEntry={!showPasswordField}
                    editable={!isLoading}
                  />
                  <Pressable
                    onPress={() => {
                      const generated = generateStrongPassword();
                      setNewPassword(generated);
                      setShowPasswordField(true);
                      setPasswordError('');
                    }}
                    style={styles.passwordToggle}
                  >
                    <Ionicons name="key-outline" size={20} color="#6B7280" />
                  </Pressable>
                  <Pressable onPress={() => setShowPasswordField(!showPasswordField)} style={styles.passwordToggle}>
                    <Ionicons name={showPasswordField ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6B7280" />
                  </Pressable>
                </View>
                {passwordError ? <ErrorHint message={passwordError} /> : null}
              </View>
            </MotiView>

            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400, delay: 550 }}
            >
              <Pressable
                style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Зберегти</Text>
                )}
              </Pressable>
            </MotiView>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 40, scale: 0.95 }}
            animate={{ opacity: 1, translateY: 0, scale: 1 }}
            transition={{ type: 'timing', duration: 500, delay: 250 }}
            style={styles.deleteCard}
          >
            <View style={styles.deleteCardHeader}>
              <View style={styles.deleteIconContainer}>
                <Ionicons name="trash-outline" size={24} color="#000000" />
              </View>
              <View style={styles.deleteTextContainer}>
                <Text style={styles.deleteTitle}>Видалення акаунта</Text>
                <Text style={styles.deleteSubtitle}>Акаунт буде видалено назавжди</Text>
              </View>
            </View>
            <Pressable style={styles.deleteButton} onPress={() => setShowDeleteModal(true)}>
              <Text style={styles.deleteButtonText}>Видалити акаунт</Text>
            </Pressable>
          </MotiView>
        </ScrollView>

        <Modal
          visible={showEmailModal}
          transparent
          animationType="fade"
          onRequestClose={() => !isChangingEmail && setShowEmailModal(false)}
        >
          <View style={styles.modalOverlay}>
            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 300 }}
              style={styles.modalContent}
            >
              <View style={styles.modalIconContainer}>
                <Ionicons name="mail-outline" size={48} color="#000000" />
              </View>
              <Text style={styles.modalTitle}>Змінити пошту</Text>
              <Text style={styles.modalDescription}>
                Введіть пароль та нову пошту
              </Text>

              <View style={styles.modalInputContainer}>
                <View style={[styles.passwordInputWrapper, emailChangeError ? styles.inputError : null]}>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Поточний пароль"
                    placeholderTextColor="#9CA3AF"
                    value={currentPasswordForEmail}
                    onChangeText={(text) => {
                      setCurrentPasswordForEmail(text);
                      setEmailChangeError('');
                    }}
                    secureTextEntry={!showEmailPasswordInput}
                    editable={!isChangingEmail}
                  />
                  <Pressable onPress={() => setShowEmailPasswordInput(!showEmailPasswordInput)} style={styles.passwordToggle}>
                    <Ionicons name={showEmailPasswordInput ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6B7280" />
                  </Pressable>
                </View>

                <TextInput
                  style={[styles.modalInputFull, { marginTop: 12 }]}
                  placeholder="Нова пошта"
                  placeholderTextColor="#9CA3AF"
                  value={newEmailForChange}
                  onChangeText={(text) => {
                    setNewEmailForChange(text);
                    setEmailChangeError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isChangingEmail}
                />

                {emailChangeError ? <ErrorHint message={emailChangeError} /> : null}
              </View>

              <View style={styles.modalButtons}>
                <Pressable
                  style={styles.modalCancelButton}
                  onPress={() => setShowEmailModal(false)}
                  disabled={isChangingEmail}
                >
                  <Text style={styles.modalCancelButtonText}>Скасувати</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalConfirmButton, isChangingEmail && styles.modalButtonDisabled]}
                  onPress={handleEmailChange}
                  disabled={isChangingEmail}
                >
                  {isChangingEmail ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.modalConfirmButtonText}>Змінити</Text>
                  )}
                </Pressable>
              </View>
            </MotiView>
          </View>
        </Modal>

        <Modal
          visible={showEmailSuccessModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowEmailSuccessModal(false)}
        >
          <View style={styles.modalOverlay}>
            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 300 }}
              style={styles.modalContent}
            >
              <View style={styles.successIconContainer}>
                <Ionicons name="checkmark-circle-outline" size={48} color="#000000" />
              </View>
              <Text style={styles.modalTitle}>Успішно!</Text>
              <Text style={styles.modalDescription}>
                Пошту успішно змінено
              </Text>
              <Pressable
                style={styles.successButton}
                onPress={() => setShowEmailSuccessModal(false)}
              >
                <Text style={styles.successButtonText}>ОК</Text>
              </Pressable>
            </MotiView>
          </View>
        </Modal>

        <Modal
          visible={showDeleteModal}
          transparent
          animationType="fade"
          onRequestClose={() => !isDeleting && setShowDeleteModal(false)}
        >
          <View style={styles.modalOverlay}>
            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 300 }}
              style={styles.modalContent}
            >
              <View style={styles.modalIconContainer}>
                <Ionicons name="warning-outline" size={48} color="#000000" />
              </View>
              <Text style={styles.modalTitle}>Видалити акаунт?</Text>
              <Text style={styles.modalDescription}>
                Ця дія незворотна. Всі ваші дані буде видалено назавжди.
              </Text>

              <View style={styles.modalInputContainer}>
                <View style={[styles.passwordInputWrapper, deletePasswordError ? styles.inputError : null]}>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Введіть пароль"
                    placeholderTextColor="#9CA3AF"
                    value={deletePassword}
                    onChangeText={(text) => {
                      setDeletePassword(text);
                      setDeletePasswordError('');
                    }}
                    secureTextEntry={!showDeletePassword}
                    editable={!isDeleting}
                  />
                  <Pressable onPress={() => setShowDeletePassword(!showDeletePassword)} style={styles.passwordToggle}>
                    <Ionicons name={showDeletePassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6B7280" />
                  </Pressable>
                </View>
                {deletePasswordError ? <ErrorHint message={deletePasswordError} /> : null}
              </View>

              <View style={styles.modalButtons}>
                <Pressable
                  style={styles.modalCancelButton}
                  onPress={() => {
                    setShowDeleteModal(false);
                    setDeletePassword('');
                    setDeletePasswordError('');
                  }}
                  disabled={isDeleting}
                >
                  <Text style={styles.modalCancelButtonText}>Скасувати</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalConfirmButton, isDeleting && styles.modalButtonDisabled]}
                  onPress={handleDeleteAccount}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.modalConfirmButtonText}>Видалити</Text>
                  )}
                </Pressable>
              </View>
            </MotiView>
          </View>
        </Modal>

        <Modal
          visible={showSuccessModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSuccessModal(false)}
        >
          <View style={styles.modalOverlay}>
            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 300 }}
              style={styles.modalContent}
            >
              <View style={styles.successIconContainer}>
                <Ionicons name="checkmark-circle-outline" size={48} color="#000000" />
              </View>
              <Text style={styles.modalTitle}>Успішно!</Text>
              <Text style={styles.modalDescription}>{successMessage}</Text>
              <Pressable
                style={styles.successButton}
                onPress={() => setShowSuccessModal(false)}
              >
                <Text style={styles.successButtonText}>ОК</Text>
              </Pressable>
            </MotiView>
          </View>
        </Modal>

        <Modal
          visible={showNoChangesModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowNoChangesModal(false)}
        >
          <View style={styles.modalOverlay}>
            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 300 }}
              style={styles.modalContent}
            >
              <View style={styles.noChangesIconContainer}>
                <Ionicons name="create-outline" size={48} color="#000000" />
              </View>
              <Text style={styles.modalTitle}>Немає змін</Text>
              <Text style={styles.modalDescription}>
                Щоб оновити профіль, внесіть зміни.
              </Text>
              <Pressable style={styles.successButton} onPress={() => setShowNoChangesModal(false)}>
                <Text style={styles.successButtonText}>Зрозуміло</Text>
              </Pressable>
            </MotiView>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7F8',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
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
    backgroundColor: '#F5F7F8',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#000000',
  },
  inputError: {
    borderColor: '#E5E7EB',
  },
  errorHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
  },
  errorHintText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 8,
  },
  errorHintIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteCard: {
    borderRadius: 16,
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginTop: 16,
  },
  deleteCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  deleteTextContainer: {
    flex: 1,
  },
  deleteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  deleteSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  deleteButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalInputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  modalInputFull: {
    backgroundColor: '#F5F7F8',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000000',
    width: '100%',
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7F8',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#000000',
  },
  modalInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000000',
  },
  passwordToggle: {
    padding: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  modalButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successButton: {
    width: '100%',
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  noChangesIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  readOnlyField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7F8',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  readOnlyIcon: {
    marginRight: 12,
  },
  readOnlyText: {
    flex: 1,
    fontSize: 16,
    color: '#6B7280',
  },
});
