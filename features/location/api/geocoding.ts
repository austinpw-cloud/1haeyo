/**
 * 카카오 로컬 API — 장소/주소 검색.
 *
 * 사용자가 "미금역 김밥", "판교 스타벅스" 같이 자연스럽게 치면
 * 장소명(keyword) 검색이 훨씬 잘 맞음. 도로명주소로 정확히 치는 경우는
 * address 검색이 더 정확. 여기서는 두 개 합쳐서 통합 결과 제공.
 *
 * 문서: https://developers.kakao.com/docs/latest/ko/local/dev-guide
 */

const REST_KEY = process.env.EXPO_PUBLIC_KAKAO_REST_KEY;

export interface PlaceResult {
  /** 표시명 (장소명 있으면 장소명, 없으면 주소) */
  name: string;
  /** 도로명/지번 주소 */
  address: string;
  /** 도로명 주소 (있으면) */
  roadAddress?: string;
  /** 카테고리 (예: "음식점 > 한식") */
  category?: string;
  /** 전화번호 */
  phone?: string;
  lat: number;
  lng: number;
}

interface KakaoKeywordDoc {
  place_name: string;
  category_name: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string; // lng
  y: string; // lat
}

interface KakaoAddressDoc {
  address_name: string;
  road_address: { address_name: string } | null;
  x: string;
  y: string;
}

async function kakaoGet(endpoint: string, query: string) {
  if (!REST_KEY) throw new Error('카카오 REST 키가 설정되지 않았어요.');
  const url = `https://dapi.kakao.com${endpoint}?query=${encodeURIComponent(query)}&size=10`;
  const res = await fetch(url, {
    headers: { Authorization: `KakaoAK ${REST_KEY}` },
  });
  if (!res.ok) {
    throw new Error(`카카오 검색 실패: ${res.status}`);
  }
  return res.json();
}

/**
 * 키워드(장소명) 검색.
 * "미금역 스타벅스", "분당 OO식당" 같은 자연 입력 지원.
 */
export async function searchPlaces(query: string): Promise<PlaceResult[]> {
  if (!query.trim()) return [];
  try {
    const data = await kakaoGet('/v2/local/search/keyword.json', query);
    const docs: KakaoKeywordDoc[] = data.documents ?? [];
    return docs.map((d) => ({
      name: d.place_name,
      address: d.road_address_name || d.address_name,
      roadAddress: d.road_address_name || undefined,
      category: d.category_name || undefined,
      phone: d.phone || undefined,
      lat: parseFloat(d.y),
      lng: parseFloat(d.x),
    }));
  } catch {
    return [];
  }
}

/**
 * 주소 검색 (도로명/지번).
 * 키워드로 안 나오는 정확한 주소 입력 대응.
 */
export async function searchAddresses(query: string): Promise<PlaceResult[]> {
  if (!query.trim()) return [];
  try {
    const data = await kakaoGet('/v2/local/search/address.json', query);
    const docs: KakaoAddressDoc[] = data.documents ?? [];
    return docs.map((d) => ({
      name: d.road_address?.address_name || d.address_name,
      address: d.road_address?.address_name || d.address_name,
      roadAddress: d.road_address?.address_name,
      lat: parseFloat(d.y),
      lng: parseFloat(d.x),
    }));
  } catch {
    return [];
  }
}

/**
 * 통합 검색.
 * 장소(keyword) 결과를 우선 보여주고, 부족하면 주소(address) 결과로 보완.
 */
export async function searchLocations(query: string): Promise<PlaceResult[]> {
  const [places, addresses] = await Promise.all([
    searchPlaces(query),
    searchAddresses(query),
  ]);
  const seen = new Set<string>();
  const out: PlaceResult[] = [];
  for (const r of [...places, ...addresses]) {
    const key = `${r.lat.toFixed(5)},${r.lng.toFixed(5)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out.slice(0, 15);
}
