/* eslint-disable camelcase */

exports.up = (pgm) => {
  pgm.alterColumn('playlist_song_activities', 'time', {
    default: pgm.func('current_timestamp'),
  });
};

exports.down = (pgm) => {
  pgm.alterColumn('playlist_song_activities', 'time', {
    default: null,
  });
};
