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
  },
  dark: {
    colors: {
      primary: palette.maize,
      secondary: palette.blue,
    },
    text: '#fff',
    background: '#000',
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
  },
};
