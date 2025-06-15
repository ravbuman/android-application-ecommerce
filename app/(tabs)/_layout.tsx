  import { Tabs } from "expo-router";
  import CustomAppBar from "../components/CustomAppBar";
  import CustomTabBar from "../components/CustomTabBar";

  export default function TabsLayout() {
    return (
      <Tabs
        screenOptions={({ route }) => ({
          header: () => (
            <CustomAppBar
              title={route.name.replace("screens/", "").replace("Screen", "")}
            />
          ),
          headerShown: true,
          tabBarActiveTintColor: undefined, // handled in CustomTabBar
          tabBarInactiveTintColor: undefined,
          tabBarStyle: { display: "none" }, // Hide default tab bar
        })}
        tabBar={() => <CustomTabBar />}
      >
        <Tabs.Screen name="screens/OrdersScreen" />
        <Tabs.Screen name="screens/ProfileScreen" />
        <Tabs.Screen name="screens/HomeScreen" />
        <Tabs.Screen name="screens/ProductList" />
        <Tabs.Screen name="screens/WishlistScreen" />
        <Tabs.Screen name="screens/Reports" />
      </Tabs>
    );
  }
  // (tabs)/_layout.tsx: Handles the main tab navigation for the app.
