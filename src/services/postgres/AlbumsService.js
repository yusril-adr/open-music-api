const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const MapDBToModel = require('../../utils');

class AlbumsService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addAlbum({ name, year }) {
    const id = `album-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3) RETURNING id',
      values: [id, name, year],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Album gagal ditambahkan');
    }

    await this._cacheService.delete('albums');

    return result.rows[0].id;
  }

  async getAlbums() {
    try {
      const result = await this._cacheService.get('albums');
      return {
        isFromCache: true,
        data: JSON.parse(result),
      };
    } catch (error) {
      const { rows } = await this._pool.query('SELECT id, name, cover_url, year FROM albums');

      await this._cacheService.set('albums', JSON.stringify(rows));

      return {
        isFromCache: false,
        data: rows,
      };
    }
  }

  async getAlbumById(id) {
    const query = {
      text: 'SELECT id, name, cover_url, year FROM albums WHERE id = $1',
      values: [id],
    };
    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Album tidak ditemukan');
    }

    const [albumResult] = result.rows;
    albumResult.songs = await this._getSongsByAlbumId(id);
    return MapDBToModel.album(albumResult);
  }

  async _getSongsByAlbumId(id) {
    const query = {
      text: 'SELECT * FROM songs WHERE album_id = $1',
      values: [id],
    };
    const { rows } = await this._pool.query(query);
    return rows;
  }

  async editAlbumById(id, { name, year }) {
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2 WHERE id = $3 RETURNING id',
      values: [name, year, id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan');
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan');
    }
  }

  async uploadCoverByAlbumId(filename, id) {
    const query = {
      text: 'UPDATE albums SET cover_url = $1 WHERE id = $2 RETURNING id',
      values: [filename, id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Gagal memperbarui cover album. Id tidak ditemukan');
    }
  }

  async addAlbumLike(userId, albumId) {
    const id = `like-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO user_album_likes VALUES($1, $2, $3) RETURNING id',
      values: [id, userId, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Album gagal disukai');
    }

    await this._cacheService.delete(`albums:${albumId}`);

    return result.rows[0].id;
  }

  async getAlbumLikesByAlbumId(id) {
    try {
      const result = await this._cacheService.get(`albums:${id}`);
      return {
        isFromCache: true,
        data: JSON.parse(result),
      };
    } catch (error) {
      const query = {
        text: 'SELECT * FROM user_album_likes WHERE album_id = $1',
        values: [id],
      };
      const { rowCount } = await this._pool.query(query);

      await this._cacheService.set(`albums:${id}`, JSON.stringify(rowCount));

      return {
        isFromCache: false,
        data: rowCount,
      };
    }
  }

  async getAlbumLike(userId, albumId) {
    const query = {
      text: 'SELECT id FROM user_album_likes WHERE user_id = $1 AND album_id = $2',
      values: [userId, albumId],
    };
    const result = await this._pool.query(query);

    return result.rows[0]?.id;
  }

  async deleteAlbumLike(likeId) {
    const query = {
      text: 'DELETE FROM user_album_likes WHERE id = $1 RETURNING album_id',
      values: [likeId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Batal menyukai album gagal. Id tidak ditemukan');
    }

    await this._cacheService.delete(`albums:${result.rows[0].album_id}`);
  }
}

module.exports = AlbumsService;
