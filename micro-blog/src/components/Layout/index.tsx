import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  HomeOutlined,
  SearchOutlined,
  SettingOutlined,
  LogoutOutlined,
  LoginOutlined,
  GithubOutlined,
  WeiboOutlined,
  MenuOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../../store';
import styles from './index.module.css';

interface LayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}

const navItems = [
  { path: '/', label: '首页', icon: <HomeOutlined /> },
  { path: '/search', label: '搜索', icon: <SearchOutlined /> },
  { path: '/settings', label: '设置', icon: <SettingOutlined /> },
] as const;

const Layout: React.FC<LayoutProps> = ({ children, sidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { auth, logout } = useAppStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [version, setVersion] = useState('0.0.1');

  useEffect(() => {
    import('../../../package.json')
      .then((pkg) => setVersion(pkg.version))
      .catch(() => setVersion('0.0.1'));
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const handleLogin = () => {
    setMobileMenuOpen(false);
    navigate('/login');
  };

  return (
    <div className={styles.layout}>
      <aside className={`${styles.leftSidebar} ${mobileMenuOpen ? styles.mobileOpen : ''}`}>
        <div className={styles.logo}>MB</div>

        {auth.isLoggedIn && (
          <div className={styles.userBadge}>
            <UserOutlined style={{ marginRight: 4 }} />
            <span>{auth.username || '用户'}</span>
          </div>
        )}

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <div
              key={item.path}
              className={`${styles.navItem} ${location.pathname === item.path ? styles.active : ''}`}
              onClick={() => {
                if (item.path === '/settings' && !auth.isLoggedIn) {
                  navigate('/login');
                } else {
                  navigate(item.path);
                }
                setMobileMenuOpen(false);
              }}
              title={item.label}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </div>
          ))}
          <div className={styles.navDivider} />
          <a
            className={styles.navItem}
            href="https://github.com/nishinokaede"
            target="_blank"
            rel="noopener noreferrer"
            title="GitHub"
          >
            <span className={styles.navIcon}>
              <GithubOutlined />
            </span>
            <span className={styles.navLabel}>GitHub</span>
          </a>
           <a
            className={styles.navItem}
            href="https://weibo.com/u/7858914035"
            target="_blank"
            rel="noopener noreferrer"
            title="Weibo"
          >
            <span className={styles.navIcon}>
              <WeiboOutlined />
            </span>
            <span className={styles.navLabel}>Weibo</span>
          </a>


          {auth.isLoggedIn ? (
            <div
              className={`${styles.navItem} ${styles.exitItem}`}
              onClick={handleLogout}
              title="退出登录"
            >
              <span className={styles.navIcon}>
                <LogoutOutlined />
              </span>
              <span className={styles.navLabel}>退出</span>
            </div>
          ) : (
            <div
              className={`${styles.navItem} ${styles.loginItem}`}
              onClick={handleLogin}
              title="登录"
            >
              <span className={styles.navIcon}>
                <LoginOutlined />
              </span>
              <span className={styles.navLabel}>登录</span>
            </div>
          )}
        </nav>
        <div className={styles.version}>v{version}</div>
      </aside>

      <main className={styles.center}>
        {mobileMenuOpen && (
          <div className={styles.overlay} onClick={() => setMobileMenuOpen(false)} />
        )}
        <div className={styles.mobileHeader}>
          <span className={styles.hamburger} onClick={() => setMobileMenuOpen((prev) => !prev)}>
            <MenuOutlined />
          </span>
          <span className={styles.mobileLogo}>Micro Blog</span>
        </div>
        {children}
      </main>

      <aside className={styles.rightSidebar}>{sidebar}</aside>
    </div>
  );
};

export default Layout;
