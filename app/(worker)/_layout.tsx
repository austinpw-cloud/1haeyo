/**
 * 일손(worker) 역할 메인 탭.
 * 하단 탭 3개: 홈 / 내 일 / 프로필
 * 테마: 주황 (primary)
 */

import { Tabs } from 'expo-router';
import { Briefcase, Home, User } from 'lucide-react-native';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, RoleSwitcher, touchTarget, typography } from '@/shared/ui';

export default function WorkerLayout() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <RoleSwitcher />
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: colors.primary[500],
            tabBarInactiveTintColor: colors.neutral[500],
            tabBarStyle: {
              backgroundColor: colors.neutral[0],
              borderTopColor: colors.neutral[200],
              height: touchTarget.primary + 24,
              paddingTop: 6,
              paddingBottom: 6,
            },
            tabBarLabelStyle: {
              ...typography.caption,
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: '홈',
              tabBarIcon: ({ color }) => <Home size={24} color={color} />,
            }}
          />
          <Tabs.Screen
            name="my-jobs"
            options={{
              title: '내 일',
              tabBarIcon: ({ color }) => <Briefcase size={24} color={color} />,
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: '프로필',
              tabBarIcon: ({ color }) => <User size={24} color={color} />,
            }}
          />
        </Tabs>
      </View>
    </SafeAreaView>
  );
}
