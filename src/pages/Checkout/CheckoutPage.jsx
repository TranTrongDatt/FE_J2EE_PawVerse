import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  CreditCard, 
  Wallet, 
  CheckCircle, 
  ChevronRight, 
  MapPin, 
  Truck, 
  User, 
  Mail, 
  Phone, 
  ArrowLeft,
  ShieldCheck,
  ShoppingBag,
  Clock,
  ShieldAlert,
  Heart,
  Package,
  PawPrint,
  Bone,
  Dog,
  Cat,
  Zap,
  Ticket,
  Tag
} from 'lucide-react';
import { cartService } from '../../api/cartService';
import { orderService } from '../../api/orderService';
import { authService } from '../../api/authService';
import { formatPrice } from '../../utils/formatters';
import { lookupHCMDistrictByCoords, isActuallyThuDuc } from '../../utils/hcmDistrictMapping';
import { getProvinces, getDistricts, getWards, findProvinceCode, findDistrictCode } from '../../api/vietnamAddressService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/useAuthStore';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const SHOP_LAT = 10.8231;
const SHOP_LNG = 106.7625;

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calcShippingByDistance(lat, lng) {
  const dist = haversineDistance(SHOP_LAT, SHOP_LNG, lat, lng);
  if (dist < 3) return { fee: 0, distance: dist };
  if (dist <= 8) return { fee: 20000, distance: dist };
  return { fee: 30000, distance: dist };
}

// Custom marker icons
const shopIcon = L.divIcon({
  html: `<div style="background:#ea580c;width:36px;height:36px;border-radius:50%;border:3px solid white;box-shadow:0 2px 10px rgba(234,88,12,0.5);display:flex;align-items:center;justify-content:center;font-size:18px;">🏪</div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -20],
});

const confirmedIcon = L.divIcon({
  html: `<div style="background:#16a34a;width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 10px rgba(22,163,74,0.5);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);font-size:16px;">✅</span></div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -38],
});

