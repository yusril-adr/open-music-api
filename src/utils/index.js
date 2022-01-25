// eslint-disable-next-line camelcase
const MapDBToModel = {
  song({
    id, title, year, genre, performer, duration, album_id: albumId,
  }) {
    return {
      id,
      title,
      year,
      performer,
      genre,
      duration,
      albumId,
    };
  },
};

module.exports = MapDBToModel;
