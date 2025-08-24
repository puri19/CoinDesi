import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
  Pressable,
  Dimensions,
  StatusBar,
  Platform,
  RefreshControl
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import firestore from '@react-native-firebase/firestore';
import { fetchAtributes, removeHistoryItem, clearAllHistoryAction } from '../redux/action/userActions';
import Header from '../components/Header';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

// --- RESPONSIVE SCALING UTILS ---
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const GUIDELINE_BASE_WIDTH = 375;
const GUIDELINE_BASE_HEIGHT = 812;

const RW = (size: number) => (SCREEN_WIDTH / GUIDELINE_BASE_WIDTH) * size;
const RH = (size: number) => (SCREEN_HEIGHT / GUIDELINE_BASE_HEIGHT) * size;
const RFValue = (fontSize: number, standardScreenHeight = GUIDELINE_BASE_HEIGHT) => {
  const heightPercent = (fontSize * SCREEN_HEIGHT) / standardScreenHeight;
  return Math.round(heightPercent);
};
// ------------------------------------

// Modern Blue Theme
const THEME = {
  primary: '#2563EB',
  secondary: '#3B82F6',
  accent: '#1E40AF',
  background: '#F8FAFC',
  card: '#FFFFFF',
  text: '#1E293B',
  textSecondary: '#64748B',
  textLight: '#94A3B8',
  border: '#E2E8F0',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  shadow: '#000000',
};

interface Article {
  id: string;
  title: string;
  summary?: string;
  image?: string;
  [key: string]: any;
}

interface RootState {
  user: {
    history: string[];
    userinfo: {
      phone?: string;
    };
  };
}

