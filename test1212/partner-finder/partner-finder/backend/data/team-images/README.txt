Put the pictures for your team profiles here (PNG, JPEG or WebP).
Then write the file names in backend/data/team-profiles.json ("avatar": "you.png", "banner": "you-banner.jpg")
and run:  npm run db:seed:team
The script copies each picture into backend/uploads/ (avatars/ and banners/) - that is where the app serves them from.