const pendingIcon = L.divIcon({
  html: `<div style="background:#2563eb;width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 10px rgba(37,99,235,0.5);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);font-size:16px;">📍</span></div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -38],
});

function MapClickHandler({ onClick }) {
  useMapEvents({ click: (e) => onClick(e.latlng) });
  return null;
}

function FlyToLocation({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo([target.lat, target.lng], 16, { duration: 1.2 });
    }
  }, [target, map]);
  return null;
}

const shippingSchema = z.object({
  fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().regex(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, 'Số điện thoại không hợp lệ'),
  shippingAddress: z.string().min(10, 'Địa chỉ phải có ít nhất 10 ký tự'),
  shippingCity: z.string().min(2, 'Vui lòng nhập thành phố'),
  shippingDistrict: z.string().min(1, 'Vui lòng nhập quận/huyện'),
  shippingWard: z.string().optional(),
  note: z.string().optional(),
});

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherInput, setVoucherInput] = useState('');
  const [addressMode, setAddressMode] = useState('manual');
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [mapShipping, setMapShipping] = useState(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  // Search bar state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [flyTarget, setFlyTarget] = useState(null);
  const searchRef = useRef(null);
  // Pending (pre-confirm) state
  const [pendingPosition, setPendingPosition] = useState(null);
  const [pendingAddressData, setPendingAddressData] = useState(null);
  const [pendingShipping, setPendingShipping] = useState(null);

  // Cascading address dropdown state
  const [provincesList, setProvincesList] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);
  const [wardsList, setWardsList] = useState([]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState('');
  const [selectedDistrictCode, setSelectedDistrictCode] = useState('');
  const [addressApiError, setAddressApiError] = useState(false);

  const applyVoucherMutation = useMutation({
    mutationFn: (code) => orderService.applyCoupon(code),
    onSuccess: (voucher) => {
      setAppliedVoucher(voucher);
      toast.success(`Áp dụng mã ưu đãi ${voucher.code} thành công! 💎`, {
        style: { borderRadius: '15px', background: '#111', color: '#fff', fontSize: '12px', fontWeight: 'bold' }
      });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn 🐾');
    },
  });

  // Fetch cart
  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: cartService.getCart,
  });

  // Fetch fresh profile for address fields
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: authService.getCurrentUser,
  });

  // Form handling — dùng defaultValues + reset (tránh values prop ghi đè setValue của map)
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      shippingAddress: '',
      shippingCity: '',
      shippingDistrict: '',
      shippingWard: '',
      note: '',
    },
  });

  // Pre-fill form once when profile loads
  useEffect(() => {
    if (profile || user) {
      reset({
        fullName: profile?.fullName || user?.fullName || '',
        email: profile?.email || user?.email || '',
        phone: profile?.soDienThoai || user?.soDienThoai || '',
        shippingAddress: profile?.diaChi || user?.diaChi || '',
        shippingCity: profile?.tinhThanhPho || '',
        shippingDistrict: profile?.quanHuyen || '',
        shippingWard: profile?.phuongXa || '',
        note: '',
      }, { keepDirtyValues: true }); // giữ các giá trị đã sửa tay
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.idUser ?? profile?.id, user?.idUser ?? user?.id]);

  // Load danh sách tỉnh/thành lần đầu
  useEffect(() => {
    getProvinces()
      .then(data => setProvincesList(data))
      .catch(() => setAddressApiError(true));
  }, []);

  // Load quận/huyện khi chọn tỉnh/thành
  useEffect(() => {
    if (!selectedProvinceCode) { setDistrictsList([]); setWardsList([]); return; }
    getDistricts(selectedProvinceCode)
      .then(data => setDistrictsList(data))
      .catch(() => setDistrictsList([]));
    setSelectedDistrictCode('');
    setWardsList([]);
  }, [selectedProvinceCode]);

  // Load phường/xã khi chọn quận/huyện
  useEffect(() => {
    if (!selectedDistrictCode) { setWardsList([]); return; }
    getWards(selectedDistrictCode)
      .then(data => setWardsList(data))
      .catch(() => setWardsList([]));
  }, [selectedDistrictCode]);

  // Auto-select dropdowns khi profile load
  useEffect(() => {
    if (!profile) return;
    const autoSelectFromProfile = async () => {
      try {
        const pCode = await findProvinceCode(profile.tinhThanhPho);
        if (pCode) {
          setSelectedProvinceCode(pCode);
          const dCode = await findDistrictCode(pCode, profile.quanHuyen);
          if (dCode) setSelectedDistrictCode(dCode);
        }
      } catch { /* silent */ }
    };
    if (profile.tinhThanhPho) autoSelectFromProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.idUser ?? profile?.id]);

  // Parse Vietnamese address từ Nominatim — hỗ trợ đầy đủ các loại địa chỉ VN
  const parseVietnamAddress = (data, lat = null, lng = null) => {
    const a = data.address || {};
    const displayParts = (data.display_name || '').split(',').map(s => s.trim()).filter(Boolean);

    // --- Mapping ISO3166-2-lvl4 → 5 TP trực thuộc TW ---
    // Nominatim KHÔNG trả field "state" cho HCM, nhưng luôn có ISO code
    const centralCityByISO = {
      'VN-SG': 'Thành phố Hồ Chí Minh',
      'VN-HN': 'Thành phố Hà Nội',
      'VN-DN': 'Thành phố Đà Nẵng',
      'VN-HP': 'Thành phố Hải Phòng',
      'VN-CT': 'Thành phố Cần Thơ',
    };
    const isoCode = a['ISO3166-2-lvl4'] || a['ISO3166-2-lvl6'] || '';
    const resolvedCentralCity = centralCityByISO[isoCode] || '';
    const centralCityNames = Object.values(centralCityByISO).map(n => n.toLowerCase());

    // Fallback: parse city từ display_name (từ phải qua trái, bỏ "Việt Nam" và postcode)
    const parseCityFromDisplay = () => {
      for (let i = displayParts.length - 1; i >= 0; i--) {
        const p = displayParts[i];
        if (/^(việt nam|vn)$/i.test(p)) continue;
        if (/^\d{5,6}$/.test(p)) continue; // postcode
        if (/^(thành phố|tỉnh)\s/i.test(p)) return p;
      }
      return '';
    };

    // --- WARD: Phường/Xã/Thị trấn ---
    const ward =
      a.quarter ||
      a.suburb ||
      a.neighbourhood ||
      a.village ||
      a.hamlet ||
      a.residential ||
      a.allotments ||
      '';

    // --- CITY: Tỉnh/Thành phố ---
    let city = '';
    if (resolvedCentralCity) {
      // TP trực thuộc TW: dùng mapping ISO (chính xác 100%)
      city = resolvedCentralCity;
    } else {
      // Tỉnh/TP thường: ưu tiên state, state_district, rồi parse display_name
      city = a.state || a.state_district || parseCityFromDisplay() ||
             a.city || a.town || a.municipality || '';
    }

    // --- DISTRICT: Quận/Huyện ---
    let district =
      a.city_district ||
      a.district ||
      a.county ||
      a.borough ||
      '';

    // Fallback: kiểm tra suburb có chứa tên quận không
    if (!district && a.suburb && /^(quận|huyện|thị xã|tx\.)/i.test(a.suburb)) {
      district = a.suburb;
    }

    // Fallback: parse từ display_name theo từ khóa tiếng Việt
    if (!district && data.display_name) {
      const byKeyword = displayParts.find((p) => {
        const lower = p.toLowerCase();
        if (centralCityNames.includes(lower)) return false;
        // Match cả "Thành phố X" (sub-city, VD: TP Thủ Đức) cùng "Quận/Huyện/Thị xã"
        return /^(quận|huyện|thị xã|thành phố)\s/i.test(p);
      });
      if (byKeyword) {
        district = byKeyword;
      } else if (!resolvedCentralCity && displayParts.length >= 4) {
        // Heuristic chỉ dùng cho tỉnh thường, KHÔNG dùng cho TP trực thuộc TW
        const candidate = displayParts[displayParts.length - 3];
        if (
          candidate &&
          !/^(phường|xã|thôn|ấp|khóm|việt nam|vn$)/i.test(candidate) &&
          !centralCityNames.includes(candidate.toLowerCase()) &&
          !/^\d{5,6}$/.test(candidate) &&
          !/^tỉnh\s/i.test(candidate)
        ) {
          district = candidate;
        }
      }
    }

    // Cho TP.HCM: ưu tiên tra cứu phường→quận từ mapping (chính xác hơn OSM boundary)
    // Dùng tọa độ để phân biệt phường trùng tên (VD: Phường 1 thuộc nhiều quận)
    if (resolvedCentralCity === 'Thành phố Hồ Chí Minh' && ward) {
      const coordLat = lat ?? parseFloat(data.lat);
      const coordLng = lng ?? parseFloat(data.lon);
      const mappedDistrict = lookupHCMDistrictByCoords(ward, coordLat, coordLng);
      if (mappedDistrict) {
        district = mappedDistrict;
      }
    }

    // Validate "Thành phố Thủ Đức": OSM boundary bị sai rộng, nhiều quận khác bị gán nhầm
    if (/thành phố thủ đức/i.test(district) && resolvedCentralCity === 'Thành phố Hồ Chí Minh') {
      if (ward) {
        const coordLat2 = lat ?? parseFloat(data.lat);
        const coordLng2 = lng ?? parseFloat(data.lon);
        const isNumberedWard = /^phường\s+\d+$/i.test(ward.trim());
        if (isNumberedWard) {
          // TP Thủ Đức KHÔNG có phường đánh số → chắc chắn sai boundary
          district = lookupHCMDistrictByCoords(ward, coordLat2, coordLng2) || '';
        } else if (!isActuallyThuDuc(ward, coordLat2, coordLng2)) {
          // Phường có tên nhưng không nằm trong Thủ Đức → sai boundary
          district = lookupHCMDistrictByCoords(ward, coordLat2, coordLng2) || '';
        }
      }
    }

    // Fallback cuối: nếu a.city khác resolvedCentralCity → có thể là đơn vị cấp quận
    if (!district && resolvedCentralCity && a.city && a.city.toLowerCase() !== resolvedCentralCity.toLowerCase()) {
      // Validate: không nhận "Thành phố Thủ Đức" nếu ward không thuộc Thủ Đức
      if (/thành phố thủ đức/i.test(a.city)) {
        const coordLat3 = lat ?? parseFloat(data.lat);
        const coordLng3 = lng ?? parseFloat(data.lon);
        if (ward && isActuallyThuDuc(ward, coordLat3, coordLng3)) {
          district = a.city;
        }
      } else {
        district = a.city;
      }
    }

    // --- STREET ADDRESS ---
    let streetAddress = [a.house_number, a.road || a.pedestrian || a.path].filter(Boolean).join(' ');

    // Nếu chỉ có số nhà mà không có tên đường, thử ghép từ display_name
    if (a.house_number && !(a.road || a.pedestrian || a.path) && displayParts.length >= 2) {
      const secondPart = displayParts[1];
      if (secondPart && !/^(phường|xã|quận|huyện|thành phố|tỉnh|khu phố|thị trấn|thị xã|ấp|khóm|việt nam)/i.test(secondPart) && !/^\d{5,6}$/.test(secondPart)) {
        streetAddress = `${a.house_number} ${secondPart}`;
      }
    }

    // Nếu có đường nhưng không có số nhà, thử lấy số nhà từ display_name
    if (a.road && !a.house_number && displayParts.length >= 1) {
      const firstPart = displayParts[0];
      if (firstPart && /^\d/.test(firstPart) && firstPart !== a.road) {
        streetAddress = `${firstPart} ${a.road}`;
      }
    }

    if (!streetAddress) {
      streetAddress = displayParts[0] || '';
    }

    console.log('[Nominatim raw]', data.address);
    console.log('[Parsed]', { city, district, ward, streetAddress, isoCode });

    return { ward, district, city, streetAddress, displayName: data.display_name || '' };
  };

  const handleMapClick = async (latlng) => {
    const { lat, lng } = latlng;
    setPendingPosition([lat, lng]);
    setPendingShipping(calcShippingByDistance(lat, lng));
    setPendingAddressData(null);
    setIsGeocoding(true);
    try {
      // Stage 1: zoom=18 — lấy chi tiết đường/số nhà/phường
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=vi&zoom=18&addressdetails=1`
      );
      const data = await res.json();
      if (data.address) {
        const parsed = parseVietnamAddress(data, lat, lng);

        // Stage 2: Nếu quận/huyện vẫn trống (thường xảy ra ở HCM vì Nominatim
        // không trả city_district ở zoom cao), thử lại ở zoom=14 (cấp quận)
        if (!parsed.district) {
          try {
            const res2 = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=vi&zoom=14&addressdetails=1`
            );
            const data2 = await res2.json();
            if (data2.address) {
              const a2 = data2.address;
              // Trực tiếp lấy district từ raw data ở zoom thấp (đáng tin hơn)
              const rawDistrict = a2.city_district || a2.district || a2.county || '';
              if (rawDistrict) {
                parsed.district = rawDistrict;
              } else {
                // Fallback: field city ở zoom=14 thường là cấp quận cho HCM
                // VD: city = "Thành phố Thủ Đức", "Quận Bình Thạnh"
                const cityVal = a2.city || '';
                if (cityVal && /^(quận|huyện|thành phố)\s/i.test(cityVal)) {
                  // Nếu là city cấp tỉnh (5 TP trực thuộc TW) thì bỏ qua
                  const centralNames = ['thành phố hồ chí minh', 'thành phố hà nội', 'thành phố đà nẵng', 'thành phố hải phòng', 'thành phố cần thơ'];
                  if (!centralNames.includes(cityVal.toLowerCase())) {
                    parsed.district = cityVal;
                  }
                }
              }

              // Bổ sung ward nếu stage 1 cũng thiếu
              if (!parsed.ward) {
                const parsed2 = parseVietnamAddress(data2, lat, lng);
                if (parsed2.ward) {
                  parsed.ward = parsed2.ward;
                }
              }
            }
          } catch (e) {
            console.error('District fallback geocoding error:', e);
          }
        }

        setPendingAddressData(parsed);
      }
    } catch (err) {
      console.error('Geocoding error:', err);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSearchAddress = useCallback(async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setIsSearching(true);
    setSearchResults([]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&accept-language=vi&countrycodes=vn`
      );
      const data = await res.json();
      setSearchResults(data || []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleSelectSearchResult = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setFlyTarget({ lat, lng });
    setSearchResults([]);
    // Loại bỏ "Thành phố Thủ Đức" (boundary sai của OSM) khỏi text hiển thị
    const bogusBoundaries = ['thành phố thủ đức'];
    const parts = (result.display_name || '').split(',').map(s => s.trim());
    const cleanParts = parts.filter(p => !bogusBoundaries.includes(p.toLowerCase()));
    setSearchQuery(cleanParts.slice(0, 2).join(', '));
    // Auto reverse-geocode vị trí → hiển thị preview địa chỉ ngay
    handleMapClick({ lat, lng });
  };

  const handleConfirmAddress = async () => {
    if (!pendingPosition || !pendingAddressData) return;
    const { ward, district, city, streetAddress } = pendingAddressData;
    setValue('shippingAddress', streetAddress, { shouldValidate: true });

    // Auto-select cascading dropdowns từ parsed address
    try {
      if (city) {
        const pCode = await findProvinceCode(city);
        if (pCode) {
          setSelectedProvinceCode(pCode);
          setValue('shippingCity', city, { shouldValidate: true });
          if (district) {
            // Đợi districts load xong rồi mới select
            const dists = await getDistricts(pCode);
            setDistrictsList(dists);
            const dCode = await findDistrictCode(pCode, district);
            if (dCode) {
              setSelectedDistrictCode(dCode);
              setValue('shippingDistrict', district, { shouldValidate: true });
              if (ward) {
                const wds = await getWards(dCode);
                setWardsList(wds);
                // Tìm ward khớp tên trong danh sách
                const normalize = (s) => s.toLowerCase().replace(/^(phường|xã|thị trấn)\s+/i, '').trim();
                const matched = wds.find(w => normalize(w.name) === normalize(ward));
                if (matched) {
                  setValue('shippingWard', matched.name, { shouldValidate: true });
                } else {
                  setValue('shippingWard', ward, { shouldValidate: true });
                }
              }
            } else {
              setValue('shippingDistrict', district, { shouldValidate: true });
              setValue('shippingWard', ward, { shouldValidate: true });
            }
          }
        } else {
          // Fallback: set text values nếu không tìm được code
          setValue('shippingCity', city, { shouldValidate: true });
          setValue('shippingDistrict', district, { shouldValidate: true });
          setValue('shippingWard', ward, { shouldValidate: true });
        }
      }
    } catch (err) {
      console.error('Auto-select dropdown error:', err);
      // Fallback: set text values
      setValue('shippingCity', city, { shouldValidate: true });
      setValue('shippingDistrict', district, { shouldValidate: true });
      setValue('shippingWard', ward, { shouldValidate: true });
    }

    setSelectedPosition(pendingPosition);
    setMapShipping(pendingShipping);
    setPendingPosition(null);
    setPendingAddressData(null);
    setPendingShipping(null);
    toast.success('Đã xác nhận vị trí giao hàng! 📍');
  };

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: (orderData) => orderService.createOrder(orderData),
    onSuccess: (data) => {
      toast.success('Đặt hàng thành công!');
      navigate(`/orders/${data.orderId}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Đặt hàng thất bại');
    },
  });

  const onSubmit = async (data) => {
    if (!cart || cart.items?.length === 0) {
      toast.error('Giỏ hàng trống');
      return;
    }

    const orderData = {
      ...data,
      paymentMethod: paymentMethod,
      voucherCode: appliedVoucher?.code || null,
      latitude: selectedPosition?.[0] || null,
      longitude: selectedPosition?.[1] || null,
    };

    createOrderMutation.mutate(orderData);
  };

  if (isLoading) return <LoadingSpinner fullScreen />;

  if (!cart || cart.items?.length === 0) {
    navigate('/cart');
    return null;
  }

  const items = cart.items || [];
  const subtotal = cart.totalAmount || items.reduce((sum, item) => sum + (item.subtotal || item.price * item.quantity), 0);
  const shippingFee = (addressMode === 'map' && mapShipping) ? mapShipping.fee : 30000;
  
  const discountAmount = (() => {
    if (!appliedVoucher) return 0;
    if (appliedVoucher.voucherType === 'PERCENTAGE') {
      const pct = (subtotal * (appliedVoucher.discountPercentage || 0)) / 100;
      return appliedVoucher.maxDiscountAmount ? Math.min(pct, Number(appliedVoucher.maxDiscountAmount)) : pct;
    }
    if (appliedVoucher.voucherType === 'FIXED_AMOUNT') {
      return Math.min(Number(appliedVoucher.discountValue || 0), subtotal);
    }
    if (appliedVoucher.voucherType === 'FREE_SHIPPING') {
      return shippingFee;
    }
    return 0;
  })();
  
  const total = subtotal + shippingFee - discountAmount;

  return (
    <div className="bg-[#fcfdfd] min-h-screen pt-24 pb-20 relative overflow-hidden">
      {/* Decorative Blobs - Match HomePage Hero but subtler */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-5%] right-[-5%] w-[40vw] h-[40vw] bg-orange-100/30 rounded-full blur-[100px] opacity-40"></div>
        <div className="absolute bottom-[-5%] left-[-5%] w-[35vw] h-[35vw] bg-blue-50/40 rounded-full blur-[80px] opacity-30"></div>
        
        {/* Subtle Decorative Outlines */}
        <div className="absolute top-[20%] left-[5%] opacity-[0.03] rotate-12">
          <Dog size={200} />
        </div>
        <div className="absolute bottom-[20%] right-[3%] opacity-[0.03] -rotate-12">
          <Cat size={180} />
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Modern Breadcrumb with Progress Steps */}
        <div className="max-w-7xl mx-auto mb-12">
          <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-8 overflow-x-auto whitespace-nowrap pb-2 no-scrollbar">
            <Link to="/" className="hover:text-orange-500 transition-colors">TRANG CHỦ</Link>
            <ChevronRight size={12} className="shrink-0" />
            <Link to="/cart" className="hover:text-orange-500 transition-colors">GIỎ HÀNG</Link>
            <ChevronRight size={12} className="shrink-0" />
            <span className="text-orange-600">THANH TOÁN</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-6">
            <div className="animate-in fade-in slide-in-from-left-8 duration-700">
            <h1 className="text-5xl md:text-6xl font-black text-gray-900 tracking-tighter uppercase mb-3 leading-none [text-wrap:balance]">
              XÁC NHẬN <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-400 relative inline-block">
                ĐƠN HÀNG
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 358 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                   <path d="M3 9C118.957 4.47226 235.163 3.52085 355 3" stroke="#F4A261" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
            <div className="flex items-center gap-6 mt-4">
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em] flex items-center gap-2">
                <ShieldCheck size={14} className="text-green-500" />
                Giao dịch bảo mật 256-bit
              </p>
              <div className="h-4 w-[1px] bg-gray-200 hidden md:block"></div>
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em] flex items-center gap-2 hidden md:flex">
                <Clock size={14} className="text-blue-500" />
                Xử lý trong vòng 2h
              </p>
            </div>
            </div>
            
            <Link to="/cart" className="flex items-center gap-2 text-gray-400 hover:text-orange-500 font-black text-[10px] uppercase tracking-widest transition-all hover:-translate-x-1 group">
               <ArrowLeft size={16} className="group-hover:translate-x-[-2px] transition-transform" /> 
               Quay lại giỏ hàng
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Column - Forms */}
            <div className="lg:col-span-8 space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-100">
              
              {/* Shipping Section */}
              <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/50 p-8 md:p-12 border border-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-48 h-48 bg-orange-50/50 rounded-bl-full opacity-30 -mr-24 -mt-24 group-hover:scale-110 transition-transform duration-1000" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 bg-orange-600 text-white rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-orange-200">
                      <MapPin size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">THÔNG TIN GIAO HÀNG</h2>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Vui lòng cung cấp địa chỉ chính xác 🐾</p>
                    </div>
                  </div>

                  {/* Address Mode Tabs */}
                  <div className="flex gap-3 mb-8">
                    <button type="button" onClick={() => { setAddressMode('manual'); setSelectedPosition(null); setMapShipping(null); }}
                      className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${addressMode === 'manual' ? 'bg-orange-600 text-white shadow-lg shadow-orange-200' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>
                      ✏️ NHẬP THỦ CÔNG
                    </button>
                    <button type="button" onClick={() => setAddressMode('map')}
                      className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${addressMode === 'map' ? 'bg-orange-600 text-white shadow-lg shadow-orange-200' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>
                      🗺️ CHỌN TRÊN BẢN ĐỒ
                    </button>
                  </div>

                  {/* Map Picker */}
                  {addressMode === 'map' && (
                    <div className="mb-8 space-y-3">
                      {/* Search bar */}
                      <div className="relative" ref={searchRef}>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400 pointer-events-none" />
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSearchAddress()}
                              placeholder="Tìm kiếm địa chỉ trên bản đồ..."
                              className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border-2 border-orange-100 rounded-2xl focus:outline-none focus:border-orange-300 font-bold text-sm text-gray-800 placeholder:text-gray-300 transition-all"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleSearchAddress}
                            disabled={isSearching || !searchQuery.trim()}
                            className="px-5 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-wider transition-all shadow-lg shadow-orange-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                          >
                            {isSearching ? '...' : 'TÌM'}
                          </button>
                        </div>
                        {/* Search results dropdown */}
                        {searchResults.length > 0 && (
                          <div className="absolute top-full left-0 right-0 z-[9999] mt-1 bg-white rounded-2xl shadow-2xl border border-orange-100 overflow-hidden">
                            {searchResults.map((r, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => handleSelectSearchResult(r)}
                                className="w-full text-left px-5 py-3.5 hover:bg-orange-50 transition-colors border-b border-gray-50 last:border-0 flex items-start gap-3 group"
                              >
                                <MapPin size={14} className="mt-0.5 text-orange-400 shrink-0 group-hover:text-orange-600" />
                                <span className="text-[12px] font-bold text-gray-700 line-clamp-2 leading-snug group-hover:text-gray-900">
                                  {r.display_name}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Map */}
                      <div className="rounded-[2rem] overflow-hidden border-2 border-orange-100 shadow-lg" style={{ height: '380px' }}>
                        <MapContainer center={[SHOP_LAT, SHOP_LNG]} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          <Marker position={[SHOP_LAT, SHOP_LNG]} icon={shopIcon}>
                            <Popup>🏪 PawVerse Shop</Popup>
                          </Marker>
                          {selectedPosition && (
                            <Marker position={selectedPosition} icon={confirmedIcon}>
                              <Popup>✅ Vị trí đã xác nhận</Popup>
                            </Marker>
                          )}
                          {pendingPosition && (
                            <Marker position={pendingPosition} icon={pendingIcon}>
                              <Popup>📍 Vị trí đang chọn</Popup>
                            </Marker>
                          )}
                          <MapClickHandler onClick={handleMapClick} />
                          <FlyToLocation target={flyTarget} />
                        </MapContainer>
                      </div>

                      {/* Hint */}
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">
                        👆 Click vào bản đồ để chọn vị trí giao hàng
                      </p>

                      {/* Address preview bar + Confirm button */}
                      {(pendingPosition || isGeocoding) && (
                        <div className="bg-white border-2 border-blue-100 rounded-2xl p-4 shadow-lg">
                          {isGeocoding ? (
                            <p className="text-[11px] font-black text-blue-500 uppercase tracking-widest animate-pulse flex items-center gap-2">
                              <MapPin size={14} className="animate-bounce" /> Đang xác định địa chỉ...
                            </p>
                          ) : pendingAddressData ? (
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-1.5">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Địa chỉ đã chọn</p>
                                <p className="text-[13px] font-bold text-gray-800 leading-snug line-clamp-2">
                                  {pendingAddressData.streetAddress}
                                </p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {pendingAddressData.ward && (
                                    <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                      {pendingAddressData.ward}
                                    </span>
                                  )}
                                  {pendingAddressData.district && (
                                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                      {pendingAddressData.district}
                                    </span>
                                  )}
                                  {pendingAddressData.city && (
                                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                      {pendingAddressData.city}
                                    </span>
                                  )}
                                  {pendingShipping && (
                                    <span className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                      📍 {pendingShipping.distance.toFixed(1)}km · {pendingShipping.fee === 0 ? 'MIỄN PHÍ SHIP' : formatPrice(pendingShipping.fee)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={handleConfirmAddress}
                                className="shrink-0 px-5 py-3 bg-gradient-to-r from-orange-600 to-orange-400 text-white rounded-2xl font-black text-[11px] uppercase tracking-wider shadow-lg shadow-orange-200 hover:shadow-orange-300 active:scale-95 transition-all flex items-center gap-2"
                              >
                                <CheckCircle size={16} /> XÁC NHẬN
                              </button>
                            </div>
                          ) : null}
                        </div>
                      )}

                      {/* Confirmed info */}
                      {selectedPosition && mapShipping && !pendingPosition && (
                        <div className="flex items-center gap-3 ml-2">
                          <span className="px-4 py-2 bg-green-50 text-green-600 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                            ✅ Vị trí đã xác nhận · {mapShipping.distance.toFixed(1)} km
                          </span>
                          <span className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider ${mapShipping.fee === 0 ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                            🚚 {mapShipping.fee === 0 ? 'MIỄN PHÍ SHIP' : formatPrice(mapShipping.fee)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Input Group Template */}
                    <div className="space-y-2">
                      <label htmlFor="fullName" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 flex items-center gap-2 cursor-pointer">
                        <User size={12} /> HỌ VÀ TÊN *
                      </label>
                      <input
                        {...register('fullName')}
                        id="fullName"
                        autoComplete="name"
                        placeholder="Nguyễn Văn A…"
                        className={`w-full px-8 py-5 bg-gray-50/50 border-2 rounded-[1.5rem] focus:outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300 ${errors.fullName ? 'border-red-100 bg-red-50 focus:border-red-200' : 'border-transparent focus:border-orange-200 focus:bg-white focus:shadow-xl focus:shadow-orange-100/30'}`}
                      />
                      {errors.fullName && <p className="text-[10px] text-red-500 font-black ml-4 uppercase tracking-wider">{errors.fullName.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="phone" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 flex items-center gap-2 cursor-pointer">
                        <Phone size={12} /> SỐ ĐIỆN THOẠI *
                      </label>
                      <input
                        {...register('phone')}
                        id="phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="09xx xxx xxx…"
                        className={`w-full px-8 py-5 bg-gray-50/50 border-2 rounded-[1.5rem] focus:outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300 tabular-nums ${errors.phone ? 'border-red-100 bg-red-50 focus:border-red-200' : 'border-transparent focus:border-orange-200 focus:bg-white focus:shadow-xl focus:shadow-orange-100/30'}`}
                      />
                      {errors.phone && <p className="text-[10px] text-red-500 font-black ml-4 uppercase tracking-wider">{errors.phone.message}</p>}
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label htmlFor="email" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 flex items-center gap-2 cursor-pointer">
                        <Mail size={12} /> EMAIL NHẬN THÔNG BÁO *
                      </label>
                      <input
                        {...register('email')}
                        id="email"
                        type="email"
                        autoComplete="email"
                        spellCheck={false}
                        placeholder="van.a@example.com…"
                        className={`w-full px-8 py-5 bg-gray-50/50 border-2 rounded-[1.5rem] focus:outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300 ${errors.email ? 'border-red-100 bg-red-50 focus:border-red-200' : 'border-transparent focus:border-orange-200 focus:bg-white focus:shadow-xl focus:shadow-orange-100/30'}`}
                      />
                      {errors.email && <p className="text-[10px] text-red-500 font-black ml-4 uppercase tracking-wider">{errors.email.message}</p>}
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label htmlFor="shippingAddress" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 flex items-center gap-2 cursor-pointer">
                        <Truck size={12} /> ĐỊA CHỈ CHI TIẾT ĐỂ NHẬN HÀNG *
                      </label>
                      <input
                        {...register('shippingAddress')}
                        id="shippingAddress"
                        autoComplete="shipping address-line1"
                        placeholder="Số nhà, tên đường, khu vực……"
                        className={`w-full px-8 py-5 bg-gray-50/50 border-2 rounded-[1.5rem] focus:outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300 ${errors.shippingAddress ? 'border-red-100 bg-red-50 focus:border-red-200' : 'border-transparent focus:border-orange-200 focus:bg-white focus:shadow-xl focus:shadow-orange-100/30'}`}
                      />
                      {errors.shippingAddress && <p className="text-[10px] text-red-500 font-black ml-4 uppercase tracking-wider">{errors.shippingAddress.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:col-span-2">
                      {/* Tỉnh/Thành — dropdown đầu tiên */}
                      <div className="space-y-2">
                        <label htmlFor="shippingCity" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 cursor-pointer">TỈNH/THÀNH *</label>
                        {addressApiError ? (
                          <input
                            {...register('shippingCity')}
                            id="shippingCity"
                            placeholder="Nhập tỉnh/thành…"
                            className={`w-full px-6 py-4 bg-gray-50/50 border-2 rounded-[1.25rem] focus:outline-none transition-all font-bold text-gray-800 ${errors.shippingCity ? 'border-red-100 bg-red-50' : 'border-transparent focus:border-orange-200 focus:bg-white'}`}
                          />
                        ) : (
                          <select
                            id="shippingCity"
                            value={selectedProvinceCode}
                            onChange={(e) => {
                              const code = e.target.value;
                              setSelectedProvinceCode(code);
                              const prov = provincesList.find(p => String(p.code) === code);
                              setValue('shippingCity', prov ? prov.name : '', { shouldValidate: true });
                              setValue('shippingDistrict', '');
                              setValue('shippingWard', '');
                            }}
                            className={`w-full px-6 py-4 bg-gray-50/50 border-2 rounded-[1.25rem] focus:outline-none transition-all font-bold text-gray-800 ${errors.shippingCity ? 'border-red-100 bg-red-50' : 'border-transparent focus:border-orange-200 focus:bg-white'}`}
                          >
                            <option value="">-- Chọn Tỉnh/Thành --</option>
                            {provincesList.map(p => (
                              <option key={p.code} value={p.code}>{p.name}</option>
                            ))}
                          </select>
                        )}
                        <input type="hidden" {...register('shippingCity')} />
                      </div>

                      {/* Quận/Huyện — load theo tỉnh/thành */}
                      <div className="space-y-2">
                        <label htmlFor="shippingDistrict" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 cursor-pointer">QUẬN/HUYỆN *</label>
                        {addressApiError ? (
                          <input
                            {...register('shippingDistrict')}
                            id="shippingDistrict"
                            placeholder="Nhập quận/huyện…"
                            className={`w-full px-6 py-4 bg-gray-50/50 border-2 rounded-[1.25rem] focus:outline-none transition-all font-bold text-gray-800 ${errors.shippingDistrict ? 'border-red-100 bg-red-50' : 'border-transparent focus:border-orange-200 focus:bg-white'}`}
                          />
                        ) : (
                          <select
                            id="shippingDistrict"
                            value={selectedDistrictCode}
                            onChange={(e) => {
                              const code = e.target.value;
                              setSelectedDistrictCode(code);
                              const dist = districtsList.find(d => String(d.code) === code);
                              setValue('shippingDistrict', dist ? dist.name : '', { shouldValidate: true });
                              setValue('shippingWard', '');
                            }}
                            disabled={!selectedProvinceCode}
                            className={`w-full px-6 py-4 bg-gray-50/50 border-2 rounded-[1.25rem] focus:outline-none transition-all font-bold text-gray-800 ${!selectedProvinceCode ? 'opacity-50 cursor-not-allowed' : ''} ${errors.shippingDistrict ? 'border-red-100 bg-red-50' : 'border-transparent focus:border-orange-200 focus:bg-white'}`}
                          >
                            <option value="">-- Chọn Quận/Huyện --</option>
                            {districtsList.map(d => (
                              <option key={d.code} value={d.code}>{d.name}</option>
                            ))}
                          </select>
                        )}
                        <input type="hidden" {...register('shippingDistrict')} />
                      </div>

                      {/* Phường/Xã — load theo quận/huyện */}
                      <div className="space-y-2">
                        <label htmlFor="shippingWard" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 cursor-pointer">PHƯỜNG/XÃ</label>
                        {addressApiError ? (
                          <input
                            {...register('shippingWard')}
                            id="shippingWard"
                            placeholder="Nhập phường/xã…"
                            className="w-full px-6 py-4 bg-gray-50/50 border-2 border-transparent rounded-[1.25rem] focus:outline-none transition-all font-bold text-gray-800 focus:border-orange-200 focus:bg-white"
                          />
                        ) : (
                          <select
                            id="shippingWard"
                            onChange={(e) => {
                              const wardName = e.target.value;
                              setValue('shippingWard', wardName, { shouldValidate: true });
                            }}
                            disabled={!selectedDistrictCode}
                            className={`w-full px-6 py-4 bg-gray-50/50 border-2 border-transparent rounded-[1.25rem] focus:outline-none transition-all font-bold text-gray-800 ${!selectedDistrictCode ? 'opacity-50 cursor-not-allowed' : ''} focus:border-orange-200 focus:bg-white`}
                          >
                            <option value="">-- Chọn Phường/Xã --</option>
                            {wardsList.map(w => (
                              <option key={w.code} value={w.name}>{w.name}</option>
                            ))}
                          </select>
                        )}
                        <input type="hidden" {...register('shippingWard')} />
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">GHI CHÚ ĐƠN HÀNG</label>
                       <textarea
                         {...register('note')}
                         rows={3}
                         placeholder="Lời nhắn cho shipper hoặc về sản phẩm..."
                         className="w-full px-8 py-5 bg-gray-50/50 border-2 border-transparent rounded-[2rem] focus:outline-none transition-all font-bold text-gray-900 focus:border-orange-200 focus:bg-white resize-none"
                       />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Section */}
              <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/50 p-8 md:p-12 border border-white relative overflow-hidden group">
                 <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-blue-200">
                      <CreditCard size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">PHƯƠNG THỨC THANH TOÁN</h2>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Mọi thông tin đều được mã hóa 🔒</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* COD Option */}
                    <label className={`relative flex flex-col items-center justify-center p-8 border-2 rounded-[2rem] cursor-pointer transition-all duration-300 ${paymentMethod === 'COD' ? 'border-orange-600 bg-orange-50/50 ring-4 ring-orange-50' : 'border-gray-50 bg-gray-50/50 hover:bg-gray-100/50'}`}>
                      <input
                        type="radio"
                        name="payment"
                        value="COD"
                        checked={paymentMethod === 'COD'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="hidden"
                      />
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-all duration-500 ${paymentMethod === 'COD' ? 'bg-orange-600 text-white shadow-lg' : 'bg-white text-gray-400 shadow-sm'}`}>
                        <Wallet size={26} />
                      </div>
                      <span className="font-black text-[11px] uppercase tracking-wider text-gray-900 mb-1 leading-none">TIỀN MẶT</span>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">KHI NHẬN HÀNG</span>
                      {paymentMethod === 'COD' && (
                        <div className="absolute top-4 right-4 text-orange-600">
                          <CheckCircle size={18} />
                        </div>
                      )}
                    </label>

                    {/* VNPAY (Soon) */}
                    <div className="relative flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-100 bg-gray-50/30 rounded-[2rem] opacity-60 cursor-not-allowed group">
                      <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-4 text-gray-200">
                        <CreditCard size={26} />
                      </div>
                      <span className="font-black text-[11px] uppercase tracking-wider text-gray-400 mb-1 leading-none">VNPAY QR</span>
                      <span className="px-2 py-0.5 bg-gray-200 text-white text-[8px] font-black uppercase rounded-full">Sắp có</span>
                      <ShieldAlert className="absolute top-4 right-4 text-gray-200" size={18} />
                    </div>

                    {/* MOMO (Soon) */}
                    <div className="relative flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-100 bg-gray-50/30 rounded-[2rem] opacity-60 cursor-not-allowed group">
                      <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-4 font-black text-gray-200 text-2xl italic leading-none">
                        M
                      </div>
                      <span className="font-black text-[11px] uppercase tracking-wider text-gray-400 mb-1 leading-none">VÍ MOMO</span>
                      <span className="px-2 py-0.5 bg-gray-200 text-white text-[8px] font-black uppercase rounded-full">Sắp có</span>
                    </div>
                  </div>
              </div>
            </div>

            {/* Right Column - Order Summary - Premium Receipt Style */}
            <div className="lg:col-span-4 self-start sticky top-32 animate-in fade-in slide-in-from-right-10 duration-700 delay-200">
              <div className="bg-gray-900 rounded-[3rem] shadow-2xl p-8 md:p-10 text-white relative overflow-hidden group">
                {/* Decorative Elements */}
                <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-orange-500/10 rounded-full blur-[60px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-48 h-48 bg-blue-500/5 rounded-full blur-[50px]" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-10 border-b border-white/10 pb-8">
                     <div className="bg-orange-600 p-2 rounded-xl shadow-lg shadow-orange-600/20">
                       <ShoppingBag size={24} className="text-white" />
                     </div>
                     <h2 className="text-2xl font-black tracking-tighter uppercase italic leading-none">ĐƠN HÀNG CỦA BẠN</h2>
                  </div>

                  {/* List Items */}
                  <div className="space-y-6 mb-10 max-h-[380px] overflow-y-auto pr-3 custom-scrollbar">
                    {items.map((item) => (
                      <div key={item.cartItemId} className="flex gap-4 group/item">
                        <div className="w-16 h-16 shrink-0 rounded-2xl bg-white/5 p-1 border border-white/10 overflow-hidden relative group-hover/item:border-orange-500/50 transition-colors">
                           <img 
                            src={item.productImage || '/placeholder-product.jpg'} 
                            alt={item.productName} 
                            width={64}
                            height={64}
                            loading="lazy"
                            className="w-full h-full object-cover rounded-xl group-hover/item:scale-110 transition-transform duration-500" 
                           />
                           <div className="absolute -bottom-1 -right-1 bg-orange-600 text-[10px] font-black px-1.5 py-0.5 rounded-lg border border-gray-900 shadow-md tabular-nums">
                             x{item.quantity}
                           </div>
                        </div>
                        <div className="flex-1 min-w-0 py-1">
                          <p className="text-[11px] font-black uppercase tracking-tight text-white/90 line-clamp-2 leading-snug mb-1 group-hover/item:text-orange-400 transition-colors">
                            {item.productName}
                          </p>
                          <span className="text-sm font-black text-orange-500 tabular-nums">
                            {formatPrice(item.subtotal || item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-4 mb-10 pt-4">
                    <div className="flex justify-between items-center text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                       <span>TẠM TÍNH</span>
                       <span className="text-white text-base font-black tabular-nums">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                       <span className="flex items-center gap-2">
                         <Truck size={14} /> GIAO HÀNG
                         {mapShipping && <span className="text-orange-400 ml-1">({mapShipping.distance.toFixed(1)}km)</span>}
                       </span>
                       <span className={`text-base font-black tabular-nums ${shippingFee === 0 ? 'text-green-400' : 'text-white'}`}>
                         {shippingFee === 0 ? 'MIỄN PHÍ' : formatPrice(shippingFee)}
                       </span>
                    </div>

                    {/* Discount Code Input Section */}
                    <div className="pt-6 pb-2">
                       <div className="flex flex-col gap-3">
                         <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                            <Ticket size={12} className="text-orange-500" /> MÃ GIẢM GIÁ / ƯU ĐÃI
                         </label>
                         <div className="relative group">
                           <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                              <Tag size={14} className={`transition-colors duration-300 ${appliedVoucher ? 'text-orange-500' : 'text-white/20 group-focus-within:text-orange-400'}`} />
                           </div>
                           <input 
                             type="text"
                             value={appliedVoucher ? appliedVoucher.code : voucherInput}
                             onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                             disabled={!!appliedVoucher || applyVoucherMutation.isPending}
                             placeholder="NHẬP MÃ TẠI ĐÂY…"
                             className={`w-full pl-14 pr-24 py-5 bg-white/5 border-2 rounded-[1.5rem] focus:outline-none transition-all font-black text-sm tracking-widest placeholder:text-white/10 ${appliedVoucher ? 'border-orange-500/50 text-orange-400 bg-orange-500/5' : 'border-white/5 focus:border-orange-500/30 focus:bg-white/10'}`}
                           />
                           
                           {appliedVoucher ? (
                             <button
                               type="button"
                               onClick={() => {
                                 setAppliedVoucher(null);
                                 setVoucherInput('');
                               }}
                               className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-rose-500 hover:text-white text-white/40 px-4 py-2 rounded-xl text-[10px] font-black transition-all active:scale-95 uppercase tracking-widest"
                             >
                               HỦY
                             </button>
                           ) : (
                             <button
                               type="button"
                               onClick={() => applyVoucherMutation.mutate(voucherInput)}
                               disabled={!voucherInput || applyVoucherMutation.isPending}
                               className="absolute right-3 top-1/2 -translate-y-1/2 bg-orange-600 hover:bg-orange-500 text-white px-5 py-2.5 rounded-xl text-[10px] font-black transition-all active:scale-95 shadow-lg shadow-orange-950/20 disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-widest group-hover:shadow-orange-600/20"
                             >
                               {applyVoucherMutation.isPending ? '…' : 'ÁP DỤNG'}
                             </button>
                           )}
                         </div>
                         {appliedVoucher && (
                           <div className="flex items-center gap-2 ml-4 animate-in slide-in-from-top-2">
                             <Zap size={10} className="text-orange-500 animate-pulse" />
                             <span className="text-[9px] font-black text-orange-500/80 uppercase tracking-widest">
                               ĐƯỢC GIẢM SIÊU CẤP TỪ PAWVERSE
                             </span>
                           </div>
                         )}
                       </div>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between items-center text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] animate-in slide-in-from-left-4">
                         <span className="flex items-center gap-2 font-black italic">GIẢM GIÁ ƯU ĐÃI</span>
                         <span className="text-base font-black tabular-nums">-{formatPrice(discountAmount)}</span>
                      </div>
                    )}
                    
                    <div className="pt-8 border-t border-white/10 flex flex-col gap-2">
                       <div className="flex justify-between items-end">
                          <div className="flex flex-col">
                             <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-2 leading-none">TỔNG THANH TOÁN</span>
                             <span className="text-4xl md:text-5xl font-black text-orange-600 tracking-tighter italic leading-none tabular-nums">
                               {formatPrice(total)}
                             </span>
                          </div>
                          <PawPrint className="w-12 h-12 text-white/10 rotate-12 mb-1" />
                       </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={createOrderMutation.isPending}
                    className="w-full py-6 bg-gradient-to-r from-orange-600 to-orange-400 text-white rounded-[2rem] font-black text-lg uppercase tracking-[0.2em] shadow-[0_20px_40px_-10px_rgba(234,88,12,0.6)] hover:shadow-[0_25px_50px_-10px_rgba(234,88,12,0.8)] hover:-translate-y-1 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 -skew-x-12" />
                    {createOrderMutation.isPending ? (
                      <><LoadingSpinner size="sm" color="white" /> <span>ĐANG KHỞI TẠO…</span></>
                    ) : (
                      <><CheckCircle size={24} className="group-hover:rotate-12 transition-transform" /> <span>ĐẶT HÀNG NGAY</span></>
                    )}
                  </button>

                  <div className="mt-10 grid grid-cols-3 gap-3 border-t border-white/5 pt-8">
                     <div className="flex flex-col items-center gap-2 text-center group/badge">
                        <div className="p-2 bg-white/5 rounded-xl group-hover/badge:bg-white/10 transition-colors">
                           <ShieldCheck size={18} className="text-white/40" />
                        </div>
                        <span className="text-[7px] font-black text-white/30 uppercase tracking-widest">BẢO MẬT</span>
                     </div>
                     <div className="flex flex-col items-center gap-2 text-center group/badge">
                        <div className="p-2 bg-white/5 rounded-xl group-hover/badge:bg-white/10 transition-colors">
                           <Truck size={18} className="text-white/40" />
                        </div>
                        <span className="text-[7px] font-black text-white/30 uppercase tracking-widest">GIAO NHANH</span>
                     </div>
                     <div className="flex flex-col items-center gap-2 text-center group/badge">
                        <div className="p-2 bg-white/5 rounded-xl group-hover/badge:bg-white/10 transition-colors">
                           <Clock size={18} className="text-white/40" />
                        </div>
                        <span className="text-[7px] font-black text-white/30 uppercase tracking-widest">24/7 SUPPORT</span>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
