/* @ds-bundle: {"format":3,"namespace":"SandboxIndonesiaDesignSystem_99b416","components":[],"sourceHashes":{"ui_kits/desa-pintar/AppShell.jsx":"a0c654073a87","ui_kits/desa-pintar/Beranda.jsx":"3b228c1ef444","ui_kits/desa-pintar/Components.jsx":"104a7117ed1e","ui_kits/desa-pintar/Demografi.jsx":"c6dd646447e4","ui_kits/desa-pintar/Keuangan.jsx":"1347a6c48c9f","ui_kits/desa-pintar/Login.jsx":"376982e36bae","ui_kits/desa-pintar/Peta.jsx":"a3440228b826"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.SandboxIndonesiaDesignSystem_99b416 = window.SandboxIndonesiaDesignSystem_99b416 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// ui_kits/desa-pintar/AppShell.jsx
try { (() => {
/* Desa Pintar — AppShell (sidebar + topbar layout) */

const NAV_ITEMS = [{
  id: 'beranda',
  label: 'Beranda',
  icon: 'layout-dashboard'
}, {
  id: 'demografi',
  label: 'Demografi',
  icon: 'users'
}, {
  id: 'peta',
  label: 'Peta Desa',
  icon: 'map'
}, {
  id: 'keuangan',
  label: 'Keuangan',
  icon: 'wallet'
}, {
  id: 'surat',
  label: 'Surat',
  icon: 'file-text',
  count: 12
}, {
  id: 'berita',
  label: 'Berita Desa',
  icon: 'newspaper'
}, {
  id: 'potensi',
  label: 'Potensi Desa',
  icon: 'sparkles'
}, {
  id: 'pengaturan',
  label: 'Pengaturan',
  icon: 'settings',
  section: 'bottom'
}];
function Sidebar({
  active,
  onNav
}) {
  const topItems = NAV_ITEMS.filter(i => i.section !== 'bottom');
  const bottomItems = NAV_ITEMS.filter(i => i.section === 'bottom');
  return /*#__PURE__*/React.createElement("aside", {
    style: {
      width: 240,
      flexShrink: 0,
      height: '100%',
      background: 'white',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '20px 18px',
      borderBottom: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-desapintar-full.svg",
    alt: "Desa Pintar",
    style: {
      height: 36,
      display: 'block'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 12,
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      overflowY: 'auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '6px 10px 4px',
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'var(--fg-3)'
    }
  }, "Modul"), topItems.map(item => /*#__PURE__*/React.createElement(NavItem, {
    key: item.id,
    item: item,
    active: active === item.id,
    onClick: () => onNav(item.id)
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 12,
      borderTop: '1px solid var(--border)'
    }
  }, bottomItems.map(item => /*#__PURE__*/React.createElement(NavItem, {
    key: item.id,
    item: item,
    active: active === item.id,
    onClick: () => onNav(item.id)
  }))));
}
function NavItem({
  item,
  active,
  onClick
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 12px',
      borderRadius: 10,
      background: active ? 'var(--teal-50)' : hover ? 'var(--slate-100)' : 'transparent',
      color: active ? 'var(--teal-700)' : 'var(--slate-700)',
      fontFamily: 'var(--font-display)',
      fontSize: 14,
      fontWeight: active ? 600 : 500,
      border: 'none',
      cursor: 'pointer',
      textAlign: 'left',
      width: '100%',
      transition: 'all 150ms cubic-bezier(.16,1,.3,1)',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: item.icon,
    size: 18
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, item.label), item.count && /*#__PURE__*/React.createElement("span", {
    style: {
      background: active ? 'var(--teal-400)' : 'var(--slate-300)',
      color: 'white',
      fontSize: 11,
      fontWeight: 700,
      padding: '2px 7px',
      borderRadius: 999,
      minWidth: 20,
      textAlign: 'center',
      fontFamily: 'var(--font-body)'
    }
  }, item.count), active && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 0,
      top: 8,
      bottom: 8,
      width: 3,
      background: 'var(--teal-400)',
      borderRadius: '0 3px 3px 0'
    }
  }));
}
function TopBar({
  title,
  subtitle,
  breadcrumb,
  onLogout,
  userName = 'Bu Sri Wahyuni',
  userRole = 'Sekretaris Desa'
}) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  return /*#__PURE__*/React.createElement("header", {
    style: {
      height: 72,
      flexShrink: 0,
      background: 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      position: 'sticky',
      top: 0,
      zIndex: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, breadcrumb && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--fg-3)',
      display: 'flex',
      gap: 6,
      alignItems: 'center'
    }
  }, breadcrumb.map((b, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: i
  }, i > 0 && /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    size: 12
  }), /*#__PURE__*/React.createElement("span", null, b)))), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 22,
      letterSpacing: '-0.01em',
      color: 'var(--slate-900)',
      margin: 0
    }
  }, title), subtitle && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--fg-3)'
    }
  }, subtitle)), /*#__PURE__*/React.createElement(SearchBar, null), /*#__PURE__*/React.createElement(IconBtn, {
    name: "bell",
    ariaLabel: "Notifikasi"
  }), /*#__PURE__*/React.createElement(IconBtn, {
    name: "help-circle",
    ariaLabel: "Bantuan"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setMenuOpen(!menuOpen),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '6px 8px 6px 6px',
      borderRadius: 999,
      border: '1px solid var(--border)',
      background: 'white',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: userName,
    size: 32
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--slate-900)',
      fontFamily: 'var(--font-display)'
    }
  }, userName.split(' ').slice(0, 2).join(' ')), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--fg-3)'
    }
  }, userRole)), /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-down",
    size: 14,
    style: {
      color: 'var(--fg-3)'
    }
  })), menuOpen && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: 0,
      top: 'calc(100% + 8px)',
      minWidth: 200,
      background: 'white',
      borderRadius: 12,
      padding: 6,
      boxShadow: '0 12px 32px rgba(15,14,10,0.10), 0 4px 8px rgba(15,14,10,0.05)',
      border: '1px solid var(--border)',
      zIndex: 20
    }
  }, /*#__PURE__*/React.createElement(MenuItem, {
    icon: "user",
    label: "Profil saya"
  }), /*#__PURE__*/React.createElement(MenuItem, {
    icon: "settings",
    label: "Pengaturan akun"
  }), /*#__PURE__*/React.createElement(Divider, {
    style: {
      margin: '4px 0'
    }
  }), /*#__PURE__*/React.createElement(MenuItem, {
    icon: "log-out",
    label: "Keluar",
    tone: "danger",
    onClick: onLogout
  }))));
}
function MenuItem({
  icon,
  label,
  onClick,
  tone
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    style: {
      width: '100%',
      textAlign: 'left',
      padding: '8px 10px',
      borderRadius: 8,
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      color: tone === 'danger' ? 'var(--danger)' : 'var(--slate-700)',
      fontSize: 13,
      fontFamily: 'var(--font-body)',
      fontWeight: 500
    },
    onMouseEnter: e => e.currentTarget.style.background = 'var(--slate-100)',
    onMouseLeave: e => e.currentTarget.style.background = 'transparent'
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 16
  }), label);
}
function SearchBar() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      background: 'var(--slate-100)',
      borderRadius: 10,
      padding: '8px 12px',
      width: 280,
      color: 'var(--fg-3)',
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    size: 16
  }), /*#__PURE__*/React.createElement("input", {
    placeholder: "Cari penduduk, surat, RT\u2026",
    style: {
      flex: 1,
      background: 'transparent',
      border: 'none',
      outline: 'none',
      fontFamily: 'var(--font-body)',
      fontSize: 13,
      color: 'var(--slate-900)'
    }
  }), /*#__PURE__*/React.createElement("kbd", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      padding: '2px 6px',
      background: 'white',
      borderRadius: 4,
      border: '1px solid var(--border)',
      color: 'var(--fg-3)'
    }
  }, "\u2318K"));
}
function AppShell({
  active,
  onNav,
  title,
  subtitle,
  breadcrumb,
  onLogout,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      height: '100%',
      width: '100%',
      background: 'var(--slate-50)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(Sidebar, {
    active: active,
    onNav: onNav
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement(TopBar, {
    title: title,
    subtitle: subtitle,
    breadcrumb: breadcrumb,
    onLogout: onLogout
  }), /*#__PURE__*/React.createElement("main", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '24px 28px'
    }
  }, children)));
}
Object.assign(window, {
  Sidebar,
  NavItem,
  TopBar,
  SearchBar,
  AppShell,
  MenuItem
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/desa-pintar/AppShell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/desa-pintar/Beranda.jsx
try { (() => {
/* Desa Pintar — Beranda (Dashboard) */

function Beranda() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      maxWidth: 1200
    }
  }, /*#__PURE__*/React.createElement(Card, {
    padding: 0,
    style: {
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'linear-gradient(135deg, #EEFBF8 0%, #D3F5EE 100%)',
      padding: '24px 28px',
      display: 'flex',
      alignItems: 'center',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--teal-700)',
      letterSpacing: '0.04em'
    }
  }, "Senin \xB7 18 Mei 2026"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 24,
      margin: '4px 0 6px',
      color: 'var(--slate-900)'
    }
  }, "Selamat pagi, Bu Sri \uD83D\uDC4B"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      color: 'var(--slate-700)',
      margin: 0,
      maxWidth: 520
    }
  }, "Hari ini ada ", /*#__PURE__*/React.createElement("strong", null, "12 surat"), " menunggu paraf, ", /*#__PURE__*/React.createElement("strong", null, "3 KK baru"), " didaftarkan, dan sinkronisasi data RT 4 tertunda. Yuk dicek satu-satu.")), /*#__PURE__*/React.createElement(Button, {
    icon: "file-plus",
    size: "lg"
  }, "Tambah surat baru"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Total Penduduk",
    value: "4.827",
    delta: "12 minggu ini",
    deltaDir: "up"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "KK Terdaftar",
    value: "1.342",
    delta: "4 hari ini",
    deltaDir: "up",
    tint: "teal"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Surat Diproses",
    value: "87",
    delta: "6 vs minggu lalu",
    deltaDir: "down"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "APBDes 2026",
    value: "Rp 1,2 M",
    delta: "62% terpakai",
    deltaDir: "up",
    tint: "sunset"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(SectionHeader, {
    title: "Aktivitas terbaru",
    action: /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      size: "sm",
      iconRight: "arrow-right"
    }, "Lihat semua")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement(Activity, {
    icon: "user-plus",
    tint: "teal",
    who: "Bu Wati",
    what: "mendaftarkan KK baru",
    subject: "Keluarga Sugito \xB7 RT 03/RW 01",
    when: "2 menit lalu"
  }), /*#__PURE__*/React.createElement(Activity, {
    icon: "file-text",
    tint: "amber",
    who: "Pak Bambang",
    what: "menerbitkan Surat Domisili",
    subject: "No. 470/22/SD/V/2026",
    when: "14 menit lalu"
  }), /*#__PURE__*/React.createElement(Activity, {
    icon: "wallet",
    tint: "berry",
    who: "Bu Sri",
    what: "mencatat pengeluaran",
    subject: "Pemeliharaan jalan setapak \xB7 Rp 4.250.000",
    when: "38 menit lalu"
  }), /*#__PURE__*/React.createElement(Activity, {
    icon: "map-pin",
    tint: "teal",
    who: "Sistem",
    what: "memperbarui batas geospasial RT 06",
    subject: "2 polygon disesuaikan",
    when: "1 jam lalu"
  }), /*#__PURE__*/React.createElement(Activity, {
    icon: "alert-triangle",
    tint: "amber",
    who: "Sistem",
    what: "sinkronisasi tertunda",
    subject: "RT 04 \u2014 koneksi tidak stabil",
    when: "2 jam lalu"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(SectionHeader, {
    title: "Surat antrian"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(QueueItem, {
    code: "SD/470/22",
    type: "Domisili",
    who: "Sumarno"
  }), /*#__PURE__*/React.createElement(QueueItem, {
    code: "SKU/471/02",
    type: "Usaha",
    who: "Yatini"
  }), /*#__PURE__*/React.createElement(QueueItem, {
    code: "SKTM/472/11",
    type: "Tidak Mampu",
    who: "Hartono"
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "soft",
    size: "sm",
    fullWidth: true,
    style: {
      marginTop: 12
    }
  }, "Paraf 12 surat sekaligus")), /*#__PURE__*/React.createElement(Card, {
    style: {
      background: 'var(--slate-900)',
      color: 'white'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      opacity: 0.7
    }
  }, "Tips minggu ini"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 16,
      margin: '6px 0 8px'
    }
  }, "Lapor potensi desa"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      lineHeight: 1.55,
      opacity: 0.85
    }
  }, "Tambahkan UMKM atau atraksi wisata baru ke modul Potensi \u2014 biar warga lain bisa lihat di peta publik."), /*#__PURE__*/React.createElement(Button, {
    variant: "soft",
    size: "sm",
    style: {
      marginTop: 12,
      background: 'rgba(255,255,255,0.12)',
      color: 'white'
    },
    iconRight: "arrow-right"
  }, "Buka modul Potensi")))));
}
function SectionHeader({
  title,
  action
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 16,
      color: 'var(--slate-900)',
      margin: 0
    }
  }, title), action);
}
function Activity({
  icon,
  tint,
  who,
  what,
  subject,
  when
}) {
  const tints = {
    teal: 'linear-gradient(135deg,#5DC3B2,#2D8A7B)',
    amber: 'linear-gradient(135deg,#FECB34,#F59E0B)',
    berry: 'linear-gradient(135deg,#FE7346,#DD2666)',
    violet: 'linear-gradient(135deg,#7563D3,#210C2B)'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      padding: '12px 0',
      borderBottom: '1px dashed var(--border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 36,
      borderRadius: 10,
      background: tints[tint],
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 18
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--slate-700)',
      lineHeight: 1.4
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      color: 'var(--slate-900)'
    }
  }, who), " ", what), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--fg-3)',
      marginTop: 2,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, subject)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--fg-3)',
      flexShrink: 0,
      fontFamily: 'var(--font-mono)'
    }
  }, when));
}
function QueueItem({
  code,
  type,
  who
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '8px 10px',
      borderRadius: 10,
      background: 'var(--slate-50)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--slate-900)'
    }
  }, "Surat ", type), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--fg-3)',
      fontFamily: 'var(--font-mono)'
    }
  }, code, " \xB7 ", who)), /*#__PURE__*/React.createElement(Badge, {
    tone: "warning",
    dot: false
  }, "Menunggu"));
}
Object.assign(window, {
  Beranda
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/desa-pintar/Beranda.jsx", error: String((e && e.message) || e) }); }

// ui_kits/desa-pintar/Components.jsx
try { (() => {
/* Desa Pintar — Shared atoms.
   Exposes: Button, IconBtn, Input, Card, StatCard, Badge, Tag,
   Avatar, Icon, EmptyState, Toast, Divider, RowActions, ProgressBar */

// ----- Icon (Lucide wrapper) -----
function Icon({
  name,
  size = 18,
  color,
  strokeWidth = 1.75,
  style,
  className
}) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current && window.lucide) window.lucide.createIcons({
      icons: window.lucide.icons,
      attrs: {},
      nameAttr: 'data-lucide'
    });
  }, [name]);
  return /*#__PURE__*/React.createElement("i", {
    ref: ref,
    "data-lucide": name,
    "data-size": size,
    style: {
      width: size,
      height: size,
      color,
      display: 'inline-flex',
      alignItems: 'center',
      ...(style || {})
    },
    className: className
  });
}

// ----- Button -----
function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  onClick,
  disabled,
  type = 'button',
  style,
  fullWidth
}) {
  const palettes = {
    primary: {
      background: disabled ? '#CCC9C1' : 'var(--teal-400)',
      color: 'white',
      boxShadow: disabled ? 'none' : '0 8px 24px rgba(93,195,178,0.28)',
      border: 'none'
    },
    secondary: {
      background: 'white',
      color: 'var(--teal-700)',
      border: '1px solid var(--slate-300)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--teal-700)',
      border: 'none'
    },
    danger: {
      background: 'var(--danger)',
      color: 'white',
      border: 'none'
    },
    dark: {
      background: 'var(--slate-900)',
      color: 'white',
      border: 'none'
    },
    soft: {
      background: 'var(--teal-50)',
      color: 'var(--teal-700)',
      border: 'none'
    }
  };
  const sizes = {
    sm: {
      padding: '6px 12px',
      fontSize: 13,
      borderRadius: 10,
      gap: 6
    },
    md: {
      padding: '10px 18px',
      fontSize: 14,
      borderRadius: 12,
      gap: 8
    },
    lg: {
      padding: '14px 22px',
      fontSize: 15,
      borderRadius: 14,
      gap: 10
    }
  };
  return /*#__PURE__*/React.createElement("button", {
    type: type,
    onClick: onClick,
    disabled: disabled,
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      whiteSpace: 'nowrap',
      lineHeight: 1,
      transition: 'all 200ms cubic-bezier(.16,1,.3,1)',
      width: fullWidth ? '100%' : undefined,
      ...palettes[variant],
      ...sizes[size],
      ...style
    },
    onMouseDown: e => !disabled && (e.currentTarget.style.transform = 'scale(0.98)'),
    onMouseUp: e => e.currentTarget.style.transform = 'scale(1)',
    onMouseLeave: e => e.currentTarget.style.transform = 'scale(1)'
  }, icon && /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: size === 'sm' ? 14 : 16
  }), children, iconRight && /*#__PURE__*/React.createElement(Icon, {
    name: iconRight,
    size: size === 'sm' ? 14 : 16
  }));
}
function IconBtn({
  name,
  onClick,
  size = 36,
  ariaLabel,
  variant = 'ghost'
}) {
  const palettes = {
    ghost: {
      background: 'transparent',
      color: 'var(--fg-2)'
    },
    soft: {
      background: 'var(--slate-100)',
      color: 'var(--fg-1)'
    },
    teal: {
      background: 'var(--teal-50)',
      color: 'var(--teal-700)'
    }
  };
  return /*#__PURE__*/React.createElement("button", {
    "aria-label": ariaLabel,
    onClick: onClick,
    style: {
      width: size,
      height: size,
      borderRadius: 10,
      border: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 150ms',
      ...palettes[variant]
    },
    onMouseEnter: e => e.currentTarget.style.background = 'var(--slate-200)',
    onMouseLeave: e => e.currentTarget.style.background = palettes[variant].background
  }, /*#__PURE__*/React.createElement(Icon, {
    name: name,
    size: Math.round(size * 0.5)
  }));
}

