import { useClerk, useUser } from '@clerk/clerk-react';
import {
  FileText,
  FileTextIcon,
  House,
  Image,
  Scissors,
  SquarePen,
  User,
  Eraser,
} from 'lucide-react';
import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/ai', label: 'Dashboard', Icon: House },
  { to: '/ai/write-article', label: 'Write Article', Icon: SquarePen },
  { to: '/ai/blog-titles', label: 'Remove Background', Icon: Image },
  { to: '/ai/generate-images', label: 'Remove Background', Icon: Eraser },
  { to: '/ai/remove-background', label: 'Remove Object', Icon: Scissors },
  { to: '/ai/remove-object', label: 'Remove Object', Icon: FileText },
  { to: '/ai/review-resume', label: 'Review Resume', Icon: FileTextIcon },
  { to: '/ai/community', label: 'Community', Icon: User },
];

const Sidebar = ({ sidebar, setSidebar }) => {
  const { user } = useUser();
  const { signOut, OpenUserProfile } = useClerk();

  return (
    <div
      className={`w-60 bg-white border-r border-gray-200 flex flex-col justify-between items-center max-sm:absolute top-14 bottom-0 ${
        sidebar ? 'translate-x-0' : 'max-sm:-translate-x-full'
      } transition-all duration-300 ease-in-out`}
    >
      <div className='my-7 w-full'>
        <img
          src={user.imageUrl}
          alt='User avatar'
          className='w-13 rounded-full mx-auto'
        />
        <h1 className='mt-1 text-center'>{user.fullName}</h1>
        <div className='mt-4 flex flex-col gap-1'>
          {navItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/ai'}
              onClick={() => setSidebar(false)}
              className={({ isActive }) =>
                `px-3 py-2.5 flex items-center gap-3 rounded transition-colors ${
                  isActive
                    ? 'bg-gradient-to-r from-[#3C81F6] to-[#9234EA] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <Icon className='w-4 h-4' />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
