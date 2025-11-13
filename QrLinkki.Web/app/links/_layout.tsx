import React from 'react';
import { Slot, useSegments } from 'expo-router';

import { ThemedView } from '@/components/themed-view';

export default function LinksLayout() {
  return (
    <ThemedView style={{ flex: 1 }}>
      <Slot />
    </ThemedView>
  );
}