const History = () => {
  const dispatch = useDispatch();
  const historyInfo = useSelector((state: RootState) => state.user.history);
  const [historyArticles, setHistoryArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clearModalVisible, setClearModalVisible] = useState(false);
  const [removeModalVisible, setRemoveModalVisible] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<Article | null>(null);

  // Animation values
  const modalOpacity = useSharedValue(0);
  const modalScale = useSharedValue(0.8);
  const buttonScale = useSharedValue(1);
  const removeModalOpacity = useSharedValue(0);
  const removeModalScale = useSharedValue(0.8);

  useEffect(() => {
    dispatch(fetchAtributes() as any);
  }, [dispatch]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      if (!historyInfo || historyInfo.length === 0) {
        setHistoryArticles([]);
        return;
      }
      // Firestore `in` queries are limited to 30 items
      const chunks = [];
      for (let i = 0; i < historyInfo.length; i += 30) {
        chunks.push(historyInfo.slice(i, i + 30));
      }

      let fetchedArticles: Article[] = [];
      for (const chunk of chunks) {
          const snapshot = await firestore()
              .collection('crypto_articles_test_1')
              .where(firestore.FieldPath.documentId(), 'in', chunk)
              .get();

          const chunkArticles = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
          } as Article));
          fetchedArticles.push(...chunkArticles);
      }

      // Filter and sort based on history order (most recent first)
      const filtered = fetchedArticles
        .filter(article => historyInfo.includes(article.id))
        .sort((a, b) => historyInfo.indexOf(b.id) - historyInfo.indexOf(a.id));

      setHistoryArticles(filtered);
    } catch (error) {
      console.error("Error fetching history articles:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [historyInfo]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchAtributes() as any);
  };

  const handleRemoveItem = (article: Article) => {
    setItemToRemove(article);
    setRemoveModalVisible(true);
    removeModalOpacity.value = withTiming(1, { duration: 300 });
    removeModalScale.value = withSpring(1, { damping: 12, stiffness: 100 });
  };

  const hideRemoveModal = () => {
    removeModalOpacity.value = withTiming(0, { duration: 200 });
    removeModalScale.value = withTiming(0.8, { duration: 200 });
    setTimeout(() => {
      setRemoveModalVisible(false);
      setItemToRemove(null);
    }, 200);
  };

  const confirmRemoveItem = () => {
    if (itemToRemove) {
      dispatch(removeHistoryItem(itemToRemove.id) as any);
      hideRemoveModal();
    }
  };

  const showClearModal = () => {
    setClearModalVisible(true);
    modalOpacity.value = withTiming(1, { duration: 300 });
    modalScale.value = withSpring(1, { damping: 12, stiffness: 100 });
  };

  const hideClearModal = () => {
    modalOpacity.value = withTiming(0, { duration: 200 });
    modalScale.value = withTiming(0.8, { duration: 200 });
    setTimeout(() => setClearModalVisible(false), 200);
  };

  const handleClearAllHistory = () => {
    hideClearModal();
    dispatch(clearAllHistoryAction() as any);
  };

  const modalAnimatedStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [{ scale: modalScale.value }],
  }));

  const removeModalAnimatedStyle = useAnimatedStyle(() => ({
    opacity: removeModalOpacity.value,
    transform: [{ scale: removeModalScale.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const renderArticle = ({ item }: { item: Article }) => (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        {item.image && (
          <Image source={{ uri: item.image }} style={styles.image} />
        )}
        <View style={styles.cardContent}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.summary} numberOfLines={3}>
            {item.summary || 'No summary available.'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveItem(item)}
        >
          <MaterialCommunityIcons name="close" size={RFValue(20)} color={THEME.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <>
      <Header title="Recently Viewed" />
      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color={THEME.primary} style={styles.loader} />
        ) : (
          <>
            <FlatList
              data={historyArticles}
              keyExtractor={(item) => item.id}
              renderItem={renderArticle}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[THEME.primary]}
                  tintColor={THEME.primary}
                  progressBackgroundColor={THEME.background}
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons
                    name="history"
                    size={RFValue(64)}
                    color={THEME.textLight}
                  />
                  <Text style={styles.emptyText}>No viewed articles yet.</Text>
                  <Text style={styles.emptySubtext}>
                    Articles you view will appear here
                  </Text>
                </View>
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
            {historyArticles.length > 0 && (
              <TouchableOpacity
                style={styles.clearAllButton}
                onPress={showClearModal}
                activeOpacity={0.8}
              >
                  <View style={styles.clearButtonContent}>
                    <MaterialCommunityIcons name="delete-sweep" size={RFValue(20)} color="white" />
                    <Text style={styles.clearButtonText}>Clear All History</Text>
                  </View>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* Remove Item Confirmation Modal */}
      <Modal
        visible={removeModalVisible}
        transparent
        animationType="none"
        onRequestClose={hideRemoveModal}
      >
        <Pressable style={styles.modalOverlay} onPress={hideRemoveModal}>
          <Animated.View style={[styles.modalContent, removeModalAnimatedStyle]}>
            <Pressable style={styles.modalInner} onPress={() => { }}>
              <View style={styles.modalHeader}>
                <View style={styles.removeIconContainer}>
                  <MaterialCommunityIcons
                    name="delete-outline"
                    size={RFValue(32)}
                    color={THEME.error}
                  />
                </View>
                <Text style={styles.modalTitle}>Remove from History?</Text>
                {itemToRemove && (
                  <View style={styles.itemPreview}>
                    {itemToRemove.image && (
                      <Image source={{ uri: itemToRemove.image }} style={styles.previewImage} />
                    )}
                    <Text style={styles.previewTitle} numberOfLines={2}>
                      {itemToRemove.title}
                    </Text>
                  </View>
                )}
                <Text style={styles.modalMessage}>
                  This article will be removed from your viewing history.
                </Text>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={hideRemoveModal}
                >
                  <Text style={styles.cancelButtonText}>Keep</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.removeButtonModal]}
                  onPress={confirmRemoveItem}
                >
                  <MaterialCommunityIcons name="delete" size={RFValue(16)} color="white" style={styles.buttonIcon} />
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* Clear All Confirmation Modal */}
      <Modal
        visible={clearModalVisible}
        transparent
        animationType="none"
        onRequestClose={hideClearModal}
      >
        <Pressable style={styles.modalOverlay} onPress={hideClearModal}>
          <Animated.View style={[styles.modalContent, modalAnimatedStyle]}>
            <Pressable style={styles.modalInner} onPress={() => { }}>
              <View style={styles.modalHeader}>
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={RFValue(48)}
                  color={THEME.warning}
                />
                <Text style={styles.modalTitle}>Clear All History?</Text>
                <Text style={styles.modalMessage}>
                  This action cannot be undone. All your viewing history will be permanently deleted.
                </Text>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={hideClearModal}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleClearAllHistory}
                >
                  <Text style={styles.confirmButtonText}>Clear All</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
};

export default History;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  listContainer: {
    padding: RW(16),
    paddingBottom: RH(100),
  },
  cardContainer: {
    marginBottom: RH(16),
  },
  card: {
    backgroundColor: THEME.card,
    borderRadius: RW(16),
    padding: RW(16),
    shadowColor: THEME.shadow,
    shadowOffset: {
      width: 0,
      height: RH(2),
    },
    shadowOpacity: 0.1,
    shadowRadius: RW(8),
    elevation: 4,
  },
  cardContent: {
    flex: 1,
    marginRight: RW(40), // Space for the remove button
  },
  image: {
    height: RH(160),
    borderRadius: RW(12),
    marginBottom: RH(12),
    width: '100%',
  },
  title: {
    fontSize: RFValue(18),
    fontWeight: '600',
    color: THEME.text,
    marginBottom: RH(8),
    lineHeight: RFValue(24),
  },
  summary: {
    fontSize: RFValue(14),
    color: THEME.textSecondary,
    lineHeight: RFValue(20),
  },
  removeButton: {
    position: 'absolute',
    top: RW(12),
    right: RW(12),
    width: RW(32),
    height: RW(32),
    borderRadius: RW(16),
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearAllButton: {
    position: 'absolute',
    bottom: RH(20),
    left: RW(20),
    right: RW(20),
    backgroundColor: THEME.error,
    borderRadius: RW(12),
    paddingVertical: RH(16),
    shadowColor: THEME.shadow,
    shadowOffset: {
      width: 0,
      height: RH(4),
    },
    shadowOpacity: 0.2,
    shadowRadius: RW(8),
    elevation: 6,
  },
  clearButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    color: 'white',
    fontSize: RFValue(16),
    fontWeight: '600',
    marginLeft: RW(8),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: RH(60),
    height: SCREEN_HEIGHT * 0.7
  },
  emptyText: {
    fontSize: RFValue(18),
    fontWeight: '600',
    color: THEME.text,
    marginTop: RH(16),
    marginBottom: RH(8),
  },
  emptySubtext: {
    fontSize: RFValue(14),
    color: THEME.textSecondary,
    textAlign: 'center',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: RW(20),
  },
  modalContent: {
    width: '100%',
    maxWidth: RW(320),
  },
  modalInner: {
    backgroundColor: THEME.card,
    borderRadius: RW(20),
    padding: RW(24),
    shadowColor: THEME.shadow,
    shadowOffset: {
      width: 0,
      height: RH(10),
    },
    shadowOpacity: 0.25,
    shadowRadius: RW(20),
    elevation: 10,
    alignItems: 'center',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: RH(24),
  },
  removeIconContainer: {
    width: RW(64),
    height: RW(64),
    borderRadius: RW(32),
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: RH(16),
  },
  modalTitle: {
    fontSize: RFValue(20),
    fontWeight: '700',
    color: THEME.text,
    marginBottom: RH(16),
    textAlign: 'center',
  },
  itemPreview: {
    width: '100%',
    backgroundColor: THEME.background,
    borderRadius: RW(12),
    padding: RW(12),
    marginBottom: RH(16),
    alignItems: 'center',
  },
  previewImage: {
    width: RW(80),
    height: RH(60),
    borderRadius: RW(8),
    marginBottom: RH(8),
  },
  previewTitle: {
    fontSize: RFValue(14),
    fontWeight: '600',
    color: THEME.text,
    textAlign: 'center',
    lineHeight: RFValue(18),
  },
  modalMessage: {
    fontSize: RFValue(14),
    color: THEME.textSecondary,
    textAlign: 'center',
    lineHeight: RFValue(20),
  },
  modalButtons: {
    flexDirection: 'row',
    gap: RW(12),
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: RH(14),
    borderRadius: RW(12),
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: THEME.background,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  confirmButton: {
    backgroundColor: THEME.error,
  },
  removeButtonModal: {
    backgroundColor: THEME.error,
  },
  cancelButtonText: {
    fontSize: RFValue(16),
    fontWeight: '600',
    color: THEME.text,
  },
  confirmButtonText: {
    fontSize: RFValue(16),
    fontWeight: '600',
    color: 'white',
  },
  removeButtonText: {
    fontSize: RFValue(16),
    fontWeight: '600',
    color: 'white',
  },
  buttonIcon: {
    marginRight: RW(4),
  },
});