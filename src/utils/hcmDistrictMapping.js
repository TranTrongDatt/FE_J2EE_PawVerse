/**
 * Mapping phường/xã → quận/huyện cho TP.HCM (đầy đủ ~322 phường/xã)
 * Nguồn: provinces.open-api.vn/api/p/79?depth=3 (dữ liệu hành chính chính thức)
 *
 * QUAN TRỌNG: Các phường có tên đánh số (VD: "Phường 1") tồn tại ở nhiều quận.
 * Vì vậy, khi tra cứu phường số, CẦN kết hợp tọa độ để xác định quận chính xác.
 * Dùng hàm lookupHCMDistrictByCoords(wardName, lat, lng) thay vì lookupHCMDistrict(wardName).
 */

// ==========================================
// PHẦN 1: Mapping phường CÓ TÊN RIÊNG (unique, không trùng)
// ==========================================
const HCM_NAMED_WARD_TO_DISTRICT = {
  // ===== Quận 1 =====
  'phường tân định': 'Quận 1',
  'phường đa kao': 'Quận 1',
  'phường bến nghé': 'Quận 1',
  'phường bến thành': 'Quận 1',
  'phường nguyễn thái bình': 'Quận 1',
  'phường phạm ngũ lão': 'Quận 1',
  'phường cầu ông lãnh': 'Quận 1',
  'phường cô giang': 'Quận 1',
  'phường nguyễn cư trinh': 'Quận 1',
  'phường cầu kho': 'Quận 1',

  // ===== Quận 3 =====
  'phường võ thị sáu': 'Quận 3',

  // ===== Quận 8 =====
  'phường rạch ông': 'Quận 8',
  'phường hưng phú': 'Quận 8',
  'phường xóm củi': 'Quận 8',

  // ===== Quận 12 =====
  'phường thạnh xuân': 'Quận 12',
  'phường thạnh lộc': 'Quận 12',
  'phường hiệp thành': 'Quận 12',
  'phường thới an': 'Quận 12',
  'phường tân chánh hiệp': 'Quận 12',
  'phường an phú đông': 'Quận 12',
  'phường tân thới hiệp': 'Quận 12',
  'phường trung mỹ tây': 'Quận 12',
  'phường tân hưng thuận': 'Quận 12',
  'phường đông hưng thuận': 'Quận 12',
  'phường tân thới nhất': 'Quận 12',

  // ===== Quận Tân Phú =====
  'phường tân sơn nhì': 'Quận Tân Phú',
  'phường tây thạnh': 'Quận Tân Phú',
  'phường sơn kỳ': 'Quận Tân Phú',
  'phường tân quý': 'Quận Tân Phú',
  'phường tân thành': 'Quận Tân Phú',
  'phường phú thọ hòa': 'Quận Tân Phú',
  'phường phú thạnh': 'Quận Tân Phú',
  'phường phú trung': 'Quận Tân Phú',
  'phường hòa thạnh': 'Quận Tân Phú',
  'phường hiệp tân': 'Quận Tân Phú',
  'phường tân thới hòa': 'Quận Tân Phú',

  // ===== Thành phố Thủ Đức =====
  'phường linh xuân': 'Thành phố Thủ Đức',
  'phường bình chiểu': 'Thành phố Thủ Đức',
  'phường linh trung': 'Thành phố Thủ Đức',
  'phường tam bình': 'Thành phố Thủ Đức',
  'phường tam phú': 'Thành phố Thủ Đức',
  'phường hiệp bình phước': 'Thành phố Thủ Đức',
  'phường hiệp bình chánh': 'Thành phố Thủ Đức',
  'phường linh chiểu': 'Thành phố Thủ Đức',
  'phường linh tây': 'Thành phố Thủ Đức',
  'phường linh đông': 'Thành phố Thủ Đức',
  'phường bình thọ': 'Thành phố Thủ Đức',
  'phường trường thọ': 'Thành phố Thủ Đức',
  'phường long bình': 'Thành phố Thủ Đức',
  'phường long thạnh mỹ': 'Thành phố Thủ Đức',
  'phường tân phú': 'Thành phố Thủ Đức',
  'phường hiệp phú': 'Thành phố Thủ Đức',
  'phường tăng nhơn phú a': 'Thành phố Thủ Đức',
  'phường tăng nhơn phú b': 'Thành phố Thủ Đức',
  'phường phước long b': 'Thành phố Thủ Đức',
  'phường phước long a': 'Thành phố Thủ Đức',
  'phường trường thạnh': 'Thành phố Thủ Đức',
  'phường long phước': 'Thành phố Thủ Đức',
  'phường long trường': 'Thành phố Thủ Đức',
  'phường phước bình': 'Thành phố Thủ Đức',
  'phường phú hữu': 'Thành phố Thủ Đức',
  'phường thảo điền': 'Thành phố Thủ Đức',
  'phường an phú': 'Thành phố Thủ Đức',
  'phường an khánh': 'Thành phố Thủ Đức',
  'phường bình trưng đông': 'Thành phố Thủ Đức',
  'phường bình trưng tây': 'Thành phố Thủ Đức',
  'phường cát lái': 'Thành phố Thủ Đức',
  'phường thạnh mỹ lợi': 'Thành phố Thủ Đức',
  'phường an lợi đông': 'Thành phố Thủ Đức',
  'phường thủ thiêm': 'Thành phố Thủ Đức',
  'phường bình an': 'Thành phố Thủ Đức',

  // ===== Quận 7 =====
  'phường tân thuận đông': 'Quận 7',
  'phường tân thuận tây': 'Quận 7',
  'phường tân kiểng': 'Quận 7',
  'phường tân hưng': 'Quận 7',
  'phường bình thuận': 'Quận 7',
  'phường tân quy': 'Quận 7',
  'phường phú thuận': 'Quận 7',
  'phường tân phong': 'Quận 7',
  'phường phú mỹ': 'Quận 7',

  // ===== Quận Bình Tân =====
  'phường bình hưng hòa': 'Quận Bình Tân',
  'phường bình hưng hoà a': 'Quận Bình Tân',
  'phường bình hưng hòa a': 'Quận Bình Tân',
  'phường bình hưng hoà b': 'Quận Bình Tân',
  'phường bình hưng hòa b': 'Quận Bình Tân',
  'phường bình trị đông': 'Quận Bình Tân',
  'phường bình trị đông a': 'Quận Bình Tân',
  'phường bình trị đông b': 'Quận Bình Tân',
  'phường tân tạo': 'Quận Bình Tân',
  'phường tân tạo a': 'Quận Bình Tân',
  'phường an lạc': 'Quận Bình Tân',
  'phường an lạc a': 'Quận Bình Tân',

  // ===== Huyện Củ Chi =====
  'thị trấn củ chi': 'Huyện Củ Chi',
  'xã phú mỹ hưng': 'Huyện Củ Chi',
  'xã an phú': 'Huyện Củ Chi',
  'xã trung lập thượng': 'Huyện Củ Chi',
  'xã an nhơn tây': 'Huyện Củ Chi',
  'xã nhuận đức': 'Huyện Củ Chi',
  'xã phạm văn cội': 'Huyện Củ Chi',
  'xã phú hòa đông': 'Huyện Củ Chi',
  'xã trung lập hạ': 'Huyện Củ Chi',
  'xã trung an': 'Huyện Củ Chi',
  'xã phước thạnh': 'Huyện Củ Chi',
  'xã phước hiệp': 'Huyện Củ Chi',
  'xã tân an hội': 'Huyện Củ Chi',
  'xã phước vĩnh an': 'Huyện Củ Chi',
  'xã thái mỹ': 'Huyện Củ Chi',
  'xã tân thạnh tây': 'Huyện Củ Chi',
  'xã hòa phú': 'Huyện Củ Chi',
  'xã tân thạnh đông': 'Huyện Củ Chi',
  'xã bình mỹ': 'Huyện Củ Chi',
  'xã tân phú trung': 'Huyện Củ Chi',
  'xã tân thông hội': 'Huyện Củ Chi',

  // ===== Huyện Hóc Môn =====
  'thị trấn hóc môn': 'Huyện Hóc Môn',
  'xã tân hiệp': 'Huyện Hóc Môn',
  'xã nhị bình': 'Huyện Hóc Môn',
  'xã đông thạnh': 'Huyện Hóc Môn',
  'xã tân thới nhì': 'Huyện Hóc Môn',
  'xã thới tam thôn': 'Huyện Hóc Môn',
  'xã xuân thới sơn': 'Huyện Hóc Môn',
  'xã tân xuân': 'Huyện Hóc Môn',
  'xã xuân thới đông': 'Huyện Hóc Môn',
  'xã trung chánh': 'Huyện Hóc Môn',
  'xã xuân thới thượng': 'Huyện Hóc Môn',
  'xã bà điểm': 'Huyện Hóc Môn',

  // ===== Huyện Bình Chánh =====
  'thị trấn tân túc': 'Huyện Bình Chánh',
  'xã phạm văn hai': 'Huyện Bình Chánh',
  'xã vĩnh lộc a': 'Huyện Bình Chánh',
  'xã vĩnh lộc b': 'Huyện Bình Chánh',
  'xã bình lợi': 'Huyện Bình Chánh',
  'xã lê minh xuân': 'Huyện Bình Chánh',
  'xã tân nhựt': 'Huyện Bình Chánh',
  'xã tân kiên': 'Huyện Bình Chánh',
  'xã bình hưng': 'Huyện Bình Chánh',
  'xã phong phú': 'Huyện Bình Chánh',
  'xã an phú tây': 'Huyện Bình Chánh',
  'xã hưng long': 'Huyện Bình Chánh',
  'xã đa phước': 'Huyện Bình Chánh',
  'xã tân quý tây': 'Huyện Bình Chánh',
  'xã bình chánh': 'Huyện Bình Chánh',
  'xã quy đức': 'Huyện Bình Chánh',

  // ===== Huyện Nhà Bè =====
  'thị trấn nhà bè': 'Huyện Nhà Bè',
  'xã phước kiển': 'Huyện Nhà Bè',
  'xã phước lộc': 'Huyện Nhà Bè',
  'xã nhơn đức': 'Huyện Nhà Bè',
  'xã phú xuân': 'Huyện Nhà Bè',
  'xã long thới': 'Huyện Nhà Bè',
  'xã hiệp phước': 'Huyện Nhà Bè',

  // ===== Huyện Cần Giờ =====
  'thị trấn cần thạnh': 'Huyện Cần Giờ',
  'xã bình khánh': 'Huyện Cần Giờ',
  'xã tam thôn hiệp': 'Huyện Cần Giờ',
  'xã an thới đông': 'Huyện Cần Giờ',
  'xã thạnh an': 'Huyện Cần Giờ',
  'xã long hòa': 'Huyện Cần Giờ',
  'xã lý nhơn': 'Huyện Cần Giờ',
};

