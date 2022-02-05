const AlbumsHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'albums',
  version: '1.0.0',
  register: async (server, { albumsService, coversService, validator }) => {
    const albumsHandler = new AlbumsHandler({ albumsService, coversService, validator });
    server.route(routes(albumsHandler));
  },
};
