import { PropertyVerificationStatus } from '../enum/property-verification-status.enum';

export type VersionDocumentSlot =
  | 'certificationOfOccupancy'
  | 'contractOfSale'
  | 'surveyPlan'
  | 'letterOfIntent'
  | 'deedOfConveyance';

export const ACTIVE_VERSION_STATUSES = [
  PropertyVerificationStatus.PENDING,
  PropertyVerificationStatus.PENDING_REVERIFICATION,
  PropertyVerificationStatus.IN_REVIEW,
];
