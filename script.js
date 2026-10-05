/* Ê-phê-sô 5 - Kinh Thánh Tiếng Việt 1925 */
const SACH = 'Ê-phê-sô';
const CHUONG = 5;
const cacCau = [
    "Vậy anh em hãy trở nên kẻ bắt chước Đức Chúa Trời như con cái rất yêu dấu của Ngài;",
    "hãy bước đi trong sự yêu thương, cũng như Đấng Christ đã yêu thương anh em, và vì chúng ta phó chính mình Ngài cho Đức Chúa Trời làm của dâng và của tế lễ, như một thức hương có mùi thơm.",
    "Phàm những sự gian dâm, hoặc sự ô uế, hoặc sự tham lam, cũng chớ nên nói đến giữa anh em, theo như cách xứng đáng cho các thánh đồ.",
    "Chớ nói lời tục tỉu, chớ giễu cợt, chớ giả ngộ tầm phào, là những điều không đáng, nhưng thà cảm tạ ơn Chúa thì hơn.",
    "Vì anh em phải biết rõ rằng kẻ gian dâm, ô uế, tham lam, tức là kẻ thờ hình tượng, không một kẻ nào được dự phần kế nghiệp của nước Đấng Christ và Đức Chúa Trời.",
    "Đừng để cho ai lấy lời giả trá phỉnh dỗ anh em; vì ấy là nhân những điều đó mà cơn thạnh nộ của Đức Chúa Trời giáng trên các con bạn nghịch.",
    "Vậy, chớ có thông đồng điều chi với họ hết.",
    "Vả, lúc trước anh em đương còn tối tăm, nhưng bây giờ đã nên người sáng láng trong Chúa. Hãy bước đi như các con sáng láng;",
    "vì trái của sự sáng láng ở tại mọi điều nhân từ, công bình và thành thật.",
    "Hãy xét điều chi vừa lòng Chúa,",
    "và chớ dự vào công việc vô ích của sự tối tăm, thà quở trách chúng nó thì hơn;",
    "vì dầu nói đến điều mà những người đó làm cách kín giấu, cũng đã là hổ thẹn rồi.",
    "Nhưng hết thảy mọi sự đã bị quở trách đều được tỏ ra bởi sự sáng; phàm điều chi đã tỏ ra thì trở nên sự sáng vậy.",
    "Cho nên có chép rằng: Ngươi đương ngủ, hãy thức, hãy vùng dậy từ trong đám người chết, thì Đấng Christ sẽ chiếu sáng ngươi.",
    "Vậy, hãy giữ cho khéo về sự ăn ở của anh em, chớ xử mình như người dại dột, nhưng như người khôn ngoan.",
    "Hãy lợi dụng thì giờ, vì những ngày là xấu.",
    "Vậy chớ nên như kẻ dại dột, nhưng phải hiểu rõ ý muốn của Chúa là thế nào.",
    "Đừng say rượu, vì rượu xui cho luông tuồng; nhưng phải đầy dẫy Đức Thánh Linh.",
    "Hãy lấy ca vịnh, thơ thánh, và bài hát thiêng liêng mà đối đáp cùng nhau, và hết lòng hát mừng ngợi khen Chúa.",
    "Hãy thường thường nhân danh Đức Chúa Jêsus Christ chúng ta, vì mọi sự tạ ơn Đức Chúa Trời, là Cha chúng ta.",
    "Hãy kính sợ Đấng Christ mà vâng phục nhau.",
    "Hỡi kẻ làm vợ, phải vâng phục chồng mình như vâng phục Chúa,",
    "vì chồng là đầu vợ, khác nào Đấng Christ là đầu Hội thánh, Hội thánh là thân thể Ngài, và Ngài là Cứu Chúa của Hội thánh.",
    "Ấy vậy, như Hội thánh phục dưới Đấng Christ, thì đàn bà cũng phải phục dưới quyền chồng mình trong mọi sự.",
    "Hỡi người làm chồng, hãy yêu vợ mình, như Đấng Christ đã yêu Hội thánh, phó chính mình vì Hội thánh,",
    "để khiến Hội nên thánh sau khi lấy nước rửa và dùng Đạo làm cho Hội tinh sạch,",
    "đặng tỏ ra Hội thánh đầy vinh hiển, không vết, không nhăn, không chi giống như vậy, nhưng thánh sạch không chỗ trách được ở trước mặt Ngài.",
    "Cũng một thể ấy, chồng phải yêu vợ như chính thân mình. Ai yêu vợ mình thì yêu chính mình vậy.",
    "Vì chẳng hề có người nào ghét chính thân mình, nhưng nuôi nấng săn sóc nó như Đấng Christ đối với Hội thánh,",
    "vì chúng ta là các chi thể của thân Ngài.",
    "Vậy nên người đàn ông phải lìa cha mẹ mà dính díu với vợ mình, hai người cùng nên một thịt.",
    "Sự mầu nhiệm ấy là lớn, tôi nói về Đấng Christ và Hội thánh vậy.",
    "Thế thì mỗi người trong anh em phải yêu vợ mình như mình, còn vợ thì phải kính chồng."
];
const SO_CAU = cacCau.length;

