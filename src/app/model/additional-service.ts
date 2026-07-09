export type ServiceCategory = 'FOOD' | 'BEVERAGE' | 'PERSONAL_CARE' | 'OTHER';

export class AdditionalService {
    idService?: number;
    nameDto: string;
    descriptionDto?: string;
    priceDto: number;
    categoryDto: ServiceCategory;
    availableDto: boolean;
}
