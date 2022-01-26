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
};

module.exports = MapDBToModel;
