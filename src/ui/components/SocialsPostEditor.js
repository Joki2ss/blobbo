import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as socialsStorage from "../../services/socialsStorage";

const TARGETS = [
  { key: "facebook", icon: "logo-facebook" },
  { key: "instagram", icon: "logo-instagram" },
  { key: "x", icon: "logo-twitter" },
  { key: "linkedin", icon: "logo-linkedin" },
  { key: "feed", icon: "newspaper-outline" },
];

const PLANS = {
  basic: { quota: 2, period: "week" },
  plus: { quota: 4, period: "month" },
};

export default function SocialsPostEditor({ route, navigation }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [media, setMedia] = useState([]);
  const [hashtags, setHashtags] = useState([]);
  const [targets, setTargets] = useState(["feed"]);
  const [plan, setPlan] = useState("basic"); // Replace with user plan logic
  const userId = "guest"; // Replace with session.user.id if available

  // Quota check stub
  const quotaExceeded = false; // Replace with real quota logic

  const handlePublish = async () => {
    if (quotaExceeded) {
      Alert.alert("Paywall", "Upgrade your plan to publish more posts.");
      return;
    }
    const post = {
      postId: route?.params?.postId || undefined,
      ownerUserId: userId,
      title,
      body,
      media,
      hashtags,
      targets,
      status: "queued",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await socialsStorage.savePost(userId, post);
    Alert.alert("Publish", "Post published (MOCK)");
    navigation.goBack();
  };

  // Media picker stub
  const handleAddMedia = () => {
    Alert.alert("Media", "Media picker not implemented in mock mode.");
  };

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <Text style={styles.label}>Title</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Title" />
      <Text style={styles.label}>Body</Text>
      <TextInput style={[styles.input, { height: 90 }]} value={body} onChangeText={setBody} placeholder="What's new?" multiline />
      <Text style={styles.label}>Hashtags</Text>
      <TextInput style={styles.input} value={hashtags.join(" ")} onChangeText={t => setHashtags(t.split(/\s+/))} placeholder="#hashtag" />
      <Text style={styles.label}>Media</Text>
      <View style={styles.mediaRow}>
        {media.map((m, i) => (
          <Image key={i} source={{ uri: m.uri }} style={styles.mediaImg} />
        ))}
        <TouchableOpacity style={styles.addMediaBtn} onPress={handleAddMedia}>
          <Ionicons name="image-outline" size={22} color="#64748B" />
        </TouchableOpacity>
      </View>
      <Text style={styles.label}>Targets</Text>
      <View style={styles.targetsRow}>
        {TARGETS.map(t => (
          <TouchableOpacity key={t.key} style={[styles.targetBtn, targets.includes(t.key) && styles.targetBtnActive]} onPress={() => {
            setTargets(targets.includes(t.key) ? targets.filter(x => x !== t.key) : [...targets, t.key]);
          }}>
            <Ionicons name={t.icon} size={22} color={targets.includes(t.key) ? "#2563EB" : "#64748B"} />
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.publishBtn} onPress={handlePublish}>
        <Ionicons name="newspaper-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.publishText}>Publish</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { padding: 24 },
  label: { color: "#64748B", fontWeight: "500", marginTop: 18, marginBottom: 6 },
  input: { backgroundColor: "#F3F4F6", borderRadius: 8, padding: 12, fontSize: 15, color: "#23272A" },
  hashtagsRow: { flexDirection: "row", flexWrap: "wrap", marginVertical: 8 },
  mediaRow: { flexDirection: "row", marginVertical: 12 },
  mediaImg: { width: 48, height: 48, borderRadius: 8, marginRight: 6 },
  addMediaBtn: { backgroundColor: "#F3F4F6", borderRadius: 8, padding: 10, marginRight: 8 },
  targetsRow: { flexDirection: "row", marginVertical: 12 },
  targetBtn: { backgroundColor: "#F3F4F6", borderRadius: 8, padding: 10, marginRight: 8 },
  targetBtnActive: { backgroundColor: "#2563EB22" },
  publishBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#2563EB", borderRadius: 24, paddingHorizontal: 22, paddingVertical: 13, marginTop: 28, alignSelf: "flex-start" },
  publishText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
