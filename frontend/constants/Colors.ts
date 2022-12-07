const tintColorLight = '#2f95dc';
const tintColorDark = '#fff';

const palette = {
  maize: '#FFCB05',
  blue: '#00274C',
  white: '#FFFFFF',
  black: '#000000',
}

export default {
  light: {
    colors: {
      primary: palette.maize,
      secondary: palette.blue,
    },
    complementColors: {
      primary: palette.black,
      secondary: palette.white,
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
      primary: palette.maize,
      secondary: palette.blue,
    },
    complementColors: {
      primary: palette.black,
      secondary: palette.white,
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