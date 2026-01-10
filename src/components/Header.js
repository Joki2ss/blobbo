import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../theme";

export function Header({ title, subtitle, right }) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  // Responsive: desktop = thin, fixed, enterprise; mobile = dark, fixed, hamburger/search/avatar
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
  return (
    <View style={[styles.wrap, isDesktop ? styles.desktopBar : styles.mobileBar]}>
      <View style={styles.left}>
        {!isDesktop && (
          <View style={styles.hamburger}>
            {/* Hamburger icon placeholder (replace with actual icon if needed) */}
            <Text style={{ fontSize: 24, color: '#fff', fontWeight: 'bold' }}>≡</Text>
          </View>
        )}
        <Text style={[styles.title, isDesktop ? styles.titleDesktop : styles.titleMobile]}>{title}</Text>
        {subtitle && isDesktop ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.right}>
        {/* Search bar placeholder (replace with actual search if needed) */}
        <View style={isDesktop ? styles.searchDesktop : styles.searchMobile}>
          <Text style={{ color: isDesktop ? '#64748B' : '#fff', fontSize: 16 }}>🔍</Text>
        </View>
        {/* Notifications/avatar placeholder */}
        {right ? <View style={styles.right}>{right}</View> : (
          <View style={styles.avatarWrap}>
            <Text style={{ fontSize: 20, color: isDesktop ? '#64748B' : '#fff' }}>👤</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      zIndex: 200,
    },
    desktopBar: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: 56,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      paddingHorizontal: 32,
      boxShadow: '0 1px 0 ' + theme.colors.border,
    },
    mobileBar: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: 56,
      backgroundColor: '#1E293B',
      paddingHorizontal: 16,
      borderBottomWidth: 0,
      boxShadow: '0 1px 0 #0F172A',
    },
    left: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    hamburger: {
      marginRight: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontWeight: '600',
      letterSpacing: 0.1,
    },
    titleDesktop: {
      ...theme.typography.h2,
      color: theme.colors.text,
      fontSize: 20,
    },
    titleMobile: {
      ...theme.typography.h2,
      color: '#fff',
      fontSize: 18,
    },
    subtitle: {
      ...theme.typography.small,
      color: theme.colors.mutedText,
      marginTop: 2,
      marginLeft: 8,
    },
    right: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 16,
    },
    searchDesktop: {
      marginRight: 24,
      paddingVertical: 4,
      paddingHorizontal: 12,
      backgroundColor: theme.colors.bg,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      minWidth: 160,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchMobile: {
      marginRight: 12,
      paddingVertical: 4,
      paddingHorizontal: 8,
      backgroundColor: '#334155',
      borderRadius: theme.radius.md,
      minWidth: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarWrap: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#64748B',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 8,
    },
  });
}
