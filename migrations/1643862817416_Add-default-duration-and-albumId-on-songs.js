/* eslint-disable camelcase */

exports.up = (pgm) => {
  pgm.alterColumn('songs', 'duration', {
    default: 0,
  });

  pgm.alterColumn('songs', 'album_id', {
    default: 'unknown',
  });
};

exports.down = (pgm) => {
  pgm.alterColumn('songs', 'duration', {
    default: null,
  });

  pgm.alterColumn('songs', 'album_id', {
    default: null,
  });
};
