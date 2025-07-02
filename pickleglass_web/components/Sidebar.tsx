'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { useState, createElement, useEffect, useMemo, useCallback, memo } from 'react'
import { 
  Search, 
  Activity, 
  HelpCircle, 
  Download,
  ChevronDown,
  User,
  Shield,
  Database,
  CreditCard,
  LogOut,
  LucideIcon
} from 'lucide-react'
import { logout, UserProfile, checkApiKeyStatus } from '@/utils/api'
import { useAuth } from '@/utils/auth'

// 상수 정의
const ANIMATION_DURATION = {
  SIDEBAR: 500,
  TEXT: 300,
  SUBMENU: 500,
  ICON_HOVER: 200,
  COLOR_TRANSITION: 200,
  HOVER_SCALE: 200,
} as const

const DIMENSIONS = {
  SIDEBAR_EXPANDED: 220, // w-55 = 220px (실제 Cluely 비율)
  SIDEBAR_COLLAPSED: 64, // w-16 = 64px (적당한 크기)
  ICON_SIZE: 18, // 아이콘 크기 적절히 (좀 더 작게)
  USER_AVATAR_SIZE: 32, // 아바타 크기 적절히
  HEADER_HEIGHT: 64, // 헤더 높이 적절히
} as const

const ANIMATION_DELAYS = {
  BASE: 0,
  INCREMENT: 50,
  TEXT_BASE: 250,
  SUBMENU_INCREMENT: 30,
} as const

// 타입 정의 강화
interface NavigationItem {
  name: string
  href?: string
  action?: () => void
  icon: LucideIcon | string
  isLucide: boolean
  hasSubmenu?: boolean
  ariaLabel?: string
}

interface SubmenuItem {
  name: string
  href: string
  icon: LucideIcon | string
  isLucide: boolean
  ariaLabel?: string
}

interface SidebarProps {
  isCollapsed: boolean
  onToggle: (collapsed: boolean) => void
  onSearchClick?: () => void
}

interface AnimationStyles {
  text: React.CSSProperties
  submenu: React.CSSProperties
  sidebarContainer: React.CSSProperties
  textContainer: React.CSSProperties
}

