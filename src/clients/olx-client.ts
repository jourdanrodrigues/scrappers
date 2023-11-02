import axios from 'axios';
import { parse } from 'node-html-parser';
import { Prisma } from '@/clients/prisma';
import { TAd, TFullAd, TOlxData, TOptions } from '@/clients/olx-client.types';
import { OlxUrlBranch } from '@prisma/client';

type TUrlBranchData = {
  [key: string]: TUrlBranchData | string;
};

export const TRANSMISSION_MAP = { automatic: '2', manual: '1' };
export const ORDERING_MAP = { ascending: '2' };

export class OlxClient {
  static async syncCarAds() {
    const [ads, branches] = await Promise.all([
      this.fetchAllCarAds().then((ads) => ads.map(cleanFullAd)),
      Prisma.olxUrlBranch.findMany().then((branches) => {
        return branches.reduce((output, branch) => {
          return { ...output, [branch.path]: branch };
        }, {} as Record<string, OlxUrlBranch>);
      }),
    ]);
    const urlBranchData = ads.reduce((output, ad) => {
      return { ...output, ...buildBranchFromUrl(ad) };
    }, {} as TUrlBranchData);
    const newBranches = await storeOlxUrlBranches(
      urlBranchData,
      undefined,
      branches
    );
    const branchIdMap = Object.values(newBranches).reduce((output, branch) => {
      let pieces: string[] = [];
      let current: OlxUrlBranch | false = branch;
      while (!!current) {
        pieces = [current.path, ...pieces];
        current = !!current.parentPathId && newBranches[current.parentPathId];
      }
      return { ...output, [pieces.join('/')]: branch.id };
    }, {} as Record<string, number>);

    const data = ads.map(({ thumbnail, url, ...ad }) => ({
      ...ad,
      thumbnailId: branchIdMap[thumbnail],
      urlId: branchIdMap[url],
    }));
    Prisma.olxCarAd.createMany({ data });
  }

  static async fetchAllCarAds(options: TOptions = {}) {
    const firstPage = await this.fetchAdsData(options);
    const { adList, totalOfAds, pageSize, pageLimit, pageIndex } =
      firstPage.listingProps;
    const pages = Math.max(Math.ceil(totalOfAds / pageSize), pageLimit);
    const promises = [];
    for (let page = pageIndex; page <= pages; page++) {
      promises.push(this.fetchAdsData({ ...options, page: page }));
    }
    return (await Promise.allSettled(promises))
      .reduce((output, result) => {
        if (result.status !== 'fulfilled') return output;
        return [...output, ...result.value.listingProps.adList];
      }, adList)
      .filter((ad): ad is TFullAd => !ad.isPubListingItem);
  }

  static async fetchAdsData(options: TOptions): Promise<TOlxData> {
    const params = buildSearchParams(options);
    const response = await axios.get(
      `https://www.olx.com.br/autos-e-pecas/carros-vans-e-utilitarios/estado-ce/fortaleza-e-regiao?${params}`
    );
    const element = parse(response.data).querySelector('#initial-data');
    return JSON.parse(element?.['_attrs']['data-json']);
  }
}

async function storeOlxUrlBranches(
  branchData: TUrlBranchData | string,
  parentPathId: number | undefined,
  existingBranches: Record<string, OlxUrlBranch | undefined>
): Promise<Record<number, OlxUrlBranch>> {
  if (typeof branchData === 'string') {
    const branch = await getOrCreateBranch(branchData, parentPathId);
    return { [branch.id]: branch };
  }
  let branchMap: Record<number, OlxUrlBranch> = {};
  for (const [path, children] of Object.entries(branchData)) {
    const branch = await getOrCreateBranch(path, parentPathId);
    const childrenMap = await storeOlxUrlBranches(
      children,
      branch.id,
      existingBranches
    );
    branchMap = { [branch.id]: branch, ...childrenMap };
  }
  return branchMap;

  async function getOrCreateBranch(path: string, parentPathId?: number) {
    const branch = existingBranches?.[path];
    if (branch) return branch;
    const data = { path, parentPathId };
    return Prisma.olxUrlBranch.create({ data });
  }
}

function buildBranchFromUrl(ad: TAd): TUrlBranchData {
  let output: TUrlBranchData = {};
  const urls = [ad.url, ad.thumbnail].map((url) => new URL(url));
  for (const url of urls) {
    const paths = [url.origin, ...url.pathname.split('/').filter(Boolean)];
    for (let i = 0; i < paths.length - 1; i++) {
      const path = paths[i];
      const isPenultimate = i === paths.length - 2;
      if (isPenultimate) {
        output[path] = paths[i + 1];
        break;
      } else {
        output = (output[path] || (output[path] = {})) as TUrlBranchData;
      }
    }
  }
  return output;
}

function buildSearchParams({ transmission, ordering, ...o }: TOptions): string {
  const gb = (transmission && TRANSMISSION_MAP[transmission]) || '';
  const sp = (ordering && ORDERING_MAP[ordering]) || ORDERING_MAP.ascending;
  const pe = '' + (o.maxPrice ?? '');
  const ps = '' + (o.minPrice ?? 10000);
  const page = '' + (o.page ?? 5);
  return new URLSearchParams({ gb, sp, pe, ps, o: page }).toString();
}

function cleanFullAd(fullAdd: TFullAd): TAd {
  const { listId, subject, price, url, thumbnail, date, location } = fullAdd;
  return { listId, subject, price, url, thumbnail, date, location };
}
