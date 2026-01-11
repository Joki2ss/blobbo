import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { useTheme } from "../styles/useTheme";
import { fetchFeedPosts } from "../services/feedService";

export default function FeedScreen() {
  const theme = useTheme();
  const styles = makeStyles(theme);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchFeedPosts();
      setPosts(data);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Public Feed</Text>
      {loading ? (
        <Text style={styles.loading}>Loading...</Text>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDesc}>{item.description}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      padding: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: "bold",
      marginBottom: 16,
      color: theme.colors.text,
    },
    loading: {
      color: theme.colors.textSecondary,
      textAlign: "center",
      marginTop: 32,
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: 8,
      padding: 16,
      marginBottom: 12,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: theme.colors.text,
      marginBottom: 4,
    },
    cardDesc: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
  });
}
