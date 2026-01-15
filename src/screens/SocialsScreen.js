import React, { useState, useEffect } from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SocialsTabs from "../ui/components/SocialsTabs";
import SocialsPostList from "../ui/components/SocialsPostList";
import * as socialsStorage from "../services/socialsStorage";

export default function SocialsScreen({ navigation }) {
  const [tab, setTab] = useState("my");
  const [posts, setPosts] = useState([]);
  const userId = "guest"; // Replace with session.user.id if available

  useEffect(() => {
    socialsStorage.getPosts(userId).then(setPosts);
  }, []);

  // Filter posts by tab
  const filtered = posts.filter((p) => {
    if (tab === "my") return p.status === "draft" || p.status === "queued";
    if (tab === "scheduled") return p.status === "queued";
    if (tab === "published") return p.status === "published";
    return true;
  });

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Socials</Text>
      </View>
      <SocialsTabs tab={tab} navigation={navigation} onTabChange={setTab} />
      <SocialsPostList status={tab} navigation={navigation} posts={filtered} />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("SocialsPostEditor")}
        accessibilityLabel="New post"
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F6F7FB" },
  header: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  title: { fontSize: 22, fontWeight: "bold", color: "#23272A" },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 32,
    backgroundColor: "#2563EB",
    borderRadius: 32,
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.13,
    shadowRadius: 8,
    elevation: 4,
  },
});
