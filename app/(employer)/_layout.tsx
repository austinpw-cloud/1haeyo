/**
 * 사장님(employer) 역할 메인 탭.
 * 하단 탭 4개: 홈 / 일감 등록 / 매칭 관리 / 프로필
 * 테마: 녹색 (secondary)
 */

import { Tabs } from 'expo-router';
import { Home, PlusSquare, User, Users } from 'lucide-react-native';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, RoleSwitcher, touchTarget, typography } from '@/shared/ui';

export default function EmployerLayout() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <RoleSwitcher />
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: colors.secondary[500],
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
              title: '내 일감',
              tabBarIcon: ({ color }) => <Home size={24} color={color} />,
            }}
          />
          <Tabs.Screen
            name="create"
            options={{
              title: '일감 등록',
              tabBarIcon: ({ color }) => <PlusSquare size={24} color={color} />,
            }}
          />
          <Tabs.Screen
            name="matches"
            options={{
              title: '매칭 관리',
              tabBarIcon: ({ color }) => <Users size={24} color={color} />,
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
