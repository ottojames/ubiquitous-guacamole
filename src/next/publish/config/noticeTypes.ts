export type NoticeCategoryId = 'licensing' | 'gambling' | 'gvol' | 'planning' | 'probate' | 'tro';

export type NoticeDefinition = {
  id: string;
  category: NoticeCategoryId;
  categoryLabel: string;
  group: string;
  variant: string;
  label: string;
  noticeType: string;
  templateKey: string;
  version: number;
};

const definitions: NoticeDefinition[] = [
  {
    id: 'licensing-premises-new',
    category: 'licensing',
    categoryLabel: 'Licensing Act 2003',
    group: 'Premises Licence',
    variant: 'New',
    label: 'Premises Licence — New',
    noticeType: 'Licensing: Premises - New',
    templateKey: 'licensing_premises_new_v1',
    version: 1,
  },
  {
    id: 'licensing-premises-variation',
    category: 'licensing',
    categoryLabel: 'Licensing Act 2003',
    group: 'Premises Licence',
    variant: 'Variation',
    label: 'Premises Licence — Variation',
    noticeType: 'Licensing: Premises - Variation',
    templateKey: 'licensing_premises_variation_v1',
    version: 1,
  },
  {
    id: 'licensing-premises-review',
    category: 'licensing',
    categoryLabel: 'Licensing Act 2003',
    group: 'Premises Licence',
    variant: 'Review',
    label: 'Premises Licence — Review',
    noticeType: 'Licensing: Premises - Review',
    templateKey: 'licensing_premises_review_v1',
    version: 1,
  },
  {
    id: 'licensing-club-new',
    category: 'licensing',
    categoryLabel: 'Licensing Act 2003',
    group: 'Club Premises Certificate',
    variant: 'New',
    label: 'Club Premises Certificate — New',
    noticeType: 'Licensing: Club Premises Certificate - New',
    templateKey: 'licensing_club_new_v1',
    version: 1,
  },
  {
    id: 'licensing-club-variation',
    category: 'licensing',
    categoryLabel: 'Licensing Act 2003',
    group: 'Club Premises Certificate',
    variant: 'Variation',
    label: 'Club Premises Certificate — Variation',
    noticeType: 'Licensing: Club Premises Certificate - Variation',
    templateKey: 'licensing_club_variation_v1',
    version: 1,
  },
  {
    id: 'licensing-club-review',
    category: 'licensing',
    categoryLabel: 'Licensing Act 2003',
    group: 'Club Premises Certificate',
    variant: 'Review',
    label: 'Club Premises Certificate — Review',
    noticeType: 'Licensing: Club Premises Certificate - Review',
    templateKey: 'licensing_club_review_v1',
    version: 1,
  },
  {
    id: 'gambling-betting-new',
    category: 'gambling',
    categoryLabel: 'Gambling Act 2005',
    group: 'Betting',
    variant: 'New',
    label: 'Betting — New',
    noticeType: 'Gambling: Betting - New',
    templateKey: 'gambling_premises_generic_v1',
    version: 1,
  },
  {
    id: 'gambling-betting-variation',
    category: 'gambling',
    categoryLabel: 'Gambling Act 2005',
    group: 'Betting',
    variant: 'Variation',
    label: 'Betting — Variation',
    noticeType: 'Gambling: Betting - Variation',
    templateKey: 'gambling_premises_generic_v1',
    version: 1,
  },
  {
    id: 'gambling-betting-review',
    category: 'gambling',
    categoryLabel: 'Gambling Act 2005',
    group: 'Betting',
    variant: 'Review',
    label: 'Betting — Review',
    noticeType: 'Gambling: Betting - Review',
    templateKey: 'gambling_premises_generic_v1',
    version: 1,
  },
  {
    id: 'gambling-betting-transfer',
    category: 'gambling',
    categoryLabel: 'Gambling Act 2005',
    group: 'Betting',
    variant: 'Transfer',
    label: 'Betting — Transfer',
    noticeType: 'Gambling: Betting - Transfer',
    templateKey: 'gambling_premises_generic_v1',
    version: 1,
  },
  {
    id: 'gambling-bingo-new',
    category: 'gambling',
    categoryLabel: 'Gambling Act 2005',
    group: 'Bingo',
    variant: 'New',
    label: 'Bingo — New',
    noticeType: 'Gambling: Bingo - New',
    templateKey: 'gambling_premises_generic_v1',
    version: 1,
  },
  {
    id: 'gambling-bingo-variation',
    category: 'gambling',
    categoryLabel: 'Gambling Act 2005',
    group: 'Bingo',
    variant: 'Variation',
    label: 'Bingo — Variation',
    noticeType: 'Gambling: Bingo - Variation',
    templateKey: 'gambling_premises_generic_v1',
    version: 1,
  },
  {
    id: 'gambling-bingo-review',
    category: 'gambling',
    categoryLabel: 'Gambling Act 2005',
    group: 'Bingo',
    variant: 'Review',
    label: 'Bingo — Review',
    noticeType: 'Gambling: Bingo - Review',
    templateKey: 'gambling_premises_generic_v1',
    version: 1,
  },
  {
    id: 'gambling-bingo-transfer',
    category: 'gambling',
    categoryLabel: 'Gambling Act 2005',
    group: 'Bingo',
    variant: 'Transfer',
    label: 'Bingo — Transfer',
    noticeType: 'Gambling: Bingo - Transfer',
    templateKey: 'gambling_premises_generic_v1',
    version: 1,
  },
  {
    id: 'gambling-agc-new',
    category: 'gambling',
    categoryLabel: 'Gambling Act 2005',
    group: 'Adult Gaming Centre',
    variant: 'New',
    label: 'Adult Gaming Centre — New',
    noticeType: 'Gambling: Adult Gaming Centre - New',
    templateKey: 'gambling_premises_generic_v1',
    version: 1,
  },
  {
    id: 'gambling-agc-variation',
    category: 'gambling',
    categoryLabel: 'Gambling Act 2005',
    group: 'Adult Gaming Centre',
    variant: 'Variation',
    label: 'Adult Gaming Centre — Variation',
    noticeType: 'Gambling: Adult Gaming Centre - Variation',
    templateKey: 'gambling_premises_generic_v1',
    version: 1,
  },
  {
    id: 'gambling-agc-review',
    category: 'gambling',
    categoryLabel: 'Gambling Act 2005',
    group: 'Adult Gaming Centre',
    variant: 'Review',
    label: 'Adult Gaming Centre — Review',
    noticeType: 'Gambling: Adult Gaming Centre - Review',
    templateKey: 'gambling_premises_generic_v1',
    version: 1,
  },
  {
    id: 'gambling-agc-transfer',
    category: 'gambling',
    categoryLabel: 'Gambling Act 2005',
    group: 'Adult Gaming Centre',
    variant: 'Transfer',
    label: 'Adult Gaming Centre — Transfer',
    noticeType: 'Gambling: Adult Gaming Centre - Transfer',
    templateKey: 'gambling_premises_generic_v1',
    version: 1,
  },
  {
    id: 'gambling-fec-new',
    category: 'gambling',
    categoryLabel: 'Gambling Act 2005',
    group: 'Family Entertainment Centre',
    variant: 'New',
    label: 'Family Entertainment Centre — New',
    noticeType: 'Gambling: Family Entertainment Centre - New',
    templateKey: 'gambling_premises_generic_v1',
    version: 1,
  },
  {
    id: 'gambling-fec-variation',
    category: 'gambling',
    categoryLabel: 'Gambling Act 2005',
    group: 'Family Entertainment Centre',
    variant: 'Variation',
    label: 'Family Entertainment Centre — Variation',
    noticeType: 'Gambling: Family Entertainment Centre - Variation',
    templateKey: 'gambling_premises_generic_v1',
    version: 1,
  },
  {
    id: 'gambling-fec-review',
    category: 'gambling',
    categoryLabel: 'Gambling Act 2005',
    group: 'Family Entertainment Centre',
    variant: 'Review',
    label: 'Family Entertainment Centre — Review',
    noticeType: 'Gambling: Family Entertainment Centre - Review',
    templateKey: 'gambling_premises_generic_v1',
    version: 1,
  },
  {
    id: 'gambling-fec-transfer',
    category: 'gambling',
    categoryLabel: 'Gambling Act 2005',
    group: 'Family Entertainment Centre',
    variant: 'Transfer',
    label: 'Family Entertainment Centre — Transfer',
    noticeType: 'Gambling: Family Entertainment Centre - Transfer',
    templateKey: 'gambling_premises_generic_v1',
    version: 1,
  },
  {
    id: 'gvol-new',
    category: 'gvol',
    categoryLabel: "Goods Vehicle Operator's Licence",
    group: "Goods Vehicle Operator's Licence",
    variant: 'New',
    label: 'GVOL — New',
    noticeType: 'GVOL: Operating Centre - New',
    templateKey: 'gvol_operating_centre_v1',
    version: 1,
  },
  {
    id: 'gvol-variation',
    category: 'gvol',
    categoryLabel: "Goods Vehicle Operator's Licence",
    group: "Goods Vehicle Operator's Licence",
    variant: 'Variation',
    label: 'GVOL — Variation',
    noticeType: 'GVOL: Operating Centre - Variation',
    templateKey: 'gvol_operating_centre_v1',
    version: 1,
  },
  {
    id: 'planning-major',
    category: 'planning',
    categoryLabel: 'Planning (Press Notices)',
    group: 'Planning Application',
    variant: 'Major',
    label: 'Major Development',
    noticeType: 'Planning: Major Development',
    templateKey: 'planning_press_notice_v1',
    version: 1,
  },
  {
    id: 'planning-eia',
    category: 'planning',
    categoryLabel: 'Planning (Press Notices)',
    group: 'Planning Application',
    variant: 'EIA',
    label: 'EIA Development',
    noticeType: 'Planning: EIA Development',
    templateKey: 'planning_press_notice_v1',
    version: 1,
  },
  {
    id: 'planning-listed',
    category: 'planning',
    categoryLabel: 'Planning (Press Notices)',
    group: 'Planning Application',
    variant: 'Listed',
    label: 'Listed Building',
    noticeType: 'Planning: Listed Building',
    templateKey: 'planning_press_notice_v1',
    version: 1,
  },
  {
    id: 'planning-conservation',
    category: 'planning',
    categoryLabel: 'Planning (Press Notices)',
    group: 'Planning Application',
    variant: 'Conservation Area',
    label: 'Conservation Area',
    noticeType: 'Planning: Conservation Area',
    templateKey: 'planning_press_notice_v1',
    version: 1,
  },
  {
    id: 'planning-prow',
    category: 'planning',
    categoryLabel: 'Planning (Press Notices)',
    group: 'Planning Application',
    variant: 'PRoW',
    label: 'Public Right of Way',
    noticeType: 'Planning: Public Right of Way',
    templateKey: 'planning_press_notice_v1',
    version: 1,
  },
  {
    id: 'planning-departure',
    category: 'planning',
    categoryLabel: 'Planning (Press Notices)',
    group: 'Planning Application',
    variant: 'Departure',
    label: 'Departure',
    noticeType: 'Planning: Departure',
    templateKey: 'planning_press_notice_v1',
    version: 1,
  },
  {
    id: 'probate-trustee-s27',
    category: 'probate',
    categoryLabel: 'Probate',
    group: 'Trustee Act 1925 s.27',
    variant: 'Trustee Act s.27',
    label: 'Trustee Act 1925 s.27',
    noticeType: 'Probate: Trustee Act 1925 s.27',
    templateKey: 'probate_trustee_s27_v1',
    version: 1,
  },
  {
    id: 'tro-permanent',
    category: 'tro',
    categoryLabel: 'Traffic Regulation Orders',
    group: 'Traffic Regulation Order',
    variant: 'Permanent',
    label: 'TRO — Permanent',
    noticeType: 'TRO: Permanent Order',
    templateKey: 'tro_v1',
    version: 1,
  },
  {
    id: 'tro-temporary',
    category: 'tro',
    categoryLabel: 'Traffic Regulation Orders',
    group: 'Traffic Regulation Order',
    variant: 'Temporary',
    label: 'TRO — Temporary',
    noticeType: 'TRO: Temporary Order',
    templateKey: 'tro_v1',
    version: 1,
  },
  {
    id: 'tro-experimental',
    category: 'tro',
    categoryLabel: 'Traffic Regulation Orders',
    group: 'Traffic Regulation Order',
    variant: 'Experimental',
    label: 'TRO — Experimental',
    noticeType: 'TRO: Experimental Order',
    templateKey: 'tro_v1',
    version: 1,
  },
];

