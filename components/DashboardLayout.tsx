/**
 * DashboardLayout Component
 * Shared layout for dashboard pages with navigation and sidebar
 */

'use client';

import React, { useState, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './DashboardLayout.module.css';
import type { Language } from '@/types/dashboard';
import { LANGUAGE_CONFIG } from '@/types/dashboard';

interface DashboardLayoutProps {
  children: ReactNode;
  language?: Language;
}

interface NavItem {
  label: string;
  href: string;
  icon: string;
  language?: Language;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', href: '/dashboard', icon: '🏠' },
  { label: 'French', href: '/dashboard/french', icon: '🇫🇷', language: 'french' },
  { label: 'German', href: '/dashboard/german', icon: '🇩🇪', language: 'german' },
];

export default function DashboardLayout({ children, language }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className={styles.layout}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <button
            className={styles.menuButton}
            onClick={toggleSidebar}
            aria-label="Toggle menu"
          >
            <span className={styles.menuIcon}>{sidebarOpen ? '✕' : '☰'}</span>
          </button>

          <div className={styles.logo}>
            <Link href="/">
              <span className={styles.logoIcon}>⭐</span>
              <span className={styles.logoText}>ProgressPath</span>
            </Link>
          </div>

          {language && (
            <div className={styles.languageBadge}>
              <span className={styles.languageFlag}>{LANGUAGE_CONFIG[language].flag}</span>
              <span className={styles.languageName}>{LANGUAGE_CONFIG[language].name}</span>
            </div>
          )}

          <div className={styles.headerActions}>
            <button className={styles.iconButton} aria-label="Notifications">
              🔔
            </button>
            <button className={styles.iconButton} aria-label="Profile">
              👤
            </button>
          </div>
        </div>
      </header>

      <div className={styles.container}>
        {/* Sidebar */}
        <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
          <nav className={styles.nav}>
            <div className={styles.navSection}>
              <h3 className={styles.navSectionTitle}>Dashboard</h3>
              <ul className={styles.navList}>
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                        onClick={closeSidebar}
                      >
                        <span className={styles.navIcon}>{item.icon}</span>
                        <span className={styles.navLabel}>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className={styles.navSection}>
              <h3 className={styles.navSectionTitle}>Learning</h3>
              <ul className={styles.navList}>
                <li>
                  <Link href="/french" className={styles.navLink} onClick={closeSidebar}>
                    <span className={styles.navIcon}>📚</span>
                    <span className={styles.navLabel}>French Lessons</span>
                  </Link>
                </li>
                <li>
                  <Link href="/german" className={styles.navLink} onClick={closeSidebar}>
                    <span className={styles.navIcon}>📖</span>
                    <span className={styles.navLabel}>German Lessons</span>
                  </Link>
                </li>
              </ul>
            </div>

            <div className={styles.navSection}>
              <h3 className={styles.navSectionTitle}>Other</h3>
              <ul className={styles.navList}>
                <li>
                  <Link href="/books" className={styles.navLink} onClick={closeSidebar}>
                    <span className={styles.navIcon}>📕</span>
                    <span className={styles.navLabel}>Books</span>
                  </Link>
                </li>
              </ul>
            </div>
          </nav>

          {/* Sidebar Footer */}
          <div className={styles.sidebarFooter}>
            <div className={styles.footerCard}>
              <p className={styles.footerTitle}>🎯 Daily Goal</p>
              <p className={styles.footerText}>Keep learning every day!</p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className={styles.main}>
          {children}
        </main>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