/* === KHOP === */
// Bỏ dấu, bỏ dấu câu, chữ thường: "Trời," -> "troi"
function boDau(s) {
    return s.toLowerCase().normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]/g, '');
}
/* === HET KHOP === */

const btnDoc = document.getElementById('btn-doc');
const btnHoc = document.getElementById('btn-hoc');
const btnTheme = document.getElementById('btn-theme');
const viewDoc = document.getElementById('view-doc');
const viewHoc = document.getElementById('view-hoc');
const noiDungDoc = document.getElementById('noi-dung-doc');
const noiDungHoc = document.getElementById('noi-dung-hoc');
const sanKhau = document.getElementById('san-khau');
const inputTu = document.getElementById('input-tu');
const dongDangGo = document.getElementById('dong-dang-go');
const chuDangGo = document.getElementById('chu-dang-go');
const thongBaoKetThuc = document.getElementById('thong-bao-ket-thuc');
const tomTat = document.getElementById('tom-tat');
const btnChoiLai = document.getElementById('btn-choi-lai');
const chonTu = document.getElementById('chon-tu');
const chonDen = document.getElementById('chon-den');
const btnCaDoan = document.getElementById('btn-ca-doan');
const btnLamLai = document.getElementById('btn-lam-lai');

let cacTu = [];           // mỗi phần tử: {element, base, sai}
let tuHienTaiIndex = 0;   // từ đang chờ gõ
let daXong = false;

/* ---------- Giao diện sáng / tối ---------- */
function apDungTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.dataset.theme = 'dark';
        btnTheme.textContent = '☀';
    } else {
        delete document.documentElement.dataset.theme;
        btnTheme.textContent = '☾';
    }
}

apDungTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

btnTheme.addEventListener('click', () => {
    const moi = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    apDungTheme(moi);
    try { localStorage.setItem('theme', moi); } catch (e) {}
});

/* ---------- Ô nhập ẩn ---------- */
function datLaiInput() {
    inputTu.value = '';
    chuDangGo.textContent = '';
}

function focusNhap() {
    if (daXong) return;
    inputTu.focus();
}

inputTu.addEventListener('focus', () => dongDangGo.classList.add('dang-go'));
inputTu.addEventListener('blur', () => {
    if (inputTu.value === '') dongDangGo.classList.remove('dang-go');
});

/* ---------- Chuyển tab ---------- */
btnDoc.addEventListener('click', () => {
    btnDoc.classList.add('active'); btnHoc.classList.remove('active');
    viewDoc.classList.add('active'); viewHoc.classList.remove('active');
    inputTu.blur();
});

btnHoc.addEventListener('click', () => {
    btnHoc.classList.add('active'); btnDoc.classList.remove('active');
    viewHoc.classList.add('active'); viewDoc.classList.remove('active');
    focusNhap();
    cuonXuongCuoi();
});

// Chạm vào khoảng trống trong màn Học thuộc để mở bàn phím
viewHoc.addEventListener('click', (e) => {
    if (e.target.closest('button, select, label')) return;
    focusNhap();
});

/* ---------- Màn Đọc ---------- */
function renderDoc() {
    noiDungDoc.innerHTML = '';
    cacCau.forEach((cau, i) => {
        const div = document.createElement('div');
        div.className = 'cau-doc';
        const so = document.createElement('span');
        so.className = 'so-cau';
        so.textContent = i + 1;
        div.appendChild(so);
        div.appendChild(document.createTextNode(cau));
        noiDungDoc.appendChild(div);
    });
}

