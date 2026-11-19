/**
 * Ukrainian vocative case (кличний відмінок) for a name you are speaking to.
 *
 * Ukrainian addresses people in their own case: you greet Анастасія as
 * "Анастасіє" and a Читачка as "Читачко". Leaving the nominative there is the
 * kind of thing that makes an interface sound like it was translated.
 *
 * Only the **first word** of the name is declined. That word is the given
 * name in nearly every case, and it is the one the vocative is actually heard
 * on; a surname's own ending depends on things a string cannot tell us
 * (whose name it is, whether it is a noun or an adjective), and getting it
 * wrong is louder than leaving it alone.
 *
 * The rules below key off the ending only, so nothing here guesses at gender.
 */

/** Letters a Ukrainian name is made of — anything else is left untouched. */
const UKRAINIAN_WORD = /^[А-ЩЬЮЯЄІЇҐа-щьюяєіїґ'’]+$/;

const VOWELS = "аеєиіїоуюя";
/** Hushers and velars: these take -у, not -е (Читач → Читачу, Марк → Марку). */
const TAKES_U = "жчшщкгх";

/** Give a replacement ending the case of the letter it replaces. */
function matchCase(sample: string, ending: string) {
  return sample === sample.toUpperCase() && sample !== sample.toLowerCase()
    ? ending.toUpperCase()
    : ending;
}

function vocativeWord(word: string): string {
  if (word.length < 3 || !UKRAINIAN_WORD.test(word)) return word;

  const lower = word.toLowerCase();
  const last = word.slice(-1);
  const stem = word.slice(0, -1);
  const swap = (ending: string) => stem + matchCase(last, ending);
  const add = (ending: string) => word + matchCase(last, ending);

  // Марія → Маріє, Анастасія → Анастасіє, Софія → Софіє
  if (lower.endsWith("ія")) return swap("є");
  // Катя → Катю, Оля → Олю, Ілля → Іллю
  if (lower.endsWith("я")) return swap("ю");
  // Марина → Марино, Читачка → Читачко, Микита → Микито
  if (lower.endsWith("а")) return swap("о");
  // Марко → Марку, but Петро → Петре, Павло → Павле
  if (lower.endsWith("ко")) return swap("у");
  if (lower.endsWith("о")) return swap("е");
  // Сергій → Сергію, Василь → Василю
  if (lower.endsWith("й") || lower.endsWith("ь")) return swap("ю");
  // Already a vowel and none of the above: nothing sensible to change.
  if (VOWELS.includes(lower.slice(-1))) return word;
  // Читач → Читачу, Марк → Марку, Олег → Олегу
  if (TAKES_U.includes(lower.slice(-1))) return add("у");
  // Іван → Іване, Тарас → Тарасе, Олександр → Олександре
  return add("е");
}

/**
 * Address `name` directly. English is returned untouched — it has no vocative,
 * and an English UI greeting a "Маріє" would be worse than one greeting Марія.
 */
export function vocative(name: string, locale: "uk" | "en"): string {
  if (locale !== "uk") return name;

  const trimmed = name.trim();
  if (!trimmed) return name;

  const [first, ...rest] = trimmed.split(/\s+/);
  // Марія-Анна → Маріє-Анно: both halves of a double name are spoken.
  const called = first.split("-").map(vocativeWord).join("-");
  return [called, ...rest].join(" ");
}
