const IInstitutionResponseRepository = require('../../domain/interfaces/IInstitutionResponseRepository');
// const InstitutionResponse = require('../../domain/entities/InstitutionResponse');
const InstitutionResponse = require('../database/models/InstitutionResponse');
const Verification = require('../database/models/Verification');
const Institution = require('../database/models/system/Institution');

class InstitutionResponseRepository extends IInstitutionResponseRepository {
    async toDomain(sequelizeModel) {
        if (!sequelizeModel) return null;
        return new InstitutionResponse(sequelizeModel.toJSON());
    }

    async create(response) { 
        const created = await InstitutionResponse.create({
            verificationId: response.verificationId,
            institutionId: response.institutionId,
            requestId: response.requestId,
            responseData: response.responseData,
            verificationScore: response.verificationScore,
            status: response.status,
            responseType: response.responseType,
            processedBy: response.processedBy,
            processedAt: response.processedAt,
            rawResponse: response.rawResponse,
            confidenceScore: response.confidenceScore,
            flags: response.flags,
            metadata: response.metadata,
            responseTime: response.responseTime,
            apiVersion: response.apiVersion,
            dataSource: response.dataSource,
            verificationDate: response.verificationDate,
            expiryDate: response.expiryDate,
            cost: response.cost,
            currency: response.currency,
            notes: response.notes,
            attachments: response.attachments,
            isVerified: response.isVerified,
            verificationMethod: response.verificationMethod,
            dataQualityScore: response.dataQualityScore,
            completenessScore: response.completenessScore,
            timelinessScore: response.timelinessScore
        });
        return this.toDomain(created);
    }

    async findByVerificationId(verificationId) {
        const response = await InstitutionResponse.findOne({
            where: { verificationId },
            include: [
                {
                    model: Institution,
                    as: 'institution',
                    attributes: ['id', 'name', 'code', 'country', 'type', 'vfee']
                },
            ]
        });
        return response.get({plain: true});
    }

    async update(id, updates) {
        const [affectedRows] = await InstitutionResponse.update(updates, {
            where: { id },
            returning: true
        });
        
        if (affectedRows === 0) return null;
        
        const updated = await InstitutionResponse.findByPk(id);
        return this.toDomain(updated);
    }

    async findByStatus(status) {
        const responses = await InstitutionResponse.findAll({
            where: { status },
            include: [
                {
                    model: Institution,
                    as: 'institution'
                }
            ]
        });
        return responses.map(r => this.toDomain(r));
    }
}

module.exports = InstitutionResponseRepository;