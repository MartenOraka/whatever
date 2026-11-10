# QREW: how to add and manage profiles (beginner guide)

You do **not** need to write code for any of this. Everything is stored in the real database, so profiles behave exactly like users who signed up themselves.

Words used in this guide:
- **Profile** = one person in QREW (it is a real account with an e-mail and a password).
- **Admin** = an account that is allowed to open the Admin page. You decide who in one setting (step 1).
- **Terminal** = the black window where you type commands (Git Bash on Windows). `backend` and `frontend` are the two folders of the project.

---

## 1. One-time setup: make yourself an admin

1. Open the file `backend/.env` in any text editor (Notepad is fine).
2. Add (or change) this line, using **your own e-mail** and your partner's e-mail, separated by a comma, no spaces:

   ```
   ADMIN_EMAILS=you@example.com,partner@example.com
   ```
3. Save the file. **Restart the backend**: in the terminal where it runs press `Ctrl + C`, then start it again with `npm run dev`.
4. In the browser open the site, **Sign up** with exactly that e-mail (or log in if you already have that account).
5. Look at the left menu: a new item **⚙ Admin** has appeared. Click it. (If you do not see it, see "Troubleshooting" at the bottom.)

> Only e-mails in `ADMIN_EMAILS` can open the Admin page. Everybody else is simply told "not found".

---

## 2. Add a new profile

1. Click **⚙ Admin** in the left menu.
2. In the box **Add a profile** fill in:
   | Field | What to type |
   |---|---|
   | E-mail | The person's login e-mail, for example `partner@example.com` |
   | Display name | The name shown everywhere, for example `Alex Kask` |
   | Username | Optional @handle: 3 to 20 characters, only small letters, numbers, `_` and `.` |
   | Password | At least 8 characters. **Leave empty** and QREW makes a strong one for you |
3. Click **Create profile**.
4. A green box appears. If you left the password empty it shows a **temporary password**. Copy it now: it is shown only once. (If you lose it, see step 8.)
5. Click **Open the editor →** to fill in the rest (steps 3 to 6).

---

## 3. Upload or change the profile picture

1. Admin → click **Edit** on the profile (or use **Open the editor →** right after creating it).
2. On the **Basic info** tab find the round picture with the button **Upload picture**.
3. Choose a PNG, JPEG or WebP file, **up to 2 MB**. A square picture looks best.
4. It is saved immediately. To use another picture, click **Upload picture** again. **Remove** goes back to the default QREW avatar.

## 4. Upload or change the profile banner

1. Same page (**Basic info**), at the very top there is the wide banner with **Upload banner** (or **Replace banner**).
2. Choose a PNG, JPEG or WebP, **up to 4 MB**. Best size: about **1200 x 400** pixels (a wide picture).
3. It is saved immediately. **Remove banner** shows the default QREW banner again.

**Where are the uploaded pictures stored?**
- On your computer, inside the project: `backend/uploads/avatars/` (pictures) and `backend/uploads/banners/` (banners).
- File names look like `12-3f9a1c0b7d2e4a55.png`: the number is the profile's id, the rest is random on purpose.
- The browser loads them from `http://localhost:4000/uploads/avatars/...` and `.../uploads/banners/...`.
- The database only remembers the file name (columns `avatar_url` and `banner_url` in the table `profiles`).
- Replacing or removing a picture deletes the old file. **Deleting a profile deletes its pictures too.**
- Resetting the database (`npm run db:reset`) does **not** delete the `uploads` folder. If you want a completely clean start, also delete the folder `backend/uploads`.

---

## 5. Edit profile information

Open the editor (Admin → **Edit**). It has three tabs. **Every tab has its own Save button. Click Save before you switch to another tab that you want to keep.**

**Basic info**
- Display name, Username (@handle)
- Your role in the crew: **Ideator / Creator, Gamer, Developer, Artist / Designer** (pick one or more)
- About me (short bio, up to 500 characters)
- Links (optional, must start with `http://` or `https://`)
- Location: press **Use my current location**, or choose a **city** from the list. Then set the maximum distance in km.

**Gaming**
- Games: click **+ Add game**, start typing (`cs2`, `lol`, `gta`, `minecraft`...) and pick the game from the list. Optional: playtime, rank, FACEIT level (Counter-Strike 2). More than 80 games are built in; any other game can simply be typed.
- Platforms (PC, PlayStation, Xbox, ...), preferred modes, goals, availability, tags, Steam link
- "What matters most in a match" (how important each thing is for recommendations)

**Creative**
- Skills, interests, software and tools (Blender, Unreal Engine, ... with icons), experience level, roles you look for, goals, tags

**When does a profile count as "Complete"?** It needs: a bio, a location (city picked or GPS), and at least **one game or one skill**. Only complete profiles appear in other people's recommendations. The editor header shows "Complete" or "Incomplete".

---

## 6. Add another project team member

