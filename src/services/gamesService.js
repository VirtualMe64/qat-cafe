import { supabase } from "./supabaseClient";
import { signInOrCreateUser, validateUsername } from "./authService";

const GAMES_TABLE = "games";
const GAME_PLAYERS_TABLE = "game_players";
const GAME_STATUS = {
  IN_PROGRESS_DB: "in_progress",
  IN_PROGRESS_UI: "inProgress",
  FINISHED: "finished",
};

function toServiceError(message, error) {
  if (!error?.message) {
    return new Error(message);
  }
  return new Error(`${message} ${error.message}`);
}

function timestampToEpoch(timestamp) {
  if (!timestamp) {
    return 0;
  }

  const parsedTimestamp = Date.parse(timestamp);
  return Number.isNaN(parsedTimestamp) ? 0 : parsedTimestamp;
}

function normalizeGameStatus(status) {
  if (status === GAME_STATUS.FINISHED) {
    return GAME_STATUS.FINISHED;
  }

  if (status === GAME_STATUS.IN_PROGRESS_DB || status === GAME_STATUS.IN_PROGRESS_UI) {
    return GAME_STATUS.IN_PROGRESS_UI;
  }

  return GAME_STATUS.IN_PROGRESS_UI;
}

function normalizeId(value) {
  return value == null ? "" : String(value);
}

function normalizeGameRecord(record) {
  const game = record.game;

  return {
    id: game.id,
    createdAt: game.created_at,
    lastMoveAt: game.last_move_at,
    status: normalizeGameStatus(game.status),
    currentTurnPlayerId: game.current_turn_player_id,
    rules: game.rules && typeof game.rules === "object" ? game.rules : {},
    score: Number.isInteger(record.score) ? record.score : 0,
    rack: Array.isArray(record.rack) ? record.rack : [],
    playerNumber: Number.isInteger(record.player_number) ? record.player_number : null,
  };
}

export async function getGamesForUser(userId) {
  if (!userId) {
    throw new Error("A user id is required to fetch games.");
  }

  const { data, error } = await supabase
    .from(GAME_PLAYERS_TABLE)
    .select(
      `
        score,
        rack,
        player_number,
        game:games (
          id,
          created_at,
          last_move_at,
          status,
          current_turn_player_id,
          rules
        )
      `,
    )
    .eq("user_id", userId);

  if (error) {
    throw toServiceError("Failed to fetch games.", error);
  }

  return (data ?? [])
    .filter((record) => record.game)
    .map(normalizeGameRecord)
    .sort((left, right) => {
      const rightTime = timestampToEpoch(right.lastMoveAt || right.createdAt);
      const leftTime = timestampToEpoch(left.lastMoveAt || left.createdAt);
      return rightTime - leftTime;
    });
}

export async function createGameWithOpponent({ currentUser, opponentUsername }) {
  if (!currentUser?.id) {
    throw new Error("You must be signed in to create a game.");
  }

  const validationError = validateUsername(opponentUsername);
  if (validationError) {
    throw new Error(validationError);
  }

  const opponentUser = await signInOrCreateUser(opponentUsername);
  const currentUserId = normalizeId(currentUser.id);
  const opponentUserId = normalizeId(opponentUser.id);

  if (currentUserId === opponentUserId) {
    throw new Error("Choose another player. You cannot start a game with yourself.");
  }

  const nowIso = new Date().toISOString();

  const { data: createdGame, error: gameCreateError } = await supabase
    .from(GAMES_TABLE)
    .insert({
      last_move_at: nowIso,
      status: GAME_STATUS.IN_PROGRESS_DB,
      rules: {},
      current_turn_player_id: currentUser.id,
      board_state: {},
      tile_bag: [],
    })
    .select("id, created_at, last_move_at, status, current_turn_player_id, rules")
    .single();

  if (gameCreateError || !createdGame) {
    throw toServiceError("Failed to create game.", gameCreateError);
  }

  const { error: playersCreateError } = await supabase.from(GAME_PLAYERS_TABLE).insert([
    {
      game_id: createdGame.id,
      user_id: currentUser.id,
      score: 0,
      rack: [],
      player_number: 1,
    },
    {
      game_id: createdGame.id,
      user_id: opponentUser.id,
      score: 0,
      rack: [],
      player_number: 2,
    },
  ]);

  if (playersCreateError) {
    await supabase.from(GAMES_TABLE).delete().eq("id", createdGame.id);
    throw toServiceError("Failed to add players to the game.", playersCreateError);
  }

  return {
    id: createdGame.id,
    createdAt: createdGame.created_at,
    lastMoveAt: createdGame.last_move_at,
    status: normalizeGameStatus(createdGame.status),
    currentTurnPlayerId: createdGame.current_turn_player_id,
    rules: createdGame.rules,
    opponentUsername: opponentUser.username,
  };
}
