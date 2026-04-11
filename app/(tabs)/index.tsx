import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  ChevronRight,
  Bell,
  LayoutGrid,
  Zap
} from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { getApiClient } from '@/services/api';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { BarChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

interface Stats {
  total_products: number;
  out_of_stock: number;
  inventory_health: number;
  top_products: { name: string; withdrawals: number }[];
  recent_products?: { name: string; current_quantity: number }[];
}

export default function UnifiedDashboardScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.replace('/explore');
    }
  }, [user]);

  const fetchStats = React.useCallback(async () => {
    try {
      const api = await getApiClient();
      const [statsRes, productsRes] = await Promise.all([
        api.get('/api/stats'),
        api.get('/api/products')
      ]);
      
      const statsData = statsRes.data as Stats;
      const productsData = productsRes.data as any[];
      
      // Inject recent products into stats for the chart
      statsData.recent_products = productsData
        .slice(-5)
        .map(p => ({ name: p.name, current_quantity: p.current_quantity }));

      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchStats();
    }, [fetchStats])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const StatCard = ({ title, value, icon: Icon, color, subValue }: any) => (
    <View style={styles.statCard}>
      <View style={[styles.iconContainer, { backgroundColor: color + '10' }]}>
        <Icon size={16} color={color} />
      </View>
      <View style={styles.statInfo}>
        <Text style={styles.statLabel}>{title}</Text>
        <Text style={styles.statValue}>{value}</Text>
        {subValue && <Text style={styles.statSubValue}>{subValue}</Text>}
      </View>
    </View>
  );

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(29, 29, 31, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(134, 134, 139, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: { r: '6', strokeWidth: '2', stroke: '#1d1d1f' }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Zap size={16} color={Colors.primary} />
        <Text style={styles.headerSubtitle}>إحصائيات النظام</Text>
      </View>
      <Text style={styles.headerTitle}>أداء المستودع اليوم.</Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.maxContainer}>
        {renderHeader()}

        <View style={styles.statsGrid}>
          <View style={styles.statCardWrapper}>
            <StatCard 
              title="المنتجات" 
              value={stats?.total_products || 0} 
              icon={Package} 
              color="#1d1d1f"
            />
          </View>
          <View style={styles.statCardWrapper}>
            <StatCard 
              title="منتهية" 
              value={stats?.out_of_stock || 0} 
              icon={AlertTriangle} 
              color={Colors.danger}
            />
          </View>
          <View style={styles.statCardWrapper}>
            <StatCard 
              title="الصحة" 
              value={`${stats?.inventory_health || 0}%`} 
              icon={TrendingUp} 
              color={Colors.success}
              subValue="مستوى التوفر"
            />
          </View>
        </View>

        <View style={styles.bottomSection}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>الأكثر سحباً</Text>
              <TrendingUp size={14} color="#1d1d1f" />
            </View>
            
            <View style={styles.rankingList}>
              {stats?.top_products.map((item, index) => (
                <View key={index} style={styles.rankingItem}>
                  <View style={styles.rankingInfo}>
                    <Text style={styles.rankingName}>{item.name}</Text>
                    <Text style={styles.rankingValue}>{item.withdrawals} سحب</Text>
                  </View>
                  <View style={[styles.rankBadge, index === 0 && styles.rankBadgeTop]}>
                    <Text style={styles.rankText}>{index + 1}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {stats && (
            <View style={styles.chartsContainer}>
              {stats.top_products.length > 0 && (
                <View style={[styles.chartSection, !isWeb && { width: width - 36 }]}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>الأكثر سحباً (أداء)</Text>
                    <TrendingUp size={14} color="#1d1d1f" />
                  </View>
                  <BarChart
                    data={{
                      labels: stats.top_products.slice(0, 5).map(p => p.name.substring(0, 6)),
                      datasets: [{ data: stats.top_products.slice(0, 5).map(p => p.withdrawals) }]
                    }}
                    width={isWeb ? 500 : width - 64}
                    height={180}
                    yAxisLabel=""
                    yAxisSuffix=""
                    chartConfig={chartConfig}
                    style={styles.chart}
                  />
                </View>
              )}

              {stats.recent_products && stats.recent_products.length > 0 && (
                <View style={[styles.chartSection, !isWeb && { width: width - 36 }]}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>كميات المنتجات الجديدة</Text>
                    <Package size={14} color="#1d1d1f" />
                  </View>
                  <BarChart
                    data={{
                      labels: stats.recent_products.map(p => p.name.substring(0, 6)),
                      datasets: [{ data: stats.recent_products.map(p => p.current_quantity) }]
                    }}
                    width={isWeb ? 500 : width - 64}
                    height={180}
                    yAxisLabel=""
                    yAxisSuffix=""
                    chartConfig={{
                      ...chartConfig,
                      color: (opacity = 1) => `rgba(0, 113, 227, ${opacity})`,
                    }}
                    style={styles.chart}
                  />
                </View>
              )}
            </View>
          )}

          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => router.push('/explore')}
            activeOpacity={0.8}
          >
            <View style={styles.quickActionText}>
              <Text style={styles.quickActionTitle}>سحب سريع</Text>
              <Text style={styles.quickActionSubtitle}>الانتقال للمخزن</Text>
            </View>
            <LayoutGrid size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fbfbfd',
  },
  scrollContent: {
    paddingTop: 135,
    paddingBottom: 100,
    alignItems: 'center',
  },
  maxContainer: {
    width: '100%',
    maxWidth: isWeb ? 1100 : '100%',
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fbfbfd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dashboardActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bellBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#d2d2d7', justifyContent: 'center', alignItems: 'center' },
  webProfileHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', padding: 4, borderRadius: 12, borderWidth: 1, borderColor: '#f2f2f7' },
  profileTextContainer: { alignItems: 'flex-end' },
  profileNamePrefix: { fontFamily: 'Cairo', fontSize: 9, color: '#86868b' },
  profileName: { fontFamily: 'CairoBold', fontSize: 11, color: '#1d1d1f' },
  profileCircleSmall: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#1d1d1f', justifyContent: 'center', alignItems: 'center' },
  headerTop: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  headerSubtitle: {
    fontFamily: 'CairoBold',
    fontSize: 12,
    color: '#86868b',
  },
  headerTitle: {
    fontFamily: 'CairoBold',
    fontSize: 18,
    color: '#1d1d1f',
    textAlign: 'right',
  },
  statsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 16,
    width: '100%',
  },
  statCardWrapper: {
    width: isWeb ? '33.33%' : '50%',
    padding: 6,
    height: isWeb ? undefined : 110,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 6,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statInfo: {
    alignItems: 'flex-end',
  },
  statLabel: {
    fontFamily: 'Cairo',
    fontSize: 11,
    color: '#86868b',
  },
  statValue: {
    fontFamily: 'CairoBold',
    fontSize: 14,
    color: '#1d1d1f',
  },
  statSubValue: {
    fontFamily: 'Cairo',
    fontSize: 9,
    color: '#1d1d1f',
    marginTop: 2,
  },
  bottomSection: {
    gap: 12,
    width: '100%',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#d2d2d7',
  },
  chartSection: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#d2d2d7',
    marginBottom: 12,
    alignItems: 'center',
    width: '100%',
    minHeight: isWeb ? undefined : 240,
  },
  chartsContainer: {
    flexDirection: isWeb ? 'row' : 'column',
    gap: 12,
    width: '100%',
    marginBottom: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'CairoBold',
    fontSize: 14,
    color: '#1d1d1f',
  },
  rankingList: {
    gap: 10,
  },
  rankingItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  rankingInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  rankingName: {
    fontFamily: 'CairoBold',
    fontSize: 13,
    color: '#1d1d1f',
  },
  rankingValue: {
    fontFamily: 'Cairo',
    fontSize: 11,
    color: '#86868b',
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#f5f5f7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d2d2d7',
  },
  rankBadgeTop: {
    backgroundColor: '#1d1d1f',
    borderColor: '#1d1d1f',
  },
  rankText: {
    fontFamily: 'CairoBold',
    fontSize: 11,
    color: '#d2d2d7',
  },
  quickAction: {
    backgroundColor: '#1d1d1f',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 80,
  },
  quickActionText: {
    flex: 1,
    alignItems: 'flex-end',
  },
  quickActionTitle: {
    fontFamily: 'CairoBold',
    fontSize: 16,
    color: '#fff',
  },
  quickActionSubtitle: {
    fontFamily: 'Cairo',
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
});
