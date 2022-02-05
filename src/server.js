require('dotenv').config();

const path = require('path');
const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');
const Inert = require('@hapi/inert');
const ClientError = require('./exceptions/ClientError');

// Albums
const albums = require('./api/albums');
const AlbumsService = require('./services/postgres/AlbumsService');
const AlbumsValidator = require('./validator/albums');
// Covers
const CoversService = require('./services/storage/CoversService');

// Songs
const songs = require('./api/songs');
const SongsService = require('./services/postgres/SongsService');
const SongsValidator = require('./validator/songs');

// Users
const users = require('./api/users');
const UsersService = require('./services/postgres/UsersService');
const UsersValidator = require('./validator/users');

// Authentications
const authentications = require('./api/authentications');
const AuthenticationsService = require('./services/postgres/AuthenticationsService');
const TokenManager = require('./tokenize/TokenManager');
const AuthenticationsValidator = require('./validator/authentications');

// Playlists
const playlists = require('./api/playlists');
const PlaylistsService = require('./services/postgres/PlaylistsService');
const PlaylistsValidator = require('./validator/playlists');

// Collaborations
const collaborations = require('./api/collaborations');
const CollaborationsService = require('./services/postgres/CollaborationsService');
const CollaborationsValidator = require('./validator/collaborations');

// Exports
const _exports = require('./api/exports');
const ProducerService = require('./services/rabbitmq/ProducerService');
const ExportsValidator = require('./validator/exports');

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT,
    host: process.env.HOST,
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  // External Plugin Registration
  await server.register([
    {
      plugin: Jwt,
    },
    {
      plugin: Inert,
    },
  ]);

  // Define auth strategy with jwt
  server.auth.strategy('openmusic_jwt', 'jwt', {
    keys: process.env.ACCESS_TOKEN_KEY,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: process.env.ACCESS_TOKEN_AGE,
    },
    validate: (artifacts) => ({
      isValid: true,
      credentials: {
        id: artifacts.decoded.payload.id,
      },
    }),
  });

  // Plugin Registration
  const albumsService = new AlbumsService();
  const coversService = new CoversService(path.resolve(__dirname, 'api/albums/covers'));
  const songsService = new SongsService();
  const usersService = new UsersService();
  const authenticationsService = new AuthenticationsService();
  const collaborationsService = new CollaborationsService(usersService);
  const playlistsService = new PlaylistsService(collaborationsService, songsService);

  await server.register([
    {
      plugin: albums,
      options: {
        albumsService,
        coversService,
        validator: AlbumsValidator,
      },
    },
    {
      plugin: songs,
      options: {
        service: songsService,
        validator: SongsValidator,
      },
    },
    {
      plugin: users,
      options: {
        service: usersService,
        validator: UsersValidator,
      },
    },
    {
      plugin: authentications,
      options: {
        authenticationsService,
        usersService,
        tokenManager: TokenManager,
        validator: AuthenticationsValidator,
      },
    },
    {
      plugin: playlists,
      options: {
        service: playlistsService,
        validator: PlaylistsValidator,
      },
    },
    {
      plugin: collaborations,
      options: {
        collaborationsService,
        playlistsService,
        validator: CollaborationsValidator,
      },
    },
    {
      plugin: _exports,
      options: {
        ProducerService,
        playlistsService,
        validator: ExportsValidator,
      },
    },
  ]);

  server.ext('onPreResponse', (request, h) => {
    // Get response context from request
    const { response } = request;

    // If error is instance of Custom Client Error or JWT Error or Inert Max File Size Error
    if (
      response instanceof ClientError || response.message === 'Missing authentication' || `${response.message}`.startsWith('Payload content length greater than maximum allowed')
    ) {
      // Create new response from response toolkit as error handling
      const newResponse = h.response({
        status: 'fail',
        message: response.message,
      });

      // response.output.statusCode is from JWT Error
      newResponse.code(response.statusCode || response.output.statusCode);
      return newResponse;
    }

    if (response instanceof Error) {
      // eslint-disable-next-line no-console
      console.error(response.message);

      let message;
      if (response.statusCode === 404 || response.output.statusCode === 404) {
        message = 'Maaf, endpoint yang anda minta tidak ditemukan.';
      } else {
        message = 'Maaf, terjadi kegagalan pada server kami.';
      }

      // Server ERROR!
      const newResponse = h.response({
        status: 'error',
        message,
      });
      newResponse.code(response.statusCode || response.output.statusCode || 500);

      return newResponse;
    }

    // If not Error, continue with the response (without intervention)
    return response.continue || response;
  });

  await server.start();
  // eslint-disable-next-line no-console
  console.log(`Server running on ${server.info.uri}`);
};

init();
