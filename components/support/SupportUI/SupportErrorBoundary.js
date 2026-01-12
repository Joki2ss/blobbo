import React from "react";
import { View, Text, StyleSheet } from "react-native";

import { Card } from "../../components/Card";
import { Button } from "../../components/Button";

export class SupportErrorBoundaryInner extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    try {
      this.props.onError?.(error, info);
    } catch {
      // ignore
    }
  }

  render() {
    const styles = makeStyles(this.props.theme);
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.wrap}>
        <Card>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.muted}>A runtime error occurred. You can try again.</Text>
          <Button title="Reload" variant="secondary" onPress={() => this.setState({ hasError: false, error: null })} />
        </Card>
      </View>
    );
  }
}

function makeStyles(theme) {
  return StyleSheet.create({
    wrap: {
      flex: 1,
      padding: theme.spacing.lg,
      justifyContent: "center",
      backgroundColor: theme.colors.bg,
    },
    title: {
      ...theme.typography.h2,
      color: theme.colors.text,
    },
    muted: {
      ...theme.typography.small,
      color: theme.colors.mutedText,
      marginTop: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
  });
}
