/**
 * Get Indicator By ID Use Case
 * Retrieves a single indicator with all details including specs
 */

import { IIndicatorRepository } from '../../domain/repositories/IIndicatorRepository'
import { IIndicator } from '../../domain/entities/Indicator'

export class GetIndicatorById {
  constructor(private indicatorRepository: IIndicatorRepository) {}

  async execute(id: string): Promise<IIndicator | null> {
    return await this.indicatorRepository.findById(id)
  }
}
