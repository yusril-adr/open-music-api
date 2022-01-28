/* eslint-disable no-console */
require('dotenv').config();
const { Pool } = require('pg');

const resetDb = async (pool) => {
  // Delete All Data
  await pool.query('TRUNCATE users, songs, albums, authentications, playlists, playlist_songs, playlist_song_activities');

  // Add Unknown Albums
  // For undefined albumId in table songs
  await pool.query("INSERT INTO albums(id, name, year) VALUES ('unknown', 'unknown', '0')");

  await pool.end();
};

resetDb(new Pool())
  .then(() => {
    console.log('Database berhasil direset');
  }).catch(console.log);
