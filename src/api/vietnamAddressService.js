/**
 * Vietnam Administrative Address Service
 * Sử dụng API công khai: https://provinces.open-api.vn
 * Cung cấp dữ liệu Tỉnh/Thành → Quận/Huyện → Phường/Xã chính thức.
 */

const BASE_URL = 'https://provinces.open-api.vn/api';

// In-memory cache — data hành chính hiếm khi thay đổi
const cache = {
  provinces: null,
  districts: {},  // { provinceCode: [...] }
  wards: {},      // { districtCode: [...] }
};

/**
 * Lấy danh sách 63 tỉnh/thành phố
 * @returns {Promise<Array<{code: number, name: string, codename: string, division_type: string}>>}
 */
export async function getProvinces() {
  if (cache.provinces) return cache.provinces;
  const res = await fetch(`${BASE_URL}/p/`);
  if (!res.ok) throw new Error('Không thể tải danh sách tỉnh/thành');
  const data = await res.json();
  cache.provinces = data;
  return data;
}

/**
 * Lấy danh sách quận/huyện theo tỉnh/thành phố
 * @param {number} provinceCode - Mã tỉnh (VD: 79 = TP.HCM)
 * @returns {Promise<Array<{code: number, name: string, codename: string, division_type: string}>>}
 */
export async function getDistricts(provinceCode) {
  if (!provinceCode) return [];
  if (cache.districts[provinceCode]) return cache.districts[provinceCode];
  const res = await fetch(`${BASE_URL}/p/${provinceCode}?depth=2`);
  if (!res.ok) throw new Error('Không thể tải danh sách quận/huyện');
  const data = await res.json();
  const districts = data.districts || [];
  cache.districts[provinceCode] = districts;
  return districts;
}

/**
 * Lấy danh sách phường/xã theo quận/huyện
 * @param {number} districtCode - Mã quận (VD: 770 = Quận 3)
 * @returns {Promise<Array<{code: number, name: string, codename: string, division_type: string}>>}
 */
export async function getWards(districtCode) {
  if (!districtCode) return [];
  if (cache.wards[districtCode]) return cache.wards[districtCode];
  const res = await fetch(`${BASE_URL}/d/${districtCode}?depth=2`);
  if (!res.ok) throw new Error('Không thể tải danh sách phường/xã');
  const data = await res.json();
  const wards = data.wards || [];
  cache.wards[districtCode] = wards;
  return wards;
}

/**
 * Tìm province code theo tên (fuzzy match)
 * @param {string} name - Tên tỉnh/thành (VD: "Thành phố Hồ Chí Minh", "Hồ Chí Minh", "HCM")
 * @returns {Promise<number|null>}
 */
export async function findProvinceCode(name) {
  if (!name) return null;
  const provinces = await getProvinces();
  const normalized = name.toLowerCase().trim();

  // Exact match
  const exact = provinces.find(p => p.name.toLowerCase() === normalized);
  if (exact) return exact.code;

  // Partial match — bỏ prefix "Thành phố", "Tỉnh"
  const stripped = normalized.replace(/^(thành phố|tỉnh)\s+/i, '');
  const partial = provinces.find(p => {
    const pStripped = p.name.toLowerCase().replace(/^(thành phố|tỉnh|thành phố trung ương)\s+/i, '');
    return pStripped === stripped || pStripped.includes(stripped) || stripped.includes(pStripped);
  });
  return partial?.code || null;
}

/**
 * Tìm district code theo tên trong một province
 * @param {number} provinceCode
 * @param {string} name - Tên quận/huyện
 * @returns {Promise<number|null>}
 */
export async function findDistrictCode(provinceCode, name) {
  if (!provinceCode || !name) return null;
  const districts = await getDistricts(provinceCode);
  const normalized = name.toLowerCase().trim();

  const exact = districts.find(d => d.name.toLowerCase() === normalized);
  if (exact) return exact.code;

  const stripped = normalized.replace(/^(quận|huyện|thị xã|thành phố)\s+/i, '');
  const partial = districts.find(d => {
    const dStripped = d.name.toLowerCase().replace(/^(quận|huyện|thị xã|thành phố)\s+/i, '');
    return dStripped === stripped;
  });
  return partial?.code || null;
}

/**
 * Tìm ward code theo tên trong một district
 * @param {number} districtCode
 * @param {string} name - Tên phường/xã
 * @returns {Promise<number|null>}
 */
export async function findWardCode(districtCode, name) {
  if (!districtCode || !name) return null;
  const wards = await getWards(districtCode);
  const normalized = name.toLowerCase().trim();

  const exact = wards.find(w => w.name.toLowerCase() === normalized);
  if (exact) return exact.code;

  const stripped = normalized.replace(/^(phường|xã|thị trấn)\s+/i, '');
  const partial = wards.find(w => {
    const wStripped = w.name.toLowerCase().replace(/^(phường|xã|thị trấn)\s+/i, '');
    return wStripped === stripped;
  });
  return partial?.code || null;
}

export const vietnamAddressService = {
  getProvinces,
  getDistricts,
  getWards,
  findProvinceCode,
  findDistrictCode,
  findWardCode,
};
