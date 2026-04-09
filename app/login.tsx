import { router } from 'expo-router';
import { ChevronRight, Lock, User, ShieldQuestion, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  useWindowDimensions,
  Modal
} from 'react-native';
import { Colors } from '../constants/theme';
import { getApiClient } from '../services/api';

const isWeb = Platform.OS === 'web';

export default function LoginScreen() {
  const { width } = useWindowDimensions();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [showHelp, setShowHelp] = useState(false);
  const [recoveryUser, setRecoveryUser] = useState('');
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      if (isWeb) alert('يرجى إدخل البيانات');
      else Alert.alert('تنبيه', 'يرجى إدخال البيانات');
      return;
    }
    setLoading(true);
    try {
      const api = await getApiClient();
      await api.post('/api/login', { username, password });
      router.replace('/');
    } catch (error: any) {
      const message = error.response?.data?.error || 'خطأ في الدخول';
      Alert.alert('خطأ', message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async () => {
    if (!recoveryUser || !recoveryAnswer) return;
    setIsRecovering(true);
    try {
      const api = await getApiClient();
      await api.post('/api/recover', { username: recoveryUser, answer: recoveryAnswer });
      setShowHelp(false);
      router.replace('/');
    } catch (err) {
      Alert.alert('خطأ', 'البيانات غير صحيحة');
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.backgroundGraphic, { top: -width * 0.1, right: -width * 0.15, width: width * 0.8, height: width * 0.8, borderRadius: width * 0.4 }]} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.loginCard}>
            
            {/* Professional Logo Display */}
            <View style={styles.logoPresentation}>
              <Image 
                 source={require('../assets/images/smart-logo.png')} 
                 style={styles.heroLogo} 
                 resizeMode="contain" 
              />
              <View style={styles.logoGlow} />
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>اسم المستخدم</Text>
                <View style={styles.inputWrapper}>
                  <TextInput style={styles.input} placeholder="أدخل اسم المستخدم" value={username} onChangeText={setUsername} autoCapitalize="none" />
                  <User size={18} color="#1d1d1f" />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>كلمة المرور</Text>
                <View style={styles.inputWrapper}>
                  <TextInput style={styles.input} placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry />
                  <Lock size={18} color="#1d1d1f" />
                </View>
              </View>

              <TouchableOpacity style={[styles.loginBtn, loading && styles.disabledBtn]} onPress={handleLogin} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Text style={styles.loginBtnText}>دخول للنظام</Text>
                    <ChevronRight size={18} color="#fff" />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.forgotBtn} onPress={() => setShowHelp(true)}>
                <Text style={styles.forgotText}>هل واجهت مشكلة؟</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Smart Warehouse Tech Team</Text>
              <Text style={styles.versionText}>v2.1.0 Premium Professional</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showHelp} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowHelp(false)}><X size={22} color="#1d1d1f" /></TouchableOpacity>
              <Text style={styles.modalTitle}>استعادة الوصول</Text>
            </View>
            
            <View style={styles.recoveryForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>اسم المستخدم</Text>
                <TextInput style={styles.inputRecovery} value={recoveryUser} onChangeText={setRecoveryUser} placeholder="اسم المستخدم" autoCapitalize="none" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>ما هو اسم أمك؟</Text>
                <TextInput style={styles.inputRecovery} value={recoveryAnswer} onChangeText={setRecoveryAnswer} placeholder="الإجابة" />
              </View>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleRecover} disabled={isRecovering}>
                {isRecovering ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmText}>تحقق والدخول</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 20 },
  backgroundGraphic: { position: 'absolute', backgroundColor: 'rgba(0, 0, 0, 0.02)', zIndex: -1 },
  loginCard: { width: '90%', maxWidth: 400, backgroundColor: '#ffffff', borderRadius: 32, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#f0f0f0', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 20, elevation: 4 },
  
  logoPresentation: { 
    width: 140, 
    height: 140, 
    marginBottom: 25, 
    justifyContent: 'center', 
    alignItems: 'center', 
    position: 'relative',
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#f2f2f7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    overflow: 'hidden'
  },
  heroLogo: { 
    width: '100%', 
    height: '100%',
    borderRadius: 24
  },
  logoGlow: { position: 'absolute', width: 120, height: 120, backgroundColor: 'rgba(29, 29, 31, 0.03)', borderRadius: 60, zIndex: 1 },

  form: { width: '100%', gap: 15 },
  inputGroup: { width: '100%', gap: 6 },
  label: { fontFamily: 'CairoBold', fontSize: 11, color: '#1d1d1f', textAlign: 'right' },
  inputWrapper: { 
    width: '100%', 
    height: 54, 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    borderWidth: 1.2, 
    borderColor: '#f2f2f7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1
  },
  input: { flex: 1, height: '100%', color: '#1d1d1f', fontSize: 14, fontFamily: 'Cairo', textAlign: 'right' },
  
  loginBtn: { width: '100%', height: 52, backgroundColor: '#1d1d1f', borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 10 },
  disabledBtn: { opacity: 0.7 },
  loginBtnText: { color: '#fff', fontSize: 15, fontFamily: 'CairoBold' },
  
  forgotBtn: { marginTop: 10, alignItems: 'center' },
  forgotText: { color: '#86868b', fontFamily: 'CairoBold', fontSize: 11, textDecorationLine: 'underline' },
  
  footer: { marginTop: 30, alignItems: 'center', gap: 4 },
  footerText: { color: '#86868b', fontSize: 11, fontFamily: 'CairoBold' },
  versionText: { color: '#d2d2d7', fontSize: 10, fontFamily: 'Cairo' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 30, paddingBottom: 60 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontFamily: 'CairoBold', fontSize: 18 },
  recoveryForm: { gap: 15 },
  inputRecovery: { 
    height: 52, 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    paddingHorizontal: 16, 
    textAlign: 'right', 
    fontFamily: 'Cairo',
    borderWidth: 1.2,
    borderColor: '#f2f2f7'
  },
  confirmBtn: { height: 54, backgroundColor: '#1d1d1f', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  confirmText: { color: '#fff', fontFamily: 'CairoBold', fontSize: 16 }
});
