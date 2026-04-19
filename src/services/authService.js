import { supabase } from "./supabaseClient";

const USERS_TABLE = "users";
const MIN_USERNAME_LENGTH = 2;
const MAX_USERNAME_LENGTH = 24;
const USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/;

function toServiceError(message, error) {
  if (!error?.message) {
    return new Error(message);
  }
  return new Error(`${message} ${error.message}`);
}

function normalizeUsername(rawUsername) {
  return rawUsername.trim();
}

export function validateUsername(rawUsername) {
  const username = rawUsername?.trim() ?? "";

  if (!username) {
    return "Username is required.";
  }

  if (username.length < MIN_USERNAME_LENGTH) {
    return `Username must be at least ${MIN_USERNAME_LENGTH} characters.`;
  }

  if (username.length > MAX_USERNAME_LENGTH) {
    return `Username must be at most ${MAX_USERNAME_LENGTH} characters.`;
  }

  if (!USERNAME_PATTERN.test(username)) {
    return "Use letters, numbers, underscore, or hyphen only.";
  }

  return "";
}

export async function signInOrCreateUser(rawUsername) {
  const validationError = validateUsername(rawUsername);
  if (validationError) {
    throw new Error(validationError);
  }

  const username = normalizeUsername(rawUsername);

  const { data: existingUsers, error: lookupError } = await supabase
    .from(USERS_TABLE)
    .select("id, username, created_at")
    .eq("username", username)
    .limit(1);

  if (lookupError) {
    throw toServiceError("Failed to look up user.", lookupError);
  }

  if (existingUsers?.length) {
    return existingUsers[0];
  }

  const { data: createdUser, error: createError } = await supabase
    .from(USERS_TABLE)
    .insert({
      username,
      device_tokens: [],
    })
    .select("id, username, created_at")
    .single();

  if (createError || !createdUser) {
    throw toServiceError("Failed to create user.", createError);
  }

  return createdUser;
}

export async function getUserById(userId) {
  if (!userId) {
    throw new Error("A user id is required.");
  }

  const { data, error } = await supabase
    .from(USERS_TABLE)
    .select("id, username, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw toServiceError("Failed to load user.", error);
  }

  return data;
}