export const NOTICE_DEFINITIONS = definitions;

export type NoticeCategoryNode = {
  id: NoticeCategoryId;
  label: string;
  groups: Array<{
    label: string;
    variants: Array<{
      id: string;
      label: string;
      variant: string;
      definition: NoticeDefinition;
    }>;
  }>;
};

export const NOTICE_CATEGORY_TREE: NoticeCategoryNode[] = definitions.reduce<NoticeCategoryNode[]>(
  (acc, definition) => {
    const categoryNode = acc.find((node) => node.id === definition.category);
    if (!categoryNode) {
      acc.push({
        id: definition.category,
        label: definition.categoryLabel,
        groups: [
          {
            label: definition.group,
            variants: [
              {
                id: definition.id,
                label: definition.label,
                variant: definition.variant,
                definition,
              },
            ],
          },
        ],
      });
      return acc;
    }

    let groupNode = categoryNode.groups.find((group) => group.label === definition.group);
    if (!groupNode) {
      groupNode = {
        label: definition.group,
        variants: [],
      };
      categoryNode.groups.push(groupNode);
    }

    groupNode.variants.push({
      id: definition.id,
      label: definition.label,
      variant: definition.variant,
      definition,
    });

    return acc;
  },
  []
);

export function getDefinitionById(id: string): NoticeDefinition | undefined {
  return definitions.find((definition) => definition.id === id);
}

export function getDefinitionByNoticeType(noticeType: string): NoticeDefinition | undefined {
  return definitions.find((definition) => definition.noticeType === noticeType);
}