// ----- Input -----
function Input({
  label,
  hint,
  error,
  icon,
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled,
  style
}) {
  const [focused, setFocused] = React.useState(false);
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: 'var(--slate-700)'
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      background: disabled ? 'var(--slate-100)' : 'white',
      border: `1px solid ${error ? 'var(--danger)' : focused ? 'var(--teal-400)' : 'var(--slate-300)'}`,
      borderRadius: 10,
      padding: '10px 12px',
      boxShadow: focused ? '0 0 0 3px rgba(93,195,178,0.22)' : 'none',
      transition: 'all 150ms'
    }
  }, icon && /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 16,
    style: {
      color: 'var(--fg-3)'
    }
  }), /*#__PURE__*/React.createElement("input", {
    type: type,
    value: value ?? '',
    onChange: e => onChange && onChange(e.target.value),
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    placeholder: placeholder,
    disabled: disabled,
    style: {
      flex: 1,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      fontFamily: 'var(--font-body)',
      fontSize: 14,
      color: 'var(--slate-900)'
    }
  })), error && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--danger)'
    }
  }, error), hint && !error && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--fg-3)'
    }
  }, hint));
}

// ----- Card -----
function Card({
  children,
  padding = 20,
  style,
  onClick,
  interactive
}) {
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    style: {
      background: 'white',
      borderRadius: 16,
      boxShadow: '0 1px 3px rgba(15,14,10,0.06), 0 1px 2px rgba(15,14,10,0.04)',
      padding,
      transition: 'all 200ms cubic-bezier(.16,1,.3,1)',
      cursor: interactive ? 'pointer' : 'default',
      ...style
    },
    onMouseEnter: interactive ? e => {
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(15,14,10,0.08), 0 2px 4px rgba(15,14,10,0.04)';
      e.currentTarget.style.transform = 'translateY(-2px)';
    } : undefined,
    onMouseLeave: interactive ? e => {
      e.currentTarget.style.boxShadow = '0 1px 3px rgba(15,14,10,0.06), 0 1px 2px rgba(15,14,10,0.04)';
      e.currentTarget.style.transform = 'translateY(0)';
    } : undefined
  }, children);
}

