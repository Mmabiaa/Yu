import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import StatusBar from '../components/StatusBar';
import { colors, typography } from '../theme';

const { width, height } = Dimensions.get('window');
const FRAME_SIZE = width * 0.7;
const FRAME_OFFSET = (width - FRAME_SIZE) / 2;

export default function YuVisionScreen({ navigation }: any) {
  const [permission, requestPermission] = useCameraPermissions();
  const [flashlightOn, setFlashlightOn] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No access to camera</Text>
        <TouchableOpacity 
          onPress={requestPermission} 
          style={styles.permissionButton}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar time="1:57" battery="54%" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="eye-outline" size={20} color={colors.purple} />
          <Text style={styles.headerTitle}>Yu Vision</Text>
        </View>
        <TouchableOpacity onPress={() => setFlashlightOn(!flashlightOn)}>
          <Ionicons 
            name={flashlightOn ? "flash" : "flash-outline"} 
            size={24} 
            color={colors.text} 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          enableTorch={flashlightOn}
        >
          <View style={styles.overlay}>
            {/* Corner brackets */}
            <View style={[styles.corner, styles.topLeft]}>
              <View style={[styles.bracket, styles.bracketTop, styles.bracketLeft]} />
              <View style={[styles.bracket, styles.bracketLeft, styles.bracketTop]} />
            </View>
            <View style={[styles.corner, styles.topRight]}>
              <View style={[styles.bracket, styles.bracketTop, styles.bracketRight]} />
              <View style={[styles.bracket, styles.bracketRight, styles.bracketTop]} />
            </View>
            <View style={[styles.corner, styles.bottomLeft]}>
              <View style={[styles.bracket, styles.bracketBottom, styles.bracketLeft]} />
              <View style={[styles.bracket, styles.bracketLeft, styles.bracketBottom]} />
            </View>
            <View style={[styles.corner, styles.bottomRight]}>
              <View style={[styles.bracket, styles.bracketBottom, styles.bracketRight]} />
              <View style={[styles.bracket, styles.bracketRight, styles.bracketBottom]} />
            </View>
          </View>
        </CameraView>
      </View>

      <View style={styles.bottomSection}>
        <Text style={styles.instructionText}>Point at anything to analyze</Text>
        <Animated.View style={[styles.captureButton, { transform: [{ scale: pulseAnim }] }]}>
          <TouchableOpacity
            style={styles.captureButtonInner}
            onPress={() => {
              // Handle capture/analysis
            }}
          >
            <Ionicons name="flash" size={32} color={colors.text} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    zIndex: 10,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  cameraContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
  },
  topLeft: {
    top: FRAME_OFFSET + 20,
    left: FRAME_OFFSET + 20,
  },
  topRight: {
    top: FRAME_OFFSET + 20,
    right: FRAME_OFFSET + 20,
  },
  bottomLeft: {
    bottom: FRAME_OFFSET + 20,
    left: FRAME_OFFSET + 20,
  },
  bottomRight: {
    bottom: FRAME_OFFSET + 20,
    right: FRAME_OFFSET + 20,
  },
  bracket: {
    position: 'absolute',
    borderColor: colors.purple,
    borderWidth: 3,
  },
  bracketTop: {
    top: 0,
    width: 20,
    height: 3,
  },
  bracketBottom: {
    bottom: 0,
    width: 20,
    height: 3,
  },
  bracketLeft: {
    left: 0,
    width: 3,
    height: 20,
  },
  bracketRight: {
    right: 0,
    width: 3,
    height: 20,
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
    gap: 16,
  },
  instructionText: {
    ...typography.body,
    color: colors.text,
    textAlign: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.purple,
    borderWidth: 3,
    borderColor: colors.purpleLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: colors.text,
  },
  permissionButton: {
    marginTop: 20,
    backgroundColor: colors.purple,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  permissionButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
});

