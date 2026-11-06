/* ===================================================================
   TRẢ BÀI - đọc bằng giọng nói (Web Speech API)
   File này chạy SAU script.js và dùng lại: cacCau, SO_CAU, SACH, CHUONG,
   boDau(), btnDoc, btnHoc, btnTraBai.
   Mọi biến/hàm đều có tiền tố "tb" để không đụng tên với script.js.
   =================================================================== */

/* ---------- Cấu hình ---------- */
const TB_NGON_NGU = 'vi-VN';
// Khi người đọc bỏ sót từ, cho phép nhảy tối đa bấy nhiêu từ để "bắt kịp" lại
const TB_CUA_SO_BO_QUA = 2;
// Bảng so khớp theo phát âm (tr/ch, d/gi/v, n/ng, Christ~crít...) nằm trong phien-am.js

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
const tbBtnOChu = document.getElementById('tb-btn-o-chu');            // nút bật/tắt ô chữ
const tbDongDangNghe = document.getElementById('tb-dong-dang-nghe');  // dòng hiện chữ vừa nghe được

/* ---------- Trạng thái ---------- */
const TbNhanDangGiongNoi = window.SpeechRecognition || window.webkitSpeechRecognition;
let tbNhanDang = null;      // đối tượng nhận dạng giọng nói (tạo 1 lần)
let tbTu = [];              // danh sách từ cần đọc: {element, base, trangThai: 'chua' | 'dung' | 'sai'}
let tbViTri = 0;            // chỉ số từ kế tiếp cần đọc
let tbSoLoi = 0;            // tổng số từ đọc sai hoặc bỏ sót
let tbDangNghe = false;     // người dùng đang ở chế độ trả bài (kể cả lúc hệ thống tự khởi động lại mic)
let tbXong = false;         // đã đọc hết đoạn đã chọn
let tbDaChot = 0;           // số từ đã xử lý trong PHIÊN nhận dạng hiện tại
let tbTuNoiHienTai = [];    // các từ nghe được trong phiên hiện tại
let tbHenKhoiDongLai = null; // bộ hẹn giờ tự bật lại mic
let tbHienOChu = false;     // bật/tắt hiện ô chữ (chỗ trống) cho các từ chưa đọc trong câu hiện tại

/* ===================================================================
   1. TIỆN ÍCH SO KHỚP
   =================================================================== */

// Việc so khớp từ nghe được với từ mẫu do khopAm() trong phien-am.js đảm nhiệm.

/* ===================================================================
   2. GIAO DIỆN
   =================================================================== */

/** Điền số câu vào 2 ô chọn "từ câu... đến câu...". */
function tbDienChon() {
    for (let n = 1; n <= SO_CAU; n++) {
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
    tbBtnMic.classList.toggle('dang-nghe', tbDangNghe);
    tbBtnMic.textContent = tbDangNghe ? '⏹' : '🎤';
    tbSoLoiEl.textContent = `Số lỗi: ${tbSoLoi}`;
}

/** Cập nhật màu/độ mờ từng từ theo trạng thái:
 *  đúng = hiện mờ, sai = hiện chữ gốc màu đỏ, chưa đọc = ẩn.
 *  Nếu đang bật "ô chữ": các từ chưa đọc của CÂU HIỆN TẠI hiện thành ô trống (gạch chân). */
function tbCapNhatTu() {
    const cauHienTai = tbTu[tbViTri] ? tbTu[tbViTri].cau : -1; // câu chứa từ đang chờ đọc
    tbTu.forEach(t => {
        t.element.className =
            t.trangThai === 'dung' ? 'tu-hoc mo-di' :
            t.trangThai === 'sai' ? 'tu-hoc sai-mau-do' :
            (tbHienOChu && t.cau === cauHienTai) ? 'tu-hoc o-trong' :
            'tu-hoc chua-go';
    });
    tbNoiDung.scrollTop = tbNoiDung.scrollHeight; // luôn cuộn tới phần mới nhất
}

/** Hiện các từ vừa nghe được nhưng chưa nối vào đoạn phía trên (giống dòng đang gõ ở màn Học thuộc).
 *  Khi từ được chốt, nó biến mất khỏi dòng này và hiện (mờ/đỏ) trong đoạn. */
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
    tbDungNghe();
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
                const base = boDau(manh);
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
    tbBaoTrangThai(TbNhanDangGiongNoi
        ? 'Bấm 🎤 rồi đọc thuộc đoạn đã chọn'
        : 'Trình duyệt này không hỗ trợ nhận giọng nói. Hãy mở bằng Safari (iOS 14.5 trở lên) hoặc Chrome.');
}

