import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Redirect } from "expo-router";

import { ApiError, login } from "@/lib/api";
import { useSessionContext } from "@/lib/session-context";

/** The server answers with keys; the wording belongs here. */
function messageFor(error: ApiError): string {
  switch (error.code) {
    case "invalidCredentials":
      return "Невірна пошта або пароль.";
    case "tooManyAttempts":
      return error.retryAfterMinutes
        ? `Зачекай ${error.retryAfterMinutes} хв — надто багато спроб.`
        : "Надто багато спроб. Спробуй пізніше.";
    case "network":
      return "Не вдалося зв'язатися з сервером. Він запущений?";
    default:
      return "Щось пішло не так. Спробуй ще раз.";
  }
}

export default function LoginScreen() {
  const { state, signIn } = useSessionContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (state.status === "signedIn") return <Redirect href="/" />;

  async function submit() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const { token, reader } = await login(email.trim(), password);
      await signIn(token, reader);
    } catch (e) {
      setError(e instanceof ApiError ? messageFor(e) : "Щось пішло не так.");
    } finally {
      setBusy(false);
    }
  }

  const ready = email.trim().length > 0 && password.length > 0;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Читальня</Text>
        <Text style={styles.subtitle}>Твої полиці, у кишені.</Text>

        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Пошта"
          placeholderTextColor="#9a9388"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          editable={!busy}
        />
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Пароль"
          placeholderTextColor="#9a9388"
          secureTextEntry
          textContentType="password"
          editable={!busy}
          onSubmitEditing={submit}
          returnKeyType="go"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.button, (!ready || busy) && styles.buttonOff]}
          onPress={submit}
          disabled={!ready || busy}
        >
          {busy ? (
            <ActivityIndicator color="#fffdf8" />
          ) : (
            <Text style={styles.buttonText}>Увійти</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fffdf8" },
  inner: { flex: 1, justifyContent: "center", paddingHorizontal: 28, gap: 12 },
  title: {
    fontSize: 40,
    fontWeight: "700",
    color: "#2b2420",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#7a7268",
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e4ddd0",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#2b2420",
  },
  error: { color: "#a3342b", fontSize: 14, paddingHorizontal: 4 },
  button: {
    backgroundColor: "#3f6b4f",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonOff: { opacity: 0.45 },
  buttonText: { color: "#fffdf8", fontSize: 16, fontWeight: "600" },
});
