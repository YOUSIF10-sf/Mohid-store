import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, router, usePathname } from 'expo-router';
import { Bell, History, LayoutDashboard, LogOut, Settings, ShieldCheck, Store, User as UserIcon } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { ActivityIndicator, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const isWeb = Platform.OS === 'web';

// --- INTERNAL COMPONENTS DEFINED OUTSIDE TO ENSURE STABILITY ---

const MobileHeader = ({ user }: { user: any }) => (
  <View style={styles.customHeader}>
    <View style={styles.headerLeftArea}>
      <TouchableOpacity 
        style={styles.headerIconBtn} 
        onPress={() => alert('التنبيهات قيد التطوير')}
        activeOpacity={0.7}
      >
        <Bell size={18} color="#1d1d1f" />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.headerProfileBox} 
        onPress={() => router.push('/profile')}
        activeOpacity={0.7}
      >
        <View style={{ flexDirection: 'column', alignItems: 'flex-end', marginLeft: 8 }}>
          <Text style={styles.profileNamePrefix}>مرحباً،</Text>
          <Text style={styles.profileName} numberOfLines={1}>{user?.full_name?.split(' ')[0]}</Text>
        </View>
        <View style={styles.headerProfileCircle}>
          <UserIcon size={14} color="#ffffff" />
        </View>
      </TouchableOpacity>
    </View>

    <Text style={styles.headerAppTitle}>SMART WAREHOUSE</Text>

    <View style={styles.headerLogoBlock}>
      <Image
        source={require('../../assets/images/smart-logo.png')}
        style={styles.headerLogoImg}
        resizeMode="cover"
      />
    </View>
  </View>
);

