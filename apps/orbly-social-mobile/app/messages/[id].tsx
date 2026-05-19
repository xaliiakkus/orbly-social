import {

  convoRoom,

  SOCKET_EVENTS,

  useConversationMessages,

  useConversations,

  useSendMessage,

} from "@orbly/features";

import FontAwesome from "@expo/vector-icons/FontAwesome";

import { Image } from "@/components/ui/expo-image";

import { useLocalSearchParams, useRouter } from "expo-router";

import { useEffect, useMemo, useState } from "react";

import {

  FlatList,

  Pressable,

  StyleSheet,

  Text,

  TextInput,

  View,

} from "react-native";

import * as ImagePicker from "expo-image-picker";



import { ScreenHeader } from "@/components/ScreenHeader";

import { OrblyColors } from "@/constants/Colors";

import { useAuthStore } from "@/lib/auth-store";

import { formatRelativeTime } from "@/lib/format";

import { getSocket } from "@/lib/socket";

import { uploadImage } from "@/lib/upload";

import { useMobileSocketRooms } from "@/lib/use-socket-rooms";



export default function ChatScreen() {

  const { id } = useLocalSearchParams<{ id: string }>();

  const convoId = id ?? "";

  const router = useRouter();

  const me = useAuthStore((s) => s.user);

  const [text, setText] = useState("");

  const { data: convos } = useConversations();

  const { data, refetch } = useConversationMessages(convoId);

  const send = useSendMessage(convoId);



  const participant = useMemo(

    () => convos?.data.find((c) => c.id === convoId)?.participant,

    [convos?.data, convoId],

  );



  useMobileSocketRooms(convoId ? [convoRoom(convoId)] : []);



  useEffect(() => {

    const token = useAuthStore.getState().accessToken;
    if (!token || !convoId) return;
    const s = getSocket(token);

    const handler = (payload: { conversationId?: string }) => {

      if (payload.conversationId === convoId) void refetch();

    };

    s.on(SOCKET_EVENTS.message, handler);

    return () => {

      s.off(SOCKET_EVENTS.message, handler);

    };

  }, [convoId, refetch]);



  const pickAndSend = async () => {

    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"] });

    if (res.canceled || !convoId) return;

    const asset = res.assets[0];

    if (!asset) return;

    const url = await uploadImage(

      asset.uri,

      asset.fileName ?? "img.jpg",

      asset.mimeType ?? "image/jpeg",

    );

    send.mutate({ content: text.trim() || "📎", mediaUrls: [url] });

    setText("");

  };



  const headerRight = participant ? (

    <Pressable

      onPress={() => router.push(`/profile/${participant.username}`)}

      hitSlop={8}

    >

      {participant.avatarUrl ? (

        <Image source={{ uri: participant.avatarUrl }} style={styles.headerAvatar} />

      ) : (

        <View style={styles.headerAvatar}>

          <Text style={styles.headerAvatarText}>{participant.displayName.charAt(0)}</Text>

        </View>

      )}

    </Pressable>

  ) : null;



  return (

    <View style={styles.container}>

      <ScreenHeader

        title={participant?.displayName ?? "Sohbet"}

        subtitle={participant ? `@${participant.username}` : undefined}

        right={headerRight}

      />



      <FlatList

        data={data?.data ?? []}

        keyExtractor={(m) => m.id}

        contentContainerStyle={{ paddingVertical: 8, flexGrow: 1 }}

        ListEmptyComponent={

          <Text style={styles.emptyChat}>İlk mesajı sen gönder</Text>

        }

        renderItem={({ item }) => {

          const mine = item.senderId === me?.id;

          return (

            <View style={[styles.row, mine && styles.rowMine]}>

              <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>

                <Text style={[styles.content, mine && styles.contentMine]}>{item.content}</Text>

                <Text style={[styles.time, mine && styles.timeMine]}>

                  {formatRelativeTime(item.createdAt)}

                </Text>

              </View>

            </View>

          );

        }}

      />



      <View style={styles.inputRow}>

        <Pressable onPress={() => void pickAndSend()}>

          <FontAwesome name="paperclip" size={22} color={OrblyColors.accent} />

        </Pressable>

        <TextInput

          style={styles.input}

          value={text}

          onChangeText={setText}

          placeholder="Mesaj yaz"

          placeholderTextColor={OrblyColors.textSecondary}

        />

        <Pressable

          style={[styles.sendBtn, !text.trim() && styles.sendDisabled]}

          disabled={!text.trim() || send.isPending}

          onPress={() => {

            if (!text.trim()) return;

            send.mutate({ content: text.trim() });

            setText("");

          }}

        >

          <Text style={styles.sendText}>Gönder</Text>

        </Pressable>

      </View>

    </View>

  );

}



const styles = StyleSheet.create({

  container: { flex: 1, backgroundColor: OrblyColors.bgPrimary },

  headerAvatar: {

    width: 32,

    height: 32,

    borderRadius: 16,

    backgroundColor: OrblyColors.bgTertiary,

    alignItems: "center",

    justifyContent: "center",

    overflow: "hidden",

  },

  headerAvatarText: { fontWeight: "700", color: OrblyColors.textPrimary },

  emptyChat: {

    color: OrblyColors.textSecondary,

    textAlign: "center",

    marginTop: 48,

    fontSize: 15,

  },

  row: { paddingHorizontal: 16, paddingVertical: 4, alignItems: "flex-start" },

  rowMine: { alignItems: "flex-end" },

  bubble: { maxWidth: "80%", borderRadius: 20, padding: 12 },

  bubbleMine: { backgroundColor: OrblyColors.accent },

  bubbleOther: { backgroundColor: OrblyColors.bgSecondary },

  content: { color: OrblyColors.textPrimary, fontSize: 15 },

  contentMine: { color: "#fff" },

  time: { color: OrblyColors.textSecondary, fontSize: 11, marginTop: 4 },

  timeMine: { color: "rgba(255,255,255,0.7)" },

  inputRow: {

    flexDirection: "row",

    padding: 12,

    paddingBottom: 24,

    borderTopWidth: StyleSheet.hairlineWidth,

    borderTopColor: OrblyColors.border,

    alignItems: "center",

    gap: 8,

  },

  input: {

    flex: 1,

    backgroundColor: OrblyColors.bgSecondary,

    borderRadius: 24,

    paddingHorizontal: 16,

    paddingVertical: 10,

    color: OrblyColors.textPrimary,

  },

  sendBtn: {

    backgroundColor: OrblyColors.accent,

    borderRadius: 24,

    paddingHorizontal: 16,

    paddingVertical: 10,

  },

  sendDisabled: { opacity: 0.45 },

  sendText: { color: "#fff", fontWeight: "700" },

});


