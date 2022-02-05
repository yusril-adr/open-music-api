// eslint-disable-next-line camelcase
const MapDBToModel = {
  album({
    cover_url: coverUrl, ...args
  }) {
    return {
      ...args,
      coverUrl,
    };
  },
  song({
    album_id: albumId, ...args
  }) {
    return {
      ...args,
      albumId,
    };
  },
  playlistSongs(playlist, songs) {
    return {
      ...playlist,
      songs,
    };
  },
};

module.exports = MapDBToModel;
