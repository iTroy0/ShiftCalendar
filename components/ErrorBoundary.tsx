import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Appearance } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const isDark = Appearance.getColorScheme() !== 'light';
      return (
        <View style={[styles.container, { backgroundColor: isDark ? '#0F0F0F' : '#F2F3F5' }]}>
          <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={[styles.title, { color: isDark ? '#FFF' : '#1A1A1A' }]}>Something went wrong</Text>
          <Text style={[styles.message, { color: isDark ? '#A0A0A0' : '#6B7280' }]}>
            The app ran into an unexpected error. Try restarting.
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <MaterialCommunityIcons name="refresh" size={20} color="#FFF" />
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F0F0F', // overridden at render time
    padding: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    marginTop: 20,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#A0A0A0',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    gap: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
