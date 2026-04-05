/**
 * Mapping phường/xã → quận/huyện cho TP.HCM
 * Nominatim (OSM) không có dữ liệu ranh giới quận cho HCM,
 * nên cần mapping thủ công từ tên phường → quận.
 *
 * Key: tên phường lowercase (bao gồm prefix "phường"/"xã"/"thị trấn")
 * Value: tên quận/huyện
 */

const HCM_WARD_TO_DISTRICT = {
  // ===== Quận 1 =====
  'phường bến nghé': 'Quận 1',
  'phường bến thành': 'Quận 1',
  'phường cầu kho': 'Quận 1',
  'phường cầu ông lãnh': 'Quận 1',
  'phường cô giang': 'Quận 1',
  'phường đa kao': 'Quận 1',
  'phường nguyễn cư trinh': 'Quận 1',
  'phường nguyễn thái bình': 'Quận 1',
  'phường phạm ngũ lão': 'Quận 1',
  'phường tân định': 'Quận 1',

  // ===== Quận 3 (named wards) =====
  'phường võ thị sáu': 'Quận 3',
  'phường nguyễn thiện thuật': 'Quận 3',

  // ===== Quận 7 =====
  'phường bình thuận': 'Quận 7',
  'phường phú mỹ': 'Quận 7',
  'phường phú thuận': 'Quận 7',
  'phường tân hưng': 'Quận 7',
  'phường tân kiểng': 'Quận 7',
  'phường tân phong': 'Quận 7',
  'phường tân quy': 'Quận 7',
  'phường tân thuận đông': 'Quận 7',
  'phường tân thuận tây': 'Quận 7',

  // ===== Quận 12 =====
  'phường an phú đông': 'Quận 12',
  'phường đông hưng thuận': 'Quận 12',
  'phường hiệp thành': 'Quận 12',
  'phường tân chánh hiệp': 'Quận 12',
  'phường tân hưng thuận': 'Quận 12',
  'phường tân thới hiệp': 'Quận 12',
  'phường tân thới nhất': 'Quận 12',
  'phường thạnh lộc': 'Quận 12',
  'phường thạnh xuân': 'Quận 12',
  'phường trung mỹ tây': 'Quận 12',

  // ===== Quận Tân Phú =====
  'phường hiệp tân': 'Quận Tân Phú',
  'phường hòa thạnh': 'Quận Tân Phú',
  'phường phú thạnh': 'Quận Tân Phú',
  'phường phú thọ hòa': 'Quận Tân Phú',
  'phường phú trung': 'Quận Tân Phú',
  'phường sơn kỳ': 'Quận Tân Phú',
  'phường tân quý': 'Quận Tân Phú',
  'phường tân sơn nhì': 'Quận Tân Phú',
  'phường tân thành': 'Quận Tân Phú',
  'phường tân thới hòa': 'Quận Tân Phú',
  'phường tây thạnh': 'Quận Tân Phú',

  // ===== Quận Bình Tân =====
  'phường an lạc': 'Quận Bình Tân',
  'phường an lạc a': 'Quận Bình Tân',
  'phường bình hưng hòa': 'Quận Bình Tân',
  'phường bình hưng hòa a': 'Quận Bình Tân',
  'phường bình hưng hòa b': 'Quận Bình Tân',
  'phường bình trị đông': 'Quận Bình Tân',
  'phường bình trị đông a': 'Quận Bình Tân',
  'phường bình trị đông b': 'Quận Bình Tân',
  'phường tân tạo': 'Quận Bình Tân',
  'phường tân tạo a': 'Quận Bình Tân',

  // ===== Quận Bình Thạnh (named + unique numbered) =====
  'phường 19': 'Quận Bình Thạnh',
  'phường 21': 'Quận Bình Thạnh',
  'phường 22': 'Quận Bình Thạnh',
  'phường 24': 'Quận Bình Thạnh',
  'phường 25': 'Quận Bình Thạnh',
  'phường 26': 'Quận Bình Thạnh',
  'phường 27': 'Quận Bình Thạnh',
  'phường 28': 'Quận Bình Thạnh',

  // ===== Quận 4 (unique numbered) =====
  'phường 18': 'Quận 4',

  // ===== Thành phố Thủ Đức =====
  'phường an khánh': 'Thành phố Thủ Đức',
  'phường an lợi đông': 'Thành phố Thủ Đức',
  'phường an phú': 'Thành phố Thủ Đức',
  'phường bình an': 'Thành phố Thủ Đức',
  'phường bình chiểu': 'Thành phố Thủ Đức',
  'phường bình thọ': 'Thành phố Thủ Đức',
  'phường bình trưng đông': 'Thành phố Thủ Đức',
  'phường bình trưng tây': 'Thành phố Thủ Đức',
  'phường cát lái': 'Thành phố Thủ Đức',
  'phường hiệp bình chánh': 'Thành phố Thủ Đức',
  'phường hiệp bình phước': 'Thành phố Thủ Đức',
  'phường hiệp phú': 'Thành phố Thủ Đức',
  'phường linh chiểu': 'Thành phố Thủ Đức',
  'phường linh đông': 'Thành phố Thủ Đức',
  'phường linh tây': 'Thành phố Thủ Đức',
  'phường linh trung': 'Thành phố Thủ Đức',
  'phường linh xuân': 'Thành phố Thủ Đức',
  'phường long bình': 'Thành phố Thủ Đức',
  'phường long phước': 'Thành phố Thủ Đức',
  'phường long thạnh mỹ': 'Thành phố Thủ Đức',
  'phường long trường': 'Thành phố Thủ Đức',
  'phường phú hữu': 'Thành phố Thủ Đức',
  'phường phước bình': 'Thành phố Thủ Đức',
  'phường phước long a': 'Thành phố Thủ Đức',
  'phường phước long b': 'Thành phố Thủ Đức',
  'phường tam bình': 'Thành phố Thủ Đức',
  'phường tam phú': 'Thành phố Thủ Đức',
  'phường tăng nhơn phú a': 'Thành phố Thủ Đức',
  'phường tăng nhơn phú b': 'Thành phố Thủ Đức',
  'phường thạnh mỹ lợi': 'Thành phố Thủ Đức',
  'phường thảo điền': 'Thành phố Thủ Đức',
  'phường thủ thiêm': 'Thành phố Thủ Đức',
  'phường trường thọ': 'Thành phố Thủ Đức',
  'phường trường thạnh': 'Thành phố Thủ Đức',

  // ===== Huyện Bình Chánh =====
  'xã an phú tây': 'Huyện Bình Chánh',
  'xã bình chánh': 'Huyện Bình Chánh',
  'xã bình hưng': 'Huyện Bình Chánh',
  'xã bình lợi': 'Huyện Bình Chánh',
  'xã đa phước': 'Huyện Bình Chánh',
  'xã hưng long': 'Huyện Bình Chánh',
  'xã lê minh xuân': 'Huyện Bình Chánh',
  'xã phạm văn hai': 'Huyện Bình Chánh',
  'xã quy đức': 'Huyện Bình Chánh',
  'xã tân kiên': 'Huyện Bình Chánh',
  'xã tân nhựt': 'Huyện Bình Chánh',
  'xã tân quý tây': 'Huyện Bình Chánh',
  'xã vĩnh lộc a': 'Huyện Bình Chánh',
  'xã vĩnh lộc b': 'Huyện Bình Chánh',
  'thị trấn tân túc': 'Huyện Bình Chánh',

  // ===== Huyện Hóc Môn =====
  'xã bà điểm': 'Huyện Hóc Môn',
  'xã đông thạnh': 'Huyện Hóc Môn',
  'xã nhị bình': 'Huyện Hóc Môn',
  'xã tân hiệp': 'Huyện Hóc Môn',
  'xã tân thới nhì': 'Huyện Hóc Môn',
  'xã tân xuân': 'Huyện Hóc Môn',
  'xã thới tam thôn': 'Huyện Hóc Môn',
  'xã trung chánh': 'Huyện Hóc Môn',
  'xã xuân thới đông': 'Huyện Hóc Môn',
  'xã xuân thới sơn': 'Huyện Hóc Môn',
  'xã xuân thới thượng': 'Huyện Hóc Môn',
  'thị trấn hóc môn': 'Huyện Hóc Môn',

  // ===== Huyện Củ Chi =====
  'xã an nhơn tây': 'Huyện Củ Chi',
  'xã bình mỹ': 'Huyện Củ Chi',
  'xã hòa phú': 'Huyện Củ Chi',
  'xã nhuận đức': 'Huyện Củ Chi',
  'xã phạm văn cội': 'Huyện Củ Chi',
  'xã phú hòa đông': 'Huyện Củ Chi',
  'xã phú mỹ hưng': 'Huyện Củ Chi',
  'xã phước hiệp': 'Huyện Củ Chi',
  'xã phước thạnh': 'Huyện Củ Chi',
  'xã phước vĩnh an': 'Huyện Củ Chi',
  'xã thái mỹ': 'Huyện Củ Chi',
  'xã tân an hội': 'Huyện Củ Chi',
  'xã tân phú trung': 'Huyện Củ Chi',
  'xã tân thạnh đông': 'Huyện Củ Chi',
  'xã tân thạnh tây': 'Huyện Củ Chi',
  'xã tân thông hội': 'Huyện Củ Chi',
  'xã trung an': 'Huyện Củ Chi',
  'xã trung lập hạ': 'Huyện Củ Chi',
  'xã trung lập thượng': 'Huyện Củ Chi',
  'thị trấn củ chi': 'Huyện Củ Chi',

  // ===== Huyện Nhà Bè =====
  'xã hiệp phước': 'Huyện Nhà Bè',
  'xã long thới': 'Huyện Nhà Bè',
  'xã nhơn đức': 'Huyện Nhà Bè',
  'xã phú xuân': 'Huyện Nhà Bè',
  'xã phước kiển': 'Huyện Nhà Bè',
  'xã phước lộc': 'Huyện Nhà Bè',
  'thị trấn nhà bè': 'Huyện Nhà Bè',

  // ===== Huyện Cần Giờ =====
  'xã an thới đông': 'Huyện Cần Giờ',
  'xã bình khánh': 'Huyện Cần Giờ',
  'xã cần thạnh': 'Huyện Cần Giờ',
  'xã long hòa': 'Huyện Cần Giờ',
  'xã lý nhơn': 'Huyện Cần Giờ',
  'xã tam thôn hiệp': 'Huyện Cần Giờ',
  'xã thạnh an': 'Huyện Cần Giờ',
};

/**
 * Tra cứu quận/huyện từ tên phường/xã cho TP.HCM
 * @param {string} wardName - Tên phường đầy đủ, ví dụ "Phường Tân Thới Hòa"
 * @returns {string} Tên quận/huyện hoặc '' nếu không tìm thấy
 */
export function lookupHCMDistrict(wardName) {
  if (!wardName) return '';
  return HCM_WARD_TO_DISTRICT[wardName.toLowerCase().trim()] || '';
}

export default HCM_WARD_TO_DISTRICT;
