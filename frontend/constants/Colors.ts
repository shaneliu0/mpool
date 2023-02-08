const tintColorLight = '#2f95dc';
const tintColorDark = '#fff';

const defaultPalette = {
  primary: '#FFCB05',
  secondary: '#00274C',
  red: '#C40233',
  white: '#FFFFFF',
  black: '#000000',
}

export const getThemeFromPalette = (palette?: typeof defaultPalette) => {
  const p = { ...defaultPalette, ...palette };

  return {
    light: {
      colors: {
        primary: p.primary,
        secondary: p.secondary,
        danger: p.red,
      },
      complementColors: {
        primary: p.black,
        secondary: p.white,
        danger: p.white,
      },
      text: '#000',
      background: '#fff',
      tint: tintColorLight,
      tabIconDefault: '#ccc',
      tabIconSelected: tintColorLight,
      softForeground: "rgba(0,0,0,.87)"
    },
    dark: {
      colors: {
        primary: p.primary,
        secondary: p.secondary,
        danger: p.red,
      },
      complementColors: {
        primary: p.black,
        secondary: p.white,
        danger: p.white,
      },
      text: '#fff',
      background: '#000',
      tint: tintColorDark,
      tabIconDefault: '#ccc',
      tabIconSelected: tintColorDark,
      softForeground: "rgba(216,216,216,0.87)"
    },
  }
}

export default {
  light: {
    colors: {
      primary: defaultPalette.primary,
      secondary: defaultPalette.secondary,
      danger: defaultPalette.red,
    },
    complementColors: {
      primary: defaultPalette.black,
      secondary: defaultPalette.white,
      danger: defaultPalette.white,
    },
    text: '#000',
    background: '#fff',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
    softForeground: "rgba(0,0,0,.87)"
  },
  dark: {
    colors: {
      primary: defaultPalette.primary,
      secondary: defaultPalette.secondary,
      danger: defaultPalette.red,
    },
    complementColors: {
      primary: defaultPalette.black,
      secondary: defaultPalette.white,
      danger: defaultPalette.white,
    },
    text: '#fff',
    background: '#000',
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
    softForeground: "rgba(216,216,216,0.87)"
  },
};

export const grayLining = "#5f6368";