// 커스텀 훅: 애니메이션 로직 분리
const useAnimationStyles = (isCollapsed: boolean) => {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    setIsAnimating(true)
    const timer = setTimeout(() => setIsAnimating(false), ANIMATION_DURATION.SIDEBAR)
    return () => clearTimeout(timer)
  }, [isCollapsed])

  // 🔥 프로덕션 레벨 애니메이션: Transform 기반으로 일관된 속도감 제공
  const getTextAnimationStyle = useCallback((delay = 0): React.CSSProperties => ({
    willChange: 'opacity',
    transition: `opacity ${ANIMATION_DURATION.TEXT}ms ease-out`,
    transitionDelay: `${delay}ms`,
    opacity: isCollapsed ? 0 : 1,
    pointerEvents: isCollapsed ? 'none' : 'auto',
  }), [isCollapsed])

  const getSubmenuAnimationStyle = useCallback((isExpanded: boolean): React.CSSProperties => ({
    willChange: 'opacity, max-height',
    transition: `all ${ANIMATION_DURATION.SUBMENU}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
    maxHeight: isCollapsed || !isExpanded ? '0px' : '400px',
    opacity: isCollapsed || !isExpanded ? 0 : 1,
  }), [isCollapsed])

  const sidebarContainerStyle: React.CSSProperties = useMemo(() => ({
    willChange: 'width',
    transition: `width ${ANIMATION_DURATION.SIDEBAR}ms cubic-bezier(0.4, 0, 0.2, 1)`,
  }), [])

  // 🎯 핵심: 고정된 컨테이너 크기 + 내부 컨텐츠만 transform
  const getTextContainerStyle = useCallback((): React.CSSProperties => ({
    width: isCollapsed ? '0px' : '150px',
    overflow: 'hidden',
    transition: `width ${ANIMATION_DURATION.SIDEBAR}ms cubic-bezier(0.4, 0, 0.2, 1)`,
  }), [isCollapsed])
  
  // 🌟 새로운 텍스트 애니메이션: opacity 전환만 사용 + 열릴 때 살짝 딜레이
  const getUniformTextStyle = useCallback((): React.CSSProperties => ({
    willChange: 'opacity',
    opacity: isCollapsed ? 0 : 1,
    transition: `opacity 300ms ease ${isCollapsed ? '0ms' : '200ms'}`,
    whiteSpace: 'nowrap' as const,
  }), [isCollapsed])

  return {
    isAnimating,
    getTextAnimationStyle,
    getSubmenuAnimationStyle,
    sidebarContainerStyle,
    getTextContainerStyle,
    getUniformTextStyle,
  }
}

// 메모이제이션된 아이콘 컴포넌트
const IconComponent = memo<{
  icon: LucideIcon | string
  isLucide: boolean
  alt: string
  className?: string
}>(({ icon, isLucide, alt, className = "h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110" }) => {
  if (isLucide) {
    return createElement(icon as LucideIcon, { className, 'aria-hidden': true })
  }

  return (
          <Image 
      src={icon as string}
      alt={alt}
      width={18}
      height={18}
      className={className}
      loading="lazy"
    />
  )
})

IconComponent.displayName = 'IconComponent'

// Sidebar 컴포넌트 정의
const SidebarComponent = ({ isCollapsed, onToggle, onSearchClick }: SidebarProps) => {
  const pathname = usePathname()
  const router = useRouter()
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(pathname.startsWith('/settings'))
  const { user: userInfo, isLoading: authLoading } = useAuth()
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null)
  
  const {
    isAnimating,
    getTextAnimationStyle,
    getSubmenuAnimationStyle,
    sidebarContainerStyle,
    getTextContainerStyle,
    getUniformTextStyle,
  } = useAnimationStyles(isCollapsed)

  useEffect(() => {
    checkApiKeyStatus()
      .then(status => setHasApiKey(status.hasApiKey))
      .catch(err => {
        console.error("Failed to check API key status:", err)
        setHasApiKey(null) // Set to null on error
      })
  }, [])

  // Synchronize Settings menu expansion state based on URL path
  useEffect(() => {
    if (pathname.startsWith('/settings')) {
      setIsSettingsExpanded(true)
    }
  }, [pathname])

  // Memoized navigation data
  const navigation = useMemo<NavigationItem[]>(() => [
    { 
      name: 'Search', 
      action: onSearchClick, 
      icon: '/search.svg', 
      isLucide: false,
      ariaLabel: 'Open search'
    },
    { 
      name: 'My Activity', 
      href: '/activity', 
      icon: '/activity.svg', 
      isLucide: false,
      ariaLabel: 'View my activity'
    },
    { 
      name: 'Personalize', 
      href: '/personalize', 
      icon: '/book.svg', 
      isLucide: false,
      ariaLabel: 'Personalization settings'
    },
    { 
      name: 'Settings', 
      href: '/settings', 
      icon: '/setting.svg', 
      isLucide: false, 
      hasSubmenu: true,
      ariaLabel: 'Settings menu'
    },
  ], [onSearchClick])

  const settingsSubmenu = useMemo<SubmenuItem[]>(() => [
    { name: 'Personal Profile', href: '/settings', icon: '/user.svg', isLucide: false, ariaLabel: 'Personal profile settings' },
    { name: 'Data & privacy', href: '/settings/privacy', icon: '/privacy.svg', isLucide: false, ariaLabel: 'Data and privacy settings' },
    { name: 'Billing', href: '/settings/billing', icon: '/credit-card.svg', isLucide: false, ariaLabel: 'Billing settings' },
  ], [])

  const bottomItems = useMemo(() => [
    { 
      href: "https://www.pickle.com/", 
      icon: HelpCircle, 
      text: "Help Center",
      ariaLabel: "Help Center (new window)"
    },
    { 
      href: "https://www.pickle.com/terms-of-service", 
      icon: Download, 
      text: "Download Pickle Glass",
      ariaLabel: "Download Pickle Glass (new window)"
    }
  ], [])

  // Memoized event handlers
  const toggleSidebar = useCallback(() => {
    onToggle(!isCollapsed)
  }, [isCollapsed, onToggle])

  const toggleSettings = useCallback(() => {
    // Allow toggle only when not on settings page to encourage users to maintain current state
    if (!pathname.startsWith('/settings')) {
      setIsSettingsExpanded(prev => !prev)
    }
  }, [pathname])

  const handleLogout = useCallback(async () => {
    try {
      await logout()
    } catch (error) {
      console.error('An error occurred during logout:', error)
      // Provide error feedback to user (toast, etc.)
    }
  }, [])

  // 키보드 네비게이션 핸들러
  const handleKeyDown = useCallback((event: React.KeyboardEvent, action?: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      action?.()
    }
  }, [])

    const renderNavigationItem = useCallback((item: NavigationItem, index: number) => {
    const isActive = item.href ? pathname.startsWith(item.href) : false
    const animationDelay = 0 // 애니메이션 딜레이 통일

    const baseButtonClasses = `
      group flex items-center rounded-lg p-2.5 text-xs font-medium w-full relative
      transition-colors duration-${ANIMATION_DURATION.COLOR_TRANSITION} ease-out
      focus:outline-none
      ${isCollapsed ? 'justify-center' : ''}
    `

    const getStateClasses = (isActive: boolean) => isActive
      ? 'bg-subtle-active-bg text-gray-900'
      : 'text-gray-600 hover:text-gray-900 hover:bg-subtle-active-bg'

                if (item.action) {
                  return (
                    <li key={item.name}>
                      <button
                        onClick={item.action}
            onKeyDown={(e) => handleKeyDown(e, item.action)}
            className={`${baseButtonClasses} ${getStateClasses(false)}`}
                        title={isCollapsed ? item.name : undefined}
            aria-label={item.ariaLabel || item.name}
                        style={{ willChange: 'background-color, color' }}
                      >
            <div className="shrink-0 flex items-center justify-center w-5 h-5">
              <IconComponent
                icon={item.icon}
                isLucide={item.isLucide}
                              alt={`${item.name} icon`}
                            />
                        </div>
                        
            <div className="ml-2.5 overflow-hidden" style={getTextContainerStyle()}>
                          <span 
                            className="block text-left"
                            style={getUniformTextStyle()}
                          >
                            {item.name}
                          </span>
                        </div>
                      </button>
                    </li>
                  )
                }
                
                if (item.hasSubmenu) {
                  return (
                    <li key={item.name}>
                      <button
                        onClick={toggleSettings}
            onKeyDown={(e) => handleKeyDown(e, toggleSettings)}
            className={`${baseButtonClasses} ${getStateClasses(isActive)}`}
                        title={isCollapsed ? item.name : undefined}
            aria-label={item.ariaLabel || item.name}
            aria-expanded={isSettingsExpanded}
            aria-controls="settings-submenu"
                        style={{ willChange: 'background-color, color' }}
                      >
            <div className="shrink-0 flex items-center justify-center w-5 h-5">
              <IconComponent
                icon={item.icon}
                isLucide={item.isLucide}
                              alt={`${item.name} icon`}
                            />
                        </div>
                        
            <div className="ml-2.5 overflow-hidden flex items-center" style={getTextContainerStyle()}>
                          <span 
                            className="flex-1 text-left"
                            style={getUniformTextStyle()}
                          >
                            {item.name}
                          </span>
                          <ChevronDown 
                            className="h-3 w-3 ml-1.5 shrink-0"
                aria-hidden="true"
                            style={{
                              willChange: 'transform, opacity',
                  transition: `all ${ANIMATION_DURATION.HOVER_SCALE}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                              transform: `rotate(${isSettingsExpanded ? 180 : 0}deg) ${isCollapsed ? 'scale(0)' : 'scale(1)'}`,
                              opacity: isCollapsed ? 0 : 1,
                            }}
                          />
                        </div>
                      </button>
                      
                      {/* Settings Submenu */}
                      <div 
            id="settings-submenu"
                        className="overflow-hidden"
            style={getSubmenuAnimationStyle(isSettingsExpanded)}
            role="region"
            aria-labelledby="settings-button"
                      >
            <ul className="mt-1 space-y-1 pl-7" role="menu">
                          {settingsSubmenu.map((subItem, subIndex) => (
                <li key={subItem.name} role="none">
                              <Link
                                href={subItem.href}
                                className={`
                                  group flex items-center rounded-lg p-1.5 text-xs font-medium gap-x-2.5
                      focus:outline-none
                                  ${pathname === subItem.href
                                    ? 'bg-subtle-active-bg text-gray-900'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-subtle-active-bg'
                                  }
                      transition-colors duration-${ANIMATION_DURATION.COLOR_TRANSITION} ease-out
                                `}
                                style={{
                                  willChange: 'background-color, color',
                                }}
                    role="menuitem"
                    aria-label={subItem.ariaLabel || subItem.name}
                              >
                    <IconComponent
                      icon={subItem.icon}
                      isLucide={subItem.isLucide}
                      alt={`${subItem.name} icon`}
                      className="h-3.5 w-3.5 shrink-0"
                    />
                                <span className="whitespace-nowrap">{subItem.name}</span>
                              </Link>
                            </li>
                          ))}
              <li role="none">
                            {isFirebaseUser ? (
                               <button
                                  onClick={handleLogout}
                                  onKeyDown={(e) => handleKeyDown(e, handleLogout)}
                                  className={`
                                    group flex items-center rounded-lg p-1.5 text-xs font-medium gap-x-2.5 
                                    text-red-600 hover:text-red-700 hover:bg-red-50 w-full 
                                    transition-colors duration-${ANIMATION_DURATION.COLOR_TRANSITION} ease-out
                                    focus:outline-none
                                  `}
                                  style={{ willChange: 'background-color, color' }}
                                  role="menuitem"
                                  aria-label="로그아웃"
                                >
                                  <LogOut className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                  <span className="whitespace-nowrap">로그아웃</span>
                                </button>
                            ) : (
                               <Link
                                  href="/login"
                                  className={`
                                    group flex items-center rounded-lg p-1.5 text-xs font-medium gap-x-2.5 
                                    text-blue-600 hover:text-blue-700 hover:bg-blue-50 w-full 
                                    transition-colors duration-${ANIMATION_DURATION.COLOR_TRANSITION} ease-out
                                    focus:outline-none
                                  `}
                                  style={{ willChange: 'background-color, color' }}
                                  role="menuitem"
                                  aria-label="로그인"
                                >
                                  <LogOut className="h-3.5 w-3.5 shrink-0 transform -scale-x-100" aria-hidden="true" />
                                  <span className="whitespace-nowrap">로그인</span>
                                </Link>
                            )}
                          </li>
                        </ul>
                      </div>
                    </li>
                  )
                }
                
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href || '#'}
                      className={`
                        group flex items-center rounded-lg p-2.5 text-xs font-medium relative
            focus:outline-none
            ${getStateClasses(isActive)}
            transition-colors duration-${ANIMATION_DURATION.COLOR_TRANSITION} ease-out
                        ${isCollapsed ? 'justify-center' : ''}
                      `}
                      title={isCollapsed ? item.name : undefined}
          aria-label={item.ariaLabel || item.name}
                      style={{ willChange: 'background-color, color' }}
                    >
          <div className="shrink-0 flex items-center justify-center w-5 h-5">
            <IconComponent
              icon={item.icon}
              isLucide={item.isLucide}
                            alt={`${item.name} icon`}
                          />
                      </div>
                      
          <div className="ml-2.5 overflow-hidden" style={getTextContainerStyle()}>
                        <span 
                          className="block text-left"
                          style={getUniformTextStyle()}
                        >
                          {item.name}
                        </span>
                      </div>
                    </Link>
                  </li>
                )
  }, [
    pathname, 
    isCollapsed, 
    isSettingsExpanded, 
    toggleSettings, 
    handleLogout, 
    handleKeyDown,
    getUniformTextStyle,
    getTextContainerStyle,
    getSubmenuAnimationStyle,
    settingsSubmenu
  ])

  const getUserDisplayName = useCallback(() => {
    if (authLoading) return 'Loading...'
    return userInfo?.display_name || 'Guest'
  }, [userInfo, authLoading])

  const getUserInitial = useCallback(() => {
    if (authLoading) return 'L'
    return userInfo?.display_name ? userInfo.display_name.charAt(0).toUpperCase() : 'G'
  }, [userInfo, authLoading])

  const isFirebaseUser = userInfo && userInfo.uid !== 'default_user';

  return (
    <aside 
      className={`flex h-full flex-col bg-subtle-bg border-r border-gray-200 relative ${
        isCollapsed ? 'w-16' : 'w-55'
      }`}
      style={sidebarContainerStyle}
      role="navigation"
      aria-label="메인 네비게이션"
      aria-expanded={!isCollapsed}
    >
      {/* Logo + Integrated Toggle */}
      <header className={`group relative flex h-16 shrink-0 items-center ${isCollapsed ? 'justify-center' : 'px-4'}`}>
        {isCollapsed ? (
          // Collapsed state: Logo only (no link) + toggle appears on hover
          <>
            <Image
              src="/symbol.svg"
              alt="Logo"
              width={32}
              height={32}
              className="h-8 w-8 shrink-0"/>
            {/* Overlay Toggle */}
            <button
              onClick={toggleSidebar}
              onKeyDown={(e) => handleKeyDown(e, toggleSidebar)}
              className="absolute inset-0 flex items-center justify-center text-gray-500 hover:text-gray-800 rounded-md opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 ease-out focus:outline-none"
              aria-label="사이드바 열기"
            >
              <Image src="/unfold.svg" alt="Open" width={18} height={18} className="h-4.5 w-4.5"/>
            </button>
          </>
        ) : (
          // Expanded state: Logo is a link, toggle button at right
          <>
            <Link href="https://pickle.com" target="_blank" rel="noopener noreferrer" className="flex items-center">
              <Image
                src="/symbol.svg"
                alt="pickleglass Logo"
                width={32}
                height={32}
                className="h-8 w-8 shrink-0"/>
            </Link>
            <button
              onClick={toggleSidebar}
              onKeyDown={(e) => handleKeyDown(e, toggleSidebar)}
              className="ml-auto text-gray-500 hover:text-gray-800 p-1 rounded-md hover:bg-gray-100 transition-colors focus:outline-none"
              aria-label="사이드바 닫기">
              <Image src="/unfold.svg" alt="Close" width={20} height={20} className="h-5 w-5 transform rotate-180"/>
            </button>
          </>
        )}
      </header>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col py-4 px-2" role="navigation" aria-label="주요 메뉴">
        <ul role="list" className="flex flex-1 flex-col gap-y-2">
          <li>
            <ul role="list" className="space-y-0.5">
              {navigation.map(renderNavigationItem)}
            </ul>
          </li>
        </ul>

        {/* System Status */}
        {!isCollapsed && hasApiKey !== null && (
           <div className="px-2.5 py-2 text-center">
             <span
                className={`text-xs px-2 py-1 rounded-full ${
                    hasApiKey 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                }`}
             >
                {hasApiKey ? 'Running Locally' : 'Using Pickle Free System'}
             </span>
           </div>
        )}

        {/* Bottom Items */}
        <div className="mt-auto space-y-1" role="navigation" aria-label="추가 링크">
          {bottomItems.map((item, index) => (
            <Link
              key={item.text}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`
                group flex rounded-lg p-2.5 text-xs leading-5 font-medium text-gray-600 
                hover:text-gray-900 hover:bg-subtle-active-bg 
                transition-colors duration-${ANIMATION_DURATION.COLOR_TRANSITION} ease-out 
                focus:outline-none
                ${isCollapsed ? 'justify-center' : ''}
              `}
              title={isCollapsed ? item.text : undefined}
              aria-label={item.ariaLabel}
              style={{ willChange: 'background-color, color' }}
            >
              <div className="shrink-0 flex items-center justify-center w-5 h-5">
                <item.icon className={`h-[18px] w-[18px] transition-transform duration-${ANIMATION_DURATION.ICON_HOVER} group-hover:scale-110`} aria-hidden="true" />
              </div>
              <div 
                className="ml-2.5 overflow-hidden"
                style={getTextContainerStyle()}
              >
                <span 
                  className="block text-left"
                  style={getUniformTextStyle()}
                >
                  {item.text}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* User Profile */}
        <div 
          className="mt-6 flex items-center"
          style={{
            padding: isCollapsed ? '12px 0' : '12px 8px',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            transition: `all ${ANIMATION_DURATION.SIDEBAR}ms cubic-bezier(0.4, 0, 0.2, 1)`,
          }}
          role="region"
          aria-label="사용자 정보"
        >
          <div 
            className={`
              h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm 
              shrink-0 cursor-pointer transition-all duration-${ANIMATION_DURATION.ICON_HOVER} 
              hover:bg-blue-600 hover:scale-105 focus:outline-none
            `}
            title={getUserDisplayName()}
            style={{ willChange: 'background-color, transform' }}
            tabIndex={0}
            role="button"
            aria-label={`사용자: ${getUserDisplayName()}`}
            onKeyDown={(e) => handleKeyDown(e, () => {
                if (isFirebaseUser) {
                    router.push('/settings');
                } else {
                    router.push('/login');
                }
            })}
          >
            {getUserInitial()}
          </div>
          
          <div 
            className="ml-3 overflow-hidden"
            style={getTextContainerStyle()}
          >
            <span 
              className="block text-sm font-semibold leading-6 text-gray-900"
              style={getUniformTextStyle()}
            >
              {getUserDisplayName()}
            </span>
          </div>
        </div>
      </nav>
    </aside>
  )
}

// 메모이제이션된 컴포넌트 내보내기
const Sidebar = memo(SidebarComponent)
Sidebar.displayName = 'Sidebar'

export default Sidebar 