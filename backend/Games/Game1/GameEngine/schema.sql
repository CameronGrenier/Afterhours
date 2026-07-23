-- Slang! word database
-- `categories` holds real gameplay categories (e.g. "Slang Words") plus one
-- special pool: is_candidate_pool=1 marks player submitted words that are not yet in the database, 
-- but not yet voted by other players as bullshit
-- in that pool are NOT valid for gameplay until a human promotes them into a
-- real category — see word_bank.promote_candidate().

CREATE TABLE IF NOT EXISTS Terms (
  term_id INT AUTO_INCREMENT PRIMARY KEY,
  term VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS Categories (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  category VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS Term_Category (
  term_id INT,
  category_id INT,
  PRIMARY KEY (term_id, category_id),
  FOREIGN KEY (term_id) REFERENCES Terms(term_id),
  FOREIGN KEY (category_id) REFERENCES Categories(category_id)
);

CREATE TABLE IF NOT EXISTS Logs_table (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT,
  log VARCHAR(32) NOT NULL,
  FOREIGN KEY (category_id) REFERENCES Categories(category_id)
);