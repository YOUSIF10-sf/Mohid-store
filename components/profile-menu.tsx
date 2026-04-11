import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LogOut, Key, X, ChevronDown, User } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { getApiClient } from '@/services/api';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';

interface ProfileMenuProps {
  userName: string;
  isWeb?: boolean;
  direction?: 'up' | 'down';
}

const isWeb = Platform.OS === 'web';

export function ProfileMenu({ userName, direction = 'down' }: ProfileMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [passModalVisible, setPassModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [fullName, setFullName] = useState(userName);
  const [username, setUsername] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const { user, logout, refreshUser } = useAuth();

  useEffect(() => {
    if (user) {
      setFullName(user.full_name);
      setUsername(user.username);
      setSecurityAnswer(user.security_answer || '');
    }
  }, [user]);

  const handleLogout = async () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من رغبتك في تسجيل الخروج؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'تسجيل الخروج', 
          style: 'destructive', 
          onPress: async () => {
            await logout();
            router.replace('/login');
          } 
        }
      ]
    );
  };

  const handleChangePassword = async () => {
    const cleanOld = oldPassword.trim();
    const cleanNew = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanOld || !cleanNew || !cleanConfirm) {
      const msg = 'يرجى ملء جميع الحقول المطلوبة';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('خطأ', msg);
      return;
    }

    if (cleanNew !== cleanConfirm) {
      const msg = 'كلمة المرور الجديدة غير متطابقة';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('تنبيه', msg);
      return;
    }

    if (cleanNew.length < 4) {
      const msg = 'كلمة المرور الجديدة قصيرة جداً';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('تنبيه', msg);
      return;
    }

    setIsSaving(true);
    try {
      const api = await getApiClient();
      // Using a more standard endpoint and payload for security
      await api.post('/api/users/change-password', { 
        oldPassword: cleanOld, 
        newPassword: cleanNew 
      });
      setPassModalVisible(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      const successMsg = 'تم تحديث كلمة المرور بنجاح';
      Platform.OS === 'web' ? alert(successMsg) : Alert.alert('نجاح', successMsg);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'تعذر تغيير كلمة المرور، يرجى التأكد من الكلمة الحالية';
      Platform.OS === 'web' ? alert(errorMsg) : Alert.alert('خطأ', errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!fullName || !username || !user) return;
    setIsSaving(true);
    try {
      const api = await getApiClient();
      await api.post(`/api/user/update`, { 
        full_name: fullName, 
        username: username,
        security_answer: securityAnswer
      });
      await refreshUser();
      setEditModalVisible(false);
      Alert.alert('نجاح', 'تم تحديث البيانات بنجاح');
    } catch (error) {
      Alert.alert('خطأ', 'فشل تحديث البيانات');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.trigger, isWeb && styles.webTrigger]} 
        onPress={() => setMenuOpen(!menuOpen)}
      >
        <ChevronDown size={16} color="#86868b" />
        <Text style={[styles.userName, styles.webUserName]}>{userName}</Text>
        <View style={styles.avatar}>
          <User size={18} color="#1d1d1f" />
        </View>
      </TouchableOpacity>

      {menuOpen && (
        <View style={[
          styles.dropdown, 
          direction === 'up' ? styles.dropdownUp : styles.dropdownDown,
          styles.webDropdown
        ]}>
          <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpen(false); setEditModalVisible(true); }}>
            <Text style={[styles.menuItemText, styles.webMenuItemText]}>تعديل البيانات</Text>
            <User size={16} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpen(false); setPassModalVisible(true); }}>
            <Text style={[styles.menuItemText, styles.webMenuItemText]}>تغيير كلمة المرور</Text>
            <Key size={16} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={() => { setMenuOpen(false); handleLogout(); }}>
            <Text style={[styles.menuItemText, styles.webMenuItemText, styles.logoutText]}>تسجيل الخروج</Text>
            <LogOut size={16} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      )}

      {/* Change Password Modal */}
      <Modal visible={passModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isWeb && { width: 300, padding: 15 }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setPassModalVisible(false)}>
                <X size={24} color="#1d1d1f" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>تغيير كلمة المرور</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>كلمة المرور الحالية</Text>
                <TextInput
                  style={[styles.input, focusedInput === 'old' && styles.inputFocused]}
                  placeholder="••••••••"
                  placeholderTextColor="#86868b"
                  secureTextEntry
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  onFocus={() => setFocusedInput('old')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>كلمة المرور الجديدة</Text>
                <TextInput
                  style={[styles.input, focusedInput === 'new' && styles.inputFocused]}
                  placeholder="••••••••"
                  placeholderTextColor="#86868b"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                  onFocus={() => setFocusedInput('new')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>تأكيد كلمة المرور الجديدة</Text>
                <TextInput
                  style={[styles.input, focusedInput === 'conf' && styles.inputFocused]}
                  placeholder="••••••••"
                  placeholderTextColor="#86868b"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onFocus={() => setFocusedInput('conf')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword} disabled={isSaving}>
                {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>تحديث كلمة المرور</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isWeb && { width: 400 }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <X size={24} color="#1d1d1f" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>تعديل الحساب</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>الاسم الكامل</Text>
                <TextInput
                  style={[styles.input, focusedInput === 'name' && styles.inputFocused]}
                  placeholder="الاسم"
                  placeholderTextColor="#86868b"
                  value={fullName}
                  onChangeText={setFullName}
                  onFocus={() => setFocusedInput('name')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>اسم المستخدم</Text>
                <TextInput
                  style={[styles.input, focusedInput === 'uname' && styles.inputFocused]}
                  placeholder="اسم المستخدم"
                  placeholderTextColor="#86868b"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  onFocus={() => setFocusedInput('uname')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>سؤال الأمان</Text>
                <TextInput
                  style={[styles.input, focusedInput === 'sec' && styles.inputFocused]}
                  placeholder="الإجابة"
                  placeholderTextColor="#86868b"
                  value={securityAnswer}
                  onChangeText={setSecurityAnswer}
                  onFocus={() => setFocusedInput('sec')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
              <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateProfile} disabled={isSaving}>
                {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>حفظ التغييرات</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { zIndex: 1000 },
  trigger: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, borderRadius: 12 },
  webTrigger: { backgroundColor: 'transparent' },
  avatar: { width: 32, height: 32, borderRadius: 12, backgroundColor: '#f5f5f7', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#d2d2d7' },
  userName: { fontFamily: 'CairoBold', fontSize: 14, color: '#1d1d1f' },
  webUserName: { color: '#1d1d1f' },
  dropdown: {
    position: 'absolute',
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 8,
    width: 200,
    borderWidth: 1,
    borderColor: '#d2d2d7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  dropdownDown: { top: 50 },
  dropdownUp: { bottom: 60 },
  webDropdown: { backgroundColor: '#ffffff' },
  mobileDropdown: { right: 0 },
  menuItem: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 10 },
  menuItemText: { fontFamily: 'CairoBold', fontSize: 14, color: '#1d1d1f' },
  webMenuItemText: { color: '#1d1d1f' },
  logoutItem: { borderTopWidth: 1, borderTopColor: '#f5f5f7', marginTop: 4 },
  logoutText: { color: Colors.danger },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: { backgroundColor: '#ffffff', width: '90%', borderRadius: 28, padding: 25, borderWidth: 1, borderColor: '#f2f2f7' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontFamily: 'CairoBold', fontSize: 16, color: '#1d1d1f' },
  form: { gap: 10 },
  inputGroup: { gap: 4 },
  label: { fontFamily: 'CairoBold', fontSize: 11, color: '#1d1d1f', textAlign: 'right', marginRight: 4 },
  input: { 
    backgroundColor: '#fff', 
    borderRadius: 10, 
    padding: 10, 
    color: '#1d1d1f', 
    fontFamily: 'Cairo', 
    textAlign: 'right', 
    borderWidth: 1.2, 
    borderColor: '#eee', 
    fontSize: 13,
    outlineStyle: 'none',
  },
  inputFocused: {
    borderColor: '#1d1d1f',
  },
  saveBtn: { backgroundColor: '#1d1d1f', height: 42, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 5 },
  saveBtnText: { color: '#fff', fontFamily: 'CairoBold', fontSize: 13 },
});
