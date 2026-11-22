import { z } from "zod";

// Validation messages are emitted as keys, not prose: the server action swaps
// them for the user's locale before rendering — auth messages via
// dict.auth.validation, the rest via dict.validation (see
// `@/i18n/validation`). A field whose message can reach the screen needs an
// explicit key: Zod's own default ("Too big: expected string to have <=500
// characters") is English, and untranslatable.
// Letters (any alphabet), spaces, apostrophes and hyphens — no digits.
const NAME_PATTERN = /^[\p{L}][\p{L}\s'’-]*$/u;

const nameField = z
  .string()
  .trim()
  .min(1, "nameRequired")
  .max(80)
  .regex(NAME_PATTERN, "nameLettersOnly");

export const SignupSchema = z
  .object({
    email: z.email("invalidEmail").trim().toLowerCase(),
    name: nameField,
    password: z.string().min(8, "passwordTooShort").max(200),
    passwordConfirm: z.string().min(1, "passwordConfirmRequired"),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    error: "passwordsDontMatch",
    path: ["passwordConfirm"],
  });
export type SignupInput = z.infer<typeof SignupSchema>;

export const LoginSchema = z.object({
  email: z.email("invalidEmail").trim().toLowerCase(),
  password: z.string().min(1, "passwordRequired"),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const RequestPasswordResetSchema = z.object({
  email: z.email("invalidEmail").trim().toLowerCase(),
});

export const ResetPasswordSchema = z
  .object({
    token: z.string().trim().min(1),
    password: z.string().min(8, "passwordTooShort").max(200),
    passwordConfirm: z.string().min(1, "passwordConfirmRequired"),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    error: "passwordsDontMatch",
    path: ["passwordConfirm"],
  });

/**
 * A URL that ends up in the page — an `href` or an `<img src>` — with its
 * protocol checked rather than assumed. Zod's `.url()` and `new URL()` both
 * take `javascript:` and `data:`.
 */
function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

/** A cover is fetched by the browser, so the same rule applies to it. */
const CoverUrl = z
  .string()
  .trim()
  .max(1000)
  .refine(isHttpUrl, { error: "coverUrlInvalid" })
  .optional()
  .or(z.literal(""));

export const ShelfEnum = z.enum(
  ["WANT_TO_READ", "READING", "READ", "ABANDONED"],
  // Only a crafted request gets here — the UI only ever sends these four —
  // but without a key it answers in Zod's English.
  "shelfInvalid",
);
export type ShelfValue = z.infer<typeof ShelfEnum>;

export const AddBookSchema = z.object({
  olid: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(300),
  author: z.string().trim().min(1).max(300),
  coverUrl: CoverUrl,
  shelf: ShelfEnum,
});

export const ManualAddBookSchema = z.object({
  title: z.string().trim().min(1, "titleRequired").max(300, "titleTooLong"),
  author: z.string().trim().min(1, "authorRequired").max(300, "authorTooLong"),
  shelf: ShelfEnum,
});

export const MoveBookSchema = z.object({
  userBookId: z.string().trim().min(1),
  shelf: ShelfEnum,
});

export const RemoveBookSchema = z.object({
  userBookId: z.string().trim().min(1),
});

export const CreateClubSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "clubNameTooShort")
    .max(80, "clubNameTooLong"),
  description: z
    .string()
    .trim()
    .max(500, "clubDescriptionTooLong")
    .optional()
    .or(z.literal("")),
});

export const ClubIdSchema = z.object({
  clubId: z.string().trim().min(1),
});

export const ChallengeToDuelSchema = z.object({
  clubId: z.string().trim().min(1),
  opponentId: z.string().trim().min(1),
});

export const DuelIdSchema = z.object({
  duelId: z.string().trim().min(1),
});

export const SetClubBookSchema = z.object({
  clubId: z.string().trim().min(1),
  bookId: z.string().trim().min(1),
});

/** Adding a book to your own shelf and to the club in one step. */
export const AddClubBookSchema = z.object({
  clubId: z.string().trim().min(1),
  olid: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(300),
  author: z.string().trim().min(1).max(300),
  coverUrl: CoverUrl,
});

