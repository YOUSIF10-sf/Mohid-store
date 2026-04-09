import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, Lock, User, X } from 'lucide-react-native';
import { getApiClient } from '@/services/api';
import { Modal } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function WebLoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Recovery State
  const [showHelp, setShowHelp] = useState(false);
  const [recoveryUser, setRecoveryUser] = useState('');
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      setError('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const api = await getApiClient();
      await api.post('/api/login', { username, password });
      router.replace('/');
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async () => {
    if (!recoveryUser || !recoveryAnswer) {
      setError('يرجى إكمال بيانات الاستعادة');
      return;
    }
    setIsRecovering(true);
    setError('');
    try {
      const api = await getApiClient();
      await api.post('/api/recover', { username: recoveryUser, answer: recoveryAnswer });
      setShowHelp(false);
      router.replace('/');
    } catch (err: any) {
      setError('إجابة سؤال الأمان أو اسم المستخدم غير صحيح');
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Graphic (Apple Style) */}
      <View style={styles.background}>
        <View style={styles.gradientCircle} />
      </View>

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
          <Text style={styles.subtitle}>أهلاً بك في نظام المخزن الذكي</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>اسم المستخدم</Text>
            <View style={styles.inputWrapper}>
               <User size={20} color="#86868b" />
               <TextInput
                 style={styles.input}
                 value={username}
                 onChangeText={setUsername}
                 autoCapitalize="none"
                 placeholder="username"
               />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>كلمة المرور</Text>
            <View style={styles.inputWrapper}>
               <Lock size={20} color="#86868b" />
               <TextInput
                 style={styles.input}
                 value={password}
                 onChangeText={setPassword}
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
            <Text style={styles.forgotText}>هل واجهت مشكلة في الدخول؟</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>Smart Warehouse Enterprise v2.0</Text>
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
    backgroundColor: '#fbfbfd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    zIndex: -1,
  },
  gradientCircle: {
    position: 'absolute',
    top: -height * 0.2,
    right: -width * 0.1,
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: 'rgba(0, 113, 227, 0.05)',
  },
  loginCard: {
    backgroundColor: '#fff',
    width: 440,
    padding: 60,
    borderRadius: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 30,
    borderWidth: 1,
    borderColor: '#d2d2d7',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f2f2f7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 18,
  },
  title: {
    fontSize: 32,
    fontFamily: 'CairoBold',
    color: '#1d1d1f',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Cairo',
    color: '#86868b',
    marginTop: 8,
  },
  form: {
    gap: 24,
  },
  inputGroup: {
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontFamily: 'CairoBold',
    color: '#1d1d1f',
    textAlign: 'right',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 60,
    borderWidth: 1,
    borderColor: '#e5e5e7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
  },
  input: {
    flex: 1,
    fontFamily: 'Cairo',
    fontSize: 16,
    color: '#1d1d1f',
    textAlign: 'right',
    marginLeft: 12,
  },
  errorText: {
    color: '#d70015',
    fontFamily: 'Cairo',
    fontSize: 13,
    textAlign: 'center',
  },
  loginBtn: {
    backgroundColor: '#1d1d1f',
    height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  loginBtnText: {
    color: '#fff',
    fontFamily: 'CairoBold',
    fontSize: 18,
  },
  footerText: {
    marginTop: 40,
    textAlign: 'center',
    fontFamily: 'Cairo',
    fontSize: 12,
    color: '#86868b',
  },
  forgotBtn: {
    marginTop: 15,
    alignItems: 'center',
  },
  forgotText: {
    color: '#0071e3',
    fontFamily: 'CairoBold',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    width: 400,
    padding: 40,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'CairoBold',
    color: '#1d1d1f',
  },
  recoveryForm: {
    gap: 20,
  },
  recoveryInput: {
    height: 54,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    textAlign: 'right',
    fontFamily: 'Cairo',
    borderWidth: 1.5,
    borderColor: '#f2f2f7',
  },
});
