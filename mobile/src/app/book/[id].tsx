import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  ApiError,
  fetchBook,
  SHELF_LABELS,
  updateProgress,
  type BookDetail,
} from "@/lib/api";
import { formatDate, percentRead } from "@/lib/format";
import { useSessionContext } from "@/lib/session-context";

export default function BookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, signOut } = useSessionContext();
  const [book, setBook] = useState<BookDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const token = state.status === "signedIn" ? state.token : null;

  const load = useCallback(async () => {
    if (!token || !id) return;
    try {
      const { book } = await fetchBook(token, id);
      setBook(book);
      // Cleared here and not before the request: setting state in the body
      // of an effect runs a second render for nothing, and a retry that
      // succeeds is the only thing that should clear the message anyway.
      setError(null);
    } catch (e) {
      // A 401 here is the token itself going bad — thirty days gone by, or
      // an account that no longer exists. The launch check in `useSession`
      // only runs at launch, so without this the reader sits in front of a
      // screen that will never load and a "Вийти" button they have no
      // reason to press. Still only a 401: being unreachable is not being
      // unauthorised.
      if (e instanceof ApiError && e.status === 401) {
        await signOut();
        return;
      }
      setError(
        e instanceof ApiError && e.code === "notFound"
          ? "Такої книжки на твоїх полицях немає."
          : e instanceof ApiError && e.code === "network"
            ? "Немає зв'язку з сервером."
            : "Не вдалося завантажити книжку.",
      );
    }
  }, [token, id, signOut]);

  useEffect(() => {
    // `react-hooks/set-state-in-effect` follows the call into `load` and
    // sees the setState calls, but every one of them is on the far side of
    // an `await` — a response, not a render. The rule is about state set
    // while the effect body is still running, and nothing here does that.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
        <Detail book={book} token={state.token} onSaved={setBook} />
      )}
    </SafeAreaView>
  );
}