// ==========================================
// PHẦN 2: Mapping phường SỐ → danh sách quận chứa phường đó
// Phường "Phường X" tồn tại ở nhiều quận → cần coords để phân biệt
// ==========================================
const HCM_NUMBERED_WARD_DISTRICTS = {
  '1': [
    { district: 'Quận 3',         lat: 10.7840, lng: 106.6842 },
    { district: 'Quận 4',         lat: 10.7578, lng: 106.7065 },
    { district: 'Quận 5',         lat: 10.7560, lng: 106.6630 },
    { district: 'Quận 6',         lat: 10.7477, lng: 106.6356 },
    { district: 'Quận 8',         lat: 10.7397, lng: 106.6538 },
    { district: 'Quận 10',        lat: 10.7725, lng: 106.6607 },
    { district: 'Quận 11',        lat: 10.7625, lng: 106.6484 },
    { district: 'Quận Gò Vấp',    lat: 10.8388, lng: 106.6596 },
    { district: 'Quận Bình Thạnh', lat: 10.8025, lng: 106.7130 },
    { district: 'Quận Tân Bình',   lat: 10.8030, lng: 106.6396 },
    { district: 'Quận Phú Nhuận',  lat: 10.7988, lng: 106.6807 },
  ],
  '2': [
    { district: 'Quận 3',         lat: 10.7840, lng: 106.6842 },
    { district: 'Quận 4',         lat: 10.7578, lng: 106.7065 },
    { district: 'Quận 5',         lat: 10.7560, lng: 106.6630 },
    { district: 'Quận 6',         lat: 10.7477, lng: 106.6356 },
    { district: 'Quận 10',        lat: 10.7725, lng: 106.6607 },
    { district: 'Quận Bình Thạnh', lat: 10.8025, lng: 106.7130 },
    { district: 'Quận Tân Bình',   lat: 10.8030, lng: 106.6396 },
    { district: 'Quận Phú Nhuận',  lat: 10.7988, lng: 106.6807 },
  ],
  '3': [
    { district: 'Quận 3',         lat: 10.7840, lng: 106.6842 },
    { district: 'Quận 4',         lat: 10.7578, lng: 106.7065 },
    { district: 'Quận 11',        lat: 10.7625, lng: 106.6484 },
    { district: 'Quận Gò Vấp',    lat: 10.8388, lng: 106.6596 },
    { district: 'Quận Tân Bình',   lat: 10.8030, lng: 106.6396 },
  ],
  '4': [
    { district: 'Quận 3',         lat: 10.7840, lng: 106.6842 },
    { district: 'Quận 4',         lat: 10.7578, lng: 106.7065 },
    { district: 'Quận 5',         lat: 10.7560, lng: 106.6630 },
    { district: 'Quận 8',         lat: 10.7397, lng: 106.6538 },
    { district: 'Quận 10',        lat: 10.7725, lng: 106.6607 },
    { district: 'Quận Tân Bình',   lat: 10.8030, lng: 106.6396 },
    { district: 'Quận Phú Nhuận',  lat: 10.7988, lng: 106.6807 },
  ],
  '5': [
    { district: 'Quận 3',         lat: 10.7840, lng: 106.6842 },
    { district: 'Quận 5',         lat: 10.7560, lng: 106.6630 },
    { district: 'Quận 8',         lat: 10.7397, lng: 106.6538 },
    { district: 'Quận 10',        lat: 10.7725, lng: 106.6607 },
    { district: 'Quận 11',        lat: 10.7625, lng: 106.6484 },
    { district: 'Quận Gò Vấp',    lat: 10.8388, lng: 106.6596 },
    { district: 'Quận Bình Thạnh', lat: 10.8025, lng: 106.7130 },
    { district: 'Quận Tân Bình',   lat: 10.8030, lng: 106.6396 },
    { district: 'Quận Phú Nhuận',  lat: 10.7988, lng: 106.6807 },
  ],
  '6': [
    { district: 'Quận 6',         lat: 10.7477, lng: 106.6356 },
    { district: 'Quận 8',         lat: 10.7397, lng: 106.6538 },
    { district: 'Quận 10',        lat: 10.7725, lng: 106.6607 },
    { district: 'Quận Gò Vấp',    lat: 10.8388, lng: 106.6596 },
    { district: 'Quận Tân Bình',   lat: 10.8030, lng: 106.6396 },
  ],
  '7': [
    { district: 'Quận 5',         lat: 10.7560, lng: 106.6630 },
    { district: 'Quận 6',         lat: 10.7477, lng: 106.6356 },
    { district: 'Quận 8',         lat: 10.7397, lng: 106.6538 },
    { district: 'Quận 11',        lat: 10.7625, lng: 106.6484 },
    { district: 'Quận Bình Thạnh', lat: 10.8025, lng: 106.7130 },
    { district: 'Quận Tân Bình',   lat: 10.8030, lng: 106.6396 },
    { district: 'Quận Phú Nhuận',  lat: 10.7988, lng: 106.6807 },
  ],
  '8': [
    { district: 'Quận 4',         lat: 10.7578, lng: 106.7065 },
    { district: 'Quận 6',         lat: 10.7477, lng: 106.6356 },
    { district: 'Quận 8',         lat: 10.7397, lng: 106.6538 },
    { district: 'Quận 10',        lat: 10.7725, lng: 106.6607 },
    { district: 'Quận 11',        lat: 10.7625, lng: 106.6484 },
    { district: 'Quận Gò Vấp',    lat: 10.8388, lng: 106.6596 },
    { district: 'Quận Tân Bình',   lat: 10.8030, lng: 106.6396 },
    { district: 'Quận Phú Nhuận',  lat: 10.7988, lng: 106.6807 },
  ],
  '9': [
    { district: 'Quận 3',         lat: 10.7840, lng: 106.6842 },
    { district: 'Quận 4',         lat: 10.7578, lng: 106.7065 },
    { district: 'Quận 5',         lat: 10.7560, lng: 106.6630 },
    { district: 'Quận 6',         lat: 10.7477, lng: 106.6356 },
    { district: 'Quận 10',        lat: 10.7725, lng: 106.6607 },
    { district: 'Quận Tân Bình',   lat: 10.8030, lng: 106.6396 },
    { district: 'Quận Phú Nhuận',  lat: 10.7988, lng: 106.6807 },
  ],
  '10': [
    { district: 'Quận 6',         lat: 10.7477, lng: 106.6356 },
    { district: 'Quận 10',        lat: 10.7725, lng: 106.6607 },
    { district: 'Quận 11',        lat: 10.7625, lng: 106.6484 },
    { district: 'Quận Gò Vấp',    lat: 10.8388, lng: 106.6596 },
    { district: 'Quận Tân Bình',   lat: 10.8030, lng: 106.6396 },
    { district: 'Quận Phú Nhuận',  lat: 10.7988, lng: 106.6807 },
  ],
  '11': [
    { district: 'Quận 3',         lat: 10.7840, lng: 106.6842 },
    { district: 'Quận 5',         lat: 10.7560, lng: 106.6630 },
    { district: 'Quận 6',         lat: 10.7477, lng: 106.6356 },
    { district: 'Quận 11',        lat: 10.7625, lng: 106.6484 },
    { district: 'Quận Gò Vấp',    lat: 10.8388, lng: 106.6596 },
    { district: 'Quận Bình Thạnh', lat: 10.8025, lng: 106.7130 },
    { district: 'Quận Tân Bình',   lat: 10.8030, lng: 106.6396 },
    { district: 'Quận Phú Nhuận',  lat: 10.7988, lng: 106.6807 },
  ],
  '12': [
    { district: 'Quận 3',         lat: 10.7840, lng: 106.6842 },
    { district: 'Quận 5',         lat: 10.7560, lng: 106.6630 },
    { district: 'Quận 6',         lat: 10.7477, lng: 106.6356 },
    { district: 'Quận Gò Vấp',    lat: 10.8388, lng: 106.6596 },
    { district: 'Quận Bình Thạnh', lat: 10.8025, lng: 106.7130 },
    { district: 'Quận Tân Bình',   lat: 10.8030, lng: 106.6396 },
  ],
  '13': [
    { district: 'Quận 4',         lat: 10.7578, lng: 106.7065 },
    { district: 'Quận 5',         lat: 10.7560, lng: 106.6630 },
    { district: 'Quận 6',         lat: 10.7477, lng: 106.6356 },
    { district: 'Quận Gò Vấp',    lat: 10.8388, lng: 106.6596 },
    { district: 'Quận Bình Thạnh', lat: 10.8025, lng: 106.7130 },
    { district: 'Quận Tân Bình',   lat: 10.8030, lng: 106.6396 },
    { district: 'Quận Phú Nhuận',  lat: 10.7988, lng: 106.6807 },
  ],
  '14': [
    { district: 'Quận 3',         lat: 10.7840, lng: 106.6842 },
    { district: 'Quận 5',         lat: 10.7560, lng: 106.6630 },
    { district: 'Quận 6',         lat: 10.7477, lng: 106.6356 },
    { district: 'Quận 8',         lat: 10.7397, lng: 106.6538 },
    { district: 'Quận 10',        lat: 10.7725, lng: 106.6607 },
    { district: 'Quận 11',        lat: 10.7625, lng: 106.6484 },
    { district: 'Quận Gò Vấp',    lat: 10.8388, lng: 106.6596 },
    { district: 'Quận Bình Thạnh', lat: 10.8025, lng: 106.7130 },
    { district: 'Quận Tân Bình',   lat: 10.8030, lng: 106.6396 },
  ],
  '15': [
    { district: 'Quận 4',         lat: 10.7578, lng: 106.7065 },
    { district: 'Quận 8',         lat: 10.7397, lng: 106.6538 },
    { district: 'Quận 10',        lat: 10.7725, lng: 106.6607 },
    { district: 'Quận 11',        lat: 10.7625, lng: 106.6484 },
    { district: 'Quận Gò Vấp',    lat: 10.8388, lng: 106.6596 },
    { district: 'Quận Tân Bình',   lat: 10.8030, lng: 106.6396 },
    { district: 'Quận Phú Nhuận',  lat: 10.7988, lng: 106.6807 },
  ],
  '16': [
    { district: 'Quận 4',         lat: 10.7578, lng: 106.7065 },
    { district: 'Quận 8',         lat: 10.7397, lng: 106.6538 },
    { district: 'Quận 11',        lat: 10.7625, lng: 106.6484 },
    { district: 'Quận Gò Vấp',    lat: 10.8388, lng: 106.6596 },
  ],
  '17': [
    { district: 'Quận Gò Vấp',    lat: 10.8388, lng: 106.6596 },
    { district: 'Quận Bình Thạnh', lat: 10.8025, lng: 106.7130 },
  ],
  '18': [
    { district: 'Quận 4',         lat: 10.7578, lng: 106.7065 },
  ],
  '19': [
    { district: 'Quận Bình Thạnh', lat: 10.8025, lng: 106.7130 },
  ],
  '22': [
    { district: 'Quận Bình Thạnh', lat: 10.8025, lng: 106.7130 },
  ],
  '25': [
    { district: 'Quận Bình Thạnh', lat: 10.8025, lng: 106.7130 },
  ],
  '26': [
    { district: 'Quận Bình Thạnh', lat: 10.8025, lng: 106.7130 },
  ],
  '27': [
    { district: 'Quận Bình Thạnh', lat: 10.8025, lng: 106.7130 },
  ],
  '28': [
    { district: 'Quận Bình Thạnh', lat: 10.8025, lng: 106.7130 },
  ],
};

