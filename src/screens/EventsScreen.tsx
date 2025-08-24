import React, { useEffect, useState } from 'react';
import {
  SectionList,
  StyleSheet,
  Text,
  View,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Modal,
  SafeAreaView,

  ScrollView,
  TextInput,
  Dimensions,
  FlatList,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { createTheme, RW, RH, getResponsivePadding, getResponsiveMargin, getStatusBarHeight, getResponsiveSize } from '../utils/theme';
import Button from '../components/Button';
import ShimmerEffect from '../components/ShimmerEffect';
import LoginPrompt from '../components/LoginPrompt';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'react-native-linear-gradient';
import { useNetworkCheck } from '../utils/withNetworkCheck';

import { RFValue } from 'react-native-responsive-fontsize';






interface Event {
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
}

interface Region {
  id: string;
  name: string;
  code: string;
}

interface CalendarDate {
  date: Date;
  day: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  hasEvent: boolean;
  isDisabled: boolean;
  isTodaySelected: boolean;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;

const EventsScreen = () => {
  const navigation = useNavigation();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showRegionPicker, setShowRegionPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [regions, setRegions] = useState<Region[]>([]);
  const [filteredRegions, setFilteredRegions] = useState<Region[]>([]);
  const [regionSearchQuery, setRegionSearchQuery] = useState('');
  const [dates, setDates] = useState<string[]>([]);
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [activeTab, setActiveTab] = useState<'date' | 'region'>('date');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDates, setCalendarDates] = useState<CalendarDate[]>([]);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [eventFilterList, setEventFilterList] = useState([]);

  const userinfo = useSelector((state: any) => state.user.userinfo);
  const isDarkMode = useSelector((state: any) => state.theme.isDarkMode);
  const theme = createTheme(isDarkMode);
  const cardScale = useSharedValue(1);
  const buttonScale = useSharedValue(1);
  const modalTranslateY = useSharedValue(1000);
  const modalOpacity = useSharedValue(0);

  const { checkNetworkBeforeAction, NetworkPopupUI, isOnline } = useNetworkCheck();

  const fetchEvents = async () => {
    try {
      await checkNetworkBeforeAction(async () => {
        setRefreshing(true);
        const snapshot = await firestore().collection('events').get();
        const data = snapshot.docs.map((doc) => {
          const d = doc.data();
          const applied = d.Applicants?.some((a: any) => a.uid === userinfo?.uid);
          return { id: doc.id, ...d, hasApplied: applied } as Event;
        });
        setEvents(data);
        setFilteredEvents(data);

        // Extract unique dates for filters
        const uniqueDates = [...new Set(data.map((event: Event) => event.event_date).filter(Boolean))];
        setDates(uniqueDates);
      });
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchRegions = async () => {
    try {
      await checkNetworkBeforeAction(async () => {
        setLoadingRegions(true);

        const regionsData: Region[] = [
          { id: '1', name: 'Mumbai', code: 'MUM' },
          { id: '2', name: 'Delhi-NCR', code: 'DEL' },
          { id: '3', name: 'Bengaluru', code: 'BLR' },
          { id: '4', name: 'Hyderabad', code: 'HYD' },
          { id: '5', name: 'Ahmedabad', code: 'AMD' },
          { id: '6', name: 'Chandigarh', code: 'CHD' },
          { id: '7', name: 'Chennai', code: 'CHE' },
          { id: '8', name: 'Pune', code: 'PUN' },
          { id: '9', name: 'Kolkata', code: 'CCU' },
        ];

        setRegions(regionsData);
      });
    } catch (error) {
      console.error('Error setting regions:', error);
    } finally {
      setLoadingRegions(false);
    }
  };

  // Generate calendar dates for the current month
  const generateCalendarDates = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const calendarDatesArray: CalendarDate[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison

    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      const isCurrentMonth = currentDate.getMonth() === month;
      const isToday = currentDate.toDateString() === today.toDateString();
      const isSelected = selectedCalendarDate ? currentDate.toDateString() === selectedCalendarDate.toDateString() : false;
      const isTodaySelected = false; // Remove default today selection styling
      const isDisabled = currentDate > today; // Only disable future dates

      // Check if this date has events
      const dateString = formatDateForDisplay(currentDate);
      const hasEvent = dates.includes(dateString);

      calendarDatesArray.push({
        date: currentDate,
        day: currentDate.getDate(),
        month: currentDate.getMonth(),
        year: currentDate.getFullYear(),
        isCurrentMonth,
        isToday,
        isSelected,
        hasEvent,
        isDisabled,
        isTodaySelected,
      });
    }

    setCalendarDates(calendarDatesArray);
  };

  const formatDateForDisplay = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Force conversion to local date (ignores UTC shift)
  const formatDateForFilter = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };



  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const handleDateSelect = (calendarDate: CalendarDate) => {
    if (!calendarDate.isCurrentMonth || calendarDate.isDisabled) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentSelectedDate = new Date(calendarDate.date);
    currentSelectedDate.setHours(0, 0, 0, 0);

    if (currentSelectedDate > today) return;

    if (
      selectedCalendarDate &&
      selectedCalendarDate.toDateString() === calendarDate.date.toDateString()
    ) {
      setSelectedCalendarDate(null);
      setSelectedDate("");
      return;
    }

    setSelectedCalendarDate(currentSelectedDate);

    // ✅ Store as YYYY-MM-DD (local)
    const formattedDate = formatDateForFilter(currentSelectedDate);
    console.log("selectedate", formattedDate)
    setSelectedDate(formattedDate);
  };
  const handleRegionSelect = (region: Region) => {
    setSelectedRegion(region.name);
    setShowRegionPicker(false);
  };

  const handleCalendarConfirm = () => {
    setShowDatePicker(false);
  };

  const handleCalendarCancel = () => {
    setSelectedCalendarDate(null);
    setSelectedDate('');
    setShowDatePicker(false);
  };

  useEffect(() => {
    fetchEvents();
    fetchRegions();
  }, []);

  // Filter regions based on search query
  useEffect(() => {
    if (regionSearchQuery.trim() === '') {
      setFilteredRegions(regions);
    } else {
      const filtered = regions.filter(region =>
        region.name.toLowerCase().includes(regionSearchQuery.toLowerCase())
      );
      setFilteredRegions(filtered);
    }
  }, [regionSearchQuery, regions]);

  useEffect(() => {
    generateCalendarDates(currentMonth);
  }, [currentMonth, dates, selectedCalendarDate]);

  useEffect(() => {
    let filtered = events;
    let filters: { key: string; label: string }[] = [];

    if (selectedDate) {
      filtered = filtered.filter(event => {
        // Firestore timestamp → JS Date (local)
        const eventDate = new Date(
          event.create_date._seconds * 1000 + event.create_date._nanoseconds / 1e6
        );

        // Extract only the local date (YYYY-MM-DD)
        const year = eventDate.getFullYear();
        const month = String(eventDate.getMonth() + 1).padStart(2, "0");
        const day = String(eventDate.getDate()).padStart(2, "0");
        const formattedEventDate = `${year}-${month}-${day}`;

        console.log("formattedEventDate:", formattedEventDate, "selectedDate:", selectedDate);

        return formattedEventDate === selectedDate;
      });

      filters.push({ key: "date", label: selectedDate });
    }



    if (selectedRegion) {
      const regionLower = selectedRegion.toLowerCase().trim();

      filtered = filtered.filter(event => {
        const placeLower = event.state.toLowerCase();

        if (placeLower.includes(regionLower)) return true;

        const parts = placeLower.split(",").map(p => p.trim());
        return parts.some(part => part === regionLower);
      });

      filters.push({ key: "region", label: selectedRegion });
    }

    setEventFilterList(filters);
    setFilteredEvents(filtered);
  }, [selectedDate, selectedRegion, events]);

  const applyToEvent = async (id: string, user: any) => {
    if (!user || !user.uid) {
      setShowLoginPrompt(true);
      return;
    }
    setApplyingId(id);
    try {
      await checkNetworkBeforeAction(async () => {
        await firestore().collection('events').doc(id).set({
          Applicants: firestore.FieldValue.arrayUnion({
            uid: user.uid,
            email: user.email,
            phone: user.phone,
            username: user.name,
          })
        }, { merge: true });
        await firestore().collection('users').doc(user.uid).set({
          events: firestore.FieldValue.arrayUnion(id),
        }, { merge: true });
        await fetchEvents();
      });
    } catch (e) {
      console.error('Apply error:', e);
    } finally {
      setApplyingId(null);
    }
  };

  const clearFilters = () => {
    setSelectedDate('');
    setSelectedRegion('');
    setSelectedCalendarDate(null);
    modalTranslateY.value = withSpring(1000, { damping: 15, stiffness: 100 });
    modalOpacity.value = withSpring(0, { damping: 15, stiffness: 100 });
    setTimeout(() => setShowFilters(false), 300);
  };



  // 🔹 Remove filter
  const removeFilter = (key) => {
    if (key === "date") setSelectedDate(null);
    if (key === "region") setSelectedRegion(null);
  };

  // 🔹 Render filter chip
  const renderFilterChip = ({ item }) => (
    <View style={{
      display: "flex", flexDirection: "row", gap: RH(5), marginLeft: RH(10), borderWidth: 1,
      borderColor: theme.border, paddingVertical: RH(2)
      , borderRadius: 5, paddingHorizontal: RW(3)
    }}>
      <Text style={[styles.chipText, { color: theme.textSecondary, fontFamily: "lato.medium" }]}>{item.label}</Text>
      <TouchableOpacity
        onPress={() => {
          removeFilter(item.key);

          // If this filter is for date, reset calendar date
          if (item.key === "date") {
            setSelectedCalendarDate(null);
          }
        }}
      >
        <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: RH(1) }}>✕</Text>
      </TouchableOpacity>
    </View>
  );


  type Event = {
    create_date?: { seconds: number; nanoseconds: number } | string; // Firestore timestamp or string
    event_date?: string; // "dd-MM-yyyy"
    event_name: string;
    event_place: string;
    event_time: string;
    image: string;
    description: string;
  };

  // ==========================
  // Parse timestamp / string → JS Date
  // ==========================
  const parseTimestamp = (ts?: any): Date | null => {
    if (!ts) return null;

    if (ts instanceof Date) return isNaN(ts.getTime()) ? null : ts;

    if (typeof ts === "object" && ts !== null) {
      if (ts.seconds !== undefined) {
        return new Date(ts.seconds * 1000 + (ts.nanoseconds || 0) / 1_000_000);
      }
      if (ts.timestampValue) return parseTimestamp(ts.timestampValue);
    }

    if (typeof ts === "string") {
      const iso = new Date(ts);
      if (!isNaN(iso.getTime())) return iso;

      const parts = ts.split("-").map(Number);
      if (parts.length === 3) {
        const [d, m, y] = parts;
        return new Date(y, m - 1, d);
      }
    }

    return null;
  };

  // ==========================
  // Format date nicely for display
  // ==========================
  const formatDate = (date: Date | null): string => {
    if (!date || isNaN(date.getTime())) return "Unknown Date";
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // ==========================
  // Format date for filtering (dd-MM-yyyy)
  // ==========================
  const formatDateKey = (date: Date | null): string => {
    if (!date || isNaN(date.getTime())) return "";
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
  };

  // ==========================
  // Filter events by date & region
  // ==========================
  const filterEvents = (
    events: Event[],
    selectedDate?: string,
    selectedRegion?: string
  ) => {
    return events.filter(event => {
      let pass = true;

      if (selectedDate) {
        const eventDate =
          parseTimestamp(event.create_date) || parseTimestamp(event.event_date);
        pass = pass && formatDateKey(eventDate) === selectedDate;
      }

      if (selectedRegion) {
        const regionLower = selectedRegion.toLowerCase().trim();
        const placeLower = event.event_place.toLowerCase();
        pass =
          pass &&
          (placeLower.includes(regionLower) ||
            placeLower.split(",").map(p => p.trim()).includes(regionLower));
      }

      return pass;
    });
  };

  // ==========================
  // Group events by date
  // ==========================
  // ==========================
  // Group events by date
  // ==========================
  const groupEventsByDate = (events: Event[]) => {
    const grouped: Record<string, Event[]> = {};

    events
      .sort((a, b) => {
        const aDate = parseTimestamp(a.create_date) || parseTimestamp(a.event_date);
        const bDate = parseTimestamp(b.create_date) || parseTimestamp(b.event_date);
        return (bDate?.getTime() || 0) - (aDate?.getTime() || 0);
      })
      .forEach(event => {
        const dateObj = parseTimestamp(event.create_date) || parseTimestamp(event.event_date);
        if (!dateObj) return;

        const key = dateObj.toDateString(); // use a consistent key
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(event);
      });

    return Object.entries(grouped).map(([key, data]) => ({
      title: new Date(key), // store Date object instead of string
      data,
    }));
  };



  const formatSectionDate = (date: Date) => {
    if (!date || isNaN(date.getTime())) return "Invalid Date";

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today / ${date.toLocaleDateString('en-US', { weekday: 'long' })}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow / ${date.toLocaleDateString('en-US', { weekday: 'long' })}`;
    } else {
      return `${date.getDate()} ${date.toLocaleDateString('en-US', { month: 'long' })} / ${date.toLocaleDateString('en-US', { weekday: 'long' })}`;
    }
  };


  const closeModalWithAnimation = () => {
    modalTranslateY.value = withSpring(1000, { damping: 15, stiffness: 100 });
    modalOpacity.value = withSpring(0, { damping: 15, stiffness: 100 });
    setTimeout(() => setShowFilters(false), 300);
  };

  const styles = createStyles(theme);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: modalTranslateY.value }],
    opacity: modalOpacity.value,
  }));

  const renderEventCard = ({ item }: { item: Event }) => (
    <TouchableOpacity
      style={[styles.card, cardStyle]}
      onPress={() => (navigation as any).navigate('EventDetail', { event: item })}
    >
      <View style={styles.cardContent}>
        <View style={styles.imageContainer}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.eventImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialCommunityIcons name="calendar-blank" size={48} color={theme.textLight} />
            </View>
          )}
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.eventName}>{item.event_name}</Text>
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
              <Text style={styles.detailText}>{item.event_time}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="location-outline" size={16} color={theme.textSecondary} />
              <Text style={styles.detailText}>{item.event_place}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // const renderCalendar = () => (
  //   <Modal
  //     visible={showDatePicker}
  //     transparent
  //     animationType="slide"
  //     onRequestClose={() => setShowDatePicker(false)}
  //   >
  //     <TouchableOpacity
  //       style={styles.modalOverlay}
  //       activeOpacity={1}
  //       onPress={() => setShowDatePicker(false)}
  //     >
  //       <View style={styles.pickerModal}>
  //         <View style={styles.modalHeader}>
  //           <Text style={styles.modalTitle}>Select Date</Text>
  //           <TouchableOpacity onPress={() => setShowDatePicker(false)}>
  //             <Ionicons name="close" size={24} color={theme.text} />
  //           </TouchableOpacity>
  //         </View>

  //         <View style={styles.calendarContainer}>
  //           {/* Calendar Header */}
  //           <View style={styles.calendarHeader}>
  //             <TouchableOpacity onPress={() => navigateMonth('prev')}>
  //               <Ionicons name="chevron-back" size={24} color={theme.primary} />
  //             </TouchableOpacity>
  //             <Text style={styles.calendarTitle}>
  //               {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
  //             </Text>
  //             <TouchableOpacity onPress={() => navigateMonth('next')}>
  //               <Ionicons name="chevron-forward" size={24} color={theme.primary} />
  //             </TouchableOpacity>
  //           </View>

  //           {/* Day Headers */}
  //           <View style={styles.dayHeaders}>
  //             {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
  //               <Text key={day} style={styles.dayHeader}>
  //                 {day}
  //               </Text>
  //             ))}
  //           </View>

  //           {/* Calendar Grid */}
  //           <View style={styles.calendarGrid}>
  //             {calendarDates.map((calendarDate, index) => (
  //               <TouchableOpacity
  //                 key={index}
  //                 style={[
  //                   styles.calendarDay,
  //                   !calendarDate.isCurrentMonth && styles.calendarDayOtherMonth,
  //                   // Remove default today styling - only show when selected
  //                   calendarDate.isSelected && styles.calendarDaySelected,
  //                   calendarDate.isTodaySelected && styles.calendarDaySelected,
  //                   calendarDate.hasEvent && styles.calendarDayHasEvent,
  //                   calendarDate.isDisabled && styles.calendarDayDisabled,
  //                 ]}
  //                 onPress={() => handleDateSelect(calendarDate)}
  //                 disabled={!calendarDate.isCurrentMonth || calendarDate.isDisabled}
  //               >
  //                 <Text style={[
  //                   styles.calendarDayText,
  //                   !calendarDate.isCurrentMonth && styles.calendarDayTextOtherMonth,
  //                   // Remove default today text styling - only show when selected
  //                   calendarDate.isSelected && styles.calendarDayTextSelected,
  //                   calendarDate.isDisabled && styles.calendarDayTextDisabled,
  //                 ]}>
  //                   {calendarDate.day}
  //                 </Text>
  //                 {calendarDate.hasEvent && (
  //                   <View style={styles.eventDot} />
  //                 )}
  //               </TouchableOpacity>
  //             ))}
  //           </View>

  //           {/* Selected Date Display */}
  //           {selectedCalendarDate && (
  //             <View style={styles.selectedDateContainer}>
  //               <Text style={styles.selectedDateText}>
  //                 Selected: {formatDateForDisplay(selectedCalendarDate)}
  //               </Text>
  //             </View>
  //           )}

  //           {/* Action Buttons */}
  //           <View style={styles.calendarActions}>
  //             <Button
  //               title="Cancel"
  //               onPress={handleCalendarCancel}
  //               variant="outline"
  //               style={styles.calendarActionButton}
  //             />
  //             <Button
  //               title="Confirm"
  //               onPress={handleCalendarConfirm}
  //               style={styles.calendarActionButton}
  //             />
  //           </View>
  //         </View>
  //       </View>
  //     </TouchableOpacity>
  //   </Modal>
  // );

  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      transparent
      animationType="none"
      onShow={() => {
        modalTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
        modalOpacity.value = withSpring(1, { damping: 15, stiffness: 100 });
      }}
      onRequestClose={() => {
        modalTranslateY.value = withSpring(1000, { damping: 15, stiffness: 100 });
        modalOpacity.value = withSpring(0, { damping: 15, stiffness: 100 });
        setTimeout(() => setShowFilters(false), 300);
      }}
    >
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.filterModal, modalStyle]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeModalWithAnimation}>
              <Ionicons name="chevron-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Filter Events</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'date' && styles.activeTab]}
              onPress={() => setActiveTab('date')}
            >
              <Text style={[styles.tabText, activeTab === 'date' && styles.activeTabText]}>Date</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'region' && styles.activeTab]}
              onPress={() => setActiveTab('region')}
            >
              <Text style={[styles.tabText, activeTab === 'region' && styles.activeTabText]}>Region</Text>
            </TouchableOpacity>
          </View>

          {/* Content based on active tab */}
          {activeTab === 'date' ? (
            <>
              {/* Calendar */}
              <View style={styles.calendarCard}>
                {/* Month Navigation */}
                <View style={styles.calendarHeader}>
                  <TouchableOpacity onPress={() => navigateMonth('prev')}>
                    <Ionicons name="chevron-back" size={18} color={theme.primary} />
                  </TouchableOpacity>
                  <Text style={styles.calendarMonthText}>
                    {currentMonth.toLocaleDateString('en-US', { month: 'long' })}
                  </Text>
                  <TouchableOpacity onPress={() => navigateMonth('next')}>
                    <Ionicons name="chevron-forward" size={18} color={theme.primary} />
                  </TouchableOpacity>
                </View>

                {/* Day Headers */}
                <View style={styles.dayHeaders}>
                  {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => (
                    <Text key={day} style={styles.dayHeader}>
                      {day}
                    </Text>
                  ))}
                </View>

                {/* Calendar Grid */}
                <View style={styles.calendarGrid}>
                  {calendarDates.map((calendarDate, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.calendarDay,
                        !calendarDate.isCurrentMonth && styles.calendarDayOtherMonth,
                        calendarDate.isSelected && styles.calendarDaySelected,
                        calendarDate.isTodaySelected && styles.calendarDaySelected,
                        calendarDate.isDisabled && styles.calendarDayDisabled,
                      ]}
                      onPress={() => handleDateSelect(calendarDate)}
                      disabled={!calendarDate.isCurrentMonth || calendarDate.isDisabled}
                    >
                      <Text style={[
                        styles.calendarDayText,
                        !calendarDate.isCurrentMonth && styles.calendarDayTextOtherMonth,
                        calendarDate.isSelected && styles.calendarDayTextSelected,
                        calendarDate.isDisabled && styles.calendarDayTextDisabled,
                      ]}>
                        {calendarDate.day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Action Buttons for Date */}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  onPress={clearFilters}
                  style={[styles.clearButton,]}
                >
                  <Text style={{ color: "#E64646", fontFamily: "Inter_28pt-Regular", fontWeight: "600" }}>
                    Clear
                  </Text>

                </TouchableOpacity>
                <Button
                  title="Set Date"
                  onPress={closeModalWithAnimation}
                  style={styles.setDateButton}
                  textStyle={{
                    fontFamily: 'Inter_28pt-Regular',   // custom font family
                    fontWeight: '400',    // bold
                    fontSize: 14,         // optional font size
                  }}
                />
              </View>
            </>
          ) : (
            <>
              {/* Region Search */}
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={theme.textSecondary} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search regions..."
                  placeholderTextColor={theme.textLight}
                  value={regionSearchQuery}
                  onChangeText={setRegionSearchQuery}
                />
                {regionSearchQuery.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearSearchButton}
                    onPress={() => setRegionSearchQuery('')}
                  >
                    <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Region List */}
              <View style={styles.regionListContainer}>
                {loadingRegions ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={styles.loadingText}>Loading regions...</Text>
                  </View>
                ) : (
                  <ScrollView style={styles.regionList} showsVerticalScrollIndicator={false}>
                    <TouchableOpacity
                      style={[styles.regionOption, !selectedRegion && styles.regionOptionActive]}
                      onPress={() => {
                        setSelectedRegion('');
                      }}
                    >
                      <View style={styles.radioContainer}>
                        <View style={[styles.radioButton, !selectedRegion && styles.radioButtonActive]}>
                          {!selectedRegion && <View style={styles.radioDot} />}
                        </View>
                      </View>
                      <Text style={[styles.regionOptionText, !selectedRegion && styles.regionOptionTextActive]}>
                        All Regions
                      </Text>
                    </TouchableOpacity>

                    {filteredRegions.length > 0 ? (
                      filteredRegions.map((region) => (
                        <TouchableOpacity
                          key={region.id}
                          style={[styles.regionOption, selectedRegion === region.name && styles.regionOptionActive]}
                          onPress={() => handleRegionSelect(region)}
                        >
                          <View style={styles.radioContainer}>
                            <View style={[styles.radioButton, selectedRegion === region.name && styles.radioButtonActive]}>
                              {selectedRegion === region.name && <View style={styles.radioDot} />}
                            </View>
                          </View>
                          <Text style={[styles.regionOptionText, selectedRegion === region.name && styles.regionOptionTextActive]}>
                            {region.name}
                          </Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <View style={styles.noDataContainer}>
                        <Text style={styles.noDataText}>
                          {regionSearchQuery ? 'No regions found' : 'No regions available'}
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                )}
              </View>

              {/* Apply Button for Region */}
              <View style={styles.applyButtonContainer}>
                <Button
                  title="Apply"
                  onPress={closeModalWithAnimation}
                  style={styles.applyButton}
                  textStyle={{
                    fontFamily: 'Inter_28pt-Regular',   // custom font family
                    fontWeight: '600',    // bold
                    fontSize: 14,
                    letterSpacing: 2         // optional font size
                  }}
                />
              </View>
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

      {/* Header */}
      <View style={[styles.headerEventMain, { borderBottomColor: theme.border }]}>
        <View style={{ display: "flex", flexDirection: "row", justifyContent: "flex-start" }}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Home', { screen: 'Discover' })}
          >
            <Ionicons name="chevron-back" size={22} color={theme.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Events</Text>

          </View>


        </View>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="filter-sharp" size={28} color={theme.text} />
        </TouchableOpacity>
      </View>
      <View >
        {eventFilterList.length > 0 && (
          <>
            {/* Filter Chips */}
            <FlatList
              data={eventFilterList}
              renderItem={renderFilterChip}
              horizontal
              keyExtractor={(item) => item.key}
              contentContainerStyle={{ paddingVertical: 8, paddingHorizontal: 10 }}
            />
          </>
        )}
      </View>




      {/* Events List */}
      {loading && events.length === 0 ? (
        <View style={styles.loadingContainer}>
          {[1, 2, 3, 4, 5].map((index) => (
            <View key={index} style={styles.shimmerCard}>
              <ShimmerEffect
                width={RW(80)}
                height={RW(80)}
                borderRadius={RW(8)}
                style={styles.shimmerImage}
              />
              <View style={styles.shimmerContent}>
                <ShimmerEffect
                  width="100%"
                  height={RH(20)}
                  borderRadius={RW(4)}
                  style={styles.shimmerTitle}
                />
                <ShimmerEffect
                  width="100%"
                  height={RH(32)}
                  borderRadius={RW(4)}
                  style={styles.shimmerDescription}
                />
                <View style={styles.shimmerDetails}>
                  <ShimmerEffect
                    width={RW(60)}
                    height={RH(16)}
                    borderRadius={RW(4)}
                    style={styles.shimmerDetail}
                  />
                  <ShimmerEffect
                    width={RW(60)}
                    height={RH(16)}
                    borderRadius={RW(4)}
                    style={styles.shimmerDetail}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <SectionList
          sections={groupEventsByDate(filteredEvents)}
          renderItem={renderEventCard}
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{formatSectionDate(title)}</Text>
            </View>
          )}
          keyExtractor={(item, index) => `${item.event_name}-${index}`}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={fetchEvents} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="calendar-blank-outline"
                size={80}
                color={theme.textLight}
              />
              <Text style={styles.emptyText}>No events available</Text>
              <Text style={styles.emptySubtext}>
                {selectedDate || selectedRegion
                  ? 'Try adjusting your filters'
                  : 'Check back later for upcoming events'}
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />

      )}

      {renderFilterModal()}
      {/* {renderCalendar()} */}

      {/* Login Prompt Modal */}
      <LoginPrompt
        visible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        title="You need to log in to continue"
        message="Please sign in to apply for events and access all features."
        isDarkMode={isDarkMode}
      />
    </SafeAreaView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({

  filterSelection: {

    height: 30
  },
  container: {
    flex: 1,
  },
  headerEventMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: RW(5),
    paddingVertical: RH(10),
    borderBottomWidth: 1,
    marginTop: RH(5),
  },
  backButton: {
    width: RW(40),
    height: RH(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    alignItems: "center",
    marginTop: RH(4),
    fontSize: RFValue(22),
    color: theme.text,  // Assuming 'theme' is in scope
    flex: 1,
    fontFamily: "Lato-Regular",
    fontWeight: "500"

  },
  filterButton: {
    width: RW(40),
    height: RH(40),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: RH(5),
  },
  loadingContainer: {
    flex: 1,
    padding: RW(16),
  },
  shimmerCard: {
    flexDirection: 'row',
    padding: RW(16),
    marginBottom: RH(16),
    backgroundColor: theme.card,
    borderRadius: theme.borderRadius.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  shimmerImage: {
    marginRight: RW(12),
  },
  shimmerContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  shimmerTitle: {
    marginBottom: RH(4),
  },
  shimmerDescription: {
    marginBottom: RH(8),
  },
  shimmerDetails: {
    flexDirection: 'row',
    gap: RW(16),
  },
  shimmerDetail: {
    // Width and height handled by ShimmerEffect props
  },
  listContainer: {
    padding: RW(12),
    paddingBottom: RH(20),
  },
  sectionHeader: {
    paddingVertical: RH(1),
    paddingHorizontal: RW(16),
    backgroundColor: theme.background,
  },
  sectionTitle: {
    fontSize: RFValue(14),
    fontWeight: '600',
    color: theme.textSecondary,
  },
  card: {
    backgroundColor: theme.card,
    borderRadius: theme.borderRadius.lg,
    marginBottom: RH(16),
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  cardContent: {
    flexDirection: 'row',
    padding: RW(16),
  },
  imageContainer: {
    width: RW(80),
    height: RW(80),
    borderRadius: RW(8),
    overflow: 'hidden',
    marginRight: RW(12),
  },
  eventImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  eventName: {
    fontSize: RFValue(16),
    fontWeight: '600',
    color: theme.text,
    marginBottom: RH(4),
    fontFamily: "lato.semibold"
  },
  description: {
    fontSize: RFValue(11),
    color: theme.textSecondary,
    lineHeight: RFValue(18),
    marginBottom: RH(8),
    fontFamily: "Lato-Regular",
    fontWeight: 400
  },
  detailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RW(16),
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RW(4),
  },
  detailText: {
    fontSize: RFValue(10),
    color: theme.textSecondary,
    fontFamily: "Lato-Regular",
    fontWeight: 500
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: RH(80),
  },
  emptyText: {
    fontSize: RFValue(20),
    fontWeight: '600',
    color: theme.text,
    marginTop: RH(16),
    marginBottom: RH(8),
  },
  emptySubtext: {
    fontSize: RFValue(16),
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: RFValue(22),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModal: {
    backgroundColor: theme.card,
    padding: RW(20),
    height: '100%',
  },
  pickerModal: {
    backgroundColor: theme.card,
    borderTopLeftRadius: RW(24),
    borderTopRightRadius: RW(24),
    padding: RW(20),
    height: '80%',
    marginTop: 'auto',
    marginBottom: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RH(24),
  },
  modalTitle: {
    fontSize: RFValue(20),
    fontWeight: '500',
    color: theme.text,
    marginLeft: RW(10),
    fontFamily: "lato.medium"
  },
  filterSection: {
    marginBottom: RH(24),
  },
  filterLabel: {
    fontSize: RFValue(16),
    fontWeight: '600',
    color: theme.text,
    marginBottom: RH(12),
  },
  filterOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.background,
    paddingHorizontal: RW(16),
    paddingVertical: RH(12),
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.border,
    gap: RW(12),
  },
  filterButtonText: {
    flex: 1,
    fontSize: RFValue(16),
    color: theme.text,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: RW(12),
    marginTop: RH(16),
  },
  clearButton: {
    flex: 1,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: "#E64646",
    borderRadius: theme.borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    display: "flex",
    paddingHorizontal: RH(20)
  },
  applyFilterButton: {
    flex: 1,
  },
  calendarContainer: {
    flex: 1,
    paddingBottom: RH(20),
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: RH(20),
  },
  calendarTitle: {
    fontSize: RFValue(20),
    fontWeight: '700',
    color: theme.text,
    textAlign: 'center',
    marginBottom: RH(16),
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: RH(12),
    fontFamily: "lato.semibold",
    fontWeight: '600'

  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: RFValue(12),
    fontWeight: '600',
    color: theme.textSecondary,
    fontFamily: "lato.semibold",
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 0.9,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RW(20),
  },
  calendarDayOtherMonth: {
    opacity: 0.3,
  },
  calendarDaySelected: {
    backgroundColor: theme.primary,
  },
  calendarDayHasEvent: {
    // Visual indicator for days with events
  },
  calendarDayDisabled: {
    opacity: 0.3,
    backgroundColor: theme.background,
  },
  calendarDayText: {
    fontSize: RFValue(13),
    fontWeight: '500',
    color: theme.text,
    marginBottom: 2,
    fontFamily: "lato.medium"
  },
  calendarDayTextOtherMonth: {
    color: theme.textLight,
  },
  calendarDayTextSelected: {
    color: theme.card,
    fontWeight: '700',
  },
  calendarDayTextDisabled: {
    color: theme.textLight,
    opacity: 0.5,
  },
  eventDot: {
    position: 'absolute',
    bottom: RH(4),
    width: RW(4),
    height: RW(4),
    borderRadius: RW(2),
    backgroundColor: theme.primary,
  },
  selectedDateContainer: {
    backgroundColor: theme.background,
    padding: RW(16),
    borderRadius: theme.borderRadius.lg,
    marginBottom: RH(16),
    alignItems: 'center',
  },
  selectedDateText: {
    fontSize: RFValue(16),
    fontWeight: '600',
    color: theme.text,
  },
  calendarActions: {
    flexDirection: 'row',
    gap: RW(12),
  },
  calendarActionButton: {
    flex: 1,
  },
  dateOptions: {
    flex: 1,
    paddingBottom: RH(20),
  },
  dateOption: {
    paddingHorizontal: RW(16),
    paddingVertical: RH(16),
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: RH(12),
    backgroundColor: theme.background,
    minHeight: RH(56),
    justifyContent: 'center',
  },
  dateOptionActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  dateOptionText: {
    fontSize: RFValue(18),
    color: theme.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  dateOptionTextActive: {
    color: theme.card,
    fontWeight: '600',
  },
  regionOptions: {
    flex: 1,
    paddingBottom: RH(20),
  },
  regionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: RW(16),
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: RH(12),
    backgroundColor: theme.background,
    minHeight: RH(56),
  },
  regionOptionActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  regionOptionText: {
    fontSize: RFValue(14),
    color: theme.text,
    fontWeight: '500',
    fontFamily: "lato.medium"
  },
  regionOptionTextActive: {
    color: theme.card,
    fontWeight: '600',
  },
  noDataContainer: {
    padding: RW(20),
    alignItems: 'center',
  },
  noDataText: {
    fontSize: RFValue(16),
    color: theme.textSecondary,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: RH(20),
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  tab: {
    flex: 1,
    paddingVertical: RH(12),
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: theme.primary,
  },
  tabText: {
    fontSize: RFValue(18),
    fontWeight: '500',
    color: theme.textSecondary,
    fontFamily: "lato.medium"

  },
  activeTabText: {
    color: theme.primary,
  },
  calendarCard: {
    backgroundColor: theme.card,
    borderRadius: theme.borderRadius.lg,
    padding: RW(20),
    marginBottom: RH(20),
    ...theme.shadow.medium,
  },
  calendarMonthText: {
    fontSize: RFValue(15),
    fontWeight: '500',
    color: theme.text,
    fontFamily: "lato.semibold"
  },
  setDateButton: {
    flex: 1,
    fontFamily: "Inter_28pt-Regular",
    fontWeight: 900
  },
  regionListContainer: {
    flex: 1,
    marginBottom: RH(20),
  },
  regionList: {
    paddingBottom: RH(20),
  },
  radioContainer: {
    width: RW(24),
    height: RW(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: RW(12),
  },
  radioButton: {
    width: RW(18),
    height: RW(18),
    borderRadius: RW(9),
    borderWidth: 1,
    borderColor: theme.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonActive: {
    borderColor: theme.primary,
    backgroundColor: theme.primary,
  },
  radioDot: {
    width: RW(8),
    height: RW(8),
    borderRadius: RW(4),
    backgroundColor: theme.card,
  },
  applyButtonContainer: {
    marginTop: RH(16),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.background,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: RW(16),
    marginBottom: RH(16),
    borderWidth: 1,
    borderColor: theme.border,
  },
  searchIcon: {
    marginRight: RW(12),
  },
  searchInput: {
    flex: 1,
    fontSize: RFValue(16),
    color: theme.text,
    fontFamily: "Lato=Regular",
    fontWeight: "400"
  },
  clearSearchButton: {
    marginLeft: RW(8),
    fontFamily: "Inter_28pt-Regular",
    fontWeight: "600",
  },
  applyButton: {
    width: '100%',
  },

  filterselection: {
    height: 20,
    borderBottomWidth: 1
  }
});

export default EventsScreen;
