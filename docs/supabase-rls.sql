-- 1. Allow users to insert (register) their own row
CREATE POLICY users_insert ON todoist.users
FOR INSERT
TO public
WITH CHECK (auth.jwt() ->> 'email' = email);

-- 2. Allow logged-in users to select (view) their own row 
CREATE POLICY users_select ON todoist.users
FOR SELECT 
TO public
USING (auth.jwt() ->> 'email' = email);

-- 3. Allow users to update their own row
CREATE POLICY users_update ON todoist.users
FOR UPDATE 
TO public
USING (auth.jwt() ->> 'email' = email);

-- 4. Do not allow users to delete rows
CREATE POLICY users_no_delete ON todoist.users
FOR DELETE
TO public
USING (false);