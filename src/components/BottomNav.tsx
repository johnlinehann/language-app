import { NavLink } from 'react-router-dom';
import { IconHome, IconRepeat, IconUser, IconGear } from './Icons';

const tabs = [
  { to: '/', label: 'Learn', Icon: IconHome },
  { to: '/practice', label: 'Practice', Icon: IconRepeat },
  { to: '/profile', label: 'Profile', Icon: IconUser },
  { to: '/settings', label: 'Settings', Icon: IconGear },
];

export function BottomNav() {
  return (
    <nav aria-label="Main" className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t-2 border-washi-200 bg-washi-50/95 backdrop-blur dark:border-sumi-700 dark:bg-sumi-900/95">
      <ul className="mx-auto flex max-w-lg justify-around pt-1">
        {tabs.map(({ to, label, Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex min-h-[56px] min-w-[64px] flex-col items-center justify-center rounded-xl px-3 text-xs font-bold ${
                  isActive ? 'text-shu-500' : 'text-sumi-700/60 dark:text-washi-200/60'
                }`
              }
            >
              <Icon className="h-6 w-6" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