Repeat step 2 for every person (they can all log in with their own e-mail and password). Add their e-mail to `ADMIN_EMAILS` too if they should also be admins.
For a demo you can also add made-up users the same way. Tip: use e-mails like `demo1@example.com`.

---

## 7. Remove or update a demonstration profile

- **Update:** Admin → **Edit** → change anything → **Save**.
- **Remove:** Admin → **Delete** (asks "are you sure?") or open the editor and use **Delete this profile** at the bottom. This also removes their requests, chats and pictures. It cannot be undone.
- You cannot delete the account you are logged in with.
- To find someone quickly, type in the **search box** (name, @username or e-mail).

## 8. Forgot a password / change a password

Admin → **Edit** the profile → at the bottom **Login and removal** → type a new password (8+ characters) or leave it empty for a generated one → **Set password**.

---

## 9. Keep your team profiles after a database reset (recommended before the review)

`npm run db:reset` empties the whole database, including profiles you made in the Admin page. The review asks you to reset and reload data, so keep your real profiles in a small file and re-create them with one command:

1. In the terminal:
   ```
   cd backend
   cp data/team-profiles.example.json data/team-profiles.json
   ```
   (On Windows without `cp`: copy the file in Explorer and rename the copy to `team-profiles.json`.)
2. Open `backend/data/team-profiles.json` and replace the example text with **your** and your partner's details. Keep the structure (commas, quotes, brackets). Useful values:
   - `crew_roles`: `"ideator"`, `"gamer"`, `"developer"`, `"artist"`
   - `city`: Tallinn, Tartu, Pärnu, Narva, Helsinki, Riga, Stockholm, Berlin, London, New York (or give `"lat"` and `"lng"` numbers)
   - games: any name or nickname works (`"CS2"` becomes `"Counter-Strike 2"` automatically)
   - `"password"`: optional per person. If left out, everybody gets `defaultPassword` from the top of the file. **Change it.**
3. Put the pictures into the folder `backend/data/team-images/` and write the file names into the JSON (`"avatar": "me.png"`, `"banner": "me-banner.jpg"`).
4. Run:
   ```
   npm run db:seed:team
   ```
   It prints `+ created` or `~ updated` for each person and whether the profile is complete. You can run it as often as you like: it updates people instead of making duplicates.

**Typical review order**
```
npm run db:reset        # empty database
npm run db:seed         # OPTIONAL: 120 fictional users
npm run db:seed:team    # YOUR real profiles (run this last)
npm run dev
```
Remember: the admin e-mails in `backend/.env` must match the e-mails in the JSON so you can open the Admin page.

---

## 10. Terminal commands for the database (only if you are curious)

You use Docker for PostgreSQL. These commands look inside the database:

```
# list all profiles with their e-mail
docker exec -it pf-db psql -U postgres -d partnerfinder -c "SELECT u.id, u.email, p.nickname, p.username, p.completed FROM users u JOIN profiles p ON p.user_id = u.id ORDER BY u.id DESC LIMIT 20;"

# see where a profile's pictures point to
docker exec -it pf-db psql -U postgres -d partnerfinder -c "SELECT user_id, avatar_url, banner_url FROM profiles WHERE username = 'yourname';"

# delete one profile by e-mail (same as the Delete button)
docker exec -it pf-db psql -U postgres -d partnerfinder -c "DELETE FROM users WHERE email = 'demo1@example.com';"
```
(Deleting by hand leaves the picture files behind in `backend/uploads/`. The Admin page's Delete button removes them for you.)

---

## Troubleshooting

| Problem | What to do |
|---|---|
| No **Admin** item in the menu | The e-mail you logged in with must be written **exactly** in `ADMIN_EMAILS` in `backend/.env`. Save the file, restart the backend (`Ctrl + C`, then `npm run dev`), and refresh the browser. |
| "Profile is Incomplete" | Add a bio, choose a city (or use GPS) and add at least one game or one skill, then Save. |
| "That e-mail is already registered" / "username is already taken" | Use another e-mail or username. Usernames are not case-sensitive. |
| Picture does not show | It must be PNG, JPEG or WebP and under the size limit (2 MB avatar, 4 MB banner). Refresh the page. Check that the backend is running. |
| A game has no cover picture | Steam games get their cover from Steam (needs internet). Games without Steam artwork (Valorant, League of Legends, Minecraft...) show a coloured tile with their logo. This is normal. |
| `npm run db:seed:team` says "Cannot find team-profiles.json" | Do step 9.1 first (copy the example file). |
| Typing mistake in the JSON | The script tells you the line: for example `profiles > 0 > crew_roles`. Fix it and run again. |

## Changing the logo

The logo files are in `frontend/public/brand/` (`qrew-logo.png` wide logo, `qrew-icon.png` square icon, `favicon.png`, `apple-touch-icon.png`). Replace a file with the same name and refresh the browser. The slogan text is `SLOGAN` in `frontend/src/config.ts`.
