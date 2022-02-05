class AlbumsHandler {
  constructor({ albumsService, coversService, validator }) {
    this._albumsService = albumsService;
    this._coversService = coversService;
    this._validator = validator;

    this.postAlbumHandler = this.postAlbumHandler.bind(this);
    this.getAlbumsHandler = this.getAlbumsHandler.bind(this);
    this.getAlbumByIdHandler = this.getAlbumByIdHandler.bind(this);
    this.putAlbumByIdHandler = this.putAlbumByIdHandler.bind(this);
    this.deleteAlbumByIdHandler = this.deleteAlbumByIdHandler.bind(this);
    this.postUploadCoverHandler = this.postUploadCoverHandler.bind(this);
    this.postAlbumLikeHandler = this.postAlbumLikeHandler.bind(this);
    this.getAlbumLikesHandler = this.getAlbumLikesHandler.bind(this);
  }

  async postAlbumHandler(request, h) {
    this._validator.validateAlbumPayload(request.payload);

    const albumId = await this._albumsService.addAlbum(request.payload);

    const response = h.response({
      status: 'success',
      message: 'Album berhasil ditambahkan',
      data: {
        albumId,
      },
    });
    response.code(201);
    return response;
  }

  async getAlbumsHandler(request, h) {
    const { isFromCache, data } = await this._albumsService.getAlbums();

    const response = h.response({
      status: 'success',
      data: {
        albums: data,
      },
    });

    if (isFromCache) response.header('X-Data-Source', 'cache');
    return response;
  }

  async getAlbumByIdHandler(request) {
    const { id } = request.params;
    const album = await this._albumsService.getAlbumById(id);
    return {
      status: 'success',
      data: {
        album,
      },
    };
  }

  async putAlbumByIdHandler(request) {
    this._validator.validateAlbumPayload(request.payload);
    const { id } = request.params;

    await this._albumsService.editAlbumById(id, request.payload);

    return {
      status: 'success',
      message: 'Album berhasil diperbarui',
    };
  }

  async deleteAlbumByIdHandler(request) {
    const { id } = request.params;
    await this._albumsService.deleteAlbumById(id);
    return {
      status: 'success',
      message: 'Album berhasil dihapus',
    };
  }

  async postUploadCoverHandler(request, h) {
    const { id } = request.params;

    const { coverUrl } = await this._albumsService.getAlbumById(id);

    const { cover } = request.payload;

    this._validator.validateCoverHeaders(cover.hapi.headers);

    const filename = await this._coversService.writeCover(cover, cover.hapi);
    const fileLocation = `http://${process.env.HOST}:${process.env.PORT}/albums/${id}/covers/${filename}`;

    if (coverUrl) {
      this._coversService.deleteCover(coverUrl);
    }

    await this._albumsService.uploadCoverByAlbumId(fileLocation, id);

    const response = h.response({
      status: 'success',
      message: 'Sampul berhasil diunggah',
    });
    response.code(201);
    return response;
  }

  async postAlbumLikeHandler(request, h) {
    const { id: credentialId } = request.auth.credentials;
    const { id: albumId } = request.params;

    // Check is album exist or not
    await this._albumsService.getAlbumById(albumId);

    const likeId = await this._albumsService.getAlbumLike(credentialId, albumId);

    let message;
    if (likeId) {
      await this._albumsService.deleteAlbumLike(likeId);

      message = 'Album berhasil batal disukai.';
    } else {
      await this._albumsService.addAlbumLike(credentialId, albumId);

      message = 'Album berhasil disukai.';
    }

    const response = h.response({
      status: 'success',
      message,
    });
    response.code(201);
    return response;
  }

  async getAlbumLikesHandler(request, h) {
    const { id } = request.params;
    const { isFromCache, data } = await this._albumsService.getAlbumLikesByAlbumId(id);

    const response = h.response({
      status: 'success',
      data: {
        likes: data,
      },
    });

    if (isFromCache) response.header('X-Data-Source', 'cache');
    return response;
  }
}

module.exports = AlbumsHandler;
