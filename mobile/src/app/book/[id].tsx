import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  ApiError,
  fetchBook,
  SHELF_LABELS,
  type BookDetail,
} from "@/lib/api";
import { formatDate, percentRead } from "@/lib/format";
import { useSessionContext } from "@/lib/session-context";

export default function BookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state } = useSessionContext();
  const [book, setBook] = useState<BookDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const token = state.status === "signedIn" ? state.token : null;

  const load = useCallback(async () => {
    if (!token || !id) return;
    setError(null);
    try {
      const { book } = await fetchBook(token, id);
      setBook(book);
    } catch (e) {
      setError(
        e instanceof ApiError && e.code === "notFound"
          ? "Такої книжки на твоїх полицях немає."
          : e instanceof ApiError && e.code === "network"
            ? "Немає зв'язку з сервером."
            : "Не вдалося завантажити книжку.",
      );
    }
  }, [token, id]);

  useEffect(() => {
    void load();
  }, [load]);

  // Hooks above, redirects below — returning a <Redirect> before the effects
  // would change the hook count between renders.
  if (state.status === "loading") {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }
  if (state.status === "signedOut") return <Redirect href="/login" />;

  return (
    <SafeAreaView style={styles.screen}>
      <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
        <Text style={styles.backText}>‹ Полиці</Text>
      </Pressable>

      {error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : !book ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : (
        <Detail book={book} />
      )}
    </SafeAreaView>
  );
}

function Detail({ book }: { book: BookDetail }) {
  const pct = percentRead(book.pagesRead, book.totalPages);
  const added = formatDate(book.addedAt);
  const finished = formatDate(book.finishedAt);

  return (
    <ScrollView contentContainerStyle={styles.body}>
      <View style={styles.head}>
        {book.book.coverUrl ? (
          <Image source={{ uri: book.book.coverUrl }} style={styles.cover} />
        ) : (
          <View style={[styles.cover, styles.coverBlank]}>
            <Text style={styles.coverLetter}>
              {book.book.title.slice(0, 1).toUpperCase()}
            </Text>
          </View>
        )}

        <View style={styles.headText}>
          <Text style={styles.title}>{book.book.title}</Text>
          <Text style={styles.author}>{book.book.author}</Text>
          <View style={styles.shelfPill}>
            <Text style={styles.shelfPillText}>
              {SHELF_LABELS[book.shelf]}
            </Text>
          </View>
        </View>
      </View>

      {pct !== null ? (
        <Section title="Прогрес читання">
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${pct}%` }]} />
          </View>
          <Text style={styles.meta}>
            {book.pagesRead} / {book.totalPages} стор. · {pct}%
          </Text>
        </Section>
      ) : null}

      {book.rating ? (
        <Section title="Оцінка">
          <Text style={styles.stars}>
            {"★".repeat(book.rating)}
            <Text style={styles.starsOff}>
              {"★".repeat(Math.max(0, 5 - book.rating))}
            </Text>
          </Text>
        </Section>
      ) : null}

      {book.review ? (
        <Section title="Відгук">
          <Text style={styles.prose}>{book.review}</Text>
        </Section>
      ) : null}

      {book.notes ? (
        <Section title="Нотатки" badge="Приватне">
          <Text style={styles.prose}>{book.notes}</Text>
        </Section>
      ) : null}

      <View style={styles.dates}>
        {added ? <Text style={styles.meta}>Додано {added}</Text> : null}
        {finished ? (
          <Text style={styles.meta}>Прочитано {finished}</Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

function Section({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fffdf8" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  error: { color: "#a3342b", fontSize: 15, textAlign: "center" },
  back: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8 },
  backText: { fontSize: 16, color: "#3f6b4f", fontWeight: "600" },
  body: { paddingHorizontal: 20, paddingBottom: 40, gap: 24 },
  head: { flexDirection: "row", gap: 16 },
  cover: { width: 96, height: 144, borderRadius: 8, backgroundColor: "#e4ddd0" },
  coverBlank: { alignItems: "center", justifyContent: "center" },
  coverLetter: { fontSize: 40, color: "#9a9388", fontWeight: "700" },
  headText: { flex: 1, gap: 6 },
  title: { fontSize: 22, fontWeight: "700", color: "#2b2420", lineHeight: 28 },
  author: { fontSize: 15, color: "#7a7268" },
  shelfPill: {
    alignSelf: "flex-start",
    backgroundColor: "#f1ebdf",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 2,
  },
  shelfPillText: { fontSize: 13, color: "#5c544a", fontWeight: "500" },
  section: { gap: 8 },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#7a7268",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  badge: {
    backgroundColor: "#ece5d6",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 11, color: "#7a7268", fontWeight: "600" },
  track: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "#e9e2d4",
    overflow: "hidden",
  },
  fill: { height: 6, borderRadius: 999, backgroundColor: "#3f6b4f" },
  meta: { fontSize: 13, color: "#7a7268", fontVariant: ["tabular-nums"] },
  stars: { fontSize: 20, color: "#b9892f" },
  starsOff: { color: "#ded7c9" },
  prose: { fontSize: 15, lineHeight: 23, color: "#2b2420" },
  dates: { gap: 4, paddingTop: 4 },
});