// ==========================================
// PHẦN 3: Helper functions
// ==========================================

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Trích số từ tên phường: "Phường 3" → "3", "Phường Bến Nghé" → null
 */
function extractWardNumber(wardName) {
  if (!wardName) return null;
  const m = wardName.trim().match(/^(?:ph\u01B0\u1EDDng\s+)?(\d+)$/i);
  return m ? m[1] : null;
}

/**
 * Tra cứu quận/huyện từ tên phường/xã cho TP.HCM (KẾT HỢP tọa độ)
 *
 * Đây là hàm chính nên dùng. Nó xử lý:
 * - Phường có tên riêng (unique): tra cứu trực tiếp
 * - Phường đánh số (trùng nhiều quận): dùng tọa độ tìm quận gần nhất
 *
 * @param {string} wardName - Tên phường (VD: "Phường 3", "Phường Bến Nghé")
 * @param {number|null} lat - Vĩ độ (optional, cần cho phường số)
 * @param {number|null} lng - Kinh độ (optional, cần cho phường số)
 * @returns {string} Tên quận/huyện hoặc '' nếu không tìm thấy
 */
export function lookupHCMDistrictByCoords(wardName, lat = null, lng = null) {
  if (!wardName) return '';
  const key = wardName.toLowerCase().trim();

  // 1. Thử exact match phường có tên riêng
  if (HCM_NAMED_WARD_TO_DISTRICT[key]) return HCM_NAMED_WARD_TO_DISTRICT[key];

  // 2. Prefix match cho phường tên (VD: "phường phước long" → "phường phước long a")
  const prefixMatch = Object.keys(HCM_NAMED_WARD_TO_DISTRICT).find(
    k => k.startsWith(key + ' ')
  );
  if (prefixMatch) return HCM_NAMED_WARD_TO_DISTRICT[prefixMatch];

  // 3. Stripped match: bỏ prefix "phường/xã/thị trấn" rồi so sánh
  const stripped = key.replace(/^(ph\u01B0\u1EDDng|x\u00E3|th\u1ECB tr\u1EA5n)\s+/i, '');
  if (stripped !== key && !/^\d+$/.test(stripped)) {
    const match = Object.keys(HCM_NAMED_WARD_TO_DISTRICT).find(k => {
      const kStripped = k.replace(/^(ph\u01B0\u1EDDng|x\u00E3|th\u1ECB tr\u1EA5n)\s+/i, '');
      return kStripped === stripped || kStripped.startsWith(stripped + ' ');
    });
    if (match) return HCM_NAMED_WARD_TO_DISTRICT[match];
  }

  // 4. Phường số → cần tọa độ
  const num = extractWardNumber(wardName);
  if (num && HCM_NUMBERED_WARD_DISTRICTS[num]) {
    const candidates = HCM_NUMBERED_WARD_DISTRICTS[num];

    // Nếu chỉ có 1 quận chứa phường số này → trả luôn
    if (candidates.length === 1) return candidates[0].district;

    // Nếu có tọa độ → tìm quận gần nhất
    if (lat != null && lng != null) {
      let closest = candidates[0];
      let minDist = Infinity;
      for (const c of candidates) {
        const d = haversine(lat, lng, c.lat, c.lng);
        if (d < minDist) {
          minDist = d;
          closest = c;
        }
      }
      return closest.district;
    }

    // Không có tọa độ → không thể xác định
    return '';
  }

  return '';
}

/**
 * Tra cứu quận/huyện CHỈ theo tên (backward compatible, không cần tọa độ)
 * CHÚ Ý: Với phường số, hàm này có thể trả kết quả sai nếu phường tồn tại ở nhiều quận.
 * Ưu tiên dùng lookupHCMDistrictByCoords() khi có tọa độ.
 */
export function lookupHCMDistrict(wardName) {
  return lookupHCMDistrictByCoords(wardName, null, null);
}

/**
 * Kiểm tra phường có thực sự thuộc TP Thủ Đức hay không.
 * @param {string} wardName
 * @param {number|null} lat
 * @param {number|null} lng
 */
export function isActuallyThuDuc(wardName, lat = null, lng = null) {
  if (!wardName) return false;
  const result = lookupHCMDistrictByCoords(wardName, lat, lng);
  return result === 'Thành phố Thủ Đức';
}

// Backward compatibility
const HCM_WARD_TO_DISTRICT = { ...HCM_NAMED_WARD_TO_DISTRICT };
export default HCM_WARD_TO_DISTRICT;
