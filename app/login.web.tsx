import { getApiClient } from '@/services/api';
import { router } from 'expo-router';
import { ChevronRight, Lock, User, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export default function WebLoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Recovery State
  const [showHelp, setShowHelp] = useState(false);
  const [recoveryUser, setRecoveryUser] = useState('');
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);

  const handleLogin = async () => {
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      setError('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    if (cleanPassword.length < 3) {
      setError('كلمة المرور قصيرة جداً');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const api = await getApiClient();
      await api.post('/api/login', {
        username: cleanUsername,
        password: cleanPassword
      });
      router.replace('/');
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول: بيانات غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async () => {
    const cleanUser = recoveryUser.trim();
    const cleanAnswer = recoveryAnswer.trim();

    if (!cleanUser || !cleanAnswer) {
      setError('يرجى إكمال بيانات الاستعادة');
      return;
    }
    setIsRecovering(true);
    setError('');
    try {
      const api = await getApiClient();
      await api.post('/api/recover', {
        username: cleanUser,
        answer: cleanAnswer
      });
      setShowHelp(false);
      // We don't automatically login for security, we just might reset or give access
      router.replace('/');
    } catch (err: any) {
      setError('إجابة سؤال الأمان أو اسم المستخدم غير صحيح');
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Left side: Background Image */}
      <View style={styles.imageSection}>
        <Image
          source={require('../assets/images/BC.jpg')}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
        <View style={styles.imageOverlay}>
          <View style={styles.brandBadge}>
            <Image
              source={require('../assets/images/smart-logo.png')}
              style={styles.smallLogo}
              resizeMode="contain"
            />
            <Text style={styles.brandName}>Smart Warehouse</Text>
          </View>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>كفاءة عالية.{'\n'}في إدارة المخزون.</Text>
            <Text style={styles.heroSubtitle}>نظام متكامل لإدارة العمليات اليومية بكل سهولة واحترافية.</Text>
          </View>
        </View>
      </View>

      {/* Right side: Login Form */}
      <View style={styles.formSection}>
        <View style={styles.loginCard}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../assets/images/smart-logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>تسجيل الدخول</Text>
            <Text style={styles.subtitle}>أهلاً بك، يرجى إدخال بياناتك للمتابعة.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>اسم المستخدم</Text>
              <View style={[styles.inputWrapper, focusedInput === 'user' && styles.focusedInput]}>
                <User size={20} color={focusedInput === 'user' ? '#1d1d1f' : '#86868b'} />
                <TextInput
                  style={[
                    styles.input,
                    isWeb && { outlineStyle: 'none' } as any
                  ]}
                  value={username}
                  onChangeText={setUsername}
                  onFocus={() => setFocusedInput('user')}
                  onBlur={() => setFocusedInput(null)}
                  autoCapitalize="none"
                  placeholder="الاسم"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>كلمة المرور</Text>
              <View style={[styles.inputWrapper, focusedInput === 'pass' && styles.focusedInput]}>
                <Lock size={20} color={focusedInput === 'pass' ? '#1d1d1f' : '#86868b'} />
                <TextInput
                  style={[
                    styles.input,
                    isWeb && { outlineStyle: 'none' } as any
                  ]}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedInput('pass')}
                  onBlur={() => setFocusedInput(null)}
                  secureTextEntry
                  placeholder="••••••••"
                />
              </View>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Text style={styles.loginBtnText}>دخول للنظام</Text>
                  <ChevronRight size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotBtn} onPress={() => setShowHelp(true)}>
              <Text style={styles.forgotText}>نسيت كلمة المرور؟</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Enterprise Edition v2.0</Text>
            <Text style={styles.footerText}>© 2026 Smart Warehouse Inc.</Text>
          </View>
        </View>
      </View>

      {/* Recovery Modal */}
      <Modal visible={showHelp} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>استعادة الوصول</Text>
              <TouchableOpacity onPress={() => setShowHelp(false)}>
                <X size={24} color="#1d1d1f" />
              </TouchableOpacity>
            </View>

            <View style={styles.recoveryForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>اسم المستخدم</Text>
                <TextInput
                  style={styles.recoveryInput}
                  value={recoveryUser}
                  onChangeText={setRecoveryUser}
                  placeholder="USERNAME"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>سؤال الأمان: ما هو اسم أمك؟</Text>
                <TextInput
                  style={styles.recoveryInput}
                  value={recoveryAnswer}
                  onChangeText={setRecoveryAnswer}
                  placeholder="الإجابة"
                />
              </View>

              <TouchableOpacity
                style={[styles.loginBtn, { marginTop: 20 }]}
                onPress={handleRecover}
                disabled={isRecovering}
              >
                {isRecovering ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.loginBtnText}>تحقق واستعادة الحساب</Text>
                )}
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
    backgroundColor: '#fff',
    flexDirection: 'row',
  },
  imageSection: {
    flex: 1.3, // Background takes more space
    backgroundColor: '#000',
    position: 'relative',
    display: isWeb && width > 900 ? 'flex' : 'none', // Hide on small screens/mobile web
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    opacity: 0.7,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 60,
    justifyContent: 'space-between',
  },
  brandBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  smallLogo: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  brandName: {
    color: '#fff',
    fontFamily: 'CairoBold',
    fontSize: 18,
    letterSpacing: 0.5,
  },
  heroContent: {
    maxWidth: 500,
    alignItems: 'flex-start',
  },
  heroTitle: {
    color: '#fff',
    fontFamily: 'CairoBold',
    fontSize: 48,
    lineHeight: 60,
    textAlign: 'left',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Cairo',
    fontSize: 18,
    marginTop: 20,
    textAlign: 'left',
    lineHeight: 28,
  },
  formSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
  },
  loginCard: {
    width: '100%',
    maxWidth: 420,
    paddingHorizontal: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#fbfbfd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f2f2f7',
  },
  logo: {
    width: 48,
    height: 48,
  },
  title: {
    fontSize: 28,
    fontFamily: 'CairoBold',
    color: '#1d1d1f',
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Cairo',
    color: '#86868b',
    marginTop: 8,
    textAlign: 'center',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontFamily: 'CairoBold',
    color: '#1d1d1f',
    textAlign: 'right',
    marginRight: 6,
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f7',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1.5,
    borderColor: 'transparent', // Smooth border appearance
  },
  focusedInput: {
    borderColor: '#1d1d1f', // Dark clean border on focus
    backgroundColor: '#fff', // White background when typing
  },
  input: {
    flex: 1,
    fontFamily: 'Cairo',
    fontSize: 15,
    color: '#1d1d1f',
    textAlign: 'right',
    marginLeft: 12,
    borderWidth: 0, // Remove default browser border
  },
  errorText: {
    color: '#d70015',
    fontFamily: 'Cairo',
    fontSize: 13,
    textAlign: 'center',
  },
  loginBtn: {
    backgroundColor: '#1d1d1f',
    height: 54,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  loginBtnText: {
    color: '#fff',
    fontFamily: 'CairoBold',
    fontSize: 16,
  },
  forgotBtn: {
    marginTop: 8,
    alignItems: 'center',
  },
  forgotText: {
    color: '#0071e3',
    fontFamily: 'CairoBold',
    fontSize: 13,
  },
  footer: {
    marginTop: 60,
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontFamily: 'Cairo',
    fontSize: 11,
    color: '#86868b',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    width: 400,
    padding: 30,
    borderRadius: 24,
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'CairoBold',
    color: '#1d1d1f',
  },
  recoveryForm: {
    gap: 16,
  },
  recoveryInput: {
    height: 50,
    backgroundColor: '#fbfbfd',
    borderRadius: 12,
    paddingHorizontal: 16,
    textAlign: 'right',
    fontFamily: 'Cairo',
    borderWidth: 1,
    borderColor: '#e5e5e7',
  },
});