/* ---------- Chọn câu ---------- */
function dienChon() {
    for (let n = 1; n <= SO_CAU; n++) {
        chonTu.appendChild(new Option(n, n));
        chonDen.appendChild(new Option(n, n));
    }
    chonTu.value = 1;
    chonDen.value = 1;
}

chonTu.addEventListener('change', () => {
    if (+chonTu.value > +chonDen.value) chonDen.value = chonTu.value;
    renderHoc();
});

chonDen.addEventListener('change', () => {
    if (+chonDen.value < +chonTu.value) chonTu.value = chonDen.value;
    renderHoc();
});

btnCaDoan.addEventListener('click', () => {
    chonTu.value = 1;
    chonDen.value = SO_CAU;
    renderHoc();
    focusNhap();
});

btnLamLai.addEventListener('click', () => { renderHoc(); focusNhap(); });
btnChoiLai.addEventListener('click', () => { renderHoc(); focusNhap(); });

/* ---------- Màn Học thuộc ---------- */
function cuonXuongCuoi() {
    noiDungHoc.scrollTop = noiDungHoc.scrollHeight;
}

function renderHoc() {
    noiDungHoc.innerHTML = '';
    cacTu = [];
    tuHienTaiIndex = 0;
    daXong = false;

    sanKhau.classList.remove('hidden');
    thongBaoKetThuc.classList.add('hidden');
    datLaiInput();

    const tu = +chonTu.value, den = +chonDen.value;
    for (let n = tu; n <= den; n++) {
        const divCau = document.createElement('div');
        divCau.className = 'cau-hoc';

        cacCau[n - 1].split(/\s+/).forEach(chu => {
            const base = boDau(chu);
            if (base === '') return; // bỏ qua ký hiệu đứng riêng

            const span = document.createElement('span');
            span.textContent = chu;
            divCau.appendChild(span);

            cacTu.push({ element: span, base, sai: false });
        });
        noiDungHoc.appendChild(divCau);
    }

    capNhatUI();
}

function capNhatUI() {
    cacTu.forEach((item, i) => {
        if (i < tuHienTaiIndex) {
            item.element.className = 'tu-hoc mo-di';
        } else if (i === tuHienTaiIndex) {
            item.element.className = item.sai ? 'tu-hoc sai-mau-do' : 'tu-hoc hien-tai';
        } else {
            item.element.className = 'tu-hoc chua-go';
        }
    });
    cuonXuongCuoi();
}

inputTu.addEventListener('input', () => {
    if (daXong) return;

    const giaTri = inputTu.value;
    const item = cacTu[tuHienTaiIndex];

    // Đang gõ lại: ẩn chữ đỏ nhắc bài
    if (item.sai && giaTri.trim() !== '') {
        item.sai = false;
        capNhatUI();
    }

    // Chưa bấm phím cách: chỉ hiển thị chữ đang gõ
    if (!/\s$/.test(giaTri)) {
        chuDangGo.textContent = giaTri;
        return;
    }

    // Đã bấm phím cách
    const daGo = giaTri.trim();
    datLaiInput();
    if (daGo === '') return;

    if (boDau(daGo) === item.base) {
        tuHienTaiIndex++;
        capNhatUI();
        if (tuHienTaiIndex >= cacTu.length) hoanThanh();
    } else {
        // Sai: hiện chữ gốc màu đỏ để người dùng nhớ lại
        item.sai = true;
        capNhatUI();
    }
});

function hoanThanh() {
    daXong = true;
    inputTu.blur();
    sanKhau.classList.add('hidden');
    thongBaoKetThuc.classList.remove('hidden');

    const a = +chonTu.value, b = +chonDen.value;
    tomTat.textContent = a === b
        ? `${SACH} ${CHUONG}:${a}`
        : `${SACH} ${CHUONG}:${a}-${b}`;

    if (typeof confetti === 'function') {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
}

/* ---------- Thích ứng khi bàn phím điện thoại mở ---------- */
function capNhatViewport() {
    const vv = window.visualViewport;
    const root = document.documentElement;
    root.style.setProperty('--app-h', (vv ? vv.height : window.innerHeight) + 'px');
    root.style.setProperty('--app-top', (vv ? vv.offsetTop : 0) + 'px');
    cuonXuongCuoi();
}

if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', capNhatViewport);
    window.visualViewport.addEventListener('scroll', capNhatViewport);
}
window.addEventListener('resize', capNhatViewport);
capNhatViewport();

dienChon();
renderDoc();
renderHoc();