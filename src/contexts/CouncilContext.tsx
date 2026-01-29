import { createContext, useContext, ReactNode } from 'react';

// Department type for council context
export interface CouncilDepartment {
  id: string;
  name: string;
  slug: string;
  type: string;
  organization: {
    id: string;
    name: string;
    slug?: string;
  };
}

// Context value type
export interface CouncilContextType {
  department: CouncilDepartment | null;
  userRole: string;
  organizationSlug: string;
  departmentSlug: string;
  basePath: string;
}

// Create context with default values
const CouncilContext = createContext<CouncilContextType | undefined>(undefined);

// Provider props
interface CouncilProviderProps {
  children: ReactNode;
  department: CouncilDepartment | null;
  userRole: string;
  organizationSlug: string;
  departmentSlug: string;
}

// Provider component
export function CouncilProvider({
  children,
  department,
  userRole,
  organizationSlug,
  departmentSlug,
}: CouncilProviderProps) {
  const basePath = `/c/${organizationSlug}/${departmentSlug}`;

  const value: CouncilContextType = {
    department,
    userRole,
    organizationSlug,
    departmentSlug,
    basePath,
  };

  return (
    <CouncilContext.Provider value={value}>
      {children}
    </CouncilContext.Provider>
  );
}

// Hook to use council context
export function useCouncil(): CouncilContextType {
  const context = useContext(CouncilContext);
  if (context === undefined) {
    throw new Error('useCouncil must be used within a CouncilProvider');
  }
  return context;
}

// Export context for advanced use cases
export { CouncilContext };
