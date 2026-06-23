export function getDefaultRoute(user) {
  if (!user) return '/login'
  if (user.role === 'admin') return '/'
  if (user.role === 'staff') return '/staff'
  return '/'
}

export function getRoleFlags(user) {
  const isAdmin = user?.role === 'admin'
  const isStaff = user?.role === 'staff'
  const isCitizen = user?.role === 'citizen'
  return {
    isAdmin,
    isStaff,
    isCitizen,
    canAccessStaff: isAdmin || isStaff,
    canAccessCitizen: isAdmin || isCitizen,
  }
}
