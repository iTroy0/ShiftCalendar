import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Appearance, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  showDetails: boolean;
}

/** Last-resort screen for render errors. Data is untouched, so "Try again" is safe. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, showDetails: false };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  handleReset = () => this.setState({ error: null, showDetails: false });

  render() {
    const { error, showDetails } = this.state;
    if (!error) return this.props.children;

    const c = Appearance.getColorScheme() === 'light' ? Colors.light : Colors.dark;
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <View style={[styles.icon, { backgroundColor: c.danger + '22' }]}>
          <MaterialCommunityIcons name="alert-circle-outline" size={40} color={c.danger} />
        </View>
        <Text style={[styles.title, { color: c.text }]}>Something went wrong</Text>
        <Text style={[styles.message, { color: c.textSecondary }]}>
          The screen hit an unexpected error. Your shifts and notes are safe on this device.
        </Text>
        <TouchableOpacity style={[styles.button, { backgroundColor: c.primary }]} onPress={this.handleReset} accessibilityRole="button">
          <MaterialCommunityIcons name="refresh" size={20} color="#FFF" />
          <Text style={styles.buttonText}>Try again</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => this.setState({ showDetails: !showDetails })} accessibilityRole="button" style={styles.detailsToggle}>
          <Text style={[styles.detailsToggleText, { color: c.textMuted }]}>{showDetails ? 'Hide details' : 'Show details'}</Text>
        </TouchableOpacity>
        {showDetails && (
          <ScrollView style={[styles.details, { backgroundColor: c.surfaceVariant }]}>
            <Text selectable style={[styles.detailsText, { color: c.textSecondary }]}>
              {error.message}
            </Text>
          </ScrollView>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  icon: { width: 76, height: 76, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800', marginTop: 20, marginBottom: 8 },
  message: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  button: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 14, gap: 8 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  detailsToggle: { marginTop: 18, padding: 8 },
  detailsToggleText: { fontSize: 13, fontWeight: '700' },
  details: { maxHeight: 160, alignSelf: 'stretch', borderRadius: 12, padding: 12, marginTop: 8 },
  detailsText: { fontSize: 12, fontFamily: 'monospace' },
});