// ----- StatCard -----
function StatCard({
  label,
  value,
  delta,
  deltaDir = 'up',
  tint
}) {
  const tints = {
    teal: {
      background: 'linear-gradient(135deg,#5DC3B2 0%, #2D8A7B 100%)',
      color: 'white'
    },
    sunset: {
      background: 'linear-gradient(135deg,#FE7346 0%, #DD2666 100%)',
      color: 'white'
    },
    twilight: {
      background: 'linear-gradient(135deg,#FE424E 0%, #7563D3 60%, #210C2B 100%)',
      color: 'white'
    },
    dawn: {
      background: 'linear-gradient(135deg,#FECB34 0%, #FE424E 100%)',
      color: 'white'
    },
    plain: {
      background: 'white',
      color: 'var(--slate-900)'
    }
  };
  const t = tints[tint || 'plain'];
  const onDark = t.color === 'white';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      ...t,
      borderRadius: 16,
      padding: '16px 18px',
      boxShadow: '0 1px 3px rgba(15,14,10,0.06)',
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      opacity: onDark ? 0.85 : 0.6,
      color: t.color
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 30,
      letterSpacing: '-0.02em',
      lineHeight: 1,
      color: t.color
    }
  }, value), delta && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      marginTop: 2,
      color: onDark ? 'rgba(255,255,255,0.92)' : deltaDir === 'up' ? 'var(--success)' : 'var(--danger)'
    }
  }, deltaDir === 'up' ? '↑' : '↓', " ", delta));
}

// ----- Badge -----
function Badge({
  children,
  tone = 'neutral',
  dot = true
}) {
  const tones = {
    success: {
      bg: '#DCFCE7',
      fg: '#14532D',
      dot: '#16A34A'
    },
    warning: {
      bg: '#FEF3C7',
      fg: '#78350F',
      dot: '#F59E0B'
    },
    danger: {
      bg: '#FEE2E2',
      fg: '#7F1D1D',
      dot: '#DC2626'
    },
    info: {
      bg: '#DBEAFE',
      fg: '#1E3A8A',
      dot: '#2563EB'
    },
    neutral: {
      bg: 'var(--slate-200)',
      fg: 'var(--slate-700)',
      dot: '#9A958A'
    },
    teal: {
      bg: 'var(--teal-50)',
      fg: 'var(--teal-700)',
      dot: 'var(--teal-400)'
    }
  };
  const t = tones[tone];
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 10px',
      borderRadius: 999,
      background: t.bg,
      color: t.fg,
      fontSize: 12,
      fontWeight: 600
    }
  }, dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: t.dot
    }
  }), children);
}

// ----- Tag (category chip) -----
function Tag({
  children,
  tone = 'teal'
}) {
  const tones = {
    teal: {
      bg: 'var(--teal-50)',
      fg: 'var(--teal-700)'
    },
    amber: {
      bg: '#FEF3C7',
      fg: '#78350F'
    },
    berry: {
      bg: '#FCE7F3',
      fg: '#9D174D'
    },
    violet: {
      bg: '#F3E8FF',
      fg: '#581C87'
    },
    slate: {
      bg: 'var(--slate-100)',
      fg: 'var(--slate-700)'
    }
  };
  const t = tones[tone];
  return /*#__PURE__*/React.createElement("span", {
    style: {
      padding: '5px 12px',
      borderRadius: 8,
      background: t.bg,
      color: t.fg,
      fontSize: 12,
      fontWeight: 600
    }
  }, children);
}

