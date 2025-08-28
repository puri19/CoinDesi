import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Share,
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { createTheme, RFValue, RW, RH } from '../utils/theme';
import ShimmerEffect from '../components/ShimmerEffect';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface EventDetail {
  id: string;
  event_name: string;
  description: string;
  event_date: string;
  event_time: string;
  event_place: string;
  region: string;
  image?: string;
  hasApplied?: boolean;
  terms_conditions?: string;
  rules?: string;
  max_participants?: number;
  current_participants?: number;
  category?: string;
  organizer?: string;
  contact_email?: string;
  contact_phone?: string;
  long_description?: string;
  requirements?: string;
  benefits?: string;
  registration_deadline?: string;
  event_type?: string;
  entry_fee?: string;
}

const EventDetailScreen = ({ id }) => {
  const navigation = useNavigation();
  const route = useRoute();
  const { event }: { event: EventDetail } = route.params as any;
  const userinfo = useSelector((state: any) => state.user.userinfo);
  const isDarkMode = useSelector((state: any) => state.theme.isDarkMode);

  const [loading, setLoading] = useState(false);
  const [isLoadingEvent, setIsLoadingEvent] = useState(true);
  const [isInterested, setIsInterested] = useState(false);

  // Popup state
  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState<'success' | 'error' | 'login' | 'info'>('info');
  const [popupMessage, setPopupMessage] = useState('');
  const [popupTitle, setPopupTitle] = useState('');

  const theme = createTheme(isDarkMode);
  const insets = useSafeAreaInsets(); // ✅ insets for status bar & gesture navigation

  const showCustomPopup = (type: 'success' | 'error' | 'login' | 'info', title: string, message: string) => {
    setPopupType(type);
    setPopupTitle(title);
    setPopupMessage(message);
    setShowPopup(true);
  };

  const hidePopup = () => setShowPopup(false);

  // Load event and check interest
  useEffect(() => {
    const load = async () => {
      try {
        await new Promise(res => setTimeout(res, 1500)); // simulate loading
        if (userinfo?.uid) {
          const doc = await firestore().collection('events').doc(event.id).get();
          if (doc.exists()) {
            const applicants = doc.data()?.Applicants || [];
            const found = applicants.some((a: any) => a.uid === userinfo.uid);
            setIsInterested(found);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingEvent(false);
      }
    };
    load();
  }, [event.id, userinfo?.uid]);

  const handleShare = async () => {
    try {
      await Share.share({
        title: event.event_name,
        message: `Check out this event: ${event.event_name}\n\nDate: ${event.event_date}\nTime: ${event.event_time}\nLocation: ${event.event_place}\n\n${event.description}`,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleInterest = async () => {
    if (!userinfo?.uid) {
      showCustomPopup('login', 'Login Required', 'Please login to express interest in events.');
      return;
    }
    setLoading(true);
    try {
      if (isInterested) {
        const doc = await firestore().collection('events').doc(event.id).get();
        if (doc.exists()) {
          const currentApplicants = doc.data()?.Applicants || [];
          const updated = currentApplicants.filter((a: any) => a.uid !== userinfo.uid);
          await firestore().collection('events').doc(event.id).update({ Applicants: updated });
        }
        await firestore().collection('users').doc(userinfo.uid).update({
          events: firestore.FieldValue.arrayRemove(event.id),
        });
        setIsInterested(false);
        showCustomPopup('success', 'Removed', 'Interest removed successfully.');
      } else {
        await firestore().collection('events').doc(event.id).update({
          Applicants: firestore.FieldValue.arrayUnion({
            uid: userinfo.uid,
            email: userinfo.email,
            phone: userinfo.phone,
            username: userinfo.name,
          }),
        });
        await firestore().collection('users').doc(userinfo.uid).update({
          events: firestore.FieldValue.arrayUnion(event.id),
        });
        setIsInterested(true);
        showCustomPopup('success', 'Success!', 'Interest expressed successfully');
      }
    } catch (err) {
      showCustomPopup('error', 'Error', 'Failed to update interest.');
    } finally {
      setLoading(false);
    }
  };

  const CustomPopup = () => (
    <Modal visible={showPopup} transparent onRequestClose={hidePopup}>
      <View style={styles.popupOverlay}>
        <View style={[
          styles.popupContainer,
          { backgroundColor: theme.card, borderColor: theme.primary }
        ]}>
          <Ionicons
            name={
              popupType === 'success' ? 'checkmark-circle' :
                popupType === 'error' ? 'close-circle' :
                  popupType === 'login' ? 'log-in' : 'information-circle'
            }
            size={48}
            color={
              popupType === 'success' ? '#10B981' :
                popupType === 'error' ? '#EF4444' : theme.primary
            }
          />
          <Text style={[styles.popupTitle, { color: theme.text }]}>{popupTitle}</Text>
          <Text style={[styles.popupMessage, { color: theme.textSecondary }]}>{popupMessage}</Text>
          <TouchableOpacity
            style={[styles.popupButton, { backgroundColor: theme.primary }]}
            onPress={() => {
              hidePopup();
              if (popupType === 'login') navigation.navigate('Login' as never);
            }}
          >
            <Text style={{ color: theme.card, fontWeight: '400', fontFamily: "Inter_28pt-Regular" }}>
              {popupType === 'login' ? 'Login' : popupType === 'success' ? 'Done' : 'OK'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={{ flex: 1, backgroundColor: theme.background, paddingTop: insets.top, }}>
        {/* Header */}
        <View style={[
          styles.headerEventMainDe,
          {
            borderBottomColor: theme.border,
          }
        ]}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Events</Text>
          </View>
        </View>

        {/* Body */}
        {isLoadingEvent ? (
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.imageContainer}>
              <ShimmerEffect width="95%" height={RH(250)} borderRadius={10} />
            </View>
            <View style={styles.contentContainer}>
              <ShimmerEffect width="90%" height={RH(32)} borderRadius={RW(4)} style={styles.shimmerEventName} />
              <ShimmerEffect width="70%" height={RH(20)} borderRadius={RW(4)} style={styles.shimmerDateTime} />
              <View style={[styles.separator, { backgroundColor: theme.border }]} />
              <View style={styles.locationContainer}>
                <View style={styles.locationInfo}>
                  <ShimmerEffect width={RW(16)} height={RW(16)} borderRadius={RW(8)} style={styles.shimmerLocationIcon} />
                  <View style={styles.locationTextContainer}>
                    <ShimmerEffect width="60%" height={RH(20)} borderRadius={RW(4)} />
                    <ShimmerEffect width="40%" height={RH(16)} borderRadius={RW(4)} />
                  </View>
                </View>
                <ShimmerEffect width={RW(40)} height={RW(40)} borderRadius={RW(20)} />
              </View>
              <View style={[styles.separator, { backgroundColor: theme.border }]} />
              <View style={styles.aboutSection}>
                <ShimmerEffect width={RW(100)} height={RH(20)} borderRadius={RW(4)} />
                <ShimmerEffect width="100%" height={RH(16)} borderRadius={RW(4)} style={styles.shimmerDescription} />
                <ShimmerEffect width="90%" height={RH(16)} borderRadius={RW(4)} style={styles.shimmerDescription} />
                <ShimmerEffect width="80%" height={RH(16)} borderRadius={RW(4)} style={styles.shimmerDescription} />
              </View>
            </View>
          </ScrollView>
        ) : (
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.imageContainer}>
              {event.image ? (
                <Image source={{ uri: event.image }} style={styles.eventImage} />
              ) : (
                <View style={[styles.imagePlaceholder, { backgroundColor: theme.card }]}>
                  <MaterialCommunityIcons name="calendar-blank" size={48} color={theme.textSecondary} />
                </View>
              )}
            </View>
            <View style={[styles.contentContainer,{backgroundColor:theme.background}]}>
              <Text style={[styles.eventName, { color: theme.text }]}>{event.event_name}</Text>
              <Text style={[styles.dateTimeText, { color: theme.textSecondary }]}>
                {event.event_date}, {event.event_time} IST
              </Text>
              <View style={[styles.separator, { backgroundColor: theme.border }]} />
              <View style={styles.locationContainer}>
                <View style={styles.locationInfo}>
                  <Ionicons
                    name="location-outline"
                    style={styles.locationIcon}
                    size={18}
                    color={theme.textSecondary}
                  />
                  <View style={styles.locationTextContainer}>
                    <Text style={[styles.locationTitle, { color: theme.text, fontFamily: "Lato-Bold", fontSize: RFValue(16) }]}>
                      {event.state}
                    </Text>
                    <Text style={[styles.locationSubtitle, { color: theme.text }]}>
                      {event.event_place}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity style={[styles.topActionButton, {
                  backgroundColor: '#F3F3F3',
                }]} onPress={handleShare}>
                  <MaterialCommunityIcons name="share-outline" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
              <View style={[styles.separator, { backgroundColor: theme.border }]} />
              <View style={styles.aboutSection}>
                <Text style={[styles.aboutTitle, { color: theme.textSecondary }]}>About Event</Text>
                <Text style={[styles.aboutDescription, { color: theme.text }]}>
                  {event.long_description || event.description || "No description available"}
                </Text>
              </View>
            </View>
          </ScrollView>
        )}

        {/* Bottom Action */}
        <View style={[styles.actionContainer, {
          borderTopColor: theme.border,
          paddingBottom: insets.bottom + RH(10) // ✅ SafeArea bottom
        }]}>
          {isLoadingEvent ? (
            <ShimmerEffect width="100%" height={RH(56)} borderRadius={12} />
          ) : (
            <TouchableOpacity
              style={[styles.showInterestButton, { backgroundColor: theme.primary }]}
              onPress={handleInterest}
              disabled={loading}
            >
              <Text style={[styles.showInterestText, { color: theme.card }]}>
                {isInterested ? 'Remove Interest' : 'Show Interest'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <CustomPopup />
      </View>
    </SafeAreaView>
  );
};

export default EventDetailScreen;

const styles = StyleSheet.create({
  headerEventMainDe: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: RW(5),
    paddingVertical: RH(10),
    borderBottomWidth: 1,
  },
  backButton: { width: RW(40), height: RH(30), justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: RFValue(22), fontWeight: '500', fontFamily: "Lato-Regular", },
  scrollView: { flex: 1 },
  imageContainer: { alignSelf: "center", marginTop: 10, height: RH(300), width: "95%", borderRadius: 10,paddingHorizontal:5 },
  eventImage: { width: '100%', height: "100%", borderRadius: 10, resizeMode: 'cover' },
  imagePlaceholder: { width: '100%', height: RH(250), justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
  contentContainer: { paddingVertical:10,paddingHorizontal:15, },
  eventName: { fontSize: RFValue(24), fontWeight: '500', marginBottom: RH(5), fontFamily: "Lato" },
  dateTimeText: { fontSize: RFValue(14), fontFamily: "Lato-Regular" },
  separator: { height: 1, marginVertical: RH(12) },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationTextContainer: {
    marginLeft: RW(4),
    paddingVertical: 2,
    flexShrink: 1,
  },
  locationTitle: {
    fontSize: RFValue(16),
    fontFamily: "Lato-Bold",
  },
  locationSubtitle: {
    fontSize: RFValue(14),
    fontFamily: "Lato-Regular",
    marginTop: 2,
  },
  locationIcon: {
    // icon size is controlled via 'size' prop, no padding needed
  },
  topActionButton: {
    width: RW(30),
    height: RW(30),
    borderRadius: RW(15),
    justifyContent: 'center',
    alignItems: 'center',
    // color removed from View, apply to Icon/Text inside
  },


  shareButton: { width: RW(40), height: RH(40), justifyContent: 'center', alignItems: 'center' },
  aboutSection: { marginTop: RH(8) },
  aboutTitle: { fontSize: RFValue(12), marginBottom: RH(8), fontFamily: "Lato-Regular" },
  aboutDescription: { fontSize: RFValue(12), lineHeight: RFValue(24), fontFamily: "Lato-Regular" },
  actionContainer: { padding: RW(20), borderTopWidth: 1 },
  showInterestButton: { paddingVertical: RH(16), borderRadius: 12, alignItems: 'center' },
  showInterestText: { fontSize: RFValue(16), fontWeight: '600', fontFamily: "lato.semibold", },

  // Shimmer placeholder styles
  shimmerEventName: { marginBottom: RH(12) },
  shimmerDateTime: { marginBottom: RH(16) },
  shimmerLocationIcon: { marginRight: RW(8) },
  shimmerDescription: { marginBottom: RH(4) },

  // Popup
  popupOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  popupContainer: { width: '90%', borderRadius: RW(16), padding: RW(24), alignItems: 'center' },
  popupTitle: { fontSize: RFValue(20), fontWeight: '400', marginVertical: RH(8), fontFamily: "lato.semibold" },
  popupMessage: { fontSize: RFValue(16), textAlign: 'center', marginBottom: RH(16), fontFamily: "lato.medium" },
  popupButton: { paddingVertical: RH(14), paddingHorizontal: RW(50), borderRadius: RW(12), fontFamily: "lato.medium" },
});
