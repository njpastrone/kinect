import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { navigationHelpers } from '../../utils/navigation';

interface BreadcrumbItem {
  label: string;
  href: string;
  current?: boolean;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
  listName?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ 
  items, 
  className = '', 
  listName 
}) => {
  const location = useLocation();
  
  // Generate breadcrumbs automatically if not provided
  const breadcrumbItems = items || navigationHelpers.getBreadcrumbs(
    location.pathname + location.search, 
    listName
  );
  
  if (breadcrumbItems.length <= 1) {
    return null; // Don't show breadcrumbs for single items
  }
  
  return (
    <nav className={`flex items-center space-x-1 text-sm text-gray-500 ${className}`}>
      <Link
        to="/"
        className="text-gray-400 hover:text-gray-600 transition-colors"
        title="Home"
      >
        <Home className="w-4 h-4" />
      </Link>
      
      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1;
        
        return (
          <React.Fragment key={item.href}>
            <ChevronRight className="w-4 h-4 text-gray-300" />
            
            {isLast ? (
              <span className="font-medium text-gray-900 truncate max-w-[200px]">
                {item.label}
              </span>
            ) : (
              <Link
                to={item.href}
                className="hover:text-gray-700 transition-colors truncate max-w-[150px]"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};