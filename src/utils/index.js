// eslint-disable-next-line camelcase
const MapDBToModel = {
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
