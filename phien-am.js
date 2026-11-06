/* ===================================================================
   PHIEN-AM.JS - So khớp từ tiếng Việt theo PHÁT ÂM (chịu sai giọng vùng miền / lỗi máy nghe)
   Dùng chung cho Trả bài (giọng nói) và Học thuộc (gõ chính tả).
   File này tự đủ, KHÔNG phụ thuộc file khác; nạp nó TRƯỚC script.js.

   Cách làm: mỗi từ được đưa về "khóa phát âm" (bỏ dấu thanh, gộp các cặp âm hay nhầm),
   hai từ có cùng khóa (hoặc khóa chỉ lệch 1 ký tự) thì coi là khớp.
   =================================================================== */

/* ---------- Cấu hình: đặt false để tắt từng nhóm cho nghiêm hơn ---------- */
const PHIEN_AM = {
    trCh: true,    // tr ≈ ch            trời ~ chời
    sX: true,      // s ≈ x              sáng ~ xáng
    dGiRV: true,   // d ≈ gi ≈ r ≈ v     dậy ~ giậy ~ rậy ~ vậy,  dễ ~ giễ
    nL: true,      // n ≈ l              nên ~ lên
    kCQ: true,     // c ≈ k ≈ q(u)       cá ~ ká,  quê ~ cuê
    ghG: true,     // gh ≈ g, ngh ≈ ng   ghi ~ gi,  nghe ~ nge
    phF: true,     // ph ≈ f             phước ~ fước
    cuoiCT: true,  // -c ≈ -ch ≈ -t      các ~ cát ~ cách
    cuoiN: true,   // -n ≈ -ng ≈ -nh     dân ~ dâng ~ dânh,  anh ~ ăn
    songAm: true,  // iê/uô/ươ rút gọn trước -n/-c   tiên ~ tin,  được ~ đức
    eI: true,      // ê ≈ i trước -n/-c  tênh ~ tinh,  ếch ~ ích
    oU: true,      // ô/o ≈ u trước -n/-c   ông ~ ung,  cộc ~ cục
    chiuLechNguyenAm: true,    // chịu sai đúng 1 nguyên âm (cùng độ dài)   dân ~ dưng, dâng ~ dưng
    doDaiToiThieuChoLech: 3    // chỉ áp dụng khi khóa dài từ bấy nhiêu ký tự (tăng lên 4 cho nghiêm hơn)
};

/* Từ máy hay nghe ra cách khác hẳn (khóa = từ mẫu đã bỏ dấu; giá trị = các cách nghe ra, đã bỏ dấu).
   Gặp từ nào bị báo sai oan thì thêm vào đây. */
const PHIEN_AM_TU_DAC_BIET = {
    christ: ['crit', 'cris', 'crist', 'cristo', 'kito', 'kit', 'chris', 'crits'],
    jesus: ['giesu', 'jesu', 'giesus', 'giesut', 'jesut']
};

/** Bỏ dấu thanh + dấu mũ/móc, đ -> d, chữ thường, bỏ ký tự khác chữ/số. Ví dụ "Trời," -> "troi". */
function boDauAm(s) {
    return String(s).toLowerCase().normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]/g, '');
}

/** Đưa một từ (đã bỏ dấu) về "khóa phát âm": gộp phụ âm đầu, âm cuối và vài nguyên âm hay nhầm. */
function khoaAm(base) {
    const C = PHIEN_AM;
    let s = base.replace(/y/g, 'i'); // y ≈ i

    /* --- Phụ âm đầu --- */
    if (C.dGiRV) s = s.replace(/^gi(?=[aeiou])/, 'd').replace(/^[rv]/, 'd'); // gi, r, v -> d
    if (C.ghG) s = s.replace(/^ngh/, 'ng').replace(/^gh/, 'g');              // ngh -> ng, gh -> g
    if (C.kCQ) s = s.replace(/^qu/, 'cu').replace(/^q/, 'c').replace(/^k(?!h)/, 'c'); // qu, q, k -> c
    if (C.trCh) s = s.replace(/^tr/, 'ch');                                  // tr -> ch
    if (C.sX) s = s.replace(/^s/, 'x');                                      // s -> x
    if (C.nL) s = s.replace(/^l/, 'n');                                      // l -> n
    if (C.phF) s = s.replace(/^ph/, 'f');                                    // ph -> f

    /* --- Âm cuối --- */
    if (C.cuoiCT) s = s.replace(/(ch|c|t)$/, 'c');  // -ch, -t -> -c
    if (C.cuoiN) s = s.replace(/(nh|ng|n)$/, 'n');  // -nh, -ng -> -n

    /* --- Nguyên âm trước âm cuối n/c --- */
    if (C.songAm) s = s.replace(/uo(?=[nc]$)/, 'u').replace(/ie(?=[nc]$)/, 'i'); // uô/ươ -> u, iê -> i
    if (C.eI) s = s.replace(/e(?=[nc]$)/, 'i');                                   // ê -> i
    if (C.oU) s = s.replace(/o(?=[nc]$)/, 'u');                                   // ô -> u
    return s;
}

/** Hai khóa cùng độ dài và chỉ khác đúng 1 vị trí, mà ở vị trí đó cả hai đều là nguyên âm?
 *  (vd "dan" ~ "dun": â/ư bị nghe lẫn). Cố ý KHÔNG chịu thiếu/thừa ký tự để tránh nhầm
 *  các từ khác nghĩa như "Chúa" và "Cha". */
function lechMotNguyenAm(a, b) {
    if (a.length !== b.length) return false;
    let soKhac = 0;
    for (let i = 0; i < a.length; i++) {
        if (a[i] === b[i]) continue;
        if (!/[aeiou]/.test(a[i]) || !/[aeiou]/.test(b[i])) return false;
        soKhac++;
    }
    return soKhac === 1;
}

/** Hàm chính: từ người dùng nói/gõ (chữ thô, có dấu hay không đều được) có khớp từ mẫu không?
 *  tuMauBase là từ mẫu ĐÃ bỏ dấu (chính là "base" lưu trong script.js). */
function khopAm(tuNghe, tuMauBase) {
    const nghe = boDauAm(tuNghe);
    if (!nghe) return false;
    if (nghe === tuMauBase) return true;                                 // trùng hẳn khi bỏ dấu
    if ((PHIEN_AM_TU_DAC_BIET[tuMauBase] || []).includes(nghe)) return true; // nằm trong bảng từ đặc biệt

    const kNghe = khoaAm(nghe), kMau = khoaAm(tuMauBase);
    if (kNghe === kMau) return true;                                     // cùng khóa phát âm
    return PHIEN_AM.chiuLechNguyenAm &&
           kMau.length >= PHIEN_AM.doDaiToiThieuChoLech &&
           lechMotNguyenAm(kNghe, kMau);                                 // lệch đúng 1 nguyên âm
}