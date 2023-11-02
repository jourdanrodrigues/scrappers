import { ORDERING_MAP, TRANSMISSION_MAP } from '@/clients/olx-client';

export type TAd = Pick<
  TFullAd,
  'listId' | 'subject' | 'price' | 'url' | 'thumbnail' | 'date' | 'location'
>;

export type TFullAd = {
  listId: number;
  subject: string;
  price: `R$ ${string}`; // "R$ 1.000.000,00"
  oldPrice: `R$ ${string}` | null;
  professionalAd: boolean;
  isFeatured: boolean;
  isChatEnabled: boolean;
  fixedOnTop: boolean;
  url: string;
  thumbnail: string;
  date: number;
  imageCount: number;
  location: string;
  category: string;
  listingCategoryId: `${number}`;
  lastBumpAgeSecs: `${number}`;
  videoCount: number;
  searchCategoryLevelZero: number;
  searchCategoryLevelOne: number;
  images: {
    original: string;
    originalAlt: string;
    thumbnail: string;
  }[];
  properties: {
    name: string;
    label: string;
    value: string;
  }[];
  accountActivityStatus: {
    isOnline: boolean;
    lastSeen?: number;
  };
  position: number;
  olxPay: {
    enabled: boolean;
    dynamicBadgeProps: {
      title: string;
      description: string;
      icon: string;
    }[];
    installments: {
      numberOfInstallments: number;
      installmentValue: string;
      totalValue: string;
    }[];
  };
  olxDelivery: {
    enabled: boolean;
    weight: string | null;
  };
  vehicleReport: {
    enabled: boolean;
    title: string | null;
    description: string | null;
    reportLink: string | null;
    reportTitle: string | null;
    tags: string[] | null;
  };
  vehicleTags: ({ name: string; label: string } | string)[];
  vehiclePills: {
    label: string;
  }[];
  realEstateCertificationData: {
    certificationType: string;
    certificationLabel: string;
    certificationIcon: string;
    certificationLink: string;
  } | null;
  tags: {
    name: string;
    label: string;
  }[];
  priorityAdImage: boolean;
  isPubListingItem?: boolean;
};

export type TOlxData = {
  listingProps: {
    adList: (TFullAd | { isPubListingItem: true })[];
    totalOfAds: number;
    pageSize: number;
    pageLimit: number;
    pageIndex: number;
  };
};

export type TOptions = {
  page?: number;
  transmission?: keyof typeof TRANSMISSION_MAP;
  minPrice?: number;
  maxPrice?: number;
  ordering?: keyof typeof ORDERING_MAP;
};
