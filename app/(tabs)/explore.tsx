import { Colors } from '@/constants/theme';
import { getApiClient } from '@/services/api';
import { useFocusEffect } from 'expo-router';
import { AlertCircle, Archive, Bell, Search, ShoppingBag, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image as RNImage
} from 'react-native';
import { useAuth } from '@/hooks/use-auth';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

interface Product {
  id: number;
  name: string;
  current_quantity: number;
  original_quantity: number;
  image_url: string;
}

export default function UnifiedStorefrontScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [withdrawQty, setWithdrawQty] = useState('1');
  const [withdrawNote, setWithdrawNote] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const fetchProducts = React.useCallback(async () => {
    try {
      const api = await getApiClient();
      const response = await api.get('/api/products');
      setProducts(response.data as Product[]);
      setFilteredProducts(response.data as Product[]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchProducts();
    }, [fetchProducts])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    setFilteredProducts(products.filter(p => p.name.toLowerCase().includes(text.toLowerCase())));
  };

  const executeWithdraw = async () => {
    if (!selectedProduct) return;
    const qty = parseInt(withdrawQty);
    if (isNaN(qty) || qty < 1 || qty > selectedProduct.current_quantity) {
      Alert.alert('خطأ', 'الكمية غير صالحة');
      return;
    }
    if (withdrawNote.trim().length < 3) {
      Alert.alert('تنبيه', 'يرجى كتابة سبب السحب');
      return;
    }

    setIsWithdrawing(true);
    try {
      const api = await getApiClient();
      await api.post(`/api/withdraw/${selectedProduct.id}`, {
        quantity: qty,
        note: withdrawNote.trim()
      });
      Alert.alert('نجاح', 'تمت العملية');
      setSelectedProduct(null);
      setWithdrawQty('1');
      setWithdrawNote('');
      fetchProducts();
    } catch (error) {
      Alert.alert('خطأ', 'فشلت العملية');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const ProductCard = ({ item }: { item: Product }) => {
    const isOutOfStock = item.current_quantity <= 0;
    const hasImage = !!item.image_url;

    return (
      <View style={[styles.card, isWeb && styles.webCard]}>
        <View style={styles.imageContainer}>
          {hasImage ? (
            <Image source={{ uri: item.image_url }} style={styles.productImage} resizeMode="cover" />
          ) : (
            <ShoppingBag size={20} color="#d2d2d7" />
          )}
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
          <Text style={[styles.stockValue, isOutOfStock && { color: Colors.danger }]}>
            المتوفر: {item.current_quantity}
          </Text>

          <TouchableOpacity
            style={[styles.withdrawBtn, isOutOfStock && styles.withdrawBtnDisabled]}
            disabled={isOutOfStock}
            onPress={() => setSelectedProduct(item)}
          >
            <Archive size={14} color="#fff" />
            <Text style={styles.withdrawBtnText}>سحب</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>المخزن</Text>
          <View style={styles.searchBox}>
            <TextInput
              style={styles.searchInput}
              placeholder="بحث عن منتج..."
              value={searchQuery}
              onChangeText={handleSearch}
            />
            <Search size={18} color="#86868b" />
          </View>
        </View>

        <FlatList
          data={filteredProducts}
          renderItem={({ item }) => <ProductCard item={item} />}
          keyExtractor={item => item.id.toString()}
          key={isWeb ? 'web-list' : 'mob-list'}
          numColumns={isWeb ? 5 : 2}
          scrollEnabled={false}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={[styles.listContainer, isWeb && { flexDirection: 'row-reverse', flexWrap: 'wrap' }]}
          ListEmptyComponent={<Text style={styles.emptyText}>لا يوجد منتجات</Text>}
        />
      </ScrollView>

      <Modal visible={!!selectedProduct} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={[styles.modalContent, isWeb && styles.webModal]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setSelectedProduct(null)}><X size={22} /></TouchableOpacity>
              <Text style={styles.modalTitle}>تأكيد السحب</Text>
            </View>
            <Text style={styles.modalProduct}>{selectedProduct?.name}</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>الكمية</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={withdrawQty} onChangeText={setWithdrawQty} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>السبب</Text>
              <TextInput style={[styles.input, { height: 80 }]} multiline value={withdrawNote} onChangeText={setWithdrawNote} />
            </View>
            <TouchableOpacity style={styles.confirmBtn} onPress={executeWithdraw} disabled={isWithdrawing}>
              {isWithdrawing ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmText}>تأكيد</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fbfbfd' },
  scrollContent: { paddingBottom: 40, paddingTop: 105 },
  header: { paddingHorizontal: 16, marginBottom: 12, alignItems: 'flex-end' },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  headerLeftArea: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bellBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#d2d2d7', justifyContent: 'center', alignItems: 'center' },
  webProfileHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', padding: 4, borderRadius: 12, borderWidth: 1, borderColor: '#f2f2f7' },
  profileTextContainer: { alignItems: 'flex-end' },
  profileNamePrefix: { fontFamily: 'Cairo', fontSize: 9, color: '#86868b' },
  profileName: { fontFamily: 'CairoBold', fontSize: 11, color: '#1d1d1f' },
  profileCircleSmall: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#1d1d1f', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontFamily: 'CairoBold', fontSize: 18, color: '#1d1d1f', textAlign: 'right' },
  searchBox: { 
    alignSelf: 'flex-end',
    width: 210, 
    height: 34, 
    backgroundColor: '#ffffff', 
    borderRadius: 8, 
    borderWidth: 1.5, 
    borderColor: '#1d1d1f', 
    flexDirection: 'row-reverse', 
    alignItems: 'center', 
    paddingHorizontal: 10,
    marginTop: 6,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  searchInput: { flex: 1, fontFamily: 'Cairo', fontSize: 13, textAlign: 'right' },
  listContainer: { paddingHorizontal: 8 },
  columnWrapper: { flexDirection: 'row-reverse', justifyContent: 'flex-start', gap: 10, marginBottom: 10 },
  card: { width: (width - 48) / 2, backgroundColor: '#fff', borderRadius: 12, padding: 8, borderWidth: 1.5, borderColor: '#1d1d1f', alignItems: 'center' },
  webCard: { width: 140, margin: 8 },
  imageContainer: { width: '100%', height: 55, backgroundColor: '#f5f5f7', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  productImage: { width: '100%', height: '100%', borderRadius: 8 },
  cardContent: { width: '100%', alignItems: 'center' },
  productName: { fontFamily: 'CairoBold', fontSize: 12, color: '#1d1d1f', marginBottom: 2 },
  stockValue: { fontFamily: 'Cairo', fontSize: 10, color: '#86868b', marginBottom: 6 },
  withdrawBtn: { width: '100%', height: 28, backgroundColor: '#1d1d1f', borderRadius: 6, flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 4 },
  withdrawBtnDisabled: { backgroundColor: '#f5f5f7' },
  withdrawBtnText: { fontFamily: 'CairoBold', fontSize: 11, color: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: isWeb ? 'center' : 'flex-end', alignItems: isWeb ? 'center' : 'stretch' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  webModal: { width: 450, borderRadius: 24, alignSelf: 'center' },
  modalHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontFamily: 'CairoBold', fontSize: 16 },
  modalProduct: { fontFamily: 'CairoBold', fontSize: 14, color: Colors.primary, marginBottom: 10, textAlign: 'center' },
  inputGroup: { gap: 4, marginBottom: 10 },
  label: { fontFamily: 'CairoBold', fontSize: 12, textAlign: 'right' },
  input: { height: 40, backgroundColor: '#f5f5f7', borderRadius: 8, paddingHorizontal: 10, textAlign: 'right', fontFamily: 'Cairo' },
  confirmBtn: { height: 44, backgroundColor: '#1d1d1f', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  confirmText: { color: '#fff', fontFamily: 'CairoBold', fontSize: 14 },
  emptyText: { textAlign: 'center', marginTop: 50, fontFamily: 'Cairo', color: '#86868b' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
