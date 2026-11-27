import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  ApiError,
  fetchBooks,
  SHELF_LABELS,
  SHELVES,
  type Shelf,
  type ShelfBook,
} from "@/lib/api";
import { useSessionContext } from "@/lib/session-context";

export default function ShelvesScreen() {
  const { state, signOut } = useSessionContext();
  const [shelf, setShelf] = useState<Shelf>("READING");
  const [books, setBooks] = useState<ShelfBook[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const token = state.status === "signedIn" ? state.token : null;

  const load = useCallback(
    async (which: Shelf) => {
      if (!token) return;
      setError(null);
      try {
        const { books } = await fetchBooks(token, which);
        setBooks(books);
      } catch (e) {
        setBooks([]);
        setError(
          e instanceof ApiError && e.code === "network"
            ? "Немає зв'язку з сервером."
            : "Не вдалося завантажити полицю.",
        );
      }
    },
    [token],
  );

  useEffect(() => {
    setBooks(null);
    void load(shelf);
  }, [shelf, load]);

  // Hooks first, redirects after — a `<Redirect>` returned above `useEffect`
  // would change the number of hooks between renders and crash the screen.
  if (state.status === "loading") {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }
  if (state.status === "signedOut") return <Redirect href="/login" />;

  async function refresh() {
    setRefreshing(true);
    await load(shelf);
    setRefreshing(false);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.hello}>
            {state.reader.name ?? state.reader.email}
          </Text>
          <Text style={styles.title}>Читальня</Text>
        </View>
        <Pressable onPress={signOut} hitSlop={10}>
          <Text style={styles.signOut}>Вийти</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabs}
      >
        {SHELVES.map((option) => {
          const active = option === shelf;
          return (
            <Pressable
              key={option}
              onPress={() => setShelf(option)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {SHELF_LABELS[option]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {books === null ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              {error ?? "Тут поки порожньо."}
            </Text>
          }
          renderItem={({ item }) => <BookRow item={item} />}
        />
      )}
    </SafeAreaView>
  );
}

function BookRow({ item }: { item: ShelfBook }) {
  const { pagesRead, totalPages } = item;
  const share =
    pagesRead && totalPages && totalPages > 0
      ? Math.min(1, pagesRead / totalPages)
      : null;

  return (
    <Pressable
      style={styles.row}
      // Typed routes are on, so the route literal is checked against the
      // files in src/app — a renamed screen breaks the build, not the app.
      onPress={() =>
        router.push({ pathname: "/book/[id]", params: { id: item.id } })
      }
    >
      {item.book.coverUrl ? (
        <Image source={{ uri: item.book.coverUrl }} style={styles.cover} />
      ) : (
        // No cover: the spine stands in, so the row keeps its rhythm instead
        // of collapsing to text width.
        <View style={[styles.cover, styles.coverBlank]}>
          <Text style={styles.coverLetter}>
            {item.book.title.slice(0, 1).toUpperCase()}
          </Text>
        </View>
      )}

      <View style={styles.rowBody}>
        <Text style={styles.bookTitle} numberOfLines={2}>
          {item.book.title}
        </Text>
        <Text style={styles.bookAuthor} numberOfLines={1}>
          {item.book.author}
        </Text>

        {item.rating ? (
          <Text style={styles.rating}>
            {"★".repeat(item.rating)}
            <Text style={styles.ratingOff}>
              {"★".repeat(Math.max(0, 5 - item.rating))}
            </Text>
          </Text>
        ) : null}

        {share !== null ? (
          <View style={styles.progressRow}>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${share * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {pagesRead}/{totalPages}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fffdf8" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  hello: { fontSize: 13, color: "#7a7268" },
  title: { fontSize: 28, fontWeight: "700", color: "#2b2420" },
  signOut: { fontSize: 15, color: "#3f6b4f", fontWeight: "600" },
  // A horizontal ScrollView inside a flex column grows to fill the column
  // unless told not to: the row of shelf pills stretched to half the screen
  // because nothing capped it. `flexGrow: 0` makes it as tall as its content,
  // and `alignItems` keeps each pill its own height rather than the row's.
  tabsScroll: { flexGrow: 0, flexShrink: 0 },
  tabs: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 8,
    alignItems: "center",
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#f1ebdf",
  },
  tabActive: { backgroundColor: "#3f6b4f" },
  tabText: { fontSize: 14, color: "#5c544a", fontWeight: "500" },
  tabTextActive: { color: "#fffdf8" },
  list: { paddingHorizontal: 20, paddingBottom: 32, gap: 16 },
  empty: {
    textAlign: "center",
    color: "#7a7268",
    fontSize: 15,
    marginTop: 48,
  },
  row: { flexDirection: "row", gap: 14 },
  cover: {
    width: 56,
    height: 84,
    borderRadius: 6,
    backgroundColor: "#e4ddd0",
  },
  coverBlank: { alignItems: "center", justifyContent: "center" },
  coverLetter: { fontSize: 24, color: "#9a9388", fontWeight: "700" },
  rowBody: { flex: 1, gap: 3 },
  bookTitle: { fontSize: 16, fontWeight: "600", color: "#2b2420" },
  bookAuthor: { fontSize: 14, color: "#7a7268" },
  rating: { fontSize: 13, color: "#b9892f", marginTop: 2 },
  ratingOff: { color: "#ded7c9" },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  track: {
    flex: 1,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#e9e2d4",
    overflow: "hidden",
  },
  fill: { height: 5, borderRadius: 999, backgroundColor: "#3f6b4f" },
  progressText: { fontSize: 12, color: "#7a7268", fontVariant: ["tabular-nums"] },
});
