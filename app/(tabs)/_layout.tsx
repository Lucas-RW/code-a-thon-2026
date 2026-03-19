import { Tabs } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MagicButton from '@/components/MagicButton';
import { View } from 'react-native';
import { theme } from '@/lib/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: 85,
          paddingBottom: 25,
          paddingTop: 10,
          position: 'absolute', // Allow the button to pop out
          borderTopWidth: 1,
          elevation: 0,
        },
        tabBarActiveTintColor: theme.colors.accentTertiary,
        tabBarInactiveTintColor: theme.colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="golden-path"
        options={{
          title: 'Path',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="auto-fix-high" size={size} color={color} />
          ),
        }}
      />

      {/* Magic Button Placeholder */}
      <Tabs.Screen
        name="magic-btn"
        listeners={{
          tabPress: (e) => {
            // Prevent actual navigation to this screen
            e.preventDefault();
          },
        }}
        options={{
          title: '',
          tabBarButton: () => (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <MagicButton size={60} />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="my-opportunities"
        options={{
          title: 'Interests',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="bookmark" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size} color={color} />
          ),
        }}
      />

      {/* Hidden Screens */}
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="ar-demo"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="buildings"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="graph"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