/* ===================================================================
   3. XỬ LÝ TỪNG TỪ NGHE ĐƯỢC
   =================================================================== */

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
    const base = boDau(tuNoi);
    if (base === '' || tbXong || tbViTri >= tbTu.length) return;

    for (let k = 0; k <= TB_CUA_SO_BO_QUA; k++) {
        const idx = tbViTri + k;
        if (idx >= tbTu.length) break;
        if (khopAm(tuNoi, tbTu[idx].base)) {
            for (let j = 0; j < k; j++) tbDanhDauSai(tbViTri + j); // các từ bị bỏ sót
            tbDanhDauDung(idx);
            tbViTri = idx + 1;
            return;
        }
    }
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

/** Nhận kết quả từ bộ nhận dạng. Từ cuối cùng khi còn "tạm" có thể bị máy sửa lại,
 *  nên chỉ chốt từ cuối sớm nếu nó khớp đúng từ đang chờ (để chữ hiện kịp lúc người đọc xong câu). */
function tbXuLyKetQua(e) {
    let chuoi = '', tatCaDaChot = true;
    for (let i = 0; i < e.results.length; i++) {
        chuoi += e.results[i][0].transcript + ' ';
        if (!e.results[i].isFinal) tatCaDaChot = false;
    }
    tbTuNoiHienTai = chuoi.trim().split(/[\s-]+/).filter(Boolean);

    if (tatCaDaChot) {
        tbChotDen(tbTuNoiHienTai.length);
        return;
    }
    tbChotDen(tbTuNoiHienTai.length - 1); // chừa từ cuối vì còn có thể đổi

    const cuoi = tbTuNoiHienTai[tbTuNoiHienTai.length - 1];
    if (cuoi && tbDaChot === tbTuNoiHienTai.length - 1 && tbTu[tbViTri] &&
        boDau(cuoi) === tbTu[tbViTri].base) {
        tbChotDen(tbTuNoiHienTai.length); // từ cuối khớp chính xác -> chốt luôn
    }
}

/* ===================================================================
   4. ĐIỀU KHIỂN MICRO
   =================================================================== */

/** Tạo bộ nhận dạng giọng nói (chỉ tạo 1 lần) và gắn các sự kiện. */
function tbKhoiTaoNhanDang() {
    if (tbNhanDang) return tbNhanDang;
    const r = new TbNhanDangGiongNoi();
    r.lang = TB_NGON_NGU;
    r.continuous = true;      // nghe liên tục (trên iPhone vẫn có thể tự dừng khi im lặng -> ta tự bật lại)
    r.interimResults = true;  // có kết quả tạm để chữ hiện ngay khi đang đọc
    r.maxAlternatives = 1;

    r.onresult = tbXuLyKetQua;

    r.onerror = (e) => {
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
            tbDangNghe = false;
            tbBaoTrangThai('Chưa được cấp quyền micro. Vào Cài đặt > Safari > Micrô, và bật Siri & Đọc chính tả (Dictation).');
        } else if (e.error === 'network') {
            tbDangNghe = false;
            tbBaoTrangThai('Lỗi mạng: nhận giọng nói cần Internet. Kiểm tra kết nối rồi thử lại.');
        }
        // 'no-speech' và 'aborted' là bình thường: onend sẽ tự bật lại nếu vẫn đang trả bài
        tbCapNhatNutVaLoi();
    };

    r.onend = () => {
        tbChotDen(tbTuNoiHienTai.length); // chốt nốt các từ còn lại của phiên vừa kết thúc
        tbDaChot = 0;                     // phiên mới sẽ bắt đầu đếm lại từ 0
        tbTuNoiHienTai = [];
        tbCapNhatDongDangNghe();
        if (tbDangNghe && !tbXong) {
            // Hệ thống tự ngắt (im lặng / giới hạn thời gian): bật lại sau một nhịp ngắn
            tbHenKhoiDongLai = setTimeout(tbBatMic, 250);
        } else {
            tbCapNhatNutVaLoi();
        }
    };

    tbNhanDang = r;
    return r;
}

