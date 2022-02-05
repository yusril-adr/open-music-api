class ExportsHandler {
  constructor({ ProducerService, playlistsService, validator }) {
    this._ProducerService = ProducerService;
    this._playlistsService = playlistsService;
    this._validator = validator;

    this.postExportPlaylistsHandler = this.postExportPlaylistsHandler.bind(this);
  }

  async postExportPlaylistsHandler(request, h) {
    this._validator.validateExportPlaylistPayload(request.payload);

    const { playlistId } = request.params;
    const { id: userId } = request.auth.credentials;
    await this._playlistsService.verifyPlaylistOwner(playlistId, userId);

    const message = {
      playlistId,
      userId,
      targetEmail: request.payload.targetEmail,
    };

    await this._ProducerService.sendMessage('export:playlists', JSON.stringify(message));

    const response = h.response({
      status: 'success',
      message: 'Permintaan Anda dalam antrean',
    });
    response.code(201);
    return response;
  }
}

module.exports = ExportsHandler;
