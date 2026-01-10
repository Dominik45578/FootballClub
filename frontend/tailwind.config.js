/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // core semantic colors mapped to CSS variables
                primary: 'var(--primary)',
                'primary-foreground': 'var(--primary-foreground)',
                secondary: 'var(--secondary)',
                'secondary-foreground': 'var(--secondary-foreground)',
                muted: 'var(--muted)',
                'muted-foreground': 'var(--muted-foreground)',
                accent: 'var(--accent)',
                'accent-foreground': 'var(--accent-foreground)',
                destructive: 'var(--destructive)',
                card: 'var(--card)',
                'card-foreground': 'var(--card-foreground)',
                input: 'var(--input)',
                background: 'var(--background)',
                foreground: 'var(--foreground)',
                border: 'var(--border)',
                ring: 'var(--ring)'
            }
        },
    },
    plugins: [],
}