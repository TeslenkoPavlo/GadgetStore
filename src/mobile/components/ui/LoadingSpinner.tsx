import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MotiView } from 'moti';

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
}


export function LoadingSpinner({ size = 50, color }: LoadingSpinnerProps) {
  const spinnerColor = color || '#1A1A1A';

  return (
    <View style={styles.container}>
      <MotiView
        from={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 300 }}
        style={styles.spinnerContainer}
      >

        <MotiView
          from={{ rotate: '0deg' }}
          animate={{ rotate: '360deg' }}
          transition={{
            type: 'timing',
            duration: 1000,
            loop: true,
            repeatReverse: false,
          }}
          style={[
            styles.outerRing,
            {
              width: size,
              height: size,
              borderColor: spinnerColor,
              borderTopColor: 'transparent',
            },
          ]}
        />


        <MotiView
          from={{ rotate: '0deg' }}
          animate={{ rotate: '-360deg' }}
          transition={{
            type: 'timing',
            duration: 800,
            loop: true,
            repeatReverse: false,
          }}
          style={[
            styles.innerRing,
            {
              width: size * 0.6,
              height: size * 0.6,
              borderColor: spinnerColor,
              borderBottomColor: 'transparent',
            },
          ]}
        />
      </MotiView>
    </View>
  );
}


export function ClockSpinner({ size = 50, color }: LoadingSpinnerProps) {
  const spinnerColor = color || '#1A1A1A';

  return (
    <View style={styles.container}>
      <MotiView
        from={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 300 }}
        style={[styles.clockContainer, { width: size, height: size, borderColor: spinnerColor }]}
      >

        <MotiView
          from={{ rotate: '0deg' }}
          animate={{ rotate: '360deg' }}
          transition={{
            type: 'timing',
            duration: 3000,
            loop: true,
            repeatReverse: false,
          }}
          style={[styles.hourHand, { backgroundColor: spinnerColor, height: size * 0.25 }]}
        />


        <MotiView
          from={{ rotate: '0deg' }}
          animate={{ rotate: '360deg' }}
          transition={{
            type: 'timing',
            duration: 1000,
            loop: true,
            repeatReverse: false,
          }}
          style={[styles.minuteHand, { backgroundColor: spinnerColor, height: size * 0.35 }]}
        />


        <View style={[styles.centerDot, { backgroundColor: spinnerColor, width: size * 0.1, height: size * 0.1 }]} />
      </MotiView>
    </View>
  );
}


export function PulseDotsSpinner({ size = 50, color }: LoadingSpinnerProps) {
  const spinnerColor = color || '#1A1A1A';
  const dotSize = size / 4;

  return (
    <View style={styles.container}>
      <View style={styles.dotsContainer}>
        {[0, 1, 2].map((index) => (
          <MotiView
            key={index}
            from={{ opacity: 0.3, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              type: 'timing',
              duration: 600,
              delay: index * 200,
              loop: true,
              repeatReverse: true,
            }}
            style={[
              styles.dot,
              {
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
                backgroundColor: spinnerColor,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerRing: {
    borderWidth: 3,
    borderRadius: 100,
    position: 'absolute',
  },
  innerRing: {
    borderWidth: 2,
    borderRadius: 100,
    position: 'absolute',
  },
  clockContainer: {
    borderWidth: 3,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hourHand: {
    width: 3,
    position: 'absolute',
    bottom: '50%',
    borderRadius: 2,
    transformOrigin: 'bottom',
  },
  minuteHand: {
    width: 2,
    position: 'absolute',
    bottom: '50%',
    borderRadius: 1,
    transformOrigin: 'bottom',
  },
  centerDot: {
    borderRadius: 100,
    position: 'absolute',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {},
});

export default LoadingSpinner;

