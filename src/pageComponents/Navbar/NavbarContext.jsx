'use client'

import { createContext, useContext } from 'react'

const NavbarContext = createContext(false)

export function NavbarScope({ children }) {
  return <NavbarContext.Provider value>{children}</NavbarContext.Provider>
}

export function useNavbarScope() {
  return useContext(NavbarContext)
}
