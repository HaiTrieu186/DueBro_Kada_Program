import type { Config } from 'tailwindcss';
import { colors } from '../../packages/design-tokens/src/colors';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: colors.primary,
        dark: colors.dark,
        light: colors.light,
        status: colors.status,
      },
    },
  },
  plugins: [],
};

export default config;
