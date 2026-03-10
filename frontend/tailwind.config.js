/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                serif: ['"DM Serif Display"', 'Georgia', 'serif'],
                display: ['Inter', 'system-ui', 'sans-serif'],
            },
            animation: {
                'fade-up': 'fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both',
                'fade-in': 'fade-in 0.35s ease both',
                'shimmer': 'shimmer 1.7s linear infinite',
                'spin-slow': 'spin-slow 4s linear infinite',
                'bar-fill': 'bar-fill 0.9s cubic-bezier(0.22,1,0.36,1) both',
                'orb-drift': 'orb-drift 20s ease-in-out infinite',
            },
        },
    },
    plugins: [],
};