// ----- Avatar -----
function Avatar({
  name,
  size = 36,
  tint = 'teal'
}) {
  const initials = (name || '?').split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
  const tints = {
    teal: 'linear-gradient(135deg,#5DC3B2,#2D8A7B)',
    sunset: 'linear-gradient(135deg,#FE7346,#DD2666)',
    amber: 'linear-gradient(135deg,#FECB34,#FE7346)',
    violet: 'linear-gradient(135deg,#7563D3,#210C2B)'
  };
  return /*#__PURE__*/React.createElement("span", {
    style: {
      width: size,
      height: size,
      borderRadius: '50%',
      background: tints[tint],
      color: 'white',
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: Math.round(size * 0.38),
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }
  }, initials);
}

// ----- Divider -----
function Divider({
  vertical,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--border)',
      ...(vertical ? {
        width: 1,
        alignSelf: 'stretch'
      } : {
        height: 1,
        width: '100%'
      }),
      ...style
    }
  });
}

// ----- ProgressBar -----
function ProgressBar({
  value,
  max = 100,
  tint = 'teal',
  height = 8
}) {
  const tints = {
    teal: '#5DC3B2',
    sunset: 'linear-gradient(90deg,#FECB34,#FE7346,#FE424E)',
    success: '#16A34A'
  };
  const pct = Math.min(100, Math.max(0, value / max * 100));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--slate-200)',
      borderRadius: 999,
      height,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${pct}%`,
      height: '100%',
      background: tints[tint],
      borderRadius: 999,
      transition: 'width 360ms cubic-bezier(.16,1,.3,1)'
    }
  }));
}

// ----- EmptyState -----
function EmptyState({
  icon = 'inbox',
  title,
  desc,
  action
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '48px 24px',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 56,
      height: 56,
      borderRadius: 16,
      background: 'var(--teal-50)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--teal-600)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 26
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 16,
      color: 'var(--slate-900)'
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--fg-3)',
      maxWidth: 320,
      lineHeight: 1.5
    }
  }, desc), action);
}

// ----- Toast -----
function Toast({
  tone = 'success',
  title,
  desc,
  onClose
}) {
  const tones = {
    success: {
      bg: '#DCFCE7',
      fg: '#14532D',
      dot: '#16A34A',
      glyph: '✓'
    },
    warning: {
      bg: '#FEF3C7',
      fg: '#78350F',
      dot: '#F59E0B',
      glyph: '!'
    },
    danger: {
      bg: '#FEE2E2',
      fg: '#7F1D1D',
      dot: '#DC2626',
      glyph: '×'
    },
    info: {
      bg: '#DBEAFE',
      fg: '#1E3A8A',
      dot: '#2563EB',
      glyph: 'i'
    }
  };
  const t = tones[tone];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: t.bg,
      color: t.fg,
      borderRadius: 12,
      padding: '12px 14px',
      display: 'flex',
      gap: 12,
      boxShadow: '0 12px 32px rgba(15,14,10,0.08), 0 4px 8px rgba(15,14,10,0.04)',
      minWidth: 280,
      maxWidth: 420
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 22,
      height: 22,
      flex: '0 0 22px',
      borderRadius: '50%',
      background: t.dot,
      color: 'white',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 700,
      fontSize: 13,
      fontFamily: 'var(--font-display)',
      marginTop: 1
    }
  }, t.glyph), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 13
    }
  }, title), desc && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      lineHeight: 1.45,
      opacity: 0.92
    }
  }, desc)), onClose && /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    "aria-label": "Tutup",
    style: {
      background: 'transparent',
      border: 'none',
      color: t.fg,
      cursor: 'pointer',
      opacity: 0.6,
      padding: 0
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "x",
    size: 16
  })));
}
Object.assign(window, {
  Icon,
  Button,
  IconBtn,
  Input,
  Card,
  StatCard,
  Badge,
  Tag,
  Avatar,
  Divider,
  ProgressBar,
  EmptyState,
  Toast
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/desa-pintar/Components.jsx", error: String((e && e.message) || e) }); }

// ui_kits/desa-pintar/Demografi.jsx
try { (() => {
/* Desa Pintar — Demografi (Penduduk table) */

const SAMPLE_PENDUDUK = [{
  nik: '3310091205930002',
  nama: 'Budi Santoso',
  kelamin: 'L',
  usia: 32,
  rt: '01/02',
  pekerjaan: 'Petani',
  status: 'aktif'
}, {
  nik: '3310091508870004',
  nama: 'Sri Wahyuni',
  kelamin: 'P',
  usia: 38,
  rt: '01/01',
  pekerjaan: 'Sekretaris Desa',
  status: 'aktif'
}, {
  nik: '3310090203910011',
  nama: 'Bambang Iskandar',
  kelamin: 'L',
  usia: 34,
  rt: '02/03',
  pekerjaan: 'Pedagang',
  status: 'aktif'
}, {
  nik: '3310092106650019',
  nama: 'Yatini Lestari',
  kelamin: 'P',
  usia: 60,
  rt: '03/01',
  pekerjaan: 'Ibu rumah tangga',
  status: 'aktif'
}, {
  nik: '3310090904820027',
  nama: 'Hartono Putra',
  kelamin: 'L',
  usia: 42,
  rt: '04/02',
  pekerjaan: 'Buruh tani',
  status: 'pindah'
}, {
  nik: '3310091112050033',
  nama: 'Dwi Anggraini',
  kelamin: 'P',
  usia: 18,
  rt: '02/02',
  pekerjaan: 'Pelajar',
  status: 'aktif'
}, {
  nik: '3310090408740041',
  nama: 'Sugito Wibowo',
  kelamin: 'L',
  usia: 51,
  rt: '05/03',
  pekerjaan: 'Tukang kayu',
  status: 'aktif'
}, {
  nik: '3310091807960058',
  nama: 'Mei Rahmawati',
  kelamin: 'P',
  usia: 29,
  rt: '03/02',
  pekerjaan: 'Guru SD',
  status: 'aktif'
}, {
  nik: '3310090501680064',
  nama: 'Wahyono Saputra',
  kelamin: 'L',
  usia: 57,
  rt: '06/01',
  pekerjaan: 'Kepala Desa',
  status: 'aktif'
}, {
  nik: '3310092009000072',
  nama: 'Nurul Hidayah',
  kelamin: 'P',
  usia: 25,
  rt: '04/01',
  pekerjaan: 'Bidan',
  status: 'baru'
}];
function Demografi() {
  const [filter, setFilter] = React.useState('semua');
  const [query, setQuery] = React.useState('');
  const filtered = SAMPLE_PENDUDUK.filter(p => filter === 'semua' || filter === 'L' && p.kelamin === 'L' || filter === 'P' && p.kelamin === 'P').filter(p => !query || p.nama.toLowerCase().includes(query.toLowerCase()) || p.nik.includes(query));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      maxWidth: 1200
    }
  }, /*#__PURE__*/React.createElement(Card, {
    padding: 16
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(SegmentControl, {
    value: filter,
    onChange: setFilter,
    options: [{
      id: 'semua',
      label: 'Semua',
      count: SAMPLE_PENDUDUK.length
    }, {
      id: 'L',
      label: 'Laki-laki',
      count: SAMPLE_PENDUDUK.filter(p => p.kelamin === 'L').length
    }, {
      id: 'P',
      label: 'Perempuan',
      count: SAMPLE_PENDUDUK.filter(p => p.kelamin === 'P').length
    }]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      maxWidth: 280
    }
  }, /*#__PURE__*/React.createElement(Input, {
    icon: "search",
    placeholder: "Cari nama atau NIK\u2026",
    value: query,
    onChange: setQuery
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    icon: "filter"
  }, "Filter lanjut"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    icon: "download"
  }, "Ekspor CSV"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    icon: "user-plus"
  }, "Tambah penduduk"))), /*#__PURE__*/React.createElement(Card, {
    padding: 0
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      overflowX: 'auto'
    }
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    style: {
      background: 'var(--slate-50)',
      borderBottom: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement(Th, null, "Nama"), /*#__PURE__*/React.createElement(Th, null, "NIK"), /*#__PURE__*/React.createElement(Th, null, "L/P"), /*#__PURE__*/React.createElement(Th, null, "Usia"), /*#__PURE__*/React.createElement(Th, null, "RT/RW"), /*#__PURE__*/React.createElement(Th, null, "Pekerjaan"), /*#__PURE__*/React.createElement(Th, null, "Status"), /*#__PURE__*/React.createElement(Th, {
    style: {
      width: 60
    }
  }))), /*#__PURE__*/React.createElement("tbody", null, filtered.map((p, i) => /*#__PURE__*/React.createElement(PendudukRow, {
    key: p.nik,
    p: p,
    odd: i % 2 === 1
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 20px',
      borderTop: '1px solid var(--border)',
      background: 'var(--slate-50)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--fg-3)'
    }
  }, "Menampilkan ", /*#__PURE__*/React.createElement("strong", null, filtered.length), " dari ", SAMPLE_PENDUDUK.length, " jiwa"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(IconBtn, {
    name: "chevron-left",
    ariaLabel: "Sebelumnya"
  }), [1, 2, 3, '…', 23].map((p, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    style: {
      width: 32,
      height: 32,
      borderRadius: 8,
      border: 'none',
      cursor: 'pointer',
      background: p === 1 ? 'var(--teal-400)' : 'transparent',
      color: p === 1 ? 'white' : 'var(--slate-700)',
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: 13
    }
  }, p)), /*#__PURE__*/React.createElement(IconBtn, {
    name: "chevron-right",
    ariaLabel: "Berikutnya"
  })))));
}
function Th({
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: 'left',
      padding: '12px 16px',
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: 'var(--fg-3)',
      fontFamily: 'var(--font-body)',
      ...style
    }
  }, children);
}
function PendudukRow({
  p,
  odd
}) {
  const [hover, setHover] = React.useState(false);
  const statusTone = p.status === 'aktif' ? 'success' : p.status === 'baru' ? 'info' : 'neutral';
  const statusLabel = p.status === 'aktif' ? 'Aktif' : p.status === 'baru' ? 'Baru' : 'Pindah';
  return /*#__PURE__*/React.createElement("tr", {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      background: hover ? 'var(--teal-50)' : odd ? 'var(--slate-50)' : 'white',
      borderBottom: '1px solid var(--border)',
      transition: 'background 120ms'
    }
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '12px 16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: p.nama,
    size: 32,
    tint: p.kelamin === 'P' ? 'sunset' : 'teal'
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600,
      color: 'var(--slate-900)'
    }
  }, p.nama))), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '12px 16px',
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      color: 'var(--slate-700)'
    }
  }, p.nik), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '12px 16px',
      color: 'var(--slate-700)'
    }
  }, p.kelamin), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '12px 16px',
      color: 'var(--slate-700)'
    }
  }, p.usia), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '12px 16px',
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      color: 'var(--slate-700)'
    }
  }, p.rt), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '12px 16px',
      color: 'var(--slate-700)'
    }
  }, p.pekerjaan), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '12px 16px'
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: statusTone
  }, statusLabel)), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '12px 16px',
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement(IconBtn, {
    name: "more-horizontal",
    size: 28,
    ariaLabel: "Aksi"
  })));
}
function SegmentControl({
  value,
  onChange,
  options
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      background: 'var(--slate-100)',
      borderRadius: 10,
      padding: 3,
      gap: 2
    }
  }, options.map(o => /*#__PURE__*/React.createElement("button", {
    key: o.id,
    onClick: () => onChange(o.id),
    style: {
      padding: '7px 14px',
      borderRadius: 8,
      border: 'none',
      background: value === o.id ? 'white' : 'transparent',
      color: value === o.id ? 'var(--slate-900)' : 'var(--slate-600)',
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      fontSize: 13,
      boxShadow: value === o.id ? '0 1px 3px rgba(15,14,10,0.08)' : 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, o.label, o.count != null && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--fg-3)',
      fontFamily: 'var(--font-mono)'
    }
  }, o.count))));
}
Object.assign(window, {
  Demografi,
  SegmentControl
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/desa-pintar/Demografi.jsx", error: String((e && e.message) || e) }); }

// ui_kits/desa-pintar/Keuangan.jsx
try { (() => {
/* Desa Pintar — Keuangan (APBDes) */

const CATEGORIES = [{
  id: 'pelayanan',
  label: 'Penyelenggaraan Pemerintahan',
  alloc: 480,
  used: 312,
  color: '#5DC3B2'
}, {
  id: 'pembangunan',
  label: 'Pembangunan Desa',
  alloc: 520,
  used: 348,
  color: '#F59E0B'
}, {
  id: 'pembinaan',
  label: 'Pembinaan Masyarakat',
  alloc: 100,
  used: 41,
  color: '#FE7346'
}, {
  id: 'pemberdayaan',
  label: 'Pemberdayaan Masyarakat',
  alloc: 80,
  used: 28,
  color: '#7563D3'
}, {
  id: 'darurat',
  label: 'Tak Terduga / Darurat',
  alloc: 20,
  used: 6,
  color: '#DD2666'
}];
const TRANSACTIONS = [{
  date: '17 Mei 2026',
  kategori: 'Pembangunan',
  desc: 'Pemeliharaan jalan setapak RT 03',
  amount: -4250000,
  status: 'lunas'
}, {
  date: '16 Mei 2026',
  kategori: 'Pelayanan',
  desc: 'ATK kantor desa (Mei)',
  amount: -1820000,
  status: 'lunas'
}, {
  date: '15 Mei 2026',
  kategori: 'Pemberdayaan',
  desc: 'Pelatihan UMKM batik tulis',
  amount: -8400000,
  status: 'proses'
}, {
  date: '14 Mei 2026',
  kategori: 'Pendapatan',
  desc: 'Dana Desa Triwulan II',
  amount: 312000000,
  status: 'lunas'
}, {
  date: '13 Mei 2026',
  kategori: 'Pembinaan',
  desc: 'Posyandu balita RT 02',
  amount: -2150000,
  status: 'lunas'
}, {
  date: '12 Mei 2026',
  kategori: 'Pelayanan',
  desc: 'Honor operator SID (Mei)',
  amount: -3500000,
  status: 'lunas'
}];
function fmt(n) {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '+';
  return sign + 'Rp ' + abs.toLocaleString('id-ID');
}
function Keuangan() {
  const totalAlloc = CATEGORIES.reduce((a, c) => a + c.alloc, 0);
  const totalUsed = CATEGORIES.reduce((a, c) => a + c.used, 0);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      maxWidth: 1200
    }
  }, /*#__PURE__*/React.createElement(Card, {
    padding: 0,
    style: {
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'linear-gradient(135deg, #FECB34 0%, #FE7346 50%, #FE424E 100%)',
      padding: '28px 32px',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      opacity: 0.85
    }
  }, "APBDes 2026"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 44,
      letterSpacing: '-0.02em',
      lineHeight: 1.05,
      marginTop: 4
    }
  }, "Rp ", totalAlloc.toLocaleString('id-ID'), ".000.000"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      opacity: 0.92,
      marginTop: 6
    }
  }, "Anggaran total tahun berjalan \xB7 ", Math.round(totalUsed / totalAlloc * 100), "% sudah terealisasi")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      minWidth: 180
    }
  }, /*#__PURE__*/React.createElement(KPILite, {
    label: "Terpakai",
    value: `Rp ${totalUsed.toLocaleString('id-ID')} jt`
  }), /*#__PURE__*/React.createElement(KPILite, {
    label: "Tersisa",
    value: `Rp ${(totalAlloc - totalUsed).toLocaleString('id-ID')} jt`
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "dark",
    icon: "plus",
    style: {
      background: 'rgba(15,14,10,0.4)'
    }
  }, "Catat transaksi"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.4fr 1fr',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 16,
      color: 'var(--slate-900)',
      margin: 0
    }
  }, "Alokasi per bidang"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    iconRight: "external-link"
  }, "Lihat APBDes lengkap")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, CATEGORIES.map(c => /*#__PURE__*/React.createElement(CategoryBar, {
    key: c.id,
    c: c
  })))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 16,
      color: 'var(--slate-900)',
      margin: '0 0 14px'
    }
  }, "Komposisi pengeluaran"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement(Donut, {
    data: CATEGORIES.map(c => ({
      value: c.used,
      color: c.color
    })),
    total: totalUsed
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      flex: 1
    }
  }, CATEGORIES.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.id,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 10,
      height: 10,
      borderRadius: 3,
      background: c.color,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--slate-700)',
      flex: 1,
      minWidth: 0,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, c.label.split(' ').slice(0, 2).join(' ')), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: 'var(--slate-900)',
      fontFamily: 'var(--font-mono)'
    }
  }, Math.round(c.used / totalUsed * 100), "%"))))))), /*#__PURE__*/React.createElement(Card, {
    padding: 0
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 16,
      color: 'var(--slate-900)',
      margin: 0
    }
  }, "Transaksi terbaru"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    icon: "filter"
  }, "Filter"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    icon: "download"
  }, "Ekspor"))), /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    style: {
      background: 'var(--slate-50)',
      borderBottom: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement(Th, null, "Tanggal"), /*#__PURE__*/React.createElement(Th, null, "Kategori"), /*#__PURE__*/React.createElement(Th, null, "Deskripsi"), /*#__PURE__*/React.createElement(Th, {
    style: {
      textAlign: 'right'
    }
  }, "Nominal"), /*#__PURE__*/React.createElement(Th, null, "Status"))), /*#__PURE__*/React.createElement("tbody", null, TRANSACTIONS.map((t, i) => /*#__PURE__*/React.createElement("tr", {
    key: i,
    style: {
      borderBottom: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '12px 16px',
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      color: 'var(--slate-700)'
    }
  }, t.date), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '12px 16px'
    }
  }, /*#__PURE__*/React.createElement(Tag, {
    tone: t.kategori === 'Pendapatan' ? 'teal' : 'amber'
  }, t.kategori)), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '12px 16px',
      color: 'var(--slate-900)',
      fontWeight: 500
    }
  }, t.desc), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '12px 16px',
      textAlign: 'right',
      fontFamily: 'var(--font-mono)',
      fontWeight: 600,
      color: t.amount > 0 ? 'var(--success)' : 'var(--slate-900)'
    }
  }, fmt(t.amount)), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '12px 16px'
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: t.status === 'lunas' ? 'success' : 'warning'
  }, t.status === 'lunas' ? 'Lunas' : 'Proses'))))))));
}
function KPILite({
  label,
  value
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      color: 'white'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      opacity: 0.8
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 17,
      lineHeight: 1.1
    }
  }, value));
}
function CategoryBar({
  c
}) {
  const pct = c.used / c.alloc * 100;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 10,
      height: 10,
      borderRadius: 3,
      background: c.color
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--slate-900)',
      fontFamily: 'var(--font-display)'
    }
  }, c.label)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--slate-700)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontWeight: 600
    }
  }, "Rp ", c.used, " jt"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--fg-3)'
    }
  }, " / ", c.alloc, " jt"))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 8,
      background: 'var(--slate-200)',
      borderRadius: 999,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      width: `${pct}%`,
      background: c.color,
      borderRadius: 999,
      transition: 'width 360ms cubic-bezier(.16,1,.3,1)'
    }
  })));
}
function Donut({
  data,
  total,
  size = 160,
  thickness = 28
}) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const sum = data.reduce((a, d) => a + d.value, 0);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: size,
      height: size,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: `0 0 ${size} ${size}`,
    style: {
      transform: 'rotate(-90deg)'
    }
  }, data.map((d, i) => {
    const frac = d.value / sum;
    const dash = frac * c;
    const seg = /*#__PURE__*/React.createElement("circle", {
      key: i,
      cx: size / 2,
      cy: size / 2,
      r: r,
      fill: "transparent",
      stroke: d.color,
      strokeWidth: thickness,
      strokeDasharray: `${dash} ${c - dash}`,
      strokeDashoffset: -offset
    });
    offset += dash;
    return seg;
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: 'var(--fg-3)'
    }
  }, "Terpakai"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 24,
      color: 'var(--slate-900)'
    }
  }, "Rp ", total, " jt")));
}
Object.assign(window, {
  Keuangan
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/desa-pintar/Keuangan.jsx", error: String((e && e.message) || e) }); }

// ui_kits/desa-pintar/Login.jsx
try { (() => {
/* Desa Pintar — Login screen.
   Split layout: branded teal panel on left, form on right.
   No real auth; "Masuk" calls onLogin. */

function Login({
  onLogin
}) {
  const [email, setEmail] = React.useState('sri.wahyuni@desa.id');
  const [pwd, setPwd] = React.useState('••••••••');
  const [remember, setRemember] = React.useState(true);
  const [shake, setShake] = React.useState(false);
  function submit(e) {
    e && e.preventDefault();
    if (!email || !pwd) {
      setShake(true);
      setTimeout(() => setShake(false), 360);
      return;
    }
    onLogin && onLogin();
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      height: '100%',
      width: '100%',
      background: 'var(--slate-50)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      background: 'linear-gradient(135deg,#5DC3B2 0%, #2D8A7B 60%, #1A4F47 100%)',
      position: 'relative',
      padding: 48,
      display: 'flex',
      flexDirection: 'column',
      color: 'white',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: -120,
      top: -120,
      width: 420,
      height: 420,
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(254,116,70,0.45), transparent 60%)',
      filter: 'blur(40px)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: -80,
      bottom: -80,
      width: 360,
      height: 360,
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(221,38,102,0.35), transparent 60%)',
      filter: 'blur(50px)'
    }
  }), /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-desapintar-mono-white.svg",
    alt: "Desa Pintar",
    style: {
      height: 44,
      alignSelf: 'flex-start',
      position: 'relative',
      zIndex: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      maxWidth: 480,
      position: 'relative',
      zIndex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      opacity: 0.85,
      marginBottom: 16
    }
  }, "v 2.4.0 \xB7 Klaten Edition"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: 48,
      lineHeight: 1.05,
      letterSpacing: '-0.03em',
      margin: 0
    }
  }, "Inovasi Desa,", /*#__PURE__*/React.createElement("br", null), "Membangun Indonesia."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 16,
      lineHeight: 1.6,
      marginTop: 20,
      opacity: 0.92,
      maxWidth: 420
    }
  }, "Satu data tunggal yang terbuka untuk seluruh layanan desa \u2014 administrasi, keuangan, pemetaan, sampai pelayanan warga. Cukup dari satu pintu."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 20,
      marginTop: 32
    }
  }, /*#__PURE__*/React.createElement(Pill, {
    icon: "users",
    label: "80.000+ jiwa terdata"
  }), /*#__PURE__*/React.createElement(Pill, {
    icon: "map-pin",
    label: "312 desa aktif"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      opacity: 0.7,
      position: 'relative',
      zIndex: 1
    }
  }, "\xA9 2026 PT Sandbox Indonesia Juara")), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 480,
      flexShrink: 0,
      padding: '64px 56px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      background: 'white',
      animation: shake ? 'shake 360ms cubic-bezier(.36,.07,.19,.97)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("style", null, `@keyframes shake { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-6px); } 40%, 80% { transform: translateX(6px); } }`), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: 'var(--teal-600)'
    }
  }, "Selamat datang kembali"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 28,
      letterSpacing: '-0.02em',
      color: 'var(--slate-900)',
      margin: '6px 0 6px'
    }
  }, "Masuk ke akun desa kamu"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      color: 'var(--fg-3)',
      marginBottom: 28
    }
  }, "Belum punya akun? ", /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      color: 'var(--teal-700)',
      fontWeight: 600
    }
  }, "Hubungi admin desa"), "."), /*#__PURE__*/React.createElement("form", {
    onSubmit: submit,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Email atau NIK",
    icon: "mail",
    value: email,
    onChange: setEmail,
    placeholder: "kamu@desa.id"
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Kata sandi",
    icon: "lock",
    type: "password",
    value: pwd,
    onChange: setPwd
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontSize: 13,
      color: 'var(--slate-700)',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: remember,
    onChange: e => setRemember(e.target.checked),
    style: {
      accentColor: 'var(--teal-400)'
    }
  }), "Ingat saya"), /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      fontSize: 13,
      color: 'var(--teal-700)',
      fontWeight: 600
    }
  }, "Lupa sandi?")), /*#__PURE__*/React.createElement(Button, {
    type: "submit",
    size: "lg",
    fullWidth: true,
    icon: "log-in",
    onClick: submit
  }, "Masuk")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      margin: '24px 0 16px'
    }
  }, /*#__PURE__*/React.createElement(Divider, null), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--fg-3)'
    }
  }, "atau"), /*#__PURE__*/React.createElement(Divider, null)), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    fullWidth: true,
    icon: "building-2"
  }, "Masuk dengan SSO Pemda")));
}
function Pill({
  icon,
  label
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      background: 'rgba(255,255,255,0.12)',
      border: '1px solid rgba(255,255,255,0.2)',
      borderRadius: 999,
      padding: '8px 14px',
      fontSize: 13,
      fontWeight: 500
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 16
  }), label);
}
Object.assign(window, {
  Login
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/desa-pintar/Login.jsx", error: String((e && e.message) || e) }); }

// ui_kits/desa-pintar/Peta.jsx
try { (() => {
/* Desa Pintar — Peta Desa (Geospasial split view) */

function Peta() {
  const [layers, setLayers] = React.useState({
    boundary: true,
    parcel: true,
    road: true,
    water: true,
    facility: true,
    potensi: false,
    poverty: false
  });
  const [selected, setSelected] = React.useState('rt03');
  const toggle = k => setLayers(s => ({
    ...s,
    [k]: !s[k]
  }));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '320px 1fr 300px',
      gap: 16,
      height: 'calc(100vh - 72px - 48px)',
      minHeight: 520
    }
  }, /*#__PURE__*/React.createElement(Card, {
    padding: 0,
    style: {
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px 18px',
      borderBottom: '1px solid var(--border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'var(--fg-3)'
    }
  }, "Lapis peta"), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 16,
      margin: '4px 0 0',
      color: 'var(--slate-900)'
    }
  }, "Desa Klaten Selatan")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14,
      flex: 1,
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement(LayerToggle, {
    on: layers.boundary,
    onChange: () => toggle('boundary'),
    icon: "hexagon",
    color: "#5DC3B2",
    label: "Batas desa & RT/RW",
    sub: "6 RT, 3 RW"
  }), /*#__PURE__*/React.createElement(LayerToggle, {
    on: layers.parcel,
    onChange: () => toggle('parcel'),
    icon: "grid-3x3",
    color: "#7563D3",
    label: "Bidang tanah",
    sub: "1.342 bidang"
  }), /*#__PURE__*/React.createElement(LayerToggle, {
    on: layers.road,
    onChange: () => toggle('road'),
    icon: "route",
    color: "#1F2937",
    label: "Jaringan jalan",
    sub: "14,2 km"
  }), /*#__PURE__*/React.createElement(LayerToggle, {
    on: layers.water,
    onChange: () => toggle('water'),
    icon: "droplets",
    color: "#2563EB",
    label: "Sungai & irigasi",
    sub: "3 aliran utama"
  }), /*#__PURE__*/React.createElement(LayerToggle, {
    on: layers.facility,
    onChange: () => toggle('facility'),
    icon: "building",
    color: "#F59E0B",
    label: "Fasilitas umum",
    sub: "22 titik"
  }), /*#__PURE__*/React.createElement(LayerToggle, {
    on: layers.potensi,
    onChange: () => toggle('potensi'),
    icon: "sparkles",
    color: "#FE7346",
    label: "Potensi & UMKM",
    sub: "48 lokasi"
  }), /*#__PURE__*/React.createElement(LayerToggle, {
    on: layers.poverty,
    onChange: () => toggle('poverty'),
    icon: "heart-handshake",
    color: "#DD2666",
    label: "Heatmap kemiskinan",
    sub: "data 2025"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14,
      borderTop: '1px solid var(--border)',
      background: 'var(--slate-50)'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "soft",
    size: "sm",
    fullWidth: true,
    icon: "layers"
  }, "Kelola lapisan"))), /*#__PURE__*/React.createElement(Card, {
    padding: 0,
    style: {
      overflow: 'hidden',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(MapStub, {
    layers: layers,
    selected: selected,
    onSelect: setSelected
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 14,
      left: 14,
      display: 'flex',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Tag, {
    tone: "teal"
  }, "Skala 1:5.000"), /*#__PURE__*/React.createElement(Tag, {
    tone: "slate"
  }, "UTM 49S")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 14,
      right: 14,
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(IconBtn, {
    name: "plus",
    variant: "soft"
  }), /*#__PURE__*/React.createElement(IconBtn, {
    name: "minus",
    variant: "soft"
  }), /*#__PURE__*/React.createElement(IconBtn, {
    name: "locate",
    variant: "soft"
  }), /*#__PURE__*/React.createElement(IconBtn, {
    name: "maximize",
    variant: "soft"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 14,
      right: 14,
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(8px)',
      borderRadius: 10,
      padding: '8px 12px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      boxShadow: '0 4px 12px rgba(15,14,10,0.06)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 60,
      height: 4,
      background: 'var(--slate-900)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      fontFamily: 'var(--font-mono)',
      color: 'var(--slate-700)'
    }
  }, "250 m"))), /*#__PURE__*/React.createElement(Card, {
    padding: 0,
    style: {
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px 18px',
      borderBottom: '1px solid var(--border)',
      background: 'linear-gradient(135deg,#EEFBF8,#D3F5EE)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'var(--teal-700)'
    }
  }, "RT terpilih"), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: 18,
      margin: '4px 0 4px',
      color: 'var(--slate-900)'
    }
  }, "RT 03 / RW 01"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--slate-700)',
      display: 'flex',
      gap: 8,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "success",
    dot: false
  }, "Sinkron"), /*#__PURE__*/React.createElement("span", null, "Update: 2 menit lalu"))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 18,
      flex: 1,
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(DetailRow, {
    label: "Ketua RT",
    value: "Pak Sumarno"
  }), /*#__PURE__*/React.createElement(DetailRow, {
    label: "Jumlah KK",
    value: "84",
    mono: true
  }), /*#__PURE__*/React.createElement(DetailRow, {
    label: "Jumlah Jiwa",
    value: "312",
    mono: true
  }), /*#__PURE__*/React.createElement(DetailRow, {
    label: "Bidang Tanah",
    value: "98",
    mono: true
  }), /*#__PURE__*/React.createElement(DetailRow, {
    label: "Luas Wilayah",
    value: "12,4 ha",
    mono: true
  }), /*#__PURE__*/React.createElement(Divider, null), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: 'var(--fg-3)'
    }
  }, "Komposisi usia"), /*#__PURE__*/React.createElement(AgeBar, null), /*#__PURE__*/React.createElement(Divider, null), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: 'var(--fg-3)'
    }
  }, "Fasilitas"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Tag, {
    tone: "amber"
  }, "Posyandu"), /*#__PURE__*/React.createElement(Tag, {
    tone: "amber"
  }, "Masjid"), /*#__PURE__*/React.createElement(Tag, {
    tone: "teal"
  }, "PAUD"), /*#__PURE__*/React.createElement(Tag, {
    tone: "violet"
  }, "Balai RT"))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14,
      borderTop: '1px solid var(--border)',
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    icon: "eye",
    style: {
      flex: 1
    }
  }, "Lihat detail"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    icon: "edit-3",
    style: {
      flex: 1
    }
  }, "Ubah"))));
}
function LayerToggle({
  on,
  onChange,
  icon,
  color,
  label,
  sub
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onChange,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 12px',
      borderRadius: 10,
      background: on ? 'var(--slate-50)' : 'transparent',
      border: 'none',
      cursor: 'pointer',
      textAlign: 'left',
      width: '100%',
      transition: 'background 120ms'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 32,
      height: 32,
      borderRadius: 8,
      background: color + (on ? 'ff' : '20'),
      color: on ? 'white' : color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 16
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--slate-900)',
      fontFamily: 'var(--font-display)'
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--fg-3)'
    }
  }, sub)), /*#__PURE__*/React.createElement(Switch, {
    on: on
  }));
}
function Switch({
  on
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      width: 32,
      height: 18,
      borderRadius: 999,
      background: on ? 'var(--teal-400)' : 'var(--slate-300)',
      position: 'relative',
      flexShrink: 0,
      transition: 'background 200ms'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 2,
      left: on ? 16 : 2,
      width: 14,
      height: 14,
      borderRadius: '50%',
      background: 'white',
      transition: 'left 200ms cubic-bezier(.16,1,.3,1)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
    }
  }));
}
function DetailRow({
  label,
  value,
  mono
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--fg-3)'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600,
      color: 'var(--slate-900)',
      fontFamily: mono ? 'var(--font-mono)' : 'inherit'
    }
  }, value));
}
function AgeBar() {
  const data = [{
    label: '0–14',
    pct: 22,
    color: '#5DC3B2'
  }, {
    label: '15–64',
    pct: 64,
    color: '#F59E0B'
  }, {
    label: '65+',
    pct: 14,
    color: '#7563D3'
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      height: 10,
      borderRadius: 999,
      overflow: 'hidden'
    }
  }, data.map(d => /*#__PURE__*/React.createElement("div", {
    key: d.label,
    style: {
      width: `${d.pct}%`,
      background: d.color
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      fontSize: 11,
      color: 'var(--slate-700)'
    }
  }, data.map(d => /*#__PURE__*/React.createElement("span", {
    key: d.label,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 2,
      background: d.color
    }
  }), d.label, " \xB7 ", /*#__PURE__*/React.createElement("strong", null, d.pct, "%")))));
}

// ----- Stylized map stub -----
function MapStub({
  layers,
  selected,
  onSelect
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      height: '100%',
      position: 'relative',
      background: '#F2F1ED'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 600 400",
    preserveAspectRatio: "xMidYMid slice",
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%'
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("pattern", {
    id: "hatch",
    patternUnits: "userSpaceOnUse",
    width: "6",
    height: "6"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M0,6 L6,0",
    stroke: "rgba(15,14,10,0.04)",
    strokeWidth: "1"
  })), /*#__PURE__*/React.createElement("radialGradient", {
    id: "aura",
    cx: "50%",
    cy: "50%",
    r: "50%"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "rgba(93,195,178,0.25)"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "rgba(93,195,178,0)"
  }))), /*#__PURE__*/React.createElement("rect", {
    x: "0",
    y: "0",
    width: "600",
    height: "400",
    fill: "url(#hatch)"
  }), layers.water && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M -10 240 Q 100 200, 200 230 T 400 220 T 620 250 L 620 280 Q 400 260, 200 270 T -10 270 Z",
    fill: "#BAE6FD",
    opacity: "0.7"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M 80 -10 Q 110 80, 90 160 T 130 290",
    stroke: "#7DD3FC",
    strokeWidth: "6",
    fill: "none",
    opacity: "0.7"
  })), layers.boundary && /*#__PURE__*/React.createElement("path", {
    d: "M 60 80 L 540 70 L 560 200 L 530 340 L 200 360 L 50 280 Z",
    fill: "rgba(93,195,178,0.08)",
    stroke: "#5DC3B2",
    strokeWidth: "2.5",
    strokeDasharray: "6 4"
  }), layers.boundary && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(RTPoly, {
    id: "rt01",
    d: "M 60 80 L 280 78 L 290 200 L 70 210 Z",
    label: "RT 01",
    selected: selected === 'rt01',
    onSelect: onSelect,
    fill: "#5DC3B2"
  }), /*#__PURE__*/React.createElement(RTPoly, {
    id: "rt02",
    d: "M 280 78 L 540 70 L 560 200 L 290 200 Z",
    label: "RT 02",
    selected: selected === 'rt02',
    onSelect: onSelect,
    fill: "#F59E0B"
  }), /*#__PURE__*/React.createElement(RTPoly, {
    id: "rt03",
    d: "M 70 210 L 290 200 L 280 340 L 90 320 Z",
    label: "RT 03",
    selected: selected === 'rt03',
    onSelect: onSelect,
    fill: "#FE7346"
  }), /*#__PURE__*/React.createElement(RTPoly, {
    id: "rt04",
    d: "M 290 200 L 560 200 L 530 340 L 280 340 Z",
    label: "RT 04",
    selected: selected === 'rt04',
    onSelect: onSelect,
    fill: "#7563D3"
  }), /*#__PURE__*/React.createElement(RTPoly, {
    id: "rt05",
    d: "M 50 280 L 90 320 L 200 360 L 90 360 Z",
    label: "RT 05",
    selected: selected === 'rt05',
    onSelect: onSelect,
    fill: "#DD2666"
  })), layers.road && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M 30 240 L 580 230",
    stroke: "#1F2937",
    strokeWidth: "3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M 290 60 L 280 360",
    stroke: "#1F2937",
    strokeWidth: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M 60 140 L 540 130",
    stroke: "#4B473F",
    strokeWidth: "1.5",
    opacity: "0.6"
  })), layers.parcel && Array.from({
    length: 60
  }).map((_, i) => /*#__PURE__*/React.createElement("rect", {
    key: i,
    x: 80 + i % 12 * 38 + i % 3 * 4,
    y: 100 + Math.floor(i / 12) * 42 + i % 4 * 2,
    width: "28",
    height: "32",
    rx: "2",
    fill: "rgba(117,99,211,0.18)",
    stroke: "rgba(117,99,211,0.4)",
    strokeWidth: "0.5"
  })), layers.facility && [{
    x: 140,
    y: 150,
    icon: '🏫'
  }, {
    x: 320,
    y: 130,
    icon: '🕌'
  }, {
    x: 450,
    y: 250,
    icon: '🏥'
  }, {
    x: 200,
    y: 290,
    icon: '🏪'
  }, {
    x: 380,
    y: 300,
    icon: '⛪'
  }].map((f, i) => /*#__PURE__*/React.createElement("g", {
    key: i
  }, /*#__PURE__*/React.createElement("circle", {
    cx: f.x,
    cy: f.y,
    r: "11",
    fill: "white",
    stroke: "#F59E0B",
    strokeWidth: "2"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: f.x,
    cy: f.y,
    r: "3.5",
    fill: "#F59E0B"
  }))), layers.potensi && [{
    x: 180,
    y: 180
  }, {
    x: 360,
    y: 170
  }, {
    x: 250,
    y: 270
  }, {
    x: 420,
    y: 290
  }].map((p, i) => /*#__PURE__*/React.createElement("g", {
    key: i
  }, /*#__PURE__*/React.createElement("circle", {
    cx: p.x,
    cy: p.y,
    r: "14",
    fill: "url(#aura)"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: p.x,
    cy: p.y,
    r: "5",
    fill: "#FE7346"
  }))), layers.poverty && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("ellipse", {
    cx: "150",
    cy: "290",
    rx: "60",
    ry: "40",
    fill: "#DD2666",
    opacity: "0.3"
  }), /*#__PURE__*/React.createElement("ellipse", {
    cx: "450",
    cy: "310",
    rx: "50",
    ry: "35",
    fill: "#DD2666",
    opacity: "0.25"
  }))));
}
function RTPoly({
  id,
  d,
  label,
  selected,
  onSelect,
  fill
}) {
  return /*#__PURE__*/React.createElement("g", {
    onClick: () => onSelect(id),
    style: {
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: d,
    fill: fill,
    opacity: selected ? 0.55 : 0.18,
    stroke: fill,
    strokeWidth: selected ? 3 : 1.5
  }), /*#__PURE__*/React.createElement("text", {
    x: d.split(' ')[1],
    y: parseInt(d.split(' ')[2]) + 24,
    fill: "#1F2937",
    fontFamily: "Plus Jakarta Sans",
    fontWeight: "700",
    fontSize: "13",
    opacity: "0.7"
  }, label));
}
Object.assign(window, {
  Peta
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/desa-pintar/Peta.jsx", error: String((e && e.message) || e) }); }

})();
