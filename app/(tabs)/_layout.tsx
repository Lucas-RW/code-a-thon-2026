import { Tabs } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
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
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="explore" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ar-demo"
        options={{
          title: 'AR Demo',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="camera" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="buildings"
        options={{
          title: 'Buildings',
          href: '/buildings',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="business" size={size} color={color} />
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
      <Tabs.Screen
        name="my-opportunities"
        options={{
          title: 'My Opportunities',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="bookmark" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