/**
 * A link the club page turns into something clickable, so the protocol is
 * checked rather than assumed: `new URL()` — and so Zod's `.url()` — happily
 * accepts `javascript:alert(1)`, which would land as an href.
 */
const MeetingUrl = z
  .string()
  .trim()
  .max(500)
  .refine(isHttpUrl, { message: "meetingUrlInvalid" })
  .or(z.literal(""));

export const EditClubSchema = CreateClubSchema.extend({
  clubId: z.string().trim().min(1),
  meetingUrl: MeetingUrl,
});

export const UpdateProfileSchema = z.object({
  name: nameField,
  email: z.email("invalidEmail").trim().toLowerCase(),
});

export const ConfirmEmailChangeSchema = z.object({
  token: z.string().trim().min(1),
});

/**
 * Deleting an account asks for the address back rather than a checkbox: it
 * is the one string only the person at the keyboard is looking at, and it
 * needs no translating.
 */
export const DeleteAccountSchema = z.object({
  confirm: z.string().trim().toLowerCase(),
});

export const ReaderIdSchema = z.object({
  readerId: z.string().trim().min(1),
});

export const ClubMemberSchema = z.object({
  clubId: z.string().trim().min(1),
  userId: z.string().trim().min(1),
});


export const UpdateProgressSchema = z
  .object({
    userBookId: z.string().trim().min(1),
    pagesRead: z.coerce
      .number("pagesReadRange")
      .int("pagesReadRange")
      .min(0, "pagesReadRange")
      .max(100000, "pagesReadRange"),
    totalPages: z.coerce
      .number("totalPagesRange")
      .int("totalPagesRange")
      .min(1, "totalPagesRange")
      .max(100000, "totalPagesRange"),
  })
  .refine((d) => d.pagesRead <= d.totalPages, {
    error: "pagesExceedTotal",
    path: ["pagesRead"],
  });

export const RatingSchema = z.object({
  userBookId: z.string().trim().min(1),
  rating: z.coerce.number().int().min(1).max(5),
});

export const ClearRatingSchema = z.object({
  userBookId: z.string().trim().min(1),
});

export const ReviewSchema = z.object({
  userBookId: z.string().trim().min(1),
  rating: z.coerce
    .number("ratingInvalid")
    .int("ratingInvalid")
    .min(1, "ratingInvalid")
    .max(5, "ratingInvalid"),
  review: z
    .string()
    .trim()
    .max(2000, "reviewTooLong")
    .optional()
    .or(z.literal("")),
});

export const NotesSchema = z.object({
  userBookId: z.string().trim().min(1),
  notes: z
    .string()
    .trim()
    .max(4000, "notesTooLong")
    .optional()
    .or(z.literal("")),
});

export const YearlyGoalSchema = z.object({
  target: z.coerce.number().int().min(0).max(1000),
});

export const ClubCommentSchema = z.object({
  clubId: z.string().trim().min(1),
  body: z
    .string()
    .trim()
    .min(1, "commentEmpty")
    .max(2000, "commentTooLong"),
  parentId: z.string().trim().min(1).optional().or(z.literal("")),
});

export const DeleteClubCommentSchema = z.object({
  clubId: z.string().trim().min(1),
  commentId: z.string().trim().min(1),
});

/**
 * A date the form left empty is "", and that is allowed. Anything else has to
 * be a date Postgres will actually take: `new Date("whenever")` is an Invalid
 * Date, which Prisma rejects at the driver — a crash page where a sentence
 * belongs.
 */
const ScheduleDate = z
  .string()
  .trim()
  .refine((v) => v === "" || !Number.isNaN(new Date(v).getTime()), {
    error: "datesInvalid",
  })
  .optional()
  .or(z.literal(""));

export const ClubScheduleSchema = z
  .object({
    clubId: z.string().trim().min(1),
    startDate: ScheduleDate,
    dueDate: ScheduleDate,
  })
  .refine(
    (d) => !d.startDate || !d.dueDate || new Date(d.dueDate) >= new Date(d.startDate),
    { error: "dueBeforeStart", path: ["dueDate"] },
  );
