import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function SocialsPostList({ status, navigation, posts }) {
  return (
    <FlatList
      data={posts}
      keyExtractor={item => item.postId}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("SocialsPostEditor", { postId: item.postId })}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <View style={styles.targets}>
              {item.targets.map(t => (
                <Ionicons key={t} name={iconForTarget(t)} size={18} color="#64748B" style={{ marginLeft: 4 }} />
              ))}
            </View>
          </View>
          <Text style={styles.cardBody} numberOfLines={2}>{item.body}</Text>
          {item.media && item.media.length > 0 && (
            <View style={styles.mediaRow}>
              {item.media.map(m => (
                <Image key={m.uri} source={{ uri: m.uri }} style={styles.mediaImg} />
              ))}
            </View>
          )}
          <Text style={styles.cardMeta}>{item.status} • {new Date(item.createdAt).toLocaleDateString()}</Text>
        </TouchableOpacity>
      )}
      ListEmptyComponent={<Text style={styles.empty}>No posts yet.</Text>}
    />
  );
}

function iconForTarget(target) {
  switch (target) {
    case "facebook": return "logo-facebook";
    case "instagram": return "logo-instagram";
    case "x": return "logo-twitter";
    case "linkedin": return "logo-linkedin";
    case "feed": return "newspaper-outline";
    default: return "share-social-outline";
  }
}

const styles = StyleSheet.create({
  list: { padding: 18 },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 18, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontWeight: "bold", fontSize: 16, color: "#23272A" },
  targets: { flexDirection: "row" },
  cardBody: { color: "#64748B", fontSize: 15, marginVertical: 8 },
  mediaRow: { flexDirection: "row", marginTop: 6 },
  mediaImg: { width: 48, height: 48, borderRadius: 8, marginRight: 6 },
  cardMeta: { color: "#B6C0D1", fontSize: 13, marginTop: 8 },
  empty: { color: "#B6C0D1", textAlign: "center", marginTop: 40 },
});
