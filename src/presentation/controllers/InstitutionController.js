class InstitutionController {
    constructor(getInstitutionsUseCase, configurationService) {
        this.getInstitutions = getInstitutionsUseCase;
        this.configurationService = configurationService;
    }

    /**
     * Get available institutions
     */
    async getInstitutionsData(req, res) {
        try {
            const institutions = await this.getInstitutions.execute();

            res.json({
                success: true,
                institutions: institutions,
            });
        } catch (error) {
            console.error(`[GetInstitutionsUseCase] Error getting institution data:`, error);
            return [];
        }
    }

    async showInstitutionsPage(req, res) {
        try {
            
            const countries = await this.configurationService.getCountries();
          
            res.render('institution/institutions-page',{ 
                title: 'Start Verification',
                countries: countries,
                user: req.user
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }

    }

    async getPopularInstitutions(req, res) {
        try {
            const institutions = await this.getInstitutions.execute();
           
            res.json({
                success: true,
                institutions: institutions,
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }

    }

}

module.exports = InstitutionController;