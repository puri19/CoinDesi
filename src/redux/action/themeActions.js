import { createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

// helper function for saving to AsyncStorage
const saveToStorage = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.log(`Error saving ${key}`, e);
  }
};

const initialState = {
  isDarkMode: false,
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.isDarkMode = !state.isDarkMode;
      saveToStorage("isDarkMode", state.isDarkMode);
    },
    setTheme: (state, action) => {
      state.isDarkMode = action.payload;
      saveToStorage("isDarkMode", action.payload);
    },
  }
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;