function Detail({
  book,
  token,
  onSaved,
}: {
  book: BookDetail;
  token: string;
  onSaved: (book: BookDetail) => void;
}) {
  const [promoted, setPromoted] = useState(false);

  const pct = percentRead(book.pagesRead, book.totalPages);
  const added = formatDate(book.addedAt);
  const finished = formatDate(book.finishedAt);

  // Only a book being read can have its progress set, which is the rule the
  // web app already follows (`book-card.tsx` shows the dialog for the
  // "Читаю зараз" shelf and nowhere else). Two surfaces offering different
  // edits on the same book is worse than one offering fewer.
  const editable = book.shelf === "READING";

  return (
    // Without this, the first tap on "Зберегти" only dismisses the number
    // pad and the second one saves.
    <ScrollView
      contentContainerStyle={styles.body}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.head}>
        {book.book.coverUrl ? (
          <Image
            source={{ uri: book.book.coverUrl }}
            style={styles.cover}
            alt={book.book.title}
          />
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

      {editable || pct !== null ? (
        <Section title="Прогрес читання">
          {pct !== null ? (
            <>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${pct}%` }]} />
              </View>
              <Text style={styles.meta}>
                {book.pagesRead} / {book.totalPages} стор. · {pct}%
              </Text>
            </>
          ) : null}
          {editable ? (
            <ProgressEditor
              book={book}
              token={token}
              onSaved={(saved, justPromoted) => {
                onSaved(saved);
                setPromoted(justPromoted);
              }}
            />
          ) : null}
          {/* Lives here rather than in the editor: finishing the book takes
              it off the "Читаю зараз" shelf, which unmounts the editor
              along with anything it was trying to say. */}
          {promoted ? (
            <Text style={styles.promoted}>
              Книжку перенесено на полицю «Прочитане».
            </Text>
          ) : null}
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

/**
 * The wording for the server's validation keys.
 *
 * The API answers with keys rather than sentences so that the Ukrainian
 * lives in the client. These are the same sentences the web form shows
 * (`src/i18n/dictionaries/uk.ts`, the `validation` block) — the point of
 * sharing the validator is that the reader is told the same thing either way.
 */
const SAVE_MESSAGES: Record<string, string> = {
  pagesReadRange: "Сторінки — це ціле число від 0 до 100 000.",
  totalPagesRange: "Усього сторінок — ціле число від 1 до 100 000.",
  pagesExceedTotal: "Прочитано більше, ніж є в книжці. Приємно, але перевір числа.",
  notFound: "Такої книжки на твоїх полицях немає.",
  network: "Немає зв'язку з сервером.",
};

function ProgressEditor({
  book,
  token,
  onSaved,
}: {
  book: BookDetail;
  token: string;
  onSaved: (book: BookDetail, promoted: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pagesRead, setPagesRead] = useState("");
  const [totalPages, setTotalPages] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function start() {
    // Prefilled from the record each time it opens, so a cancelled edit
    // leaves nothing behind.
    setPagesRead(book.pagesRead != null ? String(book.pagesRead) : "0");
    setTotalPages(book.totalPages != null ? String(book.totalPages) : "");
    setError(null);
    setOpen(true);
  }

  async function save() {
    const read = Number(pagesRead.trim());
    const total = Number(totalPages.trim());
    // A local check only for what is not a number at all — every limit and
    // the "more pages than the book has" rule belong to the server, which
    // is the only copy of them either surface trusts.
    if (!Number.isFinite(read) || !Number.isFinite(total)) {
      setError("Сторінки — це числа.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const result = await updateProgress(token, book.id, read, total);
      setOpen(false);
      onSaved(result.book, result.promoted);
    } catch (e) {
      setError(
        (e instanceof ApiError ? SAVE_MESSAGES[e.code] : null) ??
          "Не вдалося зберегти прогрес.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <Pressable onPress={start} hitSlop={8} style={styles.editorClosed}>
        <Text style={styles.action}>
          {book.pagesRead != null && book.totalPages
            ? "Змінити прогрес"
            : "Відмітити прогрес"}
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.editor}>
      <View style={styles.fields}>
        <View style={styles.field}>
          <Text style={styles.label}>Прочитано</Text>
          <TextInput
            value={pagesRead}
            onChangeText={setPagesRead}
            keyboardType="number-pad"
            maxLength={6}
            selectTextOnFocus
            editable={!saving}
            style={styles.input}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Усього</Text>
          <TextInput
            value={totalPages}
            onChangeText={setTotalPages}
            keyboardType="number-pad"
            maxLength={6}
            selectTextOnFocus
            editable={!saving}
            placeholder="320"
            placeholderTextColor="#b3aa9c"
            style={styles.input}
          />
        </View>
      </View>

      <Text style={styles.hint}>
        Дочитаєш до останньої сторінки — книжка сама стане прочитаною.
      </Text>

      {error ? <Text style={styles.fieldError}>{error}</Text> : null}

      <View style={styles.buttons}>
        <Pressable
          onPress={save}
          disabled={saving}
          style={[styles.button, saving && styles.buttonBusy]}
        >
          {saving ? (
            <ActivityIndicator color="#fffdf8" size="small" />
          ) : (
            <Text style={styles.buttonText}>Зберегти</Text>
          )}
        </Pressable>
        <Pressable onPress={() => setOpen(false)} disabled={saving} hitSlop={8}>
          <Text style={styles.cancel}>Скасувати</Text>
        </Pressable>
      </View>
    </View>
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
  fieldError: { color: "#a3342b", fontSize: 14 },
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
  editorClosed: { marginTop: 2, alignSelf: "flex-start" },
  action: { fontSize: 15, color: "#3f6b4f", fontWeight: "600" },
  promoted: { fontSize: 13, color: "#3f6b4f" },
  editor: {
    gap: 10,
    marginTop: 6,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#f7f2e8",
  },
  fields: { flexDirection: "row", gap: 12 },
  field: { flex: 1, gap: 4 },
  label: { fontSize: 12, color: "#7a7268", fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#ded7c9",
    borderRadius: 8,
    backgroundColor: "#fffdf8",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 17,
    color: "#2b2420",
    fontVariant: ["tabular-nums"],
  },
  hint: { fontSize: 12, color: "#8a8276", lineHeight: 17 },
  buttons: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 2 },
  button: {
    backgroundColor: "#3f6b4f",
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 11,
    minWidth: 120,
    alignItems: "center",
  },
  buttonBusy: { opacity: 0.7 },
  buttonText: { color: "#fffdf8", fontSize: 15, fontWeight: "600" },
  cancel: { fontSize: 15, color: "#7a7268" },
  stars: { fontSize: 20, color: "#b9892f" },
  starsOff: { color: "#ded7c9" },
  prose: { fontSize: 15, lineHeight: 23, color: "#2b2420" },
  dates: { gap: 4, paddingTop: 4 },
});
