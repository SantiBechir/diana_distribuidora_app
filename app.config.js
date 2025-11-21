require('dotenv').config();

module.exports = {
    expo: {
        name: "Diana Distribuidora",
        slug: "diana_distribuidora",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/icon.png",
        userInterfaceStyle: "light",
        splash: {
            image: "./assets/splash-icon.png",
            resizeMode: "contain",
            backgroundColor: "#2E7D32"
        },
        extra: {
            EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
            EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
        },
        plugins: [
            "expo-sqlite"
        ]
    }
};
