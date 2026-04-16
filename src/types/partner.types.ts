import { IBaseDocument } from "../utils/shared-lib-imports";

export interface IPartner extends IBaseDocument {
  partnersField: string;
  partnerLogo?: string;
  companyName: string;
  supportEmail: string;
  colourTheme: { key: string; value: string }[];
  sidebarGradient?: string;
  isDefault?: boolean;
}
