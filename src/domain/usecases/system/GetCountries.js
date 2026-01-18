class GetCountries {
    constructor(countriesRepository) {
        this.countriesRepository = countriesRepository;
    }

    async execute() {
        const countries = await this.countriesRepository.findAll();
        return countries.map(countries => countries.toJSON());
    }
}

module.exports = GetCountries;