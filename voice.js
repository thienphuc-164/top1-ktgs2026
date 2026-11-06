/* ===================================================================
   VOICE.JS - Mọi thứ liên quan đến GIỌNG NÓI + SO KHỚP PHÁT ÂM
   Nạp TRƯỚC app.js. Gồm 4 phần:

     1. PHÁT ÂM      : boDauAm(), khoaAm(), khopAm()  (dùng cả cho Học thuộc gõ chữ)
     2. MIC ENGINE   : taoMicEngine()  - chỉ lo Web Speech API (bật/tắt/tự khởi động lại/lỗi),
                       KHÔNG đụng giao diện -> lỗi nhận giọng nói thì sửa ở đây
     3. TRẢ BÀI      : khoiTaoTraBai() - giao diện + chấm từng từ, dùng MIC ENGINE
     4. (app.js gọi khoiTaoTraBai() ở cuối file)

   Bật log để debug: mở Console gõ   window.VOICE_DEBUG = true
   =================================================================== */

/* ---------- Debug ---------- */
function vLog(...args) {
    if (window.VOICE_DEBUG) console.log('[voice]', ...args);
}

/* ===================================================================
   1. SO KHỚP THEO PHÁT ÂM (chịu sai giọng vùng miền / lỗi máy nghe)
   Mỗi từ được đưa về "khóa phát âm" (bỏ dấu thanh, gộp các cặp âm hay nhầm),
   hai từ cùng khóa (hoặc chỉ lệch 1 nguyên âm) thì coi là khớp.
   =================================================================== */

/* Cấu hình: đặt false để tắt từng nhóm cho nghiêm hơn */
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
 *  tuMauBase là từ mẫu ĐÃ bỏ dấu (chính là "base" lưu trong app.js). */
function khopAm(tuNghe, tuMauBase) {
    const nghe = boDauAm(tuNghe);
    if (!nghe) return false;
    if (nghe === tuMauBase) return true;                                     // trùng hẳn khi bỏ dấu
    if ((PHIEN_AM_TU_DAC_BIET[tuMauBase] || []).includes(nghe)) return true; // nằm trong bảng từ đặc biệt

    const kNghe = khoaAm(nghe), kMau = khoaAm(tuMauBase);
    if (kNghe === kMau) return true;                                         // cùng khóa phát âm
    return PHIEN_AM.chiuLechNguyenAm &&
           kMau.length >= PHIEN_AM.doDaiToiThieuChoLech &&
           lechMotNguyenAm(kNghe, kMau);                                     // lệch đúng 1 nguyên âm
}

/* ===================================================================
   2. MIC ENGINE - chỉ lo nhận giọng nói (Web Speech API), không đụng giao diện
   ---------------------------------------------------------------
   taoMicEngine({ lang, onTranscript, onSessionEnd, onStarted, onError, onStateChange })
     onTranscript(words, allFinal) : mỗi lần có kết quả. words = mảng từ của CẢ phiên hiện tại,
                                     allFinal = true khi mọi đoạn đã được máy chốt.
     onSessionEnd()                : 1 phiên nhận dạng vừa kết thúc (trước khi tự bật lại)
     onStarted()                   : bật mic thành công
     onError(code)                 : 'permission' | 'network' | 'start-failed'
     onStateChange()               : trạng thái bật/tắt thay đổi (để vẽ lại nút mic)
   Trả về: { start, stop, isWanted }   (null nếu trình duyệt không hỗ trợ)
   =================================================================== */
const VOICE_SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const VOICE_HO_TRO = !!VOICE_SR;
const VOICE_KHOI_DONG_LAI_MS = 250; // nghỉ bao lâu rồi tự bật lại mic khi hệ thống tự ngắt

function taoMicEngine(opt) {
    if (!VOICE_HO_TRO) return null;

    let recognizer = null;     // tạo 1 lần
    let wanted = false;        // người dùng đang ở chế độ nghe (kể cả lúc hệ thống tự ngắt rồi bật lại)
    let timer = null;          // hẹn giờ tự bật lại

    function taoRecognizer() {
        if (recognizer) return recognizer;
        const r = new VOICE_SR();
        r.lang = opt.lang;
        r.continuous = true;       // nghe liên tục (iPhone vẫn có thể tự dừng khi im lặng -> ta tự bật lại)
        r.interimResults = true;   // có kết quả tạm để chữ hiện ngay khi đang đọc
        r.maxAlternatives = 1;

        r.onresult = (e) => {
            let chuoi = '', allFinal = true;
            for (let i = 0; i < e.results.length; i++) {
                chuoi += e.results[i][0].transcript + ' ';
                if (!e.results[i].isFinal) allFinal = false;
            }
            const words = chuoi.trim().split(/[\s-]+/).filter(Boolean);
            vLog('result', allFinal ? 'FINAL' : 'interim', words.join(' '));
            opt.onTranscript(words, allFinal);
        };

        r.onerror = (e) => {
            vLog('error', e.error);
            if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
                wanted = false;
                opt.onError('permission');
            } else if (e.error === 'network') {
                wanted = false;
                opt.onError('network');
            }
            // 'no-speech' và 'aborted' là bình thường: onend sẽ tự bật lại nếu vẫn đang nghe
            opt.onStateChange();
        };

        r.onend = () => {
            vLog('end, wanted =', wanted);
            opt.onSessionEnd();        // chốt nốt từ còn lại; có thể gọi stop() nếu đã hoàn thành
            if (wanted) {
                timer = setTimeout(batDau, VOICE_KHOI_DONG_LAI_MS);
            } else {
                opt.onStateChange();
            }
        };

        recognizer = r;
        return r;
    }

    /** Bật mic. Thất bại (vd iOS chặn tự bật lại) thì chuyển về trạng thái tạm dừng để người dùng bấm tiếp. */
    function batDau() {
        try {
            taoRecognizer().start();
            vLog('started');
            opt.onStarted();
        } catch (err) {
            // InvalidStateError: đang chạy rồi -> bỏ qua; lỗi khác -> tạm dừng
            if (err && err.name !== 'InvalidStateError') {
                vLog('start failed', err);
                wanted = false;
                opt.onError('start-failed');
            }
        }
        opt.onStateChange();
    }

    return {
        start() { wanted = true; batDau(); },
        stop() {
            wanted = false;
            clearTimeout(timer);
            if (recognizer) {
                try { recognizer.stop(); } catch (err) {} // stop() vẫn trả nốt kết quả đang nghe dở
            }
            opt.onStateChange();
        },
        isWanted() { return wanted; }
    };
}

/* ===================================================================
   3. MÀN TRẢ BÀI - giao diện + chấm từng từ
   Nhận từ app.js: { cacCau, soCau, sach, chuong }
   Trả về: { dung, render }   (app.js gọi dung() khi đổi tab)
   =================================================================== */
function khoiTaoTraBai(ctx) {
    const { cacCau, soCau, sach, chuong } = ctx;

    /* ---------- Cấu hình ---------- */
    const TB_NGON_NGU = 'vi-VN';
    // Khi người đọc bỏ sót từ, cho phép nhảy tối đa bấy nhiêu từ để "bắt kịp" lại
    const TB_CUA_SO_BO_QUA = 2;

    /* ---------- Tham chiếu giao diện ---------- */
    const tbChonTu = document.getElementById('tb-chon-tu');
    const tbChonDen = document.getElementById('tb-chon-den');
    const tbNoiDung = document.getElementById('tb-noi-dung');
    const tbSanKhau = document.getElementById('tb-san-khau');
    const tbKetThuc = document.getElementById('tb-ket-thuc');
    const tbTomTat = document.getElementById('tb-tom-tat');
    const tbKetQuaLoi = document.getElementById('tb-ket-qua-loi');
    const tbSoLoiEl = document.getElementById('tb-so-loi');
    const tbTrangThaiEl = document.getElementById('tb-trang-thai');
    const tbBtnMic = document.getElementById('tb-btn-mic');
    const tbBtnOChu = document.getElementById('tb-btn-o-chu');           // nút bật/tắt ô chữ
    const tbDongDangNghe = document.getElementById('tb-dong-dang-nghe'); // dòng hiện chữ vừa nghe được

    /* ---------- Trạng thái ---------- */
    let tbTu = [];              // từ cần đọc: {element, base, cau, trangThai: 'chua' | 'dung' | 'sai'}
    let tbViTri = 0;            // chỉ số từ kế tiếp cần đọc
    let tbSoLoi = 0;            // tổng số từ đọc sai hoặc bỏ sót
    let tbXong = false;         // đã đọc hết đoạn đã chọn
    let tbDaChot = 0;           // số từ đã xử lý trong PHIÊN nhận dạng hiện tại
    let tbTuNoiHienTai = [];    // các từ nghe được trong phiên hiện tại
    let tbHienOChu = false;     // hiện ô chữ (chỗ trống) cho các từ chưa đọc của câu hiện tại

    const mic = taoMicEngine({
        lang: TB_NGON_NGU,
        onTranscript: tbXuLyKetQua,
        onSessionEnd: tbKhiPhienKetThuc,
        onStarted: () => tbBaoTrangThai('Đang nghe… hãy đọc thuộc, đọc sai cũng không cần đọc lại'),
        onError: tbKhiLoiMic,
        onStateChange: tbCapNhatNutVaLoi
    });

    const tbDangNghe = () => !!mic && mic.isWanted();

    /* ---------- Giao diện ---------- */

    /** Điền số câu vào 2 ô chọn "từ câu... đến câu...". */
    function tbDienChon() {
        for (let n = 1; n <= soCau; n++) {
            tbChonTu.appendChild(new Option(n, n));
            tbChonDen.appendChild(new Option(n, n));
        }
        tbChonTu.value = 1;
        tbChonDen.value = 1;
    }

    /** Hiện dòng trạng thái nhỏ phía trên nút mic. */
    function tbBaoTrangThai(noiDung) {
        tbTrangThaiEl.textContent = noiDung;
    }

    /** Cập nhật nút mic (đang nghe hay không) và số lỗi hiển thị. */
    function tbCapNhatNutVaLoi() {
        const nghe = tbDangNghe();
        tbBtnMic.classList.toggle('dang-nghe', nghe);
        tbBtnMic.textContent = nghe ? '⏹' : '🎤';
        tbSoLoiEl.textContent = `Số lỗi: ${tbSoLoi}`;
    }

    /** Cập nhật màu/độ mờ từng từ: đúng = mờ, sai = đỏ, chưa đọc = ẩn.
     *  Nếu bật "ô chữ": các từ chưa đọc của CÂU HIỆN TẠI hiện thành ô trống (gạch chân). */
    function tbCapNhatTu() {
        const cauHienTai = tbTu[tbViTri] ? tbTu[tbViTri].cau : -1;
        tbTu.forEach(t => {
            t.element.className =
                t.trangThai === 'dung' ? 'tu-hoc mo-di' :
                t.trangThai === 'sai' ? 'tu-hoc sai-mau-do' :
                (tbHienOChu && t.cau === cauHienTai) ? 'tu-hoc o-trong' :
                'tu-hoc chua-go';
        });
        tbNoiDung.scrollTop = tbNoiDung.scrollHeight; // luôn cuộn tới phần mới nhất
    }

    /** Hiện các từ vừa nghe được nhưng chưa nối vào đoạn phía trên. */
    function tbCapNhatDongDangNghe() {
        tbDongDangNghe.textContent = tbTuNoiHienTai.slice(tbDaChot).join(' ');
    }

    /** Bật/tắt hiện ô chữ. "luu" = true thì nhớ lựa chọn cho lần mở sau. */
    function tbDatOChu(bat, luu) {
        tbHienOChu = bat;
        tbBtnOChu.textContent = bat ? 'Ô chữ: Bật' : 'Ô chữ: Tắt';
        tbBtnOChu.classList.toggle('dang-bat', bat);
        if (luu) {
            try { localStorage.setItem('tbOChu', bat ? '1' : '0'); } catch (e) {}
        }
        tbCapNhatTu();
    }

    /** Dựng lại các từ của đoạn đã chọn và đặt mọi thứ về ban đầu. */
    function tbRender() {
        tbDung();
        tbNoiDung.innerHTML = '';
        tbTu = [];
        tbViTri = 0;
        tbSoLoi = 0;
        tbXong = false;
        tbDaChot = 0;
        tbTuNoiHienTai = [];

        tbSanKhau.classList.remove('hidden');
        tbKetThuc.classList.add('hidden');

        const tu = +tbChonTu.value, den = +tbChonDen.value;
        for (let n = tu; n <= den; n++) {
            const divCau = document.createElement('div');
            divCau.className = 'cau-hoc';

            cacCau[n - 1].split(/\s+/).forEach(chu => {
                // Từ ghép có gạch nối (vd "Ê-phê-sô") được tách thành từng âm tiết, giữ dấu gạch ở cuối mỗi mảnh
                (chu.match(/[^-]+-?/g) || [chu]).forEach(manh => {
                    const base = boDauAm(manh);
                    if (base === '') return; // bỏ ký hiệu đứng riêng
                    const span = document.createElement('span');
                    span.textContent = manh;
                    divCau.appendChild(span);
                    tbTu.push({ element: span, base, cau: n, trangThai: 'chua' });
                });
            });
            tbNoiDung.appendChild(divCau);
        }

        tbCapNhatTu();
        tbCapNhatDongDangNghe();
        tbCapNhatNutVaLoi();
        tbBaoTrangThai(VOICE_HO_TRO
            ? 'Bấm 🎤 rồi đọc thuộc đoạn đã chọn'
            : 'Trình duyệt này không hỗ trợ nhận giọng nói. Hãy mở bằng Safari (iOS 14.5 trở lên) hoặc Chrome.');
    }

    /* ---------- Chấm từng từ nghe được ---------- */

    /** Đánh dấu 1 từ là đọc đúng. */
    function tbDanhDauDung(i) {
        tbTu[i].trangThai = 'dung';
    }

    /** Đánh dấu 1 từ là đọc sai/bỏ sót: hiện đỏ và cộng 1 lỗi (không bắt đọc lại). */
    function tbDanhDauSai(i) {
        tbTu[i].trangThai = 'sai';
        tbSoLoi++;
    }

    /** So 1 từ vừa nghe với đoạn cần đọc rồi tiến con trỏ.
     *  - Khớp từ hiện tại: đúng.
     *  - Khớp từ phía sau (trong cửa sổ cho phép): các từ ở giữa bị coi là bỏ sót (sai), nhảy tới từ khớp.
     *  - Không khớp từ nào: coi như đọc sai từ hiện tại, đi tiếp sang từ kế. */
    function tbXuLyMotTu(tuNoi) {
        const base = boDauAm(tuNoi);
        if (base === '' || tbXong || tbViTri >= tbTu.length) return;

        for (let k = 0; k <= TB_CUA_SO_BO_QUA; k++) {
            const idx = tbViTri + k;
            if (idx >= tbTu.length) break;
            if (khopAm(tuNoi, tbTu[idx].base)) {
                for (let j = 0; j < k; j++) tbDanhDauSai(tbViTri + j); // các từ bị bỏ sót
                tbDanhDauDung(idx);
                tbViTri = idx + 1;
                vLog('match', tuNoi, '->', tbTu[idx].base, k ? `(bỏ sót ${k})` : '');
                return;
            }
        }
        vLog('wrong', tuNoi, 'expected', tbTu[tbViTri].base);
        tbDanhDauSai(tbViTri); // đọc sai: hiện đỏ, đi tiếp
        tbViTri++;
    }

    /** Xử lý các từ chưa chốt của phiên hiện tại, tới hết chỉ số "gioiHan" (không gồm gioiHan). */
    function tbChotDen(gioiHan) {
        while (tbDaChot < gioiHan && !tbXong) {
            const tu1 = tbTuNoiHienTai[tbDaChot];
            const tu2 = tbTuNoiHienTai[tbDaChot + 1]; // chỉ để ngó trước (có thể là từ cuối còn "tạm")
            const mau = tbTu[tbViTri];
            // Máy hay tách 1 từ thành 2 (vd "Giê-su" -> "giê" + "su"): nếu ghép lại mới khớp thì coi là 1 từ
            if (mau && tu2 !== undefined && !khopAm(tu1, mau.base) && khopAm(tu1 + tu2, mau.base)) {
                tbXuLyMotTu(tu1 + tu2);
                tbDaChot += 2;
                continue;
            }
            tbXuLyMotTu(tu1);
            tbDaChot++;
        }
        tbCapNhatTu();
        tbCapNhatDongDangNghe();
        tbCapNhatNutVaLoi();
        if (tbViTri >= tbTu.length && !tbXong) tbHoanThanh();
    }

    /** Nhận kết quả từ mic engine. Từ cuối khi còn "tạm" có thể bị máy sửa lại,
     *  nên chỉ chốt từ cuối sớm nếu nó khớp đúng từ đang chờ (để chữ hiện kịp lúc người đọc xong câu). */
    function tbXuLyKetQua(words, allFinal) {
        tbTuNoiHienTai = words;

        if (allFinal) {
            tbChotDen(words.length);
            return;
        }
        tbChotDen(words.length - 1); // chừa từ cuối vì còn có thể đổi

        const cuoi = words[words.length - 1];
        if (cuoi && tbDaChot === words.length - 1 && tbTu[tbViTri] &&
            boDauAm(cuoi) === tbTu[tbViTri].base) {
            tbChotDen(words.length); // từ cuối khớp chính xác -> chốt luôn
        }
    }

    /** Một phiên nhận dạng vừa kết thúc: chốt nốt từ còn lại, reset bộ đếm cho phiên mới. */
    function tbKhiPhienKetThuc() {
        tbChotDen(tbTuNoiHienTai.length);
        tbDaChot = 0;
        tbTuNoiHienTai = [];
        tbCapNhatDongDangNghe();
    }

    /** Báo lỗi mic cho người dùng. */
    function tbKhiLoiMic(code) {
        if (code === 'permission') {
            tbBaoTrangThai('Chưa được cấp quyền micro. Vào Cài đặt > Safari > Micrô, và bật Siri & Đọc chính tả (Dictation).');
        } else if (code === 'network') {
            tbBaoTrangThai('Lỗi mạng: nhận giọng nói cần Internet. Kiểm tra kết nối rồi thử lại.');
        } else {
            tbBaoTrangThai('Mic đã dừng. Bấm 🎤 để đọc tiếp.');
        }
    }

    /* ---------- Điều khiển ---------- */

    /** Bắt đầu / tiếp tục trả bài (phải gọi từ thao tác chạm của người dùng để iPhone cho phép). */
    function tbBatDau() {
        if (!mic || tbXong) return;
        mic.start();
    }

    /** Dừng nghe (tạm dừng, vẫn giữ tiến độ). Dùng khi bấm nút, đổi tab hoặc ẩn trang. */
    function tbDung() {
        if (mic) mic.stop();
        tbCapNhatNutVaLoi();
        if (!tbXong && VOICE_HO_TRO) tbBaoTrangThai('Đã tạm dừng. Bấm 🎤 để đọc tiếp.');
    }

    /** Hoàn thành: hiện màn chúc mừng, số lỗi và pháo giấy. */
    function tbHoanThanh() {
        tbXong = true;
        tbDung();
        tbSanKhau.classList.add('hidden');
        tbKetThuc.classList.remove('hidden');

        const a = +tbChonTu.value, b = +tbChonDen.value;
        tbTomTat.textContent = a === b
            ? `${sach} ${chuong}:${a}`
            : `${sach} ${chuong}:${a}-${b}`;
        tbKetQuaLoi.textContent = tbSoLoi === 0
            ? 'Không sai lần nào 🎉'
            : `Số lỗi: ${tbSoLoi}`;

        if (typeof confetti === 'function') {
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        }
    }

    /* ---------- Gắn sự kiện ---------- */

    // Nút mic: bật/tắt
    tbBtnMic.addEventListener('click', () => {
        if (tbDangNghe()) tbDung(); else tbBatDau();
    });

    // Chọn câu: đổi khoảng câu thì làm lại từ đầu, giữ 2 ô chọn luôn hợp lệ (từ <= đến)
    tbChonTu.addEventListener('change', () => {
        if (+tbChonTu.value > +tbChonDen.value) tbChonDen.value = tbChonTu.value;
        tbRender();
    });
    tbChonDen.addEventListener('change', () => {
        if (+tbChonDen.value < +tbChonTu.value) tbChonTu.value = tbChonDen.value;
        tbRender();
    });

    // Nút "Cả đoạn", "Làm lại", "Trả bài lại"
    document.getElementById('tb-ca-doan').addEventListener('click', () => {
        tbChonTu.value = 1;
        tbChonDen.value = soCau;
        tbRender();
    });
    document.getElementById('tb-lam-lai').addEventListener('click', tbRender);
    document.getElementById('tb-choi-lai').addEventListener('click', tbRender);

    // Thu nhỏ/ẩn trang (khóa màn hình, chuyển app) thì tắt mic
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) tbDung();
    });

    // Nút "Ô chữ": bật/tắt hiện chỗ trống cho các từ còn lại của câu hiện tại
    tbBtnOChu.addEventListener('click', () => tbDatOChu(!tbHienOChu, true));

    /* ---------- Khởi động ---------- */
    if (!VOICE_HO_TRO) tbBtnMic.disabled = true;
    let tbOChuDaLuu = false;
    try { tbOChuDaLuu = localStorage.getItem('tbOChu') === '1'; } catch (e) {} // khôi phục lựa chọn ô chữ
    tbDatOChu(tbOChuDaLuu, false);
    tbDienChon();
    tbRender();

    return { dung: tbDung, render: tbRender };
}
