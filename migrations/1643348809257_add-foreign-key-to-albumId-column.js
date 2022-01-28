/* eslint-disable camelcase */

exports.up = (pgm) => {
  pgm.sql("INSERT INTO albums(id, name, year) VALUES ('unknown', 'unknown', '0')");

  pgm.addConstraint('songs', 'fk_songs.albumId_albums.id', 'FOREIGN KEY(album_id) REFERENCES albums(id) ON DELETE CASCADE');
};

exports.down = (pgm) => {
  pgm.dropConstraint('songs', 'fk_songs.albumId_albums.id');

  pgm.sql("DELETE FROM albums WHERE id = 'unknown'");
};
