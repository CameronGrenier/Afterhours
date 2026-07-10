-- Slang! word database
-- `categories` holds real gameplay categories (e.g. "Slang Words") plus one
-- special pool: is_candidate_pool=1 marks player submitted words that are not yet in the database, 
-- but not yet voted by other players as bullshit
-- in that pool are NOT valid for gameplay until a human promotes them into a
-- real category — see word_bank.promote_candidate().

CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    is_candidate_pool INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word TEXT NOT NULL,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    added_by TEXT,                              -- username who submitted it; NULL for seeded words
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(word, category_id)
);

CREATE INDEX IF NOT EXISTS idx_words_word ON words(word);
CREATE INDEX IF NOT EXISTS idx_words_category ON words(category_id);
