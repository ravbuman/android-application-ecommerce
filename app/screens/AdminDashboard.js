import { ScrollView, StyleSheet, View } from 'react-native';
import AdminDashboardStats from '../components/AdminDashboardStats';
import CustomAppBar, { APPBAR_HEIGHT } from '../components/CustomAppBar';
import { useTheme } from '../components/ThemeContext';

export default function AdminDashboard() {
  const { theme } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <CustomAppBar title="Admin Dashboard" />
      <View style={{ flex: 1, marginTop: APPBAR_HEIGHT + 32 }}>
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120, backgroundColor: theme.background }}>
          <AdminDashboardStats />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-start', alignItems: 'center', padding: 0 },
});
// The dashboard background now uses the theme for claymorphism and dark/light mode.