/** Bật micro. Thất bại (ví dụ iOS chặn tự bật lại) thì chuyển về trạng thái tạm dừng để người dùng bấm tiếp. */
function tbBatMic() {
    try {
        tbKhoiTaoNhanDang().start();
        tbBaoTrangThai('Đang nghe… hãy đọc thuộc, đọc sai cũng không cần đọc lại');
    } catch (err) {
        // InvalidStateError: đang chạy rồi -> bỏ qua; lỗi khác -> tạm dừng
        if (err && err.name !== 'InvalidStateError') {
            tbDangNghe = false;
            tbBaoTrangThai('Mic đã dừng. Bấm 🎤 để đọc tiếp.');
        }
    }
    tbCapNhatNutVaLoi();
}

/** Bắt đầu / tiếp tục trả bài (phải gọi từ thao tác chạm của người dùng để iPhone cho phép). */
function tbBatDauNghe() {
    if (!TbNhanDangGiongNoi || tbXong) return;
    tbDangNghe = true;
    tbBatMic();
}

/** Dừng nghe (tạm dừng, vẫn giữ tiến độ). Dùng khi bấm nút, đổi tab hoặc ẩn trang. */
function tbDungNghe() {
    tbDangNghe = false;
    clearTimeout(tbHenKhoiDongLai);
    if (tbNhanDang) {
        try { tbNhanDang.stop(); } catch (err) {} // stop() vẫn trả nốt kết quả đang nghe dở
    }
    tbCapNhatNutVaLoi();
    if (!tbXong && TbNhanDangGiongNoi) tbBaoTrangThai('Đã tạm dừng. Bấm 🎤 để đọc tiếp.');
}

/** Hoàn thành: hiện màn chúc mừng, số lỗi và pháo giấy. */
function tbHoanThanh() {
    tbXong = true;
    tbDungNghe();
    tbSanKhau.classList.add('hidden');
    tbKetThuc.classList.remove('hidden');

    const a = +tbChonTu.value, b = +tbChonDen.value;
    tbTomTat.textContent = a === b
        ? `${SACH} ${CHUONG}:${a}`
        : `${SACH} ${CHUONG}:${a}-${b}`;
    tbKetQuaLoi.textContent = tbSoLoi === 0
        ? 'Không sai lần nào 🎉'
        : `Số lỗi: ${tbSoLoi}`;

    if (typeof confetti === 'function') {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
}

/* ===================================================================
   5. GẮN SỰ KIỆN
   =================================================================== */

// Nút mic: bật/tắt
tbBtnMic.addEventListener('click', () => {
    if (tbDangNghe) tbDungNghe(); else tbBatDauNghe();
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
    tbChonDen.value = SO_CAU;
    tbRender();
});
document.getElementById('tb-lam-lai').addEventListener('click', tbRender);
document.getElementById('tb-choi-lai').addEventListener('click', tbRender);

// Chuyển sang tab khác thì tắt mic (tiến độ vẫn được giữ)
btnDoc.addEventListener('click', tbDungNghe);
btnHoc.addEventListener('click', tbDungNghe);

// Thu nhỏ/ẩn trang (khóa màn hình, chuyển app) thì tắt mic
document.addEventListener('visibilitychange', () => {
    if (document.hidden) tbDungNghe();
});

// Nút "Ô chữ": bật/tắt hiện chỗ trống cho các từ còn lại của câu hiện tại
tbBtnOChu.addEventListener('click', () => tbDatOChu(!tbHienOChu, true));

/* ---------- Khởi động ---------- */
if (!TbNhanDangGiongNoi) tbBtnMic.disabled = true;
let tbOChuDaLuu = false;
try { tbOChuDaLuu = localStorage.getItem('tbOChu') === '1'; } catch (e) {} // khôi phục lựa chọn ô chữ
tbDatOChu(tbOChuDaLuu, false);
tbDienChon();
tbRender();