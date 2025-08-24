import React, { useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import firestore from '@react-native-firebase/firestore';
import { fetchAtributes, fetchEvents } from '../redux/action/userActions';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { createTheme, RFValue, RW, RH, getResponsivePadding, getStatusBarHeight } from './../utils/theme';
import ShimmerEffect from '../components/ShimmerEffect';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;

const Events = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [eventData, setEventData] = useState([]);
  const isDarkMode = useSelector((state: any) => state.theme.isDarkMode);
  const theme = createTheme(isDarkMode);
  const eventIds = useSelector((state: any) => state.user.events);
  const insets = useSafeAreaInsets(); // ✅ Safe area for bottom only

  useEffect(() => {
    dispatch(fetchAtributes());
    dispatch(fetchEvents());
  }, [dispatch]);

  useEffect(() => {
    const fetchEventData = async () => {
      if (!eventIds || eventIds.length === 0) {
        setEventData([]);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const chunks = [];
        for (let i = 0; i < eventIds.length; i += 10) {
          chunks.push(eventIds.slice(i, i + 10));
        }
        let fetchedEvents = [];
        for (const chunk of chunks) {
          const snapshot = await firestore()
            .collection('events')
            .where(firestore.FieldPath.documentId(), 'in', chunk)
            .get();
          const chunkEvents = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          fetchedEvents = [...fetchedEvents, ...chunkEvents];
        }
        const sorted = eventIds
          .map(id => fetchedEvents.find(event => event.id === id))
          .filter(Boolean);
        setEventData(sorted);
      } catch (error) {
        console.error('🔥 Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEventData();
  }, [eventIds]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchAtributes());
    setRefreshing(false);
  };

  const renderItem = ({ item }) => (
    <View style={[styles.eventItem,{borderColor:theme.border}]}>
      <View style={styles.eventImageContainer}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.eventImage} resizeMode="cover" />
        ) : (
          <View style={styles.eventImagePlaceholder}>
            <MaterialCommunityIcons
              name="calendar-blank"
              size={isTablet ? 48 : 32}
              color="#999"
            />
          </View>
        )}
      </View>
      <TouchableOpacity
         onPress={() => (navigation as any).navigate('EventDetail', { event: item })}
        style={styles.eventContent}
      >
        <Text style={[styles.eventTitle, { color: theme.text }]} numberOfLines={2}>
          {item.event_name}
        </Text>
        <Text style={[styles.eventDescription, { color: theme.text }]} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.eventDetails}>
          <View style={styles.eventDetailItem}>
            <MaterialCommunityIcons name="clock-outline" size={isTablet ? 20 : 16} color="#666" />
            <Text style={[styles.eventDetailText, { color: theme.text }]}>{item.event_time || 'N/A'}</Text>
          </View>
          <View style={styles.eventDetailItem}>
            <MaterialCommunityIcons name="map-marker" size={isTablet ? 20 : 16} color="#666" />
            <Text style={[styles.eventDetailText, { color: theme.text }]}>{item.event_place || 'N/A'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* ✅ Header (unchanged paddingTop logic) */}
      <View style={[
        styles.headerEvent,
        { backgroundColor: theme.card, borderBottomColor: theme.border, borderTopColor: theme.border
          ,marginTop:insets.top
         }
      ]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Home', { screen: 'ProfilePage' })}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={isTablet ? 36 : 35}
            color={theme.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Events</Text>
      </View>

      {loading && eventData.length === 0 ? (
        <View style={styles.loadingContainer}>
          {[...Array(5)].map((_, i) => (
            <View key={i} style={styles.shimmerEventItem}>
              <ShimmerEffect
                width={isTablet ? RW(120) : RW(80)}
                height={isTablet ? RW(120) : RW(80)}
                borderRadius={RW(8)}
                style={styles.shimmerEventImage}
              />
              <View style={styles.shimmerEventContent}>
                <ShimmerEffect width="100%" height={RH(20)} style={styles.shimmerEventTitle} />
                <ShimmerEffect width="100%" height={RH(48)} style={styles.shimmerEventDescription} />
                <View style={styles.shimmerEventDetails}>
                  <ShimmerEffect width={RW(80)} height={RH(16)} style={styles.shimmerEventDetail} />
                  <ShimmerEffect width={RW(80)} height={RH(16)} style={styles.shimmerEventDetail} />
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={eventData}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + RH(20) }]} // ✅ bottom inset
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="calendar-remove-outline"
                size={isTablet ? 120 : 80}
                color={theme.textLight}
              />
              <Text style={[styles.emptyText, { color: theme.text }]}>No events found</Text>
              <Text style={[styles.emptySubtext, { color: theme.text }]}>
                You haven't joined any events yet. Check upcoming events to get started!
              </Text>
              <TouchableOpacity style={[styles.browseButton, { backgroundColor: theme.primary }]} onPress={() => navigation.navigate('EventScreen')}>
                <Text style={styles.browseButtonText}>Browse Events</Text>
              </TouchableOpacity>
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default Events;

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerEvent: {
    flexDirection: 'row',
    alignItems:"center",
    paddingHorizontal: RH(0),
    paddingVertical: RH(8), // ✅ keep original
    borderBottomWidth: 1,
    borderTopColor: '#E5E5E5',
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    width: RW(40),
    height: RW(35),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  headerTitle: {
    fontSize: RFValue(isTablet ? 24 : 24),
    flex: 1,
    marginLeft:RH(5),
    fontFamily:"Lato-Regular",
    fontWeight:"500"
  },
  loadingContainer: { paddingVertical:10,paddingHorizontal:10 },
  shimmerEventItem: { flexDirection: 'row', marginBottom: RH(15) },
  shimmerEventImage: { marginRight: RW(12) },
  shimmerEventContent: { flex: 1, justifyContent: 'space-between' },
  shimmerEventTitle: { marginBottom: RH(4) },
  shimmerEventDescription: { marginBottom: RH(6) },
  shimmerEventDetails: { flexDirection: 'row', justifyContent: 'space-between' },
  shimmerEventDetail: {},
  listContent: { paddingHorizontal: getResponsivePadding() },
  eventItem: { flexDirection: 'row', paddingVertical: RH(16), borderBottomWidth: 1, marginHorizontal: 20 },
  eventImageContainer: { marginRight: RW(12) },
  eventImage: {
    width: isTablet ? RW(120) : RW(80),
    height: isTablet ? RW(120) : RW(80),
    borderRadius: RW(8),
    backgroundColor: '#eee',
  },
  eventImagePlaceholder: {
    width: isTablet ? RW(120) : RW(80),
    height: isTablet ? RW(120) : RW(80),
    borderRadius: RW(8),
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventContent: { flex: 1, justifyContent: 'center' },
  eventTitle: {
    fontSize: RFValue(isTablet ? 20 : 16),
    fontWeight: '400',
    marginBottom: RH(4),
    color: '#111',
    fontFamily:"Lato-Bold"
  },
  eventDescription: {
    fontSize: RFValue(isTablet ? 16 : 12),
    color: '#444',
    lineHeight: RFValue(14),
    marginBottom: RH(4),
     fontFamily:"Lato-Regular",
     fontWeight:400
  },
  eventDetails: { flexDirection: 'row', gap: RW(12),  fontFamily:"Lato-Regular",
    fontWeight:500 },
  eventDetailItem: { flexDirection: 'row', alignItems: 'center', gap: RW(6), },
  eventDetailText: { fontSize: RFValue(isTablet ? 14 : 10), color: '#666', marginLeft: RW(4) ,  fontFamily:"Lato-Regular",
    fontWeight:500},
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: RW(24), paddingTop: RH(80) },
  emptyText: { fontSize: RFValue(isTablet ? 28 : 24), fontWeight: '600', marginTop: RH(16), marginBottom: RH(8), textAlign: 'center' },
  emptySubtext: { fontSize: RFValue(isTablet ? 18 : 16), textAlign: 'center', lineHeight: RFValue(24), marginBottom: RH(24) },
  browseButton: { flexDirection: 'row', backgroundColor: '#3578e5', paddingVertical: RH(12), paddingHorizontal: RW(24), borderRadius: RW(20), justifyContent: 'center' },
  browseButtonText: { color: '#fff', fontSize: RFValue(isTablet ? 18 : 16), fontWeight: '600' },
});
