export type LeadKind = 'company' | 'candidate';

export interface ILeadRequest {
  readonly kind: LeadKind;

  readonly name: string;

  readonly email: string;

  readonly company: string | null;

  readonly role: string | null;
}

export interface ILeadResponse {
  readonly id: string;

  readonly alreadyRegistered: boolean;
}
