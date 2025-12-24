import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../theme';

interface StatusBarProps {
  time?: string;
  battery?: string;
  signal?: string;
}

export default function CustomStatusBar({ 
  time = '1:50', 
  battery = '52%',
  signal = 'LTE'
}: StatusBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.timeContainer}>
        <Text style={styles.time}>{time}</Text>
      </View>
      <View style={styles.rightContainer}>
        <Text style={styles.signal}>{signal}</Text>
        <View style={styles.signalBars}>
          <View style={[styles.bar, styles.bar1]} />
          <View style={[styles.bar, styles.bar2]} />
          <View style={[styles.bar, styles.bar3]} />
        </View>
        <Text style={styles.battery}>{battery}</Text>
        <View style={styles.batteryIcon}>
          <View style={styles.batteryFill} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  timeContainer: {
    backgroundColor: colors.green,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  time: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  signal: {
    ...typography.caption,
    color: colors.green,
    marginRight: 4,
  },
  signalBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    marginRight: 4,
  },
  bar: {
    width: 3,
    backgroundColor: colors.green,
    borderRadius: 1,
  },
  bar1: {
    height: 4,
  },
  bar2: {
    height: 6,
  },
  bar3: {
    height: 8,
  },
  battery: {
    ...typography.caption,
    color: colors.green,
    marginRight: 2,
  },
  batteryIcon: {
    width: 20,
    height: 10,
    borderWidth: 1,
    borderColor: colors.green,
    borderRadius: 2,
    padding: 1,
  },
  batteryFill: {
    flex: 1,
    backgroundColor: colors.green,
    borderRadius: 1,
    width: '52%',
  },
});

