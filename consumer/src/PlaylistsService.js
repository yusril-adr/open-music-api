const { Pool } = require('pg');

class PlaylistsService {
  constructor() {
    this._pool = new Pool();
  }

  async getPlaylists(playlistId) {
    const playlistQuery = {
      text: `SELECT playlists.id, playlists.name
      FROM playlists
      WHERE playlists.id = $1`,
      values: [playlistId],
    };
    const playlistResult = await this._pool.query(playlistQuery);

    if (!playlistResult.rowCount) {
      throw new Error('Playlist tidak ditemukan');
    }

    const songsQuery = {
      text: `SELECT songs.id, songs.title, songs.performer FROM songs
      LEFT JOIN playlist_songs on playlist_songs.song_id = songs.id
      WHERE playlist_songs.playlist_id = $1
      GROUP BY songs.id`,
      values: [playlistId],
    };
    const songsResult = await this._pool.query(songsQuery);

    const [playlist] = playlistResult.rows;
    const { rows: songs } = songsResult;

    return { playlist, songs };
  }
}

module.exports = PlaylistsService;
