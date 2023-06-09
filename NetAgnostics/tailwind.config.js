/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme');

const { parseColor } = require("tailwindcss/lib/util/color");

/* Converts HEX color to RGB */
const toRGB = (value) => parseColor(value).color.join(" ");

const generateColorClass = (variable) => {
  return ({ opacityValue }) =>
      opacityValue
          ? `rgba(var(--${variable}), ${opacityValue})`
          : `rgb(var(--${variable}))`
}

const textColor = {
  primary: generateColorClass('text-primary'),
  secondary: generateColorClass('text-secondary'),
  tertiary: generateColorClass('text-tertiary'),
}

const backgroundColor = {
  primary: generateColorClass('bg-primary'),
  secondary: generateColorClass('bg-secondary'),
  tertiary: generateColorClass('bg-tertiary'),
}

module.exports = {
  darkMode: 'media', // or 'class'
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter var', ...defaultTheme.fontFamily.sans],
      },
      textColor,
      backgroundColor,
    },
  },
  plugins: [
    require('@tailwindcss/typography')
  ],
}