class BaseUseCase {
    constructor(repositories = {}) {
        this.repositories = repositories;
    }
}

module.exports = BaseUseCase;