-- Users table
    ALTER TABLE todoist.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own data" ON todoist.users FOR INSERT
     WITH CHECK (auth.jwt () - > > 'email' = email);

CREATE POLICY "Users can read their own data" ON todoist.users FOR
   SELECT USING (
          auth.jwt () - > > 'email' = email
      AND email_verified = TRUE
          );

CREATE POLICY "Users can update their own data" ON todoist.users FOR
   UPDATE USING (
auth.jwt () - > > 'email' = email
      AND email_verified = TRUE
          )
               WITH CHECK (auth.jwt () - > > 'email' = email);

-- User tokens table policy
CREATE POLICY "Users can only manage their own tokens" ON todoist.user_tokens FOR ALL USING (
auth.jwt () - > > 'email' = (
   SELECT email
     FROM todoist.users
    WHERE users.id = user_tokens.user_id
      AND users.email_verified = TRUE
)
);