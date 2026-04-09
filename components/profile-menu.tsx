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

export function ProfileMenu({ userName, isWeb, direction = 'down' }: ProfileMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [passModalVisible, setPassModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [fullName, setFullName] = useState(userName);
  const [username, setUsername] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [isSaving, setIsSaving] = useState(false);
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
    if (!newPassword) return;
    setIsSaving(true);
    try {
      const api = await getApiClient();
      await api.post('/api/user/password', { password: newPassword });
      setPassModalVisible(false);
      setNewPassword('');
      Alert.alert('نجاح', 'تم تغيير كلمة المرور بنجاح');
    } catch (error) {
      Alert.alert('خطأ', 'فشل تغيير كلمة المرور');
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
          <View style={[styles.modalContent, isWeb && { width: 400 }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setPassModalVisible(false)}>
                <X size={24} color="#1d1d1f" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>تغيير كلمة المرور</Text>
            </View>

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="كلمة المرور الجديدة"
                placeholderTextColor="#86868b"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword} disabled={isSaving}>
                {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>حفظ</Text>}
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
              <TextInput
                style={styles.input}
                placeholder="الاسم الكامل"
                placeholderTextColor="#86868b"
                value={fullName}
                onChangeText={setFullName}
              />
              <TextInput
                style={styles.input}
                placeholder="اسم المستخدم"
                placeholderTextColor="#86868b"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="سؤال الأمان: ما هو اسم أمك؟"
                placeholderTextColor="#86868b"
                value={securityAnswer}
                onChangeText={setSecurityAnswer}
              />
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
  modalTitle: { fontFamily: 'CairoBold', fontSize: 22, color: '#1d1d1f' },
  form: { gap: 18 },
  input: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 16, 
    color: '#1d1d1f', 
    fontFamily: 'Cairo', 
    textAlign: 'right', 
    borderWidth: 1.5, 
    borderColor: '#f2f2f7', 
    fontSize: 15 
  },
  saveBtn: { backgroundColor: '#1d1d1f', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { color: '#fff', fontFamily: 'CairoBold', fontSize: 17 },
});