const WebSidebar = ({ 
  user, 
  pathname, 
  logout, 
  isAdmin, 
  isWorker, 
  hasAdminAccess 
}: { 
  user: any; 
  pathname: string; 
  logout: () => void; 
  isAdmin: boolean; 
  isWorker: boolean; 
  hasAdminAccess: boolean;
}) => {
  const navItems = [
    ...(isAdmin ? [{ name: 'index', label: 'الرئيسية', icon: LayoutDashboard, href: '/' }] : []),
    { name: 'explore', label: 'المخزن', icon: Store, href: '/explore' },
    { name: 'history', label: 'سجلاتي', icon: History, href: '/history' },
    ...(!isWorker && hasAdminAccess ? [{ name: 'admin', label: 'الإدارة', icon: ShieldCheck, href: '/admin' }] : []),
    { name: 'profile', label: 'حسابي', icon: UserIcon, href: '/profile' },
  ];

  return (
    <View style={styles.sidebar}>
        <View style={styles.sidebarHeaderTop}>
          <Image
            source={require('../../assets/images/smart-logo.png')}
            style={styles.sidebarLogo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.sidebarTitle}>المخزن الذكي</Text>

      <View style={styles.sidebarNav}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <TouchableOpacity
              key={item.name}
              style={[styles.sidebarItem, isActive && styles.sidebarItemActive]}
              onPress={() => router.push(item.href as any)}
            >
              <item.icon size={22} color={isActive ? Colors.primary : "#1d1d1f"} />
              <Text style={[styles.sidebarItemText, isActive && styles.sidebarItemTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.sidebarFooter}>
        <View style={styles.sidebarProfile}>
          <View style={styles.sidebarAvatar}>
            <UserIcon size={20} color="#1d1d1f" />
          </View>
          <View style={styles.sidebarProfileInfo}>
            <Text style={styles.sidebarProfileName} numberOfLines={1}>{user?.full_name}</Text>
            <Text style={styles.sidebarProfileRole}>{user?.role === 'admin' ? 'مدير' : 'موظف'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.sidebarLogout} onPress={logout}>
          <LogOut size={18} color="#ff3b30" />
          <Text style={styles.sidebarLogoutText}>تسجيل الخروج</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const WebTopHeader = ({ user }: { user: any }) => (
  <View style={styles.webTopHeader}>
    <View style={styles.webHeaderLeft}>
      <TouchableOpacity style={styles.webHeaderBell} activeOpacity={0.7} onPress={() => alert('التنبيهات قيد التطوير')}>
        <Bell size={18} color="#1d1d1f" />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.webHeaderProfile} onPress={() => router.push('/profile')}>
        <View style={{ flexDirection: 'column', alignItems: 'flex-end', marginLeft: 12 }}>
          <Text style={styles.webProfileNamePrefix}>مرحباً،</Text>
          <Text style={styles.webProfileName}>{user?.full_name?.split(' ')[0]}</Text>
        </View>
        <View style={styles.webAvatar}>
          <UserIcon size={14} color="#fff" />
        </View>
      </TouchableOpacity>
    </View>
    <Text style={styles.webHeaderTitle}>النظام الذكي لإدارة المخازن</Text>
  </View>
);

export default function TabLayout() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();

  const isAdmin = user?.role === 'admin';
  const isSupervisor = user?.role === 'supervisor';
  const hasAdminAccess = isAdmin || isSupervisor; 
  const isWorker = user?.role === 'employee'; 

  useEffect(() => {
    if (!loading && user) {
      const isTryingAdmin = pathname === '/admin' || pathname.startsWith('/admin/');
      const isTryingIndex = pathname === '/';
      
      if (isWorker && (isTryingAdmin || isTryingIndex)) {
        router.replace('/explore');
      }
    }
  }, [pathname, user, loading]);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {loading ? (
        <View style={{ flex: 1, backgroundColor: Colors.light.background, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <View style={{ flex: 1, flexDirection: isWeb ? 'row-reverse' : 'column' }}>
          {isWeb && <WebSidebar 
            user={user} 
            pathname={pathname} 
            logout={logout} 
            isAdmin={isAdmin} 
            isWorker={isWorker} 
            hasAdminAccess={hasAdminAccess} 
          />}

          <View style={{ flex: 1 }}>
            {isWeb && <WebTopHeader user={user} />}
            <Tabs
              screenOptions={{
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.light.textMuted,
                headerShown: !isWeb,
                headerTransparent: true,
                header: () => !isWeb ? <MobileHeader user={user} /> : null,
                tabBarStyle: isWeb ? { display: 'none' } : styles.mobileTabBar,
                tabBarLabelStyle: {
                  fontFamily: 'CairoBold',
                  fontSize: 11,
                },
                sceneStyle: isWeb ? { backgroundColor: '#fbfbfd' } : undefined,
              }}>
              <Tabs.Screen
                name="index"
                options={{
                  title: 'الرئيسية',
                  tabBarButton: isAdmin ? undefined : () => null,
                  tabBarItemStyle: isAdmin ? undefined : { display: 'none' },
                  tabBarIcon: ({ color }) => <LayoutDashboard size={24} color={color} />,
                }}
              />
              <Tabs.Screen
                name="explore"
                options={{
                  title: 'المخزن',
                  tabBarIcon: ({ color }) => <Store size={24} color={color} />,
                }}
              />
              <Tabs.Screen
                name="history"
                options={{
                  title: 'سجلاتي',
                  tabBarIcon: ({ color }) => <History size={24} color={color} />,
                }}
              />
              <Tabs.Screen
                name="admin"
                options={{
                  title: 'الإدارة',
                  tabBarButton: (hasAdminAccess && !isWorker) ? undefined : () => null,
                  tabBarItemStyle: (hasAdminAccess && !isWorker) ? undefined : { display: 'none' },
                  tabBarIcon: ({ color }) => <ShieldCheck size={24} color={color} />,
                }}
              />
              <Tabs.Screen
                name="profile"
                options={{
                  title: 'حسابي',
                  tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
                }}
              />

              <Tabs.Screen 
                name="admin/products" 
                options={{ 
                  tabBarButton: () => null,
                  tabBarItemStyle: { display: 'none' }
                }} 
              />
              <Tabs.Screen 
                name="admin/users" 
                options={{ 
                  tabBarButton: () => null,
                  tabBarItemStyle: { display: 'none' }
                }} 
              />
              <Tabs.Screen 
                name="admin/withdrawals" 
                options={{ 
                  tabBarButton: () => null,
                  tabBarItemStyle: { display: 'none' }
                }} 
              />
            </Tabs>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  customHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 48,
    marginTop: isWeb ? 0 : 45,
  },
  headerLeftArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#f5f5f7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  headerProfileBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingLeft: 4,
    paddingRight: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  profileNamePrefix: {
    fontFamily: 'Cairo',
    fontSize: 9,
    color: '#86868b',
    lineHeight: 10,
  },
  profileName: {
    fontFamily: 'CairoBold',
    fontSize: 12,
    color: '#1d1d1f',
    lineHeight: 14,
  },
  headerProfileCircle: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#1d1d1f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAppTitle: {
    fontFamily: 'CairoExtraBold',
    fontSize: 8,
    color: '#86868b',
    letterSpacing: 2,
    opacity: 0.8,
  },
  headerLogoBlock: {
    width: 36,
    height: 36,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1d1d1f',
  },
  headerLogoImg: { 
    width: '100%', 
    height: '100%',
    borderRadius: 16,
  },
  mobileTabBar: {
    backgroundColor: '#fff',
    borderTopColor: '#d2d2d7',
    height: Platform.OS === 'ios' ? 88 : 65,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 0,
    borderTopWidth: 1,
  },
  sidebar: {
    width: 280,
    height: '100%',
    backgroundColor: '#ffffff',
    borderLeftWidth: 1,
    borderLeftColor: '#d2d2d7',
    padding: 24,
    zIndex: 100,
  },
  sidebarHeaderTop: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sidebarLogo: {
    width: 60,
    height: 60,
    borderRadius: 20,
    overflow: 'hidden',
  },
  sidebarTitle: {
    fontFamily: 'CairoBold',
    fontSize: 20,
    color: '#1d1d1f',
    textAlign: 'right',
    marginTop: 10,
  },
  sidebarNav: {
    flex: 1,
    gap: 8,
    marginTop: 20,
  },
  sidebarItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 15,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'transparent',
  },
  sidebarItemActive: {
    backgroundColor: '#f5f5f7',
  },
  sidebarItemText: {
    fontFamily: 'CairoBold',
    fontSize: 16,
    color: '#1d1d1f',
    textAlign: 'right',
  },
  sidebarItemTextActive: {
    color: Colors.primary,
  },
  sidebarFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f5f5f7',
    paddingTop: 24,
    gap: 20,
  },
  sidebarProfile: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  sidebarAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f5f5f7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d2d2d7',
  },
  sidebarProfileInfo: {
    alignItems: 'flex-end',
    flex: 1,
  },
  sidebarProfileName: {
    fontFamily: 'CairoBold',
    fontSize: 15,
    color: '#1d1d1f',
  },
  sidebarProfileRole: {
    fontFamily: 'Cairo',
    fontSize: 12,
    color: '#86868b',
    marginTop: 2,
  },
  sidebarLogout: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    padding: 10,
  },
  sidebarLogoutText: {
    fontFamily: 'CairoBold',
    fontSize: 14,
    color: '#ff3b30',
  },
  webTopHeader: {
    height: 70,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f7',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 10,
  },
  webHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  webHeaderBell: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e5e7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webHeaderProfile: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#fbfbfd',
    padding: 6,
    paddingRight: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f2f2f7',
  },
  webProfileNamePrefix: {
    fontFamily: 'Cairo',
    fontSize: 10,
    color: '#86868b',
  },
  webProfileName: {
    fontFamily: 'CairoBold',
    fontSize: 13,
    color: '#1d1d1f',
  },
  webAvatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#1d1d1f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webHeaderTitle: {
    fontFamily: 'CairoBold',
    fontSize: 16,
    color: '#1d1d1f',
    opacity: 0.6,
  }
});
