-- Dev/local credentials on User (email + username + password hash)

ALTER TABLE User ADD COLUMN username TEXT;
ALTER TABLE User ADD COLUMN passwordHash TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS User_username_idx ON User(username) WHERE username IS NOT NULL;
