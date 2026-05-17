import { NavLink, useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/',            label: 'Início',        countKey: null },
  { to: '/exames',      label: 'Exames',        countKey: 'exams' },
  { to: '/comparar',    label: 'Comparar',      countKey: null },
  { to: '/biomarcadores', label: 'Biomarcadores', countKey: 'biomarkers' },
  { to: '/insights',    label: 'Insights',      countKey: null },
  { to: '/dossie',      label: 'Dossiês',       countKey: null },
];

const ACTION_ITEMS = [
  { to: '/upload',      label: 'Enviar exame' },
  { to: '/config',      label: 'Configurações' },
];

export default function Sidebar({ examCount, bioCount, userName, userAge }) {
  const navigate = useNavigate();

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">m</div>
        <div className="brand-name">minha <em>saúde</em></div>
      </div>

      <div className="nav-label">Acompanhamento</div>
      {NAV_ITEMS.map(({ to, label, countKey }) => {
        const count = countKey === 'exams' ? examCount : countKey === 'biomarkers' ? bioCount : null;
        return (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="dot" />
            <span>{label}</span>
            {count != null && <span className="count">{String(count).padStart(2, '0')}</span>}
          </NavLink>
        );
      })}

      <div className="nav-label">Ações</div>
      {ACTION_ITEMS.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <span className="dot" />
          <span>{label}</span>
        </NavLink>
      ))}

      <div className="sidebar-foot">
        <div className="avatar">{(userName?.[0] || 'T').toUpperCase()}</div>
        <div className="avatar-meta">
          <b>{userName || 'Thalita'}</b>
          <span>{userAge ? `${userAge}a` : ''}</span>
        </div>
      </div>
    </aside>
  );
}